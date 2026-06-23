import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ArrowLeft, User, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import PennyScoreBadge from '@/components/PennyScoreBadge'
import VoteButtons from '@/components/VoteButtons'
import { RETAILER_LABELS } from '@/lib/constants'
import type { MarkdownObservation, Prediction } from '@/lib/supabase/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const PRICE_ENDING_LABEL: Record<string, string> = {
  '01': '$.01 — Penny',
  '03': '$._ _3 — Final markdown',
  '06': '$._ _6 — Mid markdown',
  other: 'Other ending',
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [reportResult, authResult] = await Promise.all([
    (supabase as any)
      .from('penny_reports')
      .select('*, item:items(*), store:stores(*), votes:report_votes(*)')
      .eq('id', params.id)
      .single(),
    supabase.auth.getUser(),
  ])

  const report = reportResult.data as any
  const user = authResult.data.user

  if (!report) notFound()

  const votes: { vote: string; user_id: string }[] = report.votes ?? []
  const voteCounts = {
    confirm: votes.filter((v: any) => v.vote === 'confirm').length,
    dispute: votes.filter((v: any) => v.vote === 'dispute').length,
  }
  const userVote = user
    ? (votes.find((v: any) => v.user_id === user.id)?.vote as any) ?? null
    : null

  const { item, store } = report
  const expiresIn = Math.ceil((new Date(report.expires_at).getTime() - Date.now()) / 86400000)

  // Fetch markdown history and prediction for this item
  const [{ data: mdHistory }, { data: predData }] = await Promise.all([
    (supabase as any)
      .from('markdown_observations')
      .select('*')
      .eq('item_id', item.id)
      .order('observed_at', { ascending: true }),
    (supabase as any)
      .from('predictions')
      .select('*')
      .eq('item_id', item.id)
      .maybeSingle(),
  ])

  const observations: MarkdownObservation[] = mdHistory ?? []
  const prediction: Prediction | null = predData ?? null

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/" className="btn-icon btn-ghost -ml-2" aria-label="Back to feed">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="truncate text-base font-bold text-ink">{item.name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 space-y-4">
        {/* Price + status */}
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-4xl font-bold text-penny">$0.01</span>
              <p className="mt-1 text-sm text-ink-muted">{item.name}</p>
            </div>
            <Badge status={report.status} />
          </div>

          <div className="mt-4 space-y-2 text-sm text-ink-muted">
            {item.sku && (
              <div className="flex gap-2">
                <span className="w-28 shrink-0 font-medium text-ink">SKU</span>
                <span className="font-mono">{item.sku}</span>
              </div>
            )}
            {item.model_number && (
              <div className="flex gap-2">
                <span className="w-28 shrink-0 font-medium text-ink">Model #</span>
                <span className="font-mono">{item.model_number}</span>
              </div>
            )}
            {item.category && (
              <div className="flex gap-2">
                <span className="w-28 shrink-0 font-medium text-ink">Category</span>
                <span>{item.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Penny Probability Score (if relevant) */}
        {prediction && report.status !== 'confirmed' && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Penny Probability
            </h2>
            <PennyScoreBadge prediction={prediction} />
          </div>
        )}

        {/* Store */}
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-penny" aria-hidden />
            <div>
              <p className="font-semibold text-ink">{store.name}</p>
              <p className="text-sm text-ink-muted">
                {RETAILER_LABELS[store.retailer as string]}
                {store.store_number ? ` #${store.store_number}` : ''}
              </p>
              <p className="text-sm text-ink-muted">{store.address}, {store.city}, {store.state} {store.zip}</p>
            </div>
          </div>
        </div>

        {/* Photo */}
        {report.photo_url && (
          <div className="card overflow-hidden">
            <Image
              src={report.photo_url}
              alt="Price scanner showing $0.01"
              width={600}
              height={400}
              className="w-full object-cover"
            />
            <p className="px-4 py-2 text-xs text-ink-faint">Photo submitted by reporter</p>
          </div>
        )}

        {/* Markdown History Timeline */}
        {observations.length > 0 && (
          <div className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-penny" aria-hidden />
              <h2 className="text-sm font-semibold text-ink">Markdown history</h2>
            </div>
            <div className="relative pl-4">
              {/* Vertical line */}
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-stone-200" aria-hidden />

              <div className="space-y-3">
                {observations.map((obs, _i) => (
                  <div key={obs.id} className="flex items-start gap-3">
                    <div
                      className={`relative z-10 -ml-4 mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-white
                        ${obs.price_ending === '01' ? 'bg-emerald-500'
                          : obs.price_ending === '03' ? 'bg-amber-500'
                          : obs.price_ending === '06' ? 'bg-copper-400'
                          : 'bg-stone-300'}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-ink">
                          {PRICE_ENDING_LABEL[obs.price_ending] ?? obs.price_ending}
                        </span>
                        <span className="text-[10px] text-ink-faint">
                          {new Date(obs.observed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        {RETAILER_LABELS[store.retailer as string]} · {store.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-ink-faint px-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Reported {timeAgo(report.created_at)}
          </span>
          {report.status !== 'expired' && expiresIn > 0 && (
            <span>Expires in {expiresIn}d</span>
          )}
          {report.status === 'expired' && <span className="text-stone-400">Expired</span>}
          {report.reported_by && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden />
              Community report
            </span>
          )}
        </div>

        {/* Vote */}
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink">Is this still a penny?</h2>
          <VoteButtons
            reportId={report.id}
            voteCounts={voteCounts}
            userVote={userVote}
            reportStatus={report.status}
          />
          {!user && (
            <p className="mt-2 text-xs text-ink-faint">
              <Link href="/auth/login" className="font-medium text-penny">Sign in</Link> to vote.
            </p>
          )}
        </div>

        <p className="text-center text-[11px] leading-relaxed text-ink-faint px-2">
          Penny pricing is an unofficial inventory-purge artifact. Stores are not obligated to
          honor it. Please behave respectfully and verify pricing at the register.
        </p>
      </div>
    </div>
  )
}
