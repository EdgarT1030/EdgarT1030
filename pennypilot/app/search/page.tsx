import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SkuSearchBox from '@/components/SkuSearchBox'
import ReportCard from '@/components/ReportCard'
import EmptyState from '@/components/ui/EmptyState'

async function searchReports(query: string) {
  if (!query.trim()) return []
  const supabase = createClient()
  const q = query.trim()

  const { data, error } = await supabase
    .from('penny_reports')
    .select(`
      *,
      item:items(*),
      store:stores(*),
      vote_counts:report_votes(vote)
    `)
    .or(`sku.ilike.%${q}%,model_number.ilike.%${q}%`, { foreignTable: 'items' })
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return []

  return (data ?? []).map((r: any) => {
    const votes: { vote: string }[] = r.vote_counts ?? []
    return {
      ...r,
      vote_counts: {
        confirm: votes.filter((v) => v.vote === 'confirm').length,
        dispute: votes.filter((v) => v.vote === 'dispute').length,
      },
    }
  })
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const query = searchParams.q ?? ''
  const results = await searchReports(query)

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
              Type or paste the number from the store shelf tag or product label.
            </p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No results for "${query}"`}
            description="This SKU hasn't been reported yet. If you find it for a penny, submit it!"
            action={
              <a href="/submit" className="btn-primary">
                Submit a find
              </a>
            }
          />
        ) : (
          <div>
            <p className="mb-3 text-xs text-ink-muted">
              {results.length} report{results.length !== 1 ? 's' : ''} for <strong>{query}</strong>
            </p>
            <div className="space-y-3">
              {results.map((report: any) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
