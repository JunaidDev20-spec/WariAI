// ── server/src/data/crowdStore.ts ─────────────────────────────────────────
// M1 crowd data ingestion + cleanliness demand calculation.
//
// Configurable thresholds map M1 current_population → cleanliness demand.
// No toilet/dustbin sensors — demand is derived from crowd volume.

import type { Response } from 'express'

// ── Configurable thresholds ──────────────────────────────────────────────
// Tune these for the demo. Units = people visible in CCTV frame (M1 current_population).
// Typical M1 zone detects 20–100 people.
// LOW:      0–39 people
// MODERATE: 40–59 people
// HIGH:     60–79 people  → deployment available
// CRITICAL: 80–100+ people → deployment available

export const CLEANLINESS_THRESHOLDS = {
  low: 40,      // below this = LOW
  medium: 60,   // below this = MODERATE
  high: 80,     // below this = HIGH, above = CRITICAL
}

export type DemandLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export interface CleanlinessDemand {
  mukamId: string
  level: DemandLevel
  percent: number
  current_population: number
  timestamp: number
}

export interface CrowdReading {
  mukamId: string
  current_population: number
  timestamp: number
}

// ── In-memory store ───────────────────────────────────────────────────────

const latestReading: CrowdReading = {
  mukamId: 'M01',
  current_population: 0,
  timestamp: 0,
}

const latestDemand: CleanlinessDemand = {
  mukamId: 'M01',
  level: 'LOW',
  percent: 0,
  current_population: 0,
  timestamp: 0,
}

// ── Cleanliness demand calculation ────────────────────────────────────────

export function calculateCleanlinessDemand(
  population: number,
  mukamId: string,
): CleanlinessDemand {
  let level: DemandLevel
  let percent: number

  if (population < CLEANLINESS_THRESHOLDS.low) {
    // LOW: 0–39 people → 0–25%
    level = 'LOW'
    percent = Math.round((population / CLEANLINESS_THRESHOLDS.low) * 25)
  } else if (population < CLEANLINESS_THRESHOLDS.medium) {
    // MODERATE: 40–59 people → 25–50%
    level = 'MODERATE'
    percent = 25 + Math.round(((population - CLEANLINESS_THRESHOLDS.low) / (CLEANLINESS_THRESHOLDS.medium - CLEANLINESS_THRESHOLDS.low)) * 25)
  } else if (population < CLEANLINESS_THRESHOLDS.high) {
    // HIGH: 60–79 people → 50–75%
    level = 'HIGH'
    percent = 50 + Math.round(((population - CLEANLINESS_THRESHOLDS.medium) / (CLEANLINESS_THRESHOLDS.high - CLEANLINESS_THRESHOLDS.medium)) * 25)
  } else {
    // CRITICAL: 80–100+ people → 75–100%
    level = 'CRITICAL'
    const overHigh = population - CLEANLINESS_THRESHOLDS.high
    const range = CLEANLINESS_THRESHOLDS.high // 80 people above high = 100%
    percent = Math.min(100, 75 + Math.round((overHigh / range) * 25))
  }

  return {
    mukamId,
    level,
    percent,
    current_population: population,
    timestamp: Date.now(),
  }
}

// ── Store operations ──────────────────────────────────────────────────────

export function storeCrowdReading(mukamId: string, current_population: number): CrowdReading {
  latestReading.mukamId = mukamId
  latestReading.current_population = current_population
  latestReading.timestamp = Date.now()
  return { ...latestReading }
}

export function storeCleanlinessDemand(demand: CleanlinessDemand): void {
  latestDemand.mukamId = demand.mukamId
  latestDemand.level = demand.level
  latestDemand.percent = demand.percent
  latestDemand.current_population = demand.current_population
  latestDemand.timestamp = demand.timestamp
}

export function getLatestReading(): CrowdReading {
  return { ...latestReading }
}

export function getLatestDemand(): CleanlinessDemand {
  return { ...latestDemand }
}

export function isDeploymentAvailable(): boolean {
  return latestDemand.level === 'HIGH' || latestDemand.level === 'CRITICAL'
}
