'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json.error || 'Something went wrong.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <Image src="/logo.svg" alt="Grassruts" width={200} height={40} priority />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
            <p className="text-gray-500 text-sm mb-4">
              We sent a password reset link to<br />
              <span className="font-semibold text-gray-800">{email}</span>
            </p>
            <p className="text-gray-400 text-xs">Didn&apos;t get it? Check your spam folder.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="Grassruts" width={200} height={40} priority />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your email and we&apos;ll send you a reset link.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#008751] focus:border-transparent"
              />
            </div>
            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#008751] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#006B40] transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            <Link href="/login" className="text-[#008751] font-semibold hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
