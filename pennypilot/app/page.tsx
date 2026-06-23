import { Suspense } from 'react'
import { Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReportCardSkeleton } from '@/components/ui/Skeleton'
import FeedClient from './FeedClient'

async function getFeedData(retailer?: string) {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('penny_reports')
    .select(`
      *,
      item:items(*),
      store:stores(*),
      vote_counts:report_votes(vote)
    `)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return []

  const rows = (data ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter((v) => v.vote === 'confirm').length,
        dispute:  votes.filter((v) => v.vote === 'dispute').length,
      },
    }
  })

  if (retailer) return rows.filter((r: any) => r.store?.retailer === retailer)
  return rows
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { retailer?: string }
}) {
  const reports = await getFeedData(searchParams.retailer)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-copper-400 to-penny shadow-sm">
              <Coins className="h-[18px] w-[18px] text-white" aria-hidden />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <h1 className="text-base font-bold tracking-tight text-ink">PennyPilot</h1>
                <span className="rounded-full bg-penny/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-penny">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-medium leading-none text-ink-faint">
                Find the penny. Predict the next.
              </p>
            </div>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-semibold text-emerald-700">LIVE</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4">
        <Suspense
          fallback={
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <ReportCardSkeleton key={i} />)}
            </div>
          }
        >
          <FeedClient initialReports={reports} />
        </Suspense>
      </div>
    </div>
  )
}
