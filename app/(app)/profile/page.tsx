'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Save, FileText, Users, CheckCircle2, Globe } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', community: '', is_diaspora: false })
  const [stats, setStats] = useState({ created: 0, joined: 0, resolved: 0 })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }

      const [{ data }, { count: joinedCount }, { data: createdIssues }] = await Promise.all([
        supabase
          .from('users')
          .select('full_name, community, is_diaspora, lga:lgas(name, state:states(name))')
          .eq('id', user.id)
          .single(),
        supabase
          .from('reports')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('issues')
          .select('id, status')
          .eq('created_by', user.id),
      ])

      if (data) {
        setProfile(data)
        setForm({ full_name: data.full_name ?? '', community: data.community ?? '', is_diaspora: data.is_diaspora ?? false })
      }

      const created = createdIssues?.length ?? 0
      const resolved = createdIssues?.filter(i => i.status === 'resolved' || i.status === 'verified').length ?? 0
      setStats({ created, joined: joinedCount ?? 0, resolved })
    })
  }, [router])

  const save = async () => {
    if (!form.full_name.trim() || form.full_name.length < 2) {
      setError('Full name must be at least 2 characters')
      return
    }
    setSaving(true)
    setError('')
    setSuccess(false)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to save'); return }
    setSuccess(true)
    router.refresh()
    setTimeout(() => setSuccess(false), 3000)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) {
    return (
      <div className="px-4 md:px-6 py-8">
        <div className="flex gap-8 items-start">
          <div className="flex-1 max-w-xl animate-pulse space-y-4">
            <div className="h-7 bg-gray-200 rounded w-1/3" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
          <div className="hidden lg:block w-72 shrink-0 space-y-4">
            <div className="h-36 bg-gray-200 rounded-2xl" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  const lga = Array.isArray(profile.lga) ? profile.lga[0] : profile.lga
  const state = Array.isArray(lga?.state) ? lga.state[0] : lga?.state

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="flex gap-8 items-start">

        {/* Form */}
        <div className="flex-1 min-w-0 max-w-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your account settings</p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#008751] flex items-center justify-center text-white text-2xl font-bold">
              {form.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{form.full_name}</p>
              <p className="text-sm text-gray-400">{lga?.name}{state?.name ? `, ${state.name}` : ''}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community / Ward <span className="text-gray-400">(optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Agbara, Ward 3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                value={form.community}
                onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                📍 {lga?.name ?? '—'}{state?.name ? `, ${state.name}` : ''}
                <span className="text-xs text-gray-400 ml-2">(contact support to change)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Diaspora mode</p>
                <p className="text-xs text-gray-400 mt-0.5">Watch issues without being able to report</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.is_diaspora}
                  onChange={e => setForm(f => ({ ...f, is_diaspora: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#008751] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008751]" />
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-600 text-sm font-medium">✓ Profile saved</p>}

            <button
              onClick={save}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Right panel */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-20">
          {/* Activity stats */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Your activity</h3>
            <div className="space-y-3">
              {[
                { icon: FileText, color: 'bg-blue-50 text-blue-500', value: stats.created, label: 'Issues reported' },
                { icon: Users, color: 'bg-orange-50 text-orange-500', value: stats.joined, label: 'Reports joined' },
                { icon: CheckCircle2, color: 'bg-green-50 text-[#008751]', value: stats.resolved, label: 'Issues resolved' },
              ].map(({ icon: Icon, color, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick links</h3>
            <div className="space-y-1">
              {[
                { href: '/my-reports', label: 'View my reports', icon: FileText },
                { href: '/explore', label: 'Explore all issues', icon: Globe },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                  <Icon size={15} className="text-gray-400" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Diaspora info */}
          {form.is_diaspora && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Diaspora mode is on</p>
              <p className="text-xs text-blue-600 leading-relaxed">
                You can browse and share issues but cannot submit new reports. Turn this off if you&apos;re currently in Nigeria.
              </p>
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}
