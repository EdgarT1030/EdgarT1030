'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { profileSchema } from '@/lib/validators'

interface ProfileUsernameProps {
  currentUsername: string | null
  userId: string
}

export default function ProfileUsername({ currentUsername, userId }: ProfileUsernameProps) {
  const [username, setUsername] = useState(currentUsername ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)

    const parsed = profileSchema.safeParse({ username })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient() as any
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ username: parsed.data.username })
      .eq('id', userId)

    setLoading(false)
    if (dbError) {
      setError(dbError.message.includes('unique') ? 'Username already taken.' : dbError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex gap-2">
      <div className="flex-1">
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          className="input"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="choose a username"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {error && <p className="error-text">{error}</p>}
      </div>
      <div className="pt-7">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : 'Save'}
        </button>
      </div>
    </form>
  )
}
