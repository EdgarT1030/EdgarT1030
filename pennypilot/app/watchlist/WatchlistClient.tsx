'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bookmark, BookmarkCheck, TrendingUp } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { createClient } from '@/lib/supabase/client'
import type { Prediction, Item } from '@/lib/supabase/types'

interface PredictionWithItem extends Prediction {
  item: Item
  on_watchlist?: boolean
}

interface WatchlistClientProps {
  predictions: PredictionWithItem[]
  isLoggedIn: boolean
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-copper-700'
  if (score >= 45) return 'text-amber-600'
  return 'text-stone-400'
}

export default function WatchlistClient({ predictions, isLoggedIn }: WatchlistClientProps) {
  const [watchlist, setWatchlist] = useState<Set<string>>(
    new Set(predictions.filter(p => p.on_watchlist).map(p => p.item_id))
  )
  const [toggling, setToggling] = useState<Set<string>>(new Set())

  // Filter tabs
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  const visible = tab === 'mine'
    ? predictions.filter(p => watchlist.has(p.item_id))
    : predictions

  async function toggleWatch(itemId: string) {
    if (!isLoggedIn) {
      window.location.href = '/auth/login'
      return
    }

    setToggling(s => new Set(Array.from(s).concat(itemId)))
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (watchlist.has(itemId)) {
      await supabase.from('item_watchlist').delete().match({ user_id: user.id, item_id: itemId })
      setWatchlist(s => { const n = new Set(s); n.delete(itemId); return n })
    } else {
      await supabase.from('item_watchlist').insert({ user_id: user.id, item_id: itemId })
      setWatchlist(s => new Set(Array.from(s).concat(itemId)))
    }
    setToggling(s => { const n = new Set(s); n.delete(itemId); return n })
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-stone-100 pb-3">
        {(['all', 'mine'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
              ${tab === t ? 'bg-penny text-white' : 'text-ink-muted hover:text-ink'}`}
          >
            {t === 'all' ? 'All predictions' : 'My watchlist'}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={tab === 'mine' ? 'Your watchlist is empty' : 'No predictions yet'}
          description={
            tab === 'mine'
              ? 'Bookmark items from the list to track them here.'
              : 'As users submit markdown candidates (.03 / .06 endings), predictions will appear here.'
          }
          action={
            tab === 'mine'
              ? <button onClick={() => setTab('all')} className="btn-secondary">Browse predictions</button>
              : <Link href="/submit" className="btn-primary">Submit a find</Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map(pred => {
            const { item } = pred
            const watched = watchlist.has(pred.item_id)
            const busy = toggling.has(pred.item_id)

            return (
              <div key={pred.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${scoreColor(pred.score)}`}>
                        {pred.score}%
                      </span>
                      {pred.predicted_window_days_low != null && (
                        <span className="text-xs text-ink-muted">
                          est. {pred.predicted_window_days_low}–{pred.predicted_window_days_high}d
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-ink">{item.name}</h3>
                    <p className="mt-0.5 font-mono text-xs text-ink-muted">
                      {item.sku ?? item.model_number}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleWatch(pred.item_id)}
                    disabled={busy}
                    className={`shrink-0 rounded-xl p-2.5 transition-colors
                      ${watched ? 'bg-penny/10 text-penny' : 'bg-surface-muted text-ink-faint hover:text-ink'}
                      disabled:opacity-50`}
                    aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                    aria-pressed={watched}
                  >
                    {watched
                      ? <BookmarkCheck className="h-5 w-5" aria-hidden />
                      : <Bookmark className="h-5 w-5" aria-hidden />}
                  </button>
                </div>

                {/* Reasons */}
                <div className="mt-3 space-y-1">
                  {pred.reasons.slice(0, 2).map((r, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                      <span className="text-penny" aria-hidden>›</span>
                      {r}
                    </p>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Link
                    href={`/search?q=${encodeURIComponent(item.sku ?? item.model_number ?? '')}`}
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    Check reports
                  </Link>
                  <span className="text-xs text-ink-faint">
                    Updated {new Date(pred.computed_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 px-2 text-center text-[11px] leading-relaxed text-ink-faint">
        Predictions are based on community-reported markdown stages and nationwide penny patterns.
        Not a guarantee — always verify in store.
      </p>
    </div>
  )
}
