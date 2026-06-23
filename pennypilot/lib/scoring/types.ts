export type PriceEnding = '01' | '03' | '06' | 'other'

export interface ScoreInputs {
  latestEnding: PriceEnding
  daysAtCurrentStage: number
  category: string
  pennyStoreCount: number    // distinct stores reporting this SKU at $0.01 in last 21 days
  seasonMatch: boolean
}

export interface ScoreOutput {
  score: number                      // 0–100; 100 = confirmed penny
  window: [number, number] | null    // [low, high] predicted days-until-penny; null if already penny or unknown
  reasons: string[]                  // human-readable explanation of each signal that fired
}
