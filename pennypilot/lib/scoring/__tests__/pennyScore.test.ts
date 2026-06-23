/**
 * Unit tests for the Penny Probability Score v1 formula.
 * Run with: npx vitest
 * (requires: npm install --save-dev vitest)
 */

import { describe, it, expect } from 'vitest'
import { computePennyScore, computeSeasonMatch, buildScoreInputs } from '../pennyScore'

describe('computePennyScore', () => {
  it('returns 100 + no window for confirmed penny (.01)', () => {
    const result = computePennyScore({
      latestEnding: '01',
      daysAtCurrentStage: 5,
      category: 'Lighting',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(100)
    expect(result.window).toBeNull()
    expect(result.reasons).toContain('Confirmed penny')
  })

  it('.03 stage gives base score of 55', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(55)
  })

  it('.06 stage gives base score of 30', () => {
    const result = computePennyScore({
      latestEnding: '06',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(30)
  })

  it('adds +30 for 5+ nationwide penny stores', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 6,
      seasonMatch: false,
    })
    expect(result.score).toBe(55 + 30)
    expect(result.reasons.some(r => r.includes('6 stores'))).toBe(true)
  })

  it('adds +20 for 3-4 nationwide penny stores', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 4,
      seasonMatch: false,
    })
    expect(result.score).toBe(55 + 20)
  })

  it('adds +12 for 1-2 nationwide penny stores', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 2,
      seasonMatch: false,
    })
    expect(result.score).toBe(55 + 12)
  })

  it('adds dwell bonus for .03 at >= 10 days', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 12,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(55 + 10)
  })

  it('adds dwell bonus for .03 at 5-9 days', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 7,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(55 + 6)
  })

  it('adds dwell bonus for .06 at >= 21 days', () => {
    const result = computePennyScore({
      latestEnding: '06',
      daysAtCurrentStage: 25,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.score).toBe(30 + 8)
  })

  it('adds +5 for season match', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: true,
    })
    expect(result.score).toBe(55 + 5)
  })

  it('caps non-penny score at 99', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 15,
      category: 'Patio Furniture',
      pennyStoreCount: 10,
      seasonMatch: true,
    })
    expect(result.score).toBeLessThanOrEqual(99)
  })

  it('returns .03 window [7,14]', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.window).toEqual([7, 14])
  })

  it('shrinks .03 window when pennyStoreCount >= 3', () => {
    const result = computePennyScore({
      latestEnding: '03',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 4,
      seasonMatch: false,
    })
    expect(result.window).toEqual([2, 9])  // [7-5, 14-5]
  })

  it('returns .06 window [21,42]', () => {
    const result = computePennyScore({
      latestEnding: '06',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.window).toEqual([21, 42])
  })

  it('returns null window for unknown ending', () => {
    const result = computePennyScore({
      latestEnding: 'other',
      daysAtCurrentStage: 0,
      category: 'Hardware',
      pennyStoreCount: 0,
      seasonMatch: false,
    })
    expect(result.window).toBeNull()
  })
})

describe('computeSeasonMatch', () => {
  it('matches heater in January', () => {
    expect(computeSeasonMatch('Heaters & Space Heaters', 1)).toBe(true)
  })

  it('matches garden in May', () => {
    expect(computeSeasonMatch('Garden & Outdoor', 5)).toBe(true)
  })

  it('does not match garden in January', () => {
    expect(computeSeasonMatch('Garden & Outdoor', 1)).toBe(false)
  })

  it('matches patio furniture in July', () => {
    expect(computeSeasonMatch('Patio Furniture', 7)).toBe(true)
  })
})

describe('buildScoreInputs', () => {
  it('computes daysAtCurrentStage from dates', () => {
    const observed = new Date('2024-01-01')
    const now = new Date('2024-01-08')
    const inputs = buildScoreInputs('03', observed, 'Hardware', 0, now)
    expect(inputs.daysAtCurrentStage).toBe(7)
  })

  it('detects season match from now date', () => {
    const observed = new Date('2024-01-01')
    const now = new Date('2024-07-15')  // July — summer/grill season
    const inputs = buildScoreInputs('06', observed, 'Grill & BBQ', 0, now)
    expect(inputs.seasonMatch).toBe(true)
  })
})
