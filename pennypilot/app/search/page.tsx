import { Search, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SkuSearchBox from '@/components/SkuSearchBox'
import ReportCard from '@/components/ReportCard'
import PennyScoreBadge from '@/components/PennyScoreBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { Prediction } from '@/lib/supabase/types'

const RETAILER_SEARCH_URLS: Record<string, (q: string) => string> = {
  home_depot: (q) => `https://www.homedepot.com/s/${encodeURIComponent(q)}`,
  lowes:      (q) => `https://www.lowes.com/search?searchTerm=${encodeURIComponent(q)}`,
}

async function searchReports(query: string) {
  if (!query.trim()) return { reports: [], prediction: null as Prediction | null }
  const supabase = createClient()
  const q = query.trim()

  const [{ data: reportData }, { data: predData }] = await Promise.all([
    (supabase as any)
      .from('penny_reports')
      .select('*, item:items(*), store:stores(*), vote_counts:report_votes(vote)')
      .or(`sku.ilike.%${q}%,model_number.ilike.%${q}%`, { foreignTable: 'items' })
      .order('created_at', { ascending: false })
      .limit(30),

    // Fetch prediction for this SKU
    (supabase as any)
      .from('predictions')
      .select('*')
      .in(
        'item_id',
        // sub-query: get item IDs matching this SKU
        (supabase as any)
          .from('items')
          .select('id')
          .or(`sku.ilike.%${q}%,model_number.ilike.%${q}%`)
      )
      .order('score', { ascending: false })
      .limit(1),
  ])

  const reports = (reportData ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter((v: any) => v.vote === 'confirm').length,
        dispute: votes.filter((v: any) => v.vote === 'dispute').length,
      },
    }
  })

  const prediction: Prediction | null = (predData ?? [])[0] ?? null

  return { reports, prediction }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q ?? ''
  const { reports, prediction } = await searchReports(query)

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-lg">
          <h1 className="mb-3 text-lg font-bold text-ink">SKU Checker</h1>
          <SkuSearchBox initialQuery={query} autoFocus={!query} placeholder="Enter SKU or model number…" />
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4">
        {!query ? (
          <div className="py-8 text-center">
            <p className="mb-1 text-sm font-medium text-ink">Search any SKU or model number</p>
            <p className="text-xs text-ink-muted">
              Type or paste the number from the shelf tag or product label.
            </p>
          </div>
        ) : (
          <div>
            {/* Penny Score — shown prominently at the top when available */}
            {prediction && (
              <div className="mb-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Penny Probability
                </h2>
                <PennyScoreBadge prediction={prediction} />
              </div>
            )}

            {/* Verify-it-yourself links — NOT scraping; just search page links */}
            {query && (
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-xs text-ink-faint self-center">Verify SKU:</span>
                {Object.entries(RETAILER_SEARCH_URLS).map(([retailer, urlFn]) => (
                  <a
                    key={retailer}
                    href={urlFn(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
                  >
                    {retailer === 'home_depot' ? 'Home Depot' : "Lowe's"}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ))}
              </div>
            )}

            {reports.length === 0 ? (
              <EmptyState
                icon={Search}
                title={`No results for "${query}"`}
                description="This SKU hasn't been reported yet. If you spot it for a penny, submit it!"
                action={
                  <a href="/submit" className="btn-primary">
                    Submit a find
                  </a>
                }
              />
            ) : (
              <div>
                <p className="mb-3 text-xs text-ink-muted">
                  {reports.length} report{reports.length !== 1 ? 's' : ''} for <strong>{query}</strong>
                </p>
                <div className="space-y-3">
                  {reports.map((report: any) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
