'use client'

import { useState, useEffect } from 'react'
import { MapPin, SlidersHorizontal } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReportCard from '@/components/ReportCard'
import EmptyState from '@/components/ui/EmptyState'
import { RETAILER_OPTIONS } from '@/lib/constants'
import { haversineDistance } from '@/lib/haversine'
import type { ReportWithDetails } from '@/lib/supabase/types'

interface FeedClientProps {
  initialReports: ReportWithDetails[]
}

type SortBy = 'recent' | 'distance' | 'confidence'

export default function FeedClient({ initialReports }: FeedClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeRetailer = searchParams.get('retailer') ?? ''

  const [sortBy, setSortBy] = useState<SortBy>('recent')
  const [userLat, setUserLat] = useState<number | undefined>()
  const [userLng, setUserLng] = useState<number | undefined>()
  const [locError, setLocError] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLat(coords.latitude)
        setUserLng(coords.longitude)
        setSortBy('distance')
      },
      () => setLocError(true),
      { timeout: 8000 }
    )
  }, [])

  function setRetailer(val: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (val) { params.set('retailer', val) } else { params.delete('retailer') }
    router.push(`/?${params.toString()}`)
  }

  const sorted = [...initialReports].sort((a, b) => {
    if (sortBy === 'distance' && userLat != null && userLng != null) {
      const da = haversineDistance(userLat, userLng, a.store.lat, a.store.lng)
      const db = haversineDistance(userLat, userLng, b.store.lat, b.store.lng)
      return da - db
    }
    if (sortBy === 'confidence') {
      return (b.vote_counts.confirm - b.vote_counts.dispute) - (a.vote_counts.confirm - a.vote_counts.dispute)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div>
      {/* Filters */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex items-center gap-1.5 shrink-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
        </div>

        {/* Retailer pills */}
        {[{ value: '', label: 'All' }, ...RETAILER_OPTIONS].map(opt => (
          <button
            key={opt.value}
            onClick={() => setRetailer(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
              ${activeRetailer === opt.value
                ? 'bg-penny text-white'
                : 'bg-surface-muted text-ink-muted hover:bg-stone-200'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mb-4 flex gap-2">
        {(
          [
            { key: 'recent', label: 'Recent' },
            { key: 'distance', label: 'Near me' },
            { key: 'confidence', label: 'Most confirmed' },
          ] as { key: SortBy; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              if (key === 'distance' && userLat == null) {
                navigator.geolocation?.getCurrentPosition(
                  ({ coords }) => { setUserLat(coords.latitude); setUserLng(coords.longitude); setSortBy('distance') },
                  () => setLocError(true)
                )
              } else {
                setSortBy(key)
              }
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors
              ${sortBy === key ? 'bg-ink text-white' : 'bg-surface-muted text-ink-muted hover:bg-stone-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {locError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Location unavailable — showing by recency.
        </div>
      )}

      {/* Report cards */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No finds yet"
          description="Be the first to report a penny item near you!"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              userLat={userLat}
              userLng={userLng}
            />
          ))}
        </div>
      )}

      <p className="mt-8 px-2 text-center text-[11px] leading-relaxed text-ink-faint">
        Penny pricing is an unofficial inventory-purge artifact. Stores are not obligated to honor it.
        PennyPilot only stores user-submitted reports — it does not scrape retailers.
        Behave respectfully in stores.
      </p>
    </div>
  )
}
