import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('watchlist')
    .select('lga_id, lga:lgas(id, name, state:states(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ watchlist: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lga_id } = await request.json()
  if (!lga_id) return NextResponse.json({ error: 'lga_id required' }, { status: 400 })

  const { error } = await supabase
    .from('watchlist')
    .insert({ user_id: user.id, lga_id })

  if (error?.code === '23505') return NextResponse.json({ error: 'Already watching' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
