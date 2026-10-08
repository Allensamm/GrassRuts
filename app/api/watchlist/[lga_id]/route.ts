import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lga_id: string }> },
) {
  const { lga_id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (
    request.headers.get('X-Outbox-Owner') &&
    request.headers.get('X-Outbox-Owner') !== user.id
  )
    return NextResponse.json(
      { error: 'Sign in to the account that saved this report.' },
      { status: 403 },
    )
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('lga_id', parseInt(lga_id))

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
