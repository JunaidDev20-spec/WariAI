// ── src/intelligence/m2m3Data.ts ───────────────────────────────────────────
// HARDCODED DEMO DATA SOURCE standing in for M2 (spatial / sanitation planning)
// and M3 (population forecasting). No real API call or model yet.
//
// WHY THIS SHAPE:
//   This module is the ONLY place the dashboard reads "M2/M3" output from.
//   To wire in the real services later, replace the contents of
//   MUKAM_FORECASTS with a fetch() from the M2/M3 endpoints — the shape
//   (MukamForecast) and computeSanitation() stay identical, so no component
//   changes are required.
//
//   Example future swap (left commented on purpose — not implemented yet):
//     export async function loadMukamForecasts(): Promise<Record<string, MukamForecast>> {
//       const res = await fetch('http://localhost:5000/api/m2m3/forecast')
//       return res.json()
//     }
//
// M1 INTEGRITY:
//   This module is independent of the M1 CCTV pipeline. The population
//   figures below are demo stand-ins; M1 detection/tracking is untouched.
// ─────────────────────────────────────────────────────────────────────────

export interface MukamForecast {
  mukamId: string
  currentPopulation: number
  forecast30Min: number
  forecast60Min: number
  /** Expected growth to +60 min, in percent (e.g. 50 = +50%) */
  growthPercent: number
  /** Model confidence, 0–100 */
  confidence: number
  /** Deployed sanitation infrastructure (demo stand-in for M2 asset inventory) */
  availableToilets: number
  availableDustbins: number
}

// ── Planning ratios ────────────────────────────────────────────────────────
// 1 toilet per 50 people, 1 dustbin per 50 people. Retune here.
export const SANITATION_RATIOS = {
  peoplePerToilet: 50,
  peoplePerDustbin: 50,
} as const

// ── Demo data per Mukam ─────────────────────────────────────────────────────
// Values chosen to produce a believable spread of sanitation statuses across
// the 5 Mukams (LOW → CRITICAL). All fields are easy to edit.
export const MUKAM_FORECASTS: Record<string, MukamForecast> = {
  M01: {
    mukamId: 'M01', currentPopulation: 50000, forecast30Min: 65000, forecast60Min: 75000,
    growthPercent: 50, confidence: 93, availableToilets: 1200, availableDustbins: 1300,
  },
  M02: {
    mukamId: 'M02', currentPopulation: 60000, forecast30Min: 72000, forecast60Min: 84000,
    growthPercent: 40, confidence: 91, availableToilets: 2400, availableDustbins: 2400,
  },
  M03: {
    mukamId: 'M03', currentPopulation: 45000, forecast30Min: 58000, forecast60Min: 70000,
    growthPercent: 55, confidence: 94, availableToilets: 1600, availableDustbins: 1600,
  },
  M04: {
    mukamId: 'M04', currentPopulation: 80000, forecast30Min: 95000, forecast60Min: 110000,
    growthPercent: 37, confidence: 90, availableToilets: 1200, availableDustbins: 1200,
  },
  M05: {
    mukamId: 'M05', currentPopulation: 30000, forecast30Min: 38000, forecast60Min: 45000,
    growthPercent: 50, confidence: 96, availableToilets: 2000, availableDustbins: 2000,
  },
}

// ── Sanitation status ──────────────────────────────────────────────────────
export type SanitationStatus = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export const SANITATION_STATUS_COLOR: Record<SanitationStatus, string> = {
  LOW:       '#2DD4A8',
  MODERATE:  '#E8C45A',
  HIGH:      '#F28B4B',
  CRITICAL:  '#EF5B5B',
}

// ── Derived plan returned to the UI ─────────────────────────────────────────
export interface SanitationPlan {
  mukamId: string
  /** Planning horizon = +60 min forecast population */
  forecastPopulation: number
  requiredToilets: number
  requiredDustbins: number
  availableToilets: number
  availableDustbins: number
  /** Percent — may exceed 100 when demand outstrips supply */
  toiletUtilization: number
  dustbinUtilization: number
  status: SanitationStatus
}

// ── Demo sanitation infrastructure records ─────────────────────────────────
// Hardcoded sample assets per Mukam. In a real system this comes from M2 asset inventory.
// Totals in the UI header are derived from MUKAM_FORECASTS counts, not from summing rows.

export interface ToiletRecord {
  location: string
  id: string
  status: 'OPERATIONAL' | 'PARTIAL' | 'OVERFLOW'
  capacity: number
}

export interface DustbinRecord {
  location: string
  id: string
  status: 'OPERATIONAL' | 'PARTIAL' | 'OVERFLOW'
  capacity: number
}

export interface MukamInfrastructure {
  mukamId: string
  toilets: ToiletRecord[]
  dustbins: DustbinRecord[]
}

export const MUKAM_INFRASTRUCTURE: Record<string, MukamInfrastructure> = {
  M01: {
    mukamId: 'M01',
    toilets: [
      { location: 'Near Mukam Entry Gate', id: 'T_M01_01', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Main Path - Left Side',  id: 'T_M01_02', status: 'OPERATIONAL', capacity: 40 },
      { location: 'Near Water Point',       id: 'T_M01_03', status: 'OPERATIONAL', capacity: 60 },
      { location: 'Market Road',            id: 'T_M01_04', status: 'PARTIAL',     capacity: 50 },
      { location: 'Temple Side Lane',       id: 'T_M01_05', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Open Ground - North',    id: 'T_M01_06', status: 'OPERATIONAL', capacity: 50 },
    ],
    dustbins: [
      { location: 'Main Path - Entry',   id: 'D_M01_01', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Main Path - Middle',  id: 'D_M01_02', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Market Road',         id: 'D_M01_03', status: 'OPERATIONAL', capacity: 150 },
      { location: 'Market Area',         id: 'D_M01_04', status: 'PARTIAL',     capacity: 150 },
      { location: 'Near Water Point',    id: 'D_M01_05', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Open Ground - North', id: 'D_M01_06', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Open Ground - East',  id: 'D_M01_07', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Temple Side',         id: 'D_M01_08', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Near Bus Stand',      id: 'D_M01_09', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Overflow Point',      id: 'D_M01_10', status: 'OPERATIONAL', capacity: 100 },
    ],
  },
  M02: {
    mukamId: 'M02',
    toilets: [
      { location: 'Near Mukam Entry Gate', id: 'T_M02_01', status: 'OPERATIONAL', capacity: 60 },
      { location: 'Main Path - Left Side',  id: 'T_M02_02', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Main Path - Right Side', id: 'T_M02_03', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Market Road',            id: 'T_M02_04', status: 'PARTIAL',     capacity: 60 },
      { location: 'Temple Side Lane',       id: 'T_M02_05', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Open Ground - North',    id: 'T_M02_06', status: 'OPERATIONAL', capacity: 60 },
    ],
    dustbins: [
      { location: 'Main Path - Entry',   id: 'D_M02_01', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Main Path - Middle',  id: 'D_M02_02', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Market Road',         id: 'D_M02_03', status: 'OPERATIONAL', capacity: 150 },
      { location: 'Market Area',         id: 'D_M02_04', status: 'PARTIAL',     capacity: 150 },
      { location: 'Near Water Point',    id: 'D_M02_05', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Open Ground - North', id: 'D_M02_06', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Open Ground - East',  id: 'D_M02_07', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Temple Side',         id: 'D_M02_08', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Near Bus Stand',      id: 'D_M02_09', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Overflow Point',      id: 'D_M02_10', status: 'OVERFLOW',    capacity: 120 },
    ],
  },
  M03: {
    mukamId: 'M03',
    toilets: [
      { location: 'Near Mukam Entry Gate', id: 'T_M03_01', status: 'OPERATIONAL', capacity: 55 },
      { location: 'Main Path - Left Side',  id: 'T_M03_02', status: 'OPERATIONAL', capacity: 45 },
      { location: 'Main Path - Right Side', id: 'T_M03_03', status: 'PARTIAL',     capacity: 55 },
      { location: 'Market Road',            id: 'T_M03_04', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Temple Side Lane',       id: 'T_M03_05', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Open Ground - North',    id: 'T_M03_06', status: 'OPERATIONAL', capacity: 55 },
    ],
    dustbins: [
      { location: 'Main Path - Entry',   id: 'D_M03_01', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Main Path - Middle',  id: 'D_M03_02', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Market Road',         id: 'D_M03_03', status: 'OPERATIONAL', capacity: 140 },
      { location: 'Market Area',         id: 'D_M03_04', status: 'PARTIAL',     capacity: 140 },
      { location: 'Near Water Point',    id: 'D_M03_05', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Open Ground - North', id: 'D_M03_06', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Open Ground - East',  id: 'D_M03_07', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Temple Side',         id: 'D_M03_08', status: 'OPERATIONAL', capacity: 110 },
      { location: 'Near Bus Stand',      id: 'D_M03_09', status: 'OVERFLOW',    capacity: 110 },
      { location: 'Overflow Point',      id: 'D_M03_10', status: 'OPERATIONAL', capacity: 110 },
    ],
  },
  M04: {
    mukamId: 'M04',
    toilets: [
      { location: 'Near Mukam Entry Gate', id: 'T_M04_01', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Main Path - Left Side',  id: 'T_M04_02', status: 'PARTIAL',     capacity: 40 },
      { location: 'Main Path - Right Side', id: 'T_M04_03', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Market Road',            id: 'T_M04_04', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Temple Side Lane',       id: 'T_M04_05', status: 'OVERFLOW',    capacity: 50 },
      { location: 'Open Ground - North',    id: 'T_M04_06', status: 'OPERATIONAL', capacity: 50 },
    ],
    dustbins: [
      { location: 'Main Path - Entry',   id: 'D_M04_01', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Main Path - Middle',  id: 'D_M04_02', status: 'PARTIAL',     capacity: 100 },
      { location: 'Market Road',         id: 'D_M04_03', status: 'OPERATIONAL', capacity: 120 },
      { location: 'Market Area',         id: 'D_M04_04', status: 'OVERFLOW',    capacity: 120 },
      { location: 'Near Water Point',    id: 'D_M04_05', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Open Ground - North', id: 'D_M04_06', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Open Ground - East',  id: 'D_M04_07', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Temple Side',         id: 'D_M04_08', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Near Bus Stand',      id: 'D_M04_09', status: 'OPERATIONAL', capacity: 100 },
      { location: 'Overflow Point',      id: 'D_M04_10', status: 'OVERFLOW',    capacity: 100 },
    ],
  },
  M05: {
    mukamId: 'M05',
    toilets: [
      { location: 'Near Mukam Entry Gate', id: 'T_M05_01', status: 'OPERATIONAL', capacity: 60 },
      { location: 'Main Path - Left Side',  id: 'T_M05_02', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Main Path - Right Side', id: 'T_M05_03', status: 'OPERATIONAL', capacity: 50 },
      { location: 'Market Road',            id: 'T_M05_04', status: 'OPERATIONAL', capacity: 60 },
      { location: 'Temple Side Lane',       id: 'T_M05_05', status: 'PARTIAL',     capacity: 50 },
      { location: 'Open Ground - North',    id: 'T_M05_06', status: 'OPERATIONAL', capacity: 60 },
    ],
    dustbins: [
      { location: 'Main Path - Entry',   id: 'D_M05_01', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Main Path - Middle',  id: 'D_M05_02', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Market Road',         id: 'D_M05_03', status: 'OPERATIONAL', capacity: 160 },
      { location: 'Market Area',         id: 'D_M05_04', status: 'PARTIAL',     capacity: 160 },
      { location: 'Near Water Point',    id: 'D_M05_05', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Open Ground - North', id: 'D_M05_06', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Open Ground - East',  id: 'D_M05_07', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Temple Side',         id: 'D_M05_08', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Near Bus Stand',      id: 'D_M05_09', status: 'OPERATIONAL', capacity: 130 },
      { location: 'Overflow Point',      id: 'D_M05_10', status: 'PARTIAL',     capacity: 130 },
    ],
  },
}

export function getMukamInfrastructure(mukamId: string): MukamInfrastructure {
  return MUKAM_INFRASTRUCTURE[mukamId] ?? MUKAM_INFRASTRUCTURE.M01
}

// ── Accessors ──────────────────────────────────────────────────────────────

export function getMukamForecast(mukamId: string): MukamForecast {
  return MUKAM_FORECASTS[mukamId] ?? MUKAM_FORECASTS.M01
}

/**
 * Compute sanitation demand from a forecast using the planning ratios.
 * Planning horizon is the +60 min forecast (peak expected load).
 */
export function computeSanitation(f: MukamForecast): SanitationPlan {
  const planningPopulation = f.forecast60Min

  const requiredToilets  = Math.ceil(planningPopulation / SANITATION_RATIOS.peoplePerToilet)
  const requiredDustbins = Math.ceil(planningPopulation / SANITATION_RATIOS.peoplePerDustbin)

  const toiletUtilization  = Math.round((requiredToilets  / f.availableToilets)  * 100)
  const dustbinUtilization = Math.round((requiredDustbins / f.availableDustbins) * 100)

  const peak = Math.max(toiletUtilization, dustbinUtilization)
  let status: SanitationStatus
  if (peak > 100)      status = 'CRITICAL'
  else if (peak >= 85) status = 'HIGH'
  else if (peak >= 60) status = 'MODERATE'
  else                 status = 'LOW'

  return {
    mukamId: f.mukamId,
    forecastPopulation: planningPopulation,
    requiredToilets,
    requiredDustbins,
    availableToilets: f.availableToilets,
    availableDustbins: f.availableDustbins,
    toiletUtilization,
    dustbinUtilization,
    status,
  }
}
