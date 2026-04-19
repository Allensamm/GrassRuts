import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/report', '/profile', '/explore', '/notifications', '/my-reports']

// State-mutating methods we want to protect from cross-site forgery
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Government API routes that legitimately receive cross-origin requests
const CSRF_EXEMPT = ['/api/public/']

function originMatchesHost(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // no Origin = same-origin or server-to-server
  try {
    return new URL(origin).host === (request.headers.get('host') ?? '')
  } catch {
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CSRF origin check ──────────────────────────────────────────────────
  if (
    CSRF_METHODS.has(request.method) &&
    pathname.startsWith('/api/') &&
    !CSRF_EXEMPT.some(p => pathname.startsWith(p)) &&
    !originMatchesHost(request)
  ) {
    return NextResponse.json(
      { error: 'Forbidden: cross-origin request rejected' },
      { status: 403 }
    )
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Skip auth checks for the public government API
  if (path.startsWith('/api/public/')) {
    return supabaseResponse
  }

  // Redirect authenticated users away from auth pages
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (!user && PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
