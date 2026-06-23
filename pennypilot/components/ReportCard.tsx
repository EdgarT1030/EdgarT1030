import Link from 'next/link'
import { MapPin, Clock, ThumbsUp, ThumbsDown, Coins } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import PennyScoreBadge from '@/components/PennyScoreBadge'
import { RETAILER_LABELS } from '@/lib/constants'
import { formatDistance, haversineDistance } from '@/lib/haversine'
import type { ReportWithDetails } from '@/lib/supabase/types'

interface ReportCardProps {
  report: ReportWithDetails
  userLat?: number
  userLng?: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function ReportCard({ report, userLat, userLng }: ReportCardProps) {
  const { item, store, vote_counts, prediction } = report
  const distance =
    userLat != null && userLng != null
      ? formatDistance(haversineDistance(userLat, userLng, store.lat, store.lng))
      : null
  const isConfirmed = report.status === 'confirmed'

  return (
    <Link
      href={`/report/${report.id}`}
      className="card relative block overflow-hidden transition-all hover:shadow-card-hover active:scale-[0.99]"
    >
      {/* Left accent strip */}
      {isConfirmed && (
        <span className="absolute inset-y-0 left-0 w-1 bg-emerald-400" aria-hidden />
      )}

      <div className={`p-4 ${isConfirmed ? 'pl-5' : ''}`}>
        {/* Confirmed penny callout */}
        {isConfirmed && (
          <div className="mb-2 flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-penny" aria-hidden />
            <span className="text-[11px] font-bold uppercase tracking-widest text-penny">
              $0.01 Confirmed Penny
            </span>
          </div>
        )}

        {/* Name + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-ink">{item.name}</h3>
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {item.sku ?? item.model_number}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge status={report.status} />
            {prediction && !isConfirmed && (
              <PennyScoreBadge prediction={prediction} compact />
            )}
          </div>
        </div>

        {/* Store + distance */}
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-penny/60" aria-hidden />
          <span className="truncate">
            {RETAILER_LABELS[store.retailer]} · {store.city}, {store.state}
          </span>
          {distance && (
            <span className="ml-auto shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-ink">
              {distance}
            </span>
          )}
        </div>

        {/* Votes + time */}
        <div className="mt-2.5 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-600">
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            <span className="font-semibold">{vote_counts.confirm}</span>
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
            <span className="font-semibold">{vote_counts.dispute}</span>
          </span>
          <span className="ml-auto flex items-center gap-1 text-ink-faint">
            <Clock className="h-3 w-3" aria-hidden />
            {timeAgo(report.created_at)}
          </span>
        </div>
      </div>
    </Link>
  )
}
