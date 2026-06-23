import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import WatchlistClient from './WatchlistClient'
import type { Prediction, Item } from '@/lib/supabase/types'

interface PredictionWithItem extends Prediction {
  item: Item
  on_watchlist?: boolean
}

async function getPredictions(userId: string | null): Promise<PredictionWithItem[]> {
  const supabase = createClient()

  const { data } = await (supabase as any)
    .from('predictions')
    .select('*, item:items(*)')
    .gt('score', 0)
    .order('score', { ascending: false })
    .limit(50)

  const rows: PredictionWithItem[] = (data ?? []).filter((r: any) => r.item)

  // Mark which items are on the user's watchlist
  if (userId && rows.length > 0) {
    const { data: wl } = await (supabase as any)
      .from('item_watchlist')
      .select('item_id')
      .eq('user_id', userId)
      .in('item_id', rows.map((r: any) => r.item_id))

    const watchedIds = new Set((wl ?? []).map((w: any) => w.item_id))
    rows.forEach(r => { r.on_watchlist = watchedIds.has(r.item_id) })
  }

  return rows
}

export default async function WatchlistPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const predictions = await getPredictions(user?.id ?? null)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <TrendingUp className="h-5 w-5 text-penny" aria-hidden />
          <div>
            <h1 className="text-lg font-bold text-ink">Watchlist</h1>
            <p className="text-xs text-ink-muted">Items about to penny, sorted by probability</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4 pb-8">
        <WatchlistClient predictions={predictions} isLoggedIn={!!user} />
      </div>
    </div>
  )
}
