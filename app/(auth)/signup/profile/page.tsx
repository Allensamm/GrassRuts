'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { State, LGA } from '@/types'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  state_id: z.string().min(1, 'Select your state'),
  lga_id: z.string().min(1, 'Select your LGA'),
  community: z.string().optional(),
  is_diaspora: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function ProfileSetupPage() {
  const router = useRouter()
  const [states, setStates] = useState<State[]>([])
  const [lgas, setLgas] = useState<LGA[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_diaspora: false },
  })

  const selectedStateId = watch('state_id')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('states').select('*').order('name')
      .then(({ data }) => setStates(data || []))
  }, [])

  useEffect(() => {
    if (!selectedStateId) { setLgas([]); return }
    const supabase = createClient()
    supabase.from('lgas').select('*').eq('state_id', parseInt(selectedStateId)).order('name')
      .then(({ data }) => setLgas(data || []))
  }, [selectedStateId])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    const { error: upsertError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      full_name: data.full_name,
      lga_id: parseInt(data.lga_id),
      community: data.community || null,
      is_diaspora: data.is_diaspora,
    })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="Grassruts" width={200} height={40} priority />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tell Us About You</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your location helps us show you relevant issues and ensures your reports reach the right authorities.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Chukwuemeka Okonkwo"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                {...register('full_name')}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent bg-white"
                {...register('state_id')}
              >
                <option value="">Select your state</option>
                {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.state_id && <p className="text-red-500 text-xs mt-1">{errors.state_id.message}</p>}
            </div>

            {/* LGA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Government Area *</label>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent bg-white"
                disabled={!selectedStateId}
                {...register('lga_id')}
              >
                <option value="">Select your LGA</option>
                {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              {errors.lga_id && <p className="text-red-500 text-xs mt-1">{errors.lga_id.message}</p>}
            </div>

            {/* Community */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community / Ward <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Agbara, Ward 3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                {...register('community')}
              />
            </div>

            {/* Diaspora toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-700">Currently living abroad?</p>
                <p className="text-xs text-gray-400 mt-0.5">Diaspora users can watch but cannot vote on issues</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input type="checkbox" className="sr-only peer" {...register('is_diaspora')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#008751] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008751]"></div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up your account...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
