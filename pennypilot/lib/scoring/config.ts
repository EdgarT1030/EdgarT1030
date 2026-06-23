// Tunable weights — change these as real data accumulates; do NOT hardcode inline
export const STAGE_WEIGHTS: Record<string, number> = {
  '01': 0,    // handled separately (returns 100 immediately)
  '03': 55,   // final markdown — grab-now signal
  '06': 30,   // mid markdown — watch signal
  other: 10,
}

export const PROPAGATION_TIERS = [
  { minStores: 5, bonus: 30 },
  { minStores: 3, bonus: 20 },
  { minStores: 1, bonus: 12 },
]

// Per-ending dwell bonuses: [{ minDays, bonus }] ordered highest-first
export const DWELL_BONUS: Record<string, Array<{ minDays: number; bonus: number }>> = {
  '03': [
    { minDays: 10, bonus: 10 },
    { minDays: 5,  bonus: 6  },
  ],
  '06': [
    { minDays: 21, bonus: 8 },
  ],
}

export const SEASON_BONUS = 5

// Predicted days-until-penny window per ending stage
export const WINDOW_DAYS: Record<string, [number, number]> = {
  '03': [7,  14],
  '06': [21, 42],
}

// Nationwide propagation shrinks the window
export const WINDOW_PROPAGATION_SHRINK = {
  minStores:    3,
  subtractDays: 5,
  floorDays:    1,
}

// Category keywords in-season by month (1 = Jan … 12 = Dec)
// From public penny-hunting guides; update as community data validates
export const SEASONAL_KEYWORDS: Record<number, string[]> = {
  1:  ['holiday', 'winter', 'heater'],
  2:  ['holiday', 'winter', 'heater'],
  3:  ['snow', 'winter garden', 'space heater'],
  4:  ['snow', 'winter garden', 'space heater'],
  5:  ['spring décor', 'garden'],
  6:  ['spring décor', 'garden'],
  7:  ['spring', 'summer', 'grill', 'patio'],
  8:  ['spring', 'summer', 'grill', 'patio'],
  9:  ['summer clearance', 'fan', 'ac'],
  10: ['summer clearance', 'fan', 'ac'],
  11: ['fall', 'halloween', 'holiday clearance'],
  12: ['fall', 'halloween', 'holiday clearance'],
}
