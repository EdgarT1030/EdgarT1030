'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { VoteType } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface VoteButtonsProps {
  reportId: string
  voteCounts: { confirm: number; dispute: number }
  userVote?: VoteType | null
  reportStatus: string
}

export default function VoteButtons({ reportId, voteCounts, userVote: initialVote, reportStatus }: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<VoteType | null>(initialVote ?? null)
  const [counts, setCounts] = useState(voteCounts)
  const [isPending, startTransition] = useTransition()

  const isExpired = reportStatus === 'expired'

  async function handleVote(vote: VoteType) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth/login'
      return
    }

    startTransition(async () => {
      if (userVote === vote) {
        // Toggle off
        await (supabase.from('report_votes') as any).delete().match({ report_id: reportId, user_id: user.id })
        setCounts(c => ({ ...c, [vote]: c[vote] - 1 }))
        setUserVote(null)
      } else {
        if (userVote) {
          // Switch vote
          await (supabase.from('report_votes') as any).update({ vote }).match({ report_id: reportId, user_id: user.id })
          setCounts(c => ({ confirm: c.confirm + (vote === 'confirm' ? 1 : -1), dispute: c.dispute + (vote === 'dispute' ? 1 : -1) }))
        } else {
          await (supabase.from('report_votes') as any).insert({ report_id: reportId, user_id: user.id, vote })
          setCounts(c => ({ ...c, [vote]: c[vote] + 1 }))
        }
        setUserVote(vote)
      }
    })
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleVote('confirm')}
        disabled={isPending || isExpired}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
          ${userVote === 'confirm'
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
        aria-pressed={userVote === 'confirm'}
        aria-label={`Confirm this report (${counts.confirm})`}
      >
        <ThumbsUp className="h-4 w-4" aria-hidden />
        Still there · {counts.confirm}
      </button>

      <button
        onClick={() => handleVote('dispute')}
        disabled={isPending || isExpired}
        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
          ${userVote === 'dispute'
            ? 'bg-red-600 text-white'
            : 'bg-red-50 text-red-700 hover:bg-red-100'}
          disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
        aria-pressed={userVote === 'dispute'}
        aria-label={`Dispute this report (${counts.dispute})`}
      >
        <ThumbsDown className="h-4 w-4" aria-hidden />
        Gone · {counts.dispute}
      </button>
    </div>
  )
}
