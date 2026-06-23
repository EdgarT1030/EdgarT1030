'use client'

import { useState } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-penny">
          <Coins className="h-7 w-7 text-white" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-ink">PennyPilot</h1>
        <p className="text-center text-sm text-ink-muted">
          Community-verified penny finds at Home Depot,<br />
          {"Lowe's"}, Menards and more.
        </p>
      </div>

      <div className="card w-full max-w-sm p-6">
        {sent ? (
          <div className="text-center">
            <div className="mb-3 text-3xl">📬</div>
            <h2 className="mb-1 text-base font-semibold text-ink">Check your email</h2>
            <p className="text-sm text-ink-muted">
              We sent a magic link to <strong>{email}</strong>. Tap it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="mb-4 text-base font-semibold text-ink">Sign in or create account</h2>

            <label htmlFor="email" className="label">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="input mb-4"
              placeholder="you@example.com"
            />

            {error && <p className="error-text mb-3">{error}</p>}

            <button type="submit" disabled={loading || !email} className="btn-primary btn-lg w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Send magic link
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 max-w-xs text-center text-xs text-ink-faint">
        By signing in you agree that PennyPilot only stores your email and chosen username.
        We never scrape retailers or guarantee any pricing.
      </p>
    </div>
  )
}
