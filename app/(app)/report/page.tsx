'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Camera, X, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { enqueueReport } from '@/lib/offline/queue'

const CATEGORIES = [
  { slug: 'infrastructure', name: 'Roads & Infrastructure', icon: '🛣️', description: 'Roads, bridges, drainage' },
  { slug: 'water', name: 'Water Supply', icon: '💧', description: 'Water supply, sewage' },
  { slug: 'electricity', name: 'Electricity', icon: '⚡', description: 'Power outages, cables' },
  { slug: 'public_health', name: 'Public Health', icon: '🏥', description: 'Hospitals, disease, sanitation' },
  { slug: 'security', name: 'Security', icon: '🔒', description: 'Crime, safety concerns' },
  { slug: 'education', name: 'Education', icon: '🏫', description: 'Schools, facilities' },
  { slug: 'environment', name: 'Environment', icon: '🌍', description: 'Flooding, erosion, pollution' },
  { slug: 'other', name: 'Other', icon: '❓', description: 'Other community issues' },
]

const STEP_ORDER = ['category', 'details', 'location', 'photos', 'similar'] as const
type Step = typeof STEP_ORDER[number] | 'success'

interface FormState {
  category_slug: string
  category_name: string
  category_icon: string
  title: string
  description: string
  address: string
  community: string
  lat: number | null
  lng: number | null
  photo_urls: string[]
}

export default function ReportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [form, setForm] = useState<FormState>({
    category_slug: '', category_name: '', category_icon: '',
    title: '', description: '', address: '', community: '',
    lat: null, lng: null, photo_urls: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [locating, setLocating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [similarIssues, setSimilarIssues] = useState<any[]>([])
  const [loadingSimilar, setLoadingSimilar] = useState(false)
  const [createdIssueId, setCreatedIssueId] = useState<string | null>(null)
  const [isDisaspora, setIsDisaspora] = useState<boolean | null>(null)
  const [queuedOffline, setQueuedOffline] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('is_diaspora').eq('id', user.id).single()
        .then(({ data }) => setIsDisaspora(data?.is_diaspora ?? false))
    })
  }, [])

  const stepIndex = STEP_ORDER.indexOf(step as any)

  const goBack = () => {
    if (step === 'category') router.back()
    else if (step === 'details') setStep('category')
    else if (step === 'location') setStep('details')
    else if (step === 'photos') setStep('location')
    else if (step === 'similar') setStep('photos')
  }

  const selectCategory = (cat: typeof CATEGORIES[0]) => {
    setForm(f => ({ ...f, category_slug: cat.slug, category_name: cat.name, category_icon: cat.icon }))
    setStep('details')
  }

  const validateDetails = () => {
    const e: Record<string, string> = {}
    if (form.title.trim().length < 10) e.title = 'Title must be at least 10 characters'
    if (form.description.trim().length < 20) e.description = 'Description must be at least 20 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setForm(f => ({ ...f, lat, lng }))
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const parts = (data.display_name as string)?.split(',').slice(0, 3).join(', ') ?? ''
          setForm(f => ({ ...f, address: parts }))
        } catch {}
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    if (form.photo_urls.length + files.length > 3) {
      setErrors(prev => ({ ...prev, photos: 'Maximum 3 photos allowed' }))
      e.target.value = ''
      return
    }
    setErrors(prev => ({ ...prev, photos: '' }))
    setUploading(true)
    const supabase = createClient()
    const urls: string[] = []
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photos: `${file.name} is too large (max 5MB)` }))
        continue
      }
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('evidence').upload(path, file, { upsert: false })
      if (error) {
        setErrors(prev => ({ ...prev, photos: `Upload failed: ${error.message}` }))
      } else {
        const { data } = supabase.storage.from('evidence').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    if (urls.length > 0) setForm(f => ({ ...f, photo_urls: [...f.photo_urls, ...urls] }))
    setUploading(false)
    e.target.value = ''
  }

  const removePhoto = (url: string) => {
    setForm(f => ({ ...f, photo_urls: f.photo_urls.filter(u => u !== url) }))
  }

  const goToSimilar = async () => {
    setLoadingSimilar(true)
    try {
      const res = await fetch(`/api/issues/similar?category_slug=${form.category_slug}`)
      const json = await res.json()
      setSimilarIssues(json.issues ?? [])
    } catch {
      setSimilarIssues([])
    }
    setLoadingSimilar(false)
    setStep('similar')
  }

  const submitNewIssue = async () => {
    setSubmitting(true)
    setSubmitError('')

    // Offline path: queue to IndexedDB, submit later via background sync
    if (!navigator.onLine) {
      try {
        await enqueueReport({
          category_slug: form.category_slug,
          title:         form.title,
          description:   form.description,
          address:       form.address || undefined,
          community:     form.community || undefined,
          lat:           form.lat,
          lng:           form.lng,
          photo_urls:    form.photo_urls.length ? form.photo_urls : undefined,
        })
        setQueuedOffline(true)
        setStep('success')
      } catch {
        setSubmitError('Could not queue report. Please try again.')
      }
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) { setSubmitError(json.error ?? 'Failed to submit'); setSubmitting(false); return }
      setCreatedIssueId(json.issue_id)
      setStep('success')
    } catch {
      setSubmitError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  const joinIssue = async (issueId: string) => {
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`/api/issues/${issueId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description, photo_urls: form.photo_urls }),
      })
      const json = await res.json()
      if (!res.ok) { setSubmitError(json.error ?? 'Failed to add report'); setSubmitting(false); return }
      setCreatedIssueId(issueId)
      setStep('success')
    } catch {
      setSubmitError('Network error. Try again.')
      setSubmitting(false)
    }
  }

  if (isDisaspora === true) {
    return (
      <div className="px-4 md:px-6 max-w-2xl py-16 text-center">
        <div className="text-5xl mb-4">👁️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Diaspora Mode</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          As a diaspora user, you can watch and share community issues but cannot submit reports.
          Only residents of the affected LGA can report issues.
        </p>
        <button onClick={() => router.push('/explore')} className="bg-[#008751] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors">
          Browse Issues
        </button>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="px-4 md:px-6 max-w-2xl py-16 text-center">
        <div className="text-6xl mb-4">{queuedOffline ? '📬' : '✅'}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {queuedOffline ? 'Report Saved — You\'re Offline' : 'Report Submitted!'}
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          {queuedOffline
            ? 'Your report has been saved on this device. It will be submitted automatically the next time you have an internet connection — you don\'t need to do anything.'
            : 'Your report has been recorded. As more people from your community report this issue, it will gain visibility and escalate to the right authorities.'}
        </p>
        <div className="flex flex-col gap-3">
          {!queuedOffline && createdIssueId && (
            <button
              onClick={() => router.push(`/issues/${createdIssueId}`)}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors"
            >
              View Issue
            </button>
          )}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="flex gap-8 items-start">
      {/* Form */}
      <div className="flex-1 min-w-0 max-w-xl">
      {/* Header + progress */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Report an Issue</h1>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-colors ${i < stepIndex ? 'bg-[#008751]' : i === stepIndex ? 'bg-[#008751]' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Category */}
      {step === 'category' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">What type of issue is this?</h2>
          <p className="text-sm text-gray-500 mb-4">Select the category that best describes the problem.</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => selectCategory(cat)}
                className="flex flex-col items-start gap-1 p-4 bg-white border border-gray-100 rounded-2xl hover:border-[#008751] hover:bg-green-50 transition-all text-left"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                <span className="text-xs text-gray-400 leading-tight">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && (
        <div>
          <div className="flex items-center gap-2 mb-4 bg-white border border-gray-100 rounded-xl px-3 py-2">
            <span className="text-xl">{form.category_icon}</span>
            <span className="text-sm font-medium text-gray-600">{form.category_name}</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title *</label>
              <input
                type="text"
                placeholder="e.g. Collapsed bridge on Badagry Expressway"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describe the Problem *</label>
              <textarea
                rows={5}
                placeholder="Describe the issue in detail. What happened? How long has it been a problem? Who does it affect?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent resize-none"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              <p className="text-xs text-gray-400 mt-1">{form.description.length} characters (min 20)</p>
            </div>
            <button
              onClick={() => { if (validateDetails()) setStep('location') }}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors"
            >
              Next: Location
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 'location' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Where is this issue?</h2>
          <p className="text-sm text-gray-500 mb-4">Help us pinpoint the location so authorities know exactly where to go.</p>
          <div className="space-y-4">
            <button
              onClick={detectLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#008751] text-[#008751] py-4 rounded-xl font-semibold text-sm hover:bg-green-50 transition-colors disabled:opacity-60"
            >
              {locating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
              {locating ? 'Detecting location...' : form.lat ? '✓ Location detected — tap to update' : 'Use My Current Location'}
            </button>
            {form.lat && (
              <p className="text-xs text-center text-green-700 bg-green-50 rounded-lg p-2">
                GPS acquired: {form.lat.toFixed(5)}, {form.lng?.toFixed(5)}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address / Landmark</label>
              <input
                type="text"
                placeholder="e.g. Near Shoprite, Ikeja"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Community / Ward</label>
              <input
                type="text"
                placeholder="e.g. Agbara, Ward 3"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
                value={form.community}
                onChange={e => setForm(f => ({ ...f, community: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setStep('photos')}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors"
            >
              Next: Add Photos
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Photos */}
      {step === 'photos' && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">Add Photo Evidence</h2>
          <p className="text-sm text-gray-500 mb-4">Photos make your report more credible. Up to 3 photos. (Optional)</p>
          <div className="space-y-4">
            {form.photo_urls.length < 3 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 py-8 rounded-2xl text-gray-400 hover:border-[#008751] hover:text-[#008751] transition-colors disabled:opacity-60"
              >
                {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                <span className="text-sm font-medium">{uploading ? 'Uploading...' : 'Tap to add photos'}</span>
                <span className="text-xs">{form.photo_urls.length}/3 photos added</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
            {form.photo_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.photo_urls.map(url => (
                  <div key={url} className="relative aspect-square">
                    <img src={url} alt="Evidence" className="w-full h-full object-cover rounded-xl" />
                    <button
                      onClick={() => removePhoto(url)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.photos && <p className="text-red-500 text-xs">{errors.photos}</p>}
            <button
              onClick={goToSimilar}
              disabled={loadingSimilar || uploading}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingSimilar ? 'Checking for similar issues...' : 'Continue'}
            </button>
            {!loadingSimilar && !uploading && (
              <button
                onClick={goToSimilar}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
              >
                Skip — no photos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Similar issues / Review */}
      {step === 'similar' && (
        <div>
          {similarIssues.length > 0 ? (
            <>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Similar Issues Found</h2>
              <p className="text-sm text-gray-500 mb-4">
                We found {similarIssues.length} existing issue{similarIssues.length > 1 ? 's' : ''} in your area with the same category. Is your problem already reported?
              </p>
              <div className="space-y-3 mb-4">
                {similarIssues.map((issue: any) => (
                  <div key={issue.id} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug flex-1">{issue.title}</h3>
                      <span className="text-xs text-[#008751] font-semibold shrink-0">{issue.report_count} reports</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{issue.description}</p>
                    <button
                      onClick={() => joinIssue(issue.id)}
                      disabled={submitting}
                      className="w-full bg-[#008751] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Adding your report...' : 'Yes, this is the same issue — add my report'}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={submitNewIssue}
                disabled={submitting}
                className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                No, this is a different problem
              </button>
              {submitError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3 mt-4">{submitError}</div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-900 mb-1">Ready to Submit</h2>
              <p className="text-sm text-gray-500 mb-4">No similar issues found in your area. You&apos;ll be the first to report this.</p>
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{form.category_icon}</span>
                  <span className="text-sm font-medium text-gray-600">{form.category_name}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{form.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{form.description}</p>
                {form.address && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={11} /> {form.address}
                  </p>
                )}
                {form.photo_urls.length > 0 && (
                  <div className="flex gap-2">
                    {form.photo_urls.map(url => (
                      <img key={url} src={url} alt="Evidence" className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
              {submitError && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3 mb-4">{submitError}</div>
              )}
              <button
                onClick={submitNewIssue}
                disabled={submitting}
                className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </>
          )}
        </div>
      )}
      </div>{/* end form */}

      {/* Right panel — desktop only */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-20">
        {/* How it works */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">How it works</h3>
          <ol className="space-y-4">
            {[
              { n: '1', title: 'You report an issue', desc: 'Describe the problem with photos and your location.' },
              { n: '2', title: 'Community backs it', desc: 'Neighbours who see the same problem add their report.' },
              { n: '3', title: 'Government is alerted', desc: 'At 50 reports the issue is flagged as High Priority and sent to the relevant authority.' },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#008751] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Tips for a strong report</h3>
          <ul className="space-y-2.5">
            {[
              'Be specific — include street name or nearest landmark',
              'Say how long the problem has existed',
              'Mention who it affects (school children, commuters, etc.)',
              'Add at least one photo — reports with photos get 3× more co-reports',
            ].map(tip => (
              <li key={tip} className="flex gap-2 text-xs text-gray-500 leading-relaxed">
                <span className="text-[#008751] mt-0.5 shrink-0">✓</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Threshold reminder */}
        <div className="bg-[#E8F5EE] border border-[#008751]/20 rounded-2xl p-4">
          <p className="text-xs font-semibold text-[#008751] mb-1">50 reports = action</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            When 50 residents from the same area report the same issue, it is automatically escalated to the local government authority.
          </p>
        </div>
      </aside>
      </div>{/* end flex */}
    </div>
  )
}
