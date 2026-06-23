import { Suspense } from 'react'
import { Coins } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ReportCardSkeleton } from '@/components/ui/Skeleton'
import FeedClient from './FeedClient'

async function getFeedData(retailer?: string) {
  const supabase = createClient()

  const query = supabase
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

  if (retailer) {
    // Filter on store retailer via a join condition isn't directly supported in .eq on a relation;
    // we do client-side filter after fetch for the feed (dataset is small)
  }

  const { data, error } = await query
  if (error) return []

  const rows = (data ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter((v) => v.vote === 'confirm').length,
        dispute: votes.filter((v) => v.vote === 'dispute').length,
      },
    }
  })

  if (retailer) {
    return rows.filter((r: any) => r.store?.retailer === retailer)
  }
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
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-penny">
            <Coins className="h-4 w-4 text-white" aria-hidden />
          </div>
          <h1 className="text-lg font-bold text-ink">PennyPilot</h1>
          <span className="ml-1 rounded-full bg-penny/10 px-2 py-0.5 text-xs font-medium text-penny">BETA</span>
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
