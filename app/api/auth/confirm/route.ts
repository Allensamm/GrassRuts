import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (token_hash && type) {
    const redirectTo = NextResponse.redirect(`${appUrl}/signup/profile`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              redirectTo.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email',
    })

    if (!error && user) {
      // Check if user already completed profile setup
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

      const destination = profile ? `${appUrl}/dashboard` : `${appUrl}/signup/profile`
      const finalRedirect = NextResponse.redirect(destination)
      // Copy session cookies to the new redirect response
      redirectTo.cookies.getAll().forEach(cookie =>
        finalRedirect.cookies.set(cookie.name, cookie.value)
      )
      return finalRedirect
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=confirmation_failed`)
}
