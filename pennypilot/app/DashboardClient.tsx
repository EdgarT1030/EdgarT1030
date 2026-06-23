'use client'

import {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Coins, MapPin, Clock, ChevronRight, ChevronDown, ChevronUp,
  Plus, Search, ThumbsUp, ThumbsDown, X, Zap, Info,
} from 'lucide-react'
import PennyMeter from '@/components/PennyMeter'
import { createClient } from '@/lib/supabase/client'
import { haversineDistance, formatDistance } from '@/lib/haversine'
import { RETAILER_LABELS, RETAILER_OPTIONS } from '@/lib/constants'
import type { ReportWithDetails, PredictionWithItem, Profile, VoteType } from '@/lib/supabase/types'

// ─── helpers ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function windowLabel(lo: number | null, hi: number | null) {
  if (lo == null || hi == null) return null
  return `~${lo}–${hi}d`
}

// ─── props ──────────────────────────────────────────────────
interface Props {
  initialReports:  ReportWithDetails[]
  predictions:     PredictionWithItem[]
  profile:         Profile | null
  nearbyCount:     number
}

// ─── onboarding steps ───────────────────────────────────────
const COACH = [
  {
    icon: Zap,
    title: 'This is your radar.',
    body: 'Items near you that are about to drop to $0.01 — before they do. The brighter the coin, the closer it is to pennying.',
  },
  {
    icon: Search,
    title: 'In a store? Check the SKU.',
    body: 'Type any SKU or model number. We\'ll tell you instantly if it\'s a known penny or about to become one.',
  },
  {
    icon: Plus,
    title: 'Found one? Report it.',
    body: 'Your report is verified by the community. Three confirms and it\'s locked in for everyone.',
  },
]

// ─── explainer content ──────────────────────────────────────
const EXPLAINER = [
  {
    q: 'What\'s a penny item?',
    a: 'When a retailer clears out old inventory, its in-store price can drop to exactly $0.01. This doesn\'t show online — you only see it at a store price-checker or register.',
  },
  {
    q: 'How do I find one?',
    a: 'Scan or type the SKU at a price-checker kiosk in the store. If it shows $0.01, you found one. Then report it here so the community knows.',
  },
  {
    q: 'How many can I buy?',
    a: '1–3 per store visit is the typical community guideline. Policies vary by store and manager. Always ask first and be respectful.',
  },
  {
    q: 'Is this guaranteed?',
    a: 'No. Stores aren\'t required to honor $0.01 prices. Use these predictions as signals, not promises. Always verify in store.',
  },
  {
    q: 'Where does the data come from?',
    a: 'Every find on PennyPilot is submitted by a community member. We never scrape or automate requests to any retailer website.',
  },
]

// ── main component ───────────────────────────────────────────
export default function DashboardClient({ initialReports, predictions, profile, nearbyCount }: Props) {
  const router = useRouter()

  // ── state ──────────────────────────────────────────────────
  const [reports, setReports]       = useState<ReportWithDetails[]>(initialReports)
  const [newIds,  setNewIds]        = useState<Set<string>>(new Set())
  const [userLat, setUserLat]       = useState<number>()
  const [userLng, setUserLng]       = useState<number>()
  const [statsOpen,    setStatsOpen]    = useState(false)
  const [explainerOpen, setExplainerOpen] = useState(false)
  const [coachStep,    setCoachStep]    = useState<number | null>(null)
  const [filterRetailer, setFilterRetailer] = useState('')
  const [sortBy, setSortBy]             = useState<'recent' | 'distance'>('recent')
  const [skuQuery, setSkuQuery]         = useState('')

  // ── onboarding check ───────────────────────────────────────
  useEffect(() => {
    try {
      if (!localStorage.getItem('pp-onboard-v1')) setCoachStep(1)
    } catch { /* storage blocked */ }
  }, [])

  function advanceCoach() {
    if (coachStep === null) return
    if (coachStep >= COACH.length) {
      try { localStorage.setItem('pp-onboard-v1', '1') } catch { /* */ }
      setCoachStep(null)
    } else {
      setCoachStep(coachStep + 1)
    }
  }
  function dismissCoach() {
    try { localStorage.setItem('pp-onboard-v1', '1') } catch { /* */ }
    setCoachStep(null)
  }

  // ── geolocation ────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLat(coords.latitude)
        setUserLng(coords.longitude)
        setSortBy('distance')
      },
      () => { /* denied — stay on recent */ },
      { timeout: 8000 },
    )
  }, [])

  // ── supabase realtime ──────────────────────────────────────
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'penny_reports' },
        async (payload) => {
          const { data } = await (supabase as any)
            .from('penny_reports')
            .select('*, item:items(*), store:stores(*), vote_counts:report_votes(vote)')
            .eq('id', payload.new.id)
            .single()
          if (!data) return
          const votes: { vote: string }[] = data.vote_counts ?? []
          const full: ReportWithDetails = {
            ...data,
            vote_counts: {
              confirm: votes.filter((v: any) => v.vote === 'confirm').length,
              dispute:  votes.filter((v: any) => v.vote === 'dispute').length,
            },
          }
          setReports(prev => [full, ...prev])
          setNewIds(s => new Set([...Array.from(s), full.id]))
          setTimeout(() => setNewIds(s => {
            const n = new Set(s); n.delete(full.id); return n
          }), 3000)
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── vote handler ──────────────────────────────────────────
  const castVote = useCallback(async (reportId: string, vote: VoteType) => {
    const supabase = createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const current = reports.find(r => r.id === reportId)
    const prevVote = current?.user_vote ?? null

    // Optimistic update
    setReports(prev => prev.map(r => {
      if (r.id !== reportId) return r
      const counts = { ...r.vote_counts }
      if (prevVote) counts[prevVote] = Math.max(0, counts[prevVote] - 1)
      if (prevVote !== vote) counts[vote] = counts[vote] + 1
      return { ...r, vote_counts: counts, user_vote: prevVote === vote ? null : vote }
    }))

    if (prevVote === vote) {
      await supabase.from('report_votes')
        .delete().match({ report_id: reportId, user_id: user.id })
    } else {
      await supabase.from('report_votes')
        .upsert({ report_id: reportId, user_id: user.id, vote })
    }
  }, [reports, router])

  // ── sorted/filtered feed ──────────────────────────────────
  const visibleReports = useMemo(() => {
    return [...reports]
      .filter(r => !filterRetailer || r.store?.retailer === filterRetailer)
      .sort((a, b) => {
        if (sortBy === 'distance' && userLat != null && userLng != null) {
          const da = haversineDistance(userLat, userLng, a.store.lat, a.store.lng)
          const db = haversineDistance(userLat, userLng, b.store.lat, b.store.lng)
          return da - db
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [reports, filterRetailer, sortBy, userLat, userLng])

  // ── sku quick-search ──────────────────────────────────────
  function handleSkuSearch(e: React.FormEvent) {
    e.preventDefault()
    if (skuQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(skuQuery.trim())}`)
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-paper">

      {/* ── Onboarding coachmark overlay ─────────────────── */}
      {coachStep !== null && coachStep <= COACH.length && (
        <CoachmarkOverlay
          step={coachStep}
          total={COACH.length}
          onNext={advanceCoach}
          onDismiss={dismissCoach}
        />
      )}

      {/* ── Sticky header ────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-copper-100 bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-copper-400 to-copper shadow-sm">
              <Coins className="h-[18px] w-[18px] text-white" aria-hidden />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
                  PennyPilot
                </span>
                <span className="rounded-full bg-copper/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-copper">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-medium leading-none text-ink-faint">
                Find the penny. Predict the next.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-sage/10 px-2.5 py-1">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage" />
            </span>
            <span className="text-[10px] font-semibold text-sage">LIVE</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5 pb-8">

        {/* ── 1. Greeting strip ────────────────────────── */}
        <GreetingStrip profile={profile} nearbyCount={nearbyCount} />

        {/* ── 2. THE RADAR — "About to Penny" rail ─────── */}
        <RadarRail predictions={predictions} userLat={userLat} userLng={userLng} />

        {/* ── 3. Live near you feed ────────────────────── */}
        <LiveFeed
          reports={visibleReports}
          newIds={newIds}
          filterRetailer={filterRetailer}
          sortBy={sortBy}
          userLat={userLat}
          userLng={userLng}
          onFilterRetailer={setFilterRetailer}
          onSortBy={setSortBy}
          onVote={castVote}
        />

        {/* ── 4. Quick actions ─────────────────────────── */}
        <section aria-labelledby="quick-actions-label">
          <h2 id="quick-actions-label" className="eyebrow mb-3">Quick actions</h2>
          <div className="space-y-2.5">
            <Link
              href="/submit"
              className="flex w-full items-center justify-between gap-3 rounded-2xl bg-copper px-5 py-4 text-white shadow-copper transition-all hover:bg-copper-700 active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
                <div className="text-left">
                  <p className="font-semibold leading-tight">Report a Find</p>
                  <p className="text-[11px] text-white/70">Found a penny? Tell the community.</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            </Link>

            <form onSubmit={handleSkuSearch}>
              <label htmlFor="sku-quick" className="sr-only">Check a SKU or model number</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                    aria-hidden
                  />
                  <input
                    id="sku-quick"
                    type="search"
                    inputMode="search"
                    placeholder="Check a SKU or model #…"
                    value={skuQuery}
                    onChange={e => setSkuQuery(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!skuQuery.trim()}
                  className="rounded-xl bg-paper-muted px-4 text-sm font-semibold text-ink transition-colors hover:bg-copper-100 disabled:opacity-40"
                >
                  Check
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── 5. Stats / Your Hunt (collapsible) ───────── */}
        <StatsPanel profile={profile} open={statsOpen} onToggle={() => setStatsOpen(v => !v)} />

        {/* ── "New here?" link ─────────────────────────── */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setExplainerOpen(true)}
            className="flex items-center gap-1.5 text-[12px] text-ink-faint transition-colors hover:text-copper"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
            New here? How penny hunting works
          </button>
        </div>

        <p className="px-2 text-center text-[10px] leading-relaxed text-ink-faint">
          Predictions are not promises — always verify pricing at the register.
          PennyPilot stores only community-submitted reports; it never scrapes retailers.
        </p>
      </div>

      {/* ── Explainer drawer ─────────────────────────────── */}
      {explainerOpen && (
        <ExplainerDrawer onClose={() => setExplainerOpen(false)} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

// ── Greeting strip ────────────────────────────────────────────
function GreetingStrip({ profile, nearbyCount }: { profile: Profile | null; nearbyCount: number }) {
  const name = profile?.username
    ? profile.username.split(' ')[0]
    : null

  return (
    <div className="rounded-2xl bg-gradient-to-br from-copper-50 to-paper-card px-5 py-4 ring-1 ring-copper-100">
      <p className="font-display text-xl font-semibold text-ink">
        {greeting()}{name ? `, ${name}` : ''}.
      </p>
      {nearbyCount > 0 ? (
        <p className="mt-1 text-sm text-ink-muted">
          <span className="font-semibold text-sage">{nearbyCount}</span>
          {' '}confirmed penn{nearbyCount === 1 ? 'y' : 'ies'} verified today.
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-muted">
          No confirmed pennies today yet — the hunt is on.
        </p>
      )}
    </div>
  )
}

// ── Radar rail — "About to Penny" ────────────────────────────
function RadarRail({
  predictions,
  userLat,
  userLng,
}: {
  predictions: PredictionWithItem[]
  userLat?: number
  userLng?: number
}) {
  return (
    <section aria-labelledby="radar-label">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 id="radar-label" className="eyebrow">The Radar</h2>
          <p className="mt-0.5 text-[11px] text-ink-muted">Items predicted to penny near you</p>
        </div>
        <Link href="/watchlist" className="text-[11px] font-semibold text-copper hover:underline">
          See all →
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-copper-200 bg-copper-50/40 px-5 py-8 text-center">
          <Zap className="mx-auto mb-2 h-6 w-6 text-copper/50" aria-hidden />
          <p className="text-sm font-medium text-ink-muted">No radar targets yet.</p>
          <p className="mt-1 text-[12px] text-ink-faint">
            Report a markdown (.03 or .06 ending) to start the radar.
          </p>
          <Link href="/submit" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-copper">
            Submit a markdown <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <div
          className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2"
          role="list"
          aria-label="Items about to penny"
          style={{ scrollbarWidth: 'none' }}
        >
          {predictions.map(pred => {
            const dist =
              userLat != null && userLng != null
                ? null // store lat/lng not directly on prediction; shown as "—"
                : null
            return (
              <RadarCard
                key={pred.id}
                prediction={pred}
                distance={dist}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

function RadarCard({
  prediction,
  distance: _distance,
}: {
  prediction: PredictionWithItem
  distance: string | null
}) {
  const { item, score, predicted_window_days_low: lo, predicted_window_days_high: hi, reasons } = prediction
  const win = windowLabel(lo, hi)
  const isHot = score >= 80

  return (
    <Link
      href={`/search?q=${encodeURIComponent(item.sku ?? item.model_number ?? item.name)}`}
      role="listitem"
      className={`group relative flex w-[152px] shrink-0 flex-col rounded-2xl p-3.5 transition-all hover:shadow-card-hover active:scale-[0.98]
        ${isHot
          ? 'bg-gradient-to-b from-copper-50 to-paper-card ring-1 ring-copper-200'
          : 'bg-paper-card ring-1 ring-black/[0.04]'
        }`}
    >
      {isHot && (
        <span className="absolute right-3 top-3 text-[9px] font-bold uppercase tracking-widest text-copper">
          Hot
        </span>
      )}

      {/* Coin meter — the signature */}
      <div className="mb-3 flex justify-center">
        <PennyMeter score={score} size={68} />
      </div>

      <p className="truncate text-[12px] font-semibold leading-tight text-ink">
        {item.name}
      </p>
      <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
        {item.sku ?? item.model_number ?? '—'}
      </p>

      {win && (
        <p className="mt-2 text-[10px] font-medium text-copper">
          {win} predicted
        </p>
      )}

      {reasons[0] && (
        <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-ink-faint">
          {reasons[0]}
        </p>
      )}

      <p className="mt-2 text-[9px] text-ink-faint/60">Prediction, not a promise.</p>
    </Link>
  )
}

// ── Live near you feed ────────────────────────────────────────
function LiveFeed({
  reports,
  newIds,
  filterRetailer,
  sortBy,
  userLat,
  userLng,
  onFilterRetailer,
  onSortBy,
  onVote,
}: {
  reports: ReportWithDetails[]
  newIds: Set<string>
  filterRetailer: string
  sortBy: 'recent' | 'distance'
  userLat?: number
  userLng?: number
  onFilterRetailer: (r: string) => void
  onSortBy: (s: 'recent' | 'distance') => void
  onVote: (id: string, vote: VoteType) => Promise<void>
}) {
  return (
    <section aria-labelledby="feed-label">
      {/* Feed header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="feed-label" className="eyebrow">Live near you</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSortBy('recent')}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors
              ${sortBy === 'recent' ? 'bg-ink text-white' : 'bg-paper-muted text-ink-muted hover:bg-copper-100'}`}
          >
            Recent
          </button>
          <button
            onClick={() => onSortBy('distance')}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors
              ${sortBy === 'distance' ? 'bg-ink text-white' : 'bg-paper-muted text-ink-muted hover:bg-copper-100'}`}
          >
            Nearest
          </button>
        </div>
      </div>

      {/* Retailer filter pills */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {[{ value: '', label: 'All' }, ...RETAILER_OPTIONS].map(opt => (
          <button
            key={opt.value}
            onClick={() => onFilterRetailer(opt.value)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors
              ${filterRetailer === opt.value
                ? 'bg-copper text-white'
                : 'bg-paper-muted text-ink-muted hover:bg-copper-100'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Feed rows */}
      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-copper-200 bg-copper-50/30 px-5 py-10 text-center">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-copper/40" aria-hidden />
          <p className="text-sm font-medium text-ink-muted">No finds here yet.</p>
          <p className="mt-1 text-[12px] text-ink-faint">
            Be the first to report a penny item in this area.
          </p>
          <Link href="/submit" className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-copper">
            Report a find <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5" role="list" aria-label="Recent penny finds">
          {reports.map(report => (
            <FeedRow
              key={report.id}
              report={report}
              isNew={newIds.has(report.id)}
              userLat={userLat}
              userLng={userLng}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// Status config using the new sage/amber/clay palette
const STATUS = {
  confirmed: {
    dot:   'bg-sage',
    strip: 'bg-sage',
    label: 'Confirmed',
    badge: 'bg-[#EBF3EE] text-sage',
  },
  pending: {
    dot:   'bg-warm-amber',
    strip: 'bg-warm-amber',
    label: 'Pending',
    badge: 'bg-[#FBF3E0] text-warm-amber',
  },
  expired: {
    dot:   'bg-ink-faint',
    strip: 'bg-paper-muted',
    label: 'Expired',
    badge: 'bg-paper-muted text-ink-faint',
  },
  disputed: {
    dot:   'bg-clay',
    strip: 'bg-clay',
    label: 'Disputed',
    badge: 'bg-[#F9ECEA] text-clay',
  },
} as const

function FeedRow({
  report,
  isNew,
  userLat,
  userLng,
  onVote,
}: {
  report: ReportWithDetails
  isNew: boolean
  userLat?: number
  userLng?: number
  onVote: (id: string, vote: VoteType) => Promise<void>
}) {
  const [voting, setVoting] = useState(false)
  const { item, store, vote_counts, status } = report
  const cfg = STATUS[status] ?? STATUS.pending

  const dist =
    userLat != null && userLng != null
      ? formatDistance(haversineDistance(userLat, userLng, store.lat, store.lng))
      : null

  async function vote(v: VoteType) {
    setVoting(true)
    await onVote(report.id, v)
    setVoting(false)
  }

  return (
    <div
      role="listitem"
      className={`card relative overflow-hidden transition-all hover:shadow-card-hover
        ${isNew ? 'animate-slide-in' : ''}`}
    >
      {/* Status left strip */}
      <span className={`absolute inset-y-0 left-0 w-1 ${cfg.strip}`} aria-hidden />

      <div className="flex items-start gap-3 p-3.5 pl-4">
        {/* Status dot + label */}
        <div className="mt-0.5 shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden />
            {cfg.label}
          </span>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <Link href={`/report/${report.id}`} className="block">
            <p className="truncate text-[13px] font-semibold text-ink">{item.name}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
              <span className="font-mono">{item.sku ?? item.model_number}</span>
              <span className="text-ink-faint/40">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-copper/60" aria-hidden />
                <span>{RETAILER_LABELS[store.retailer]} #{store.store_number ?? store.city}</span>
              </span>
              {dist && <span className="font-mono text-ink">{dist}</span>}
            </div>
          </Link>

          {/* Bottom row: time + votes + still/gone */}
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-ink-faint">
              <Clock className="h-3 w-3" aria-hidden />
              {timeAgo(report.created_at)}
            </span>
            <span className="flex items-center gap-2.5 text-[10px]">
              <span className="flex items-center gap-1 text-sage">
                <ThumbsUp className="h-3 w-3" aria-hidden />
                <span className="font-mono font-semibold">{vote_counts.confirm}</span>
              </span>
              <span className="flex items-center gap-1 text-clay">
                <ThumbsDown className="h-3 w-3" aria-hidden />
                <span className="font-mono font-semibold">{vote_counts.dispute}</span>
              </span>
            </span>

            {/* Still here / Gone */}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => vote('confirm')}
                disabled={voting}
                aria-pressed={report.user_vote === 'confirm'}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors
                  ${report.user_vote === 'confirm'
                    ? 'bg-sage/15 text-sage'
                    : 'bg-paper-muted text-ink-muted hover:bg-sage/10 hover:text-sage'
                  } disabled:opacity-40`}
              >
                Still here
              </button>
              <button
                onClick={() => vote('dispute')}
                disabled={voting}
                aria-pressed={report.user_vote === 'dispute'}
                className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold transition-colors
                  ${report.user_vote === 'dispute'
                    ? 'bg-clay/15 text-clay'
                    : 'bg-paper-muted text-ink-muted hover:bg-clay/10 hover:text-clay'
                  } disabled:opacity-40`}
              >
                Gone
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stats panel ───────────────────────────────────────────────
function StatsPanel({
  profile,
  open,
  onToggle,
}: {
  profile: Profile | null
  open: boolean
  onToggle: () => void
}) {
  if (!profile) return null

  return (
    <section>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl bg-paper-card px-5 py-3.5 text-left ring-1 ring-black/[0.03] transition-colors hover:bg-paper-muted"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="eyebrow">Your Hunt</span>
          {!open && (
            <span className="text-[11px] text-ink-faint">
              rep {profile.reputation_score ?? 0}
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-ink-faint" aria-hidden />
          : <ChevronDown className="h-4 w-4 text-ink-faint" aria-hidden />}
      </button>

      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2 animate-fade-in">
          {[
            { label: 'Reputation', value: profile.reputation_score ?? 0 },
            { label: 'Member since', value: new Date(profile.created_at).getFullYear() },
            { label: 'Finds', value: '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-paper-card p-3.5 text-center ring-1 ring-black/[0.03]"
            >
              <p className="font-display text-xl font-semibold text-copper">{value}</p>
              <p className="mt-0.5 text-[10px] text-ink-faint">{label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Onboarding coachmark ──────────────────────────────────────
function CoachmarkOverlay({
  step,
  total,
  onNext,
  onDismiss,
}: {
  step: number
  total: number
  onNext: () => void
  onDismiss: () => void
}) {
  const data = COACH[step - 1]
  const Icon = data.icon
  const isLast = step === total

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal
      aria-label="Getting started with PennyPilot"
    >
      <div className="w-full max-w-lg rounded-3xl bg-paper-card p-6 shadow-2xl">
        {/* Progress dots */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i < step ? 'w-5 bg-copper' : 'w-1.5 bg-paper-muted'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onDismiss}
            className="rounded-full p-1.5 text-ink-faint hover:bg-paper-muted"
            aria-label="Skip introduction"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-copper/10">
          <Icon className="h-6 w-6 text-copper" aria-hidden />
        </div>
        <h3 className="font-display mt-3 text-xl font-semibold text-ink">{data.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{data.body}</p>

        <button
          onClick={onNext}
          className="mt-6 w-full rounded-xl bg-copper py-3 text-sm font-semibold text-white shadow-copper transition-all hover:bg-copper-700 active:scale-[0.98]"
        >
          {isLast ? 'Start hunting' : 'Next'}
        </button>
      </div>
    </div>
  )
}

// ── Explainer drawer ──────────────────────────────────────────
function ExplainerDrawer({ onClose }: { onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    drawerRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal
      aria-label="How penny hunting works"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-t-3xl bg-paper-card p-6 pb-10 shadow-2xl outline-none max-h-[85vh] overflow-y-auto"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">How penny hunting works</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-faint hover:bg-paper-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          {EXPLAINER.map(({ q, a }) => (
            <div key={q} className="rounded-2xl bg-paper-muted p-4">
              <p className="text-sm font-semibold text-ink">{q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{a}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[10px] text-ink-faint">
          Penny pricing is an unofficial inventory artifact. Stores are under no obligation
          to honor it. Please be respectful to staff.
        </p>
      </div>
    </div>
  )
}
