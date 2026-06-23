import type { Prediction } from '@/lib/supabase/types'

interface PennyScoreBadgeProps {
  prediction: Prediction | null | undefined
  compact?: boolean
}

function scoreColor(score: number) {
  if (score === 100) return 'bg-emerald-100 text-emerald-800'
  if (score >= 70)   return 'bg-copper-100 text-copper-800'
  if (score >= 45)   return 'bg-amber-100  text-amber-800'
  return 'bg-stone-100 text-stone-500'
}

function windowLabel(low: number | null, high: number | null): string | null {
  if (low == null || high == null) return null
  return `${low}–${high}d`
}

export default function PennyScoreBadge({ prediction, compact = false }: PennyScoreBadgeProps) {
  if (!prediction) return null

  const { score, predicted_window_days_low: wLow, predicted_window_days_high: wHigh, reasons } = prediction
  const color = scoreColor(score)
  const win = windowLabel(wLow, wHigh)

  if (compact) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${color}`}
        title={reasons.join(' · ')}
        aria-label={`Penny probability ${score}%`}
      >
        {score}%
        {win && <span className="ml-1 font-normal opacity-75">{win}</span>}
      </span>
    )
  }

  return (
    <div className={`rounded-xl px-4 py-3 ${color}`}>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold">{score}%</span>
        <span className="text-sm font-medium">
          {score === 100 ? 'Confirmed penny' : 'penny probability'}
        </span>
        {win && <span className="ml-auto text-xs opacity-75">est. {win}</span>}
      </div>

      <ul className="space-y-1">
        {reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs opacity-90">
            <span aria-hidden>›</span>
            {r}
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[10px] opacity-60">
        Prediction, not a promise — always verify in-store.
      </p>
    </div>
  )
}
