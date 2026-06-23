import Link from 'next/link'
import { MapPin, Clock, ThumbsUp, ThumbsDown } from 'lucide-react'
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

  return (
    <Link
      href={`/report/${report.id}`}
      className="card block p-4 transition-shadow hover:shadow-card-hover active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-ink">{item.name}</h3>
          <p className="mt-0.5 text-xs text-ink-muted font-mono">
            {item.sku ?? item.model_number}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge status={report.status} />
          {prediction && report.status !== 'confirmed' && (
            <PennyScoreBadge prediction={prediction} compact />
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-penny" aria-hidden />
        <span className="truncate">
          {RETAILER_LABELS[store.retailer]} · {store.city}, {store.state}
        </span>
        {distance && (
          <span className="ml-auto shrink-0 font-medium text-ink">{distance}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
        <span className="flex items-center gap-1">
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
          {vote_counts.confirm}
        </span>
        <span className="flex items-center gap-1">
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
          {vote_counts.dispute}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {timeAgo(report.created_at)}
        </span>
      </div>
    </Link>
  )
}
