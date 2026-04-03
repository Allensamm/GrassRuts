import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  community: z.string().optional(),
  is_diaspora: z.boolean(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('users')
      .update({
        full_name: data.full_name,
        community: data.community || null,
        is_diaspora: data.is_diaspora,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
