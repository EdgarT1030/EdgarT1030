import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ArrowLeft, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import VoteButtons from '@/components/VoteButtons'
import { RETAILER_LABELS } from '@/lib/constants'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [reportResult, authResult] = await Promise.all([
    (supabase as any)
      .from('penny_reports')
      .select(`*, item:items(*), store:stores(*), votes:report_votes(*)`)
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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/95 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link href="/" className="btn-icon btn-ghost -ml-2" aria-label="Back to feed">
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <h1 className="text-base font-bold text-ink truncate">{item.name}</h1>
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
                <span className="font-medium text-ink w-28 shrink-0">SKU</span>
                <span className="font-mono">{item.sku}</span>
              </div>
            )}
            {item.model_number && (
              <div className="flex gap-2">
                <span className="font-medium text-ink w-28 shrink-0">Model #</span>
                <span className="font-mono">{item.model_number}</span>
              </div>
            )}
            {item.category && (
              <div className="flex gap-2">
                <span className="font-medium text-ink w-28 shrink-0">Category</span>
                <span>{item.category}</span>
              </div>
            )}
          </div>
        </div>

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

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-ink-faint px-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Reported {timeAgo(report.created_at)}
          </span>
          {report.status !== 'expired' && expiresIn > 0 && (
            <span>Expires in {expiresIn}d</span>
          )}
          {report.status === 'expired' && (
            <span className="text-stone-400">Expired</span>
          )}
          {report.reported_by && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" aria-hidden />
              Anonymous
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
