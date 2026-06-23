/**
 * Penny Probability Score — v1
 *
 * Isolated, pure-function module. The formula lives in config.ts so weights
 * can be tuned without touching this file. The entire module can be swapped
 * for a trained statistical model (survival analysis / logistic regression)
 * once enough `markdown_observations` rows exist — the function signature
 * won't change.
 *
 * See /PENNY_SCORE_SPEC.md for the authoritative spec.
 */

import {
  STAGE_WEIGHTS,
  PROPAGATION_TIERS,
  DWELL_BONUS,
  SEASON_BONUS,
  WINDOW_DAYS,
  WINDOW_PROPAGATION_SHRINK,
  SEASONAL_KEYWORDS,
} from './config'
import type { ScoreInputs, ScoreOutput, PriceEnding } from './types'

export type { ScoreInputs, ScoreOutput, PriceEnding }

/** True if `category` is in-season for the given month (1–12). */
export function computeSeasonMatch(category: string, month: number): boolean {
  const keywords = SEASONAL_KEYWORDS[month] ?? []
  const cat = category.toLowerCase()
  return keywords.some(kw => cat.includes(kw.toLowerCase()))
}

/**
 * Main scoring function.
 * Inputs are gathered by the caller from `markdown_observations` + `penny_reports`.
 */
export function computePennyScore(inputs: ScoreInputs): ScoreOutput {
  const { latestEnding, daysAtCurrentStage, pennyStoreCount, seasonMatch } = inputs

  // ── Already a confirmed penny ──────────────────────────────────────────
  if (latestEnding === '01') {
    return { score: 100, window: null, reasons: ['Confirmed penny'] }
  }

  let score = 0
  const reasons: string[] = []

  // ── 1. Stage base score ────────────────────────────────────────────────
  const stageBonus = STAGE_WEIGHTS[latestEnding] ?? STAGE_WEIGHTS['other']
  score += stageBonus

  if (latestEnding === '03') {
    reasons.push('Final markdown stage (.03) — late clearance')
  } else if (latestEnding === '06') {
    reasons.push('Mid markdown stage (.06) — worth watching')
  } else {
    reasons.push('Early or unknown markdown stage')
  }

  // ── 2. Nationwide propagation ──────────────────────────────────────────
  const propTier = PROPAGATION_TIERS.find(t => pennyStoreCount >= t.minStores)
  if (propTier) {
    score += propTier.bonus
    reasons.push(
      `Reported penny at ${pennyStoreCount} store${pennyStoreCount !== 1 ? 's' : ''} nationwide`
    )
  }

  // ── 3. Time-at-stage (dwell) ───────────────────────────────────────────
  const dwellTiers = DWELL_BONUS[latestEnding]
  if (dwellTiers) {
    const dwellTier = dwellTiers.find(t => daysAtCurrentStage >= t.minDays)
    if (dwellTier) {
      score += dwellTier.bonus
      reasons.push(`Has sat at this price ${daysAtCurrentStage} days with stock remaining`)
    }
  }

  // ── 4. Season match ────────────────────────────────────────────────────
  if (seasonMatch) {
    score += SEASON_BONUS
    reasons.push('In-season for this category')
  }

  // Cap at 99 — reserve 100 for actual penny
  score = Math.min(score, 99)

  // ── Predicted window ───────────────────────────────────────────────────
  let window: [number, number] | null = null
  const base = WINDOW_DAYS[latestEnding]
  if (base) {
    let [low, high] = base
    if (pennyStoreCount >= WINDOW_PROPAGATION_SHRINK.minStores) {
      low  = Math.max(WINDOW_PROPAGATION_SHRINK.floorDays, low  - WINDOW_PROPAGATION_SHRINK.subtractDays)
      high = Math.max(WINDOW_PROPAGATION_SHRINK.floorDays, high - WINDOW_PROPAGATION_SHRINK.subtractDays)
    }
    window = [low, high]
  }

  return { score, window, reasons }
}

/**
 * Build ScoreInputs from raw DB values.
 * `latestObservedAt` is the timestamp of the most recent markdown_observation for this item.
 * `nowDate` defaults to today — injectable for testing.
 */
export function buildScoreInputs(
  latestEnding: PriceEnding,
  latestObservedAt: Date,
  category: string,
  pennyStoreCount: number,
  nowDate: Date = new Date()
): ScoreInputs {
  const msPerDay = 86_400_000
  const daysAtCurrentStage = Math.floor(
    (nowDate.getTime() - latestObservedAt.getTime()) / msPerDay
  )
  const month = nowDate.getMonth() + 1
  const seasonMatch = computeSeasonMatch(category, month)

  return { latestEnding, daysAtCurrentStage, category, pennyStoreCount, seasonMatch }
}
