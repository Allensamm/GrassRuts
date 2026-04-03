import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category_slug = searchParams.get('category_slug')

  if (!category_slug) {
    return NextResponse.json({ error: 'category_slug is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get user's lga_id
  const { data: profile } = await supabase
    .from('users')
    .select('lga_id')
    .eq('id', user.id)
    .single()

  if (!profile?.lga_id) return NextResponse.json({ issues: [] })

  // Get category_id
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', category_slug)
    .single()

  if (!category) return NextResponse.json({ issues: [] })

  // Find active issues in the same LGA with the same category
  const { data: issues } = await supabase
    .from('issues')
    .select('id, title, description, report_count, status, created_at')
    .eq('category_id', category.id)
    .eq('lga_id', profile.lga_id)
    .in('status', ['pending', 'high_priority', 'in_review'])
    .order('report_count', { ascending: false })
    .limit(3)

  return NextResponse.json({ issues: issues ?? [] })
}
