// ── simulationEngine.ts ───────────────────────────────────────────────────
// Pure simulation logic — no React, no imports from UI layer.
//
// Design:
//   Each zone has a trajectory that defines its general drift direction and
//   speed. On every tick a small bounded random variation is added on top of
//   the trajectory to produce realistic-feeling noise without chaos.
//
//   Risk status is ALWAYS derived from the load values — never randomly set.
//
//   Alert (Priority Action) is ALWAYS the highest-risk zone by severity,
//   then by currentLoad, recalculated every tick.
// ─────────────────────────────────────────────────────────────────────────

import type { Mukam, Zone, ZoneStatus, Alert, MovementFlow, GlobalMetrics, ForecastPoint } from '../data/mockCommandData'
import { MUKAMS } from '../data/mockCommandData'

// ── Types ─────────────────────────────────────────────────────────────────

/** Mutable live zone data — only the fields the simulation updates */
export interface LiveZoneData {
  id: string
  currentLoad: number
  predictedLoad: number
  crowd: number
  status: ZoneStatus
}

/** Full live snapshot for one Mukam */
export interface MukamLiveState {
  mukamId: string
  zones: LiveZoneData[]
  metrics: GlobalMetrics
  alert: Alert
  movement: MovementFlow
  sanitationLoad: number
  sanitationPredicted: number
  forecast: ForecastPoint[]
  forecast30Delta: string
  forecast60Delta: string
  /** Tracks which step of its scenario this Mukam is on */
  tickCount: number
}

// ── Zone trajectories ─────────────────────────────────────────────────────
// Each entry: { step: how much load changes per tick, noise: max random ±, min, max }
// Positive step = crowd growing. Negative = easing.

interface Trajectory {
  step: number      // deterministic drift per tick (% load)
  noise: number     // ± random per tick
  min: number       // load floor
  max: number       // load ceiling
  /** crowd baseline for this zone (derived from initial data) */
  crowdPerLoad: number
}

type TrajectoryMap = Record<string, Trajectory>

/** Build per-zone trajectories from static Mukam seed data */
function buildTrajectories(mukam: Mukam): TrajectoryMap {
  const map: TrajectoryMap = {}
  for (const z of mukam.zones) {
    // Strategy by initial status:
    //   critical  → still escalating slowly until capped, small noise
    //   high      → escalating, moderate noise
    //   watch     → slow rise, can cross into high
    //   safe      → stable with slight drift, occasional bump
    //   forecast  → moderately rising (forecast zones always trend upward)
    let step = 0
    let noise = 0
    let maxLoad = 100
    switch (z.status) {
      case 'critical': step = 0.6;  noise = 0.8; maxLoad = 124; break
      case 'high':     step = 0.9;  noise = 1.2; maxLoad = 110; break
      case 'watch':    step = 0.5;  noise = 1.0; maxLoad = 95;  break
      case 'safe':     step = 0.2;  noise = 0.8; maxLoad = 70;  break
      case 'forecast': step = 0.7;  noise = 0.9; maxLoad = 90;  break
    }
    map[z.id] = {
      step,
      noise,
      min: Math.max(z.currentLoad - 5, 10),
      max: maxLoad,
      crowdPerLoad: z.capacity / 100,
    }
  }
  return map
}

// ── Risk derivation ───────────────────────────────────────────────────────
// Single authoritative function. Status NEVER randomly assigned.

export function deriveStatus(currentLoad: number, predictedLoad: number): ZoneStatus {
  // Use the higher of current and forward-looking risk
  const effective = Math.max(currentLoad, predictedLoad * 0.65)
  if (currentLoad >= 92 || effective >= 100) return 'critical'
  if (currentLoad >= 78 || effective >= 90)  return 'high'
  if (currentLoad >= 60 || effective >= 75)  return 'watch'
  return 'safe'
}

// ── Alert derivation ──────────────────────────────────────────────────────

const SEVERITY_ORDER: ZoneStatus[] = ['critical', 'high', 'watch', 'safe', 'forecast']

function severityRank(s: ZoneStatus): number {
  return SEVERITY_ORDER.indexOf(s)
}

/** Pick best-matching alert text given zone + mukam context */
function buildAlert(zone: LiveZoneData, zoneStatic: Zone, mukam: Mukam, currentAlert: Alert): Alert {
  const status = zone.status
  // Only update the alert content when severity has actually changed or load
  // has changed significantly (>3%). Otherwise keep current to avoid flicker.
  const loadDelta = Math.abs((zone.currentLoad) - (currentAlert.currentLoad ?? 0))
  if (zone.id === currentAlert.zoneId && loadDelta < 3 && status === currentAlert.severity) {
    return {
      ...currentAlert,
      currentLoad: Math.round(zone.currentLoad),
      predictedLoad: Math.round(zone.predictedLoad),
      timeToEvent: deriveTimeToEvent(zone.currentLoad, zone.predictedLoad, currentAlert.timeToEvent),
    }
  }

  const timeToEvent = deriveTimeToEvent(zone.currentLoad, zone.predictedLoad, currentAlert.timeToEvent)

  // Build title / description / recommendation from status
  let title = currentAlert.title
  let description = currentAlert.description
  let recommendation = currentAlert.recommendation

  if (status === 'critical') {
    if (zone.currentLoad >= 95) {
      title = 'OVERFLOW IMMINENT'
      description = 'Capacity breach occurring'
      recommendation = `Emergency deployment to ${zoneStatic.label} required immediately. Activate overflow protocols.`
    } else {
      title = 'SANITATION OVERFLOW'
      description = 'Sanitation capacity failure predicted'
      recommendation = `Deploy 2 mobile sanitation units and 1 response team to ${zoneStatic.label}. Prioritise ROUTE_MAIN.`
    }
  } else if (status === 'high') {
    title = 'ELEVATED CROWD DENSITY'
    description = `${zoneStatic.label} approaching capacity threshold`
    recommendation = `Pre-position response teams near ${zoneStatic.label}. Monitor inflow rate and prepare diversion routes.`
  } else if (status === 'watch') {
    title = 'CROWD DENSITY WATCH'
    description = `${zoneStatic.label} density gradually increasing`
    recommendation = `Continue monitoring ${zoneStatic.label}. Pre-position 1 crowd management team as a precaution.`
  }

  return {
    id: currentAlert.id,
    zoneId: zone.id,
    zoneLabel: zoneStatic.label,
    severity: status,
    title,
    description,
    timeToEvent,
    currentLoad: Math.round(zone.currentLoad),
    predictedLoad: Math.round(zone.predictedLoad),
    recommendation,
  }
}

function deriveTimeToEvent(current: number, predicted: number, previousTime?: number): number {
  // Estimate time to event based on load gap and growth rate
  const headroom = 100 - current
  const growthRate = Math.max(predicted - current, 1)
  const estimate = Math.round((headroom / growthRate) * 8) // ~8 min per load % at this rate
  const clamped = Math.max(5, Math.min(estimate, 90))
  // Decay towards the estimate without jumping
  if (previousTime === undefined) return clamped
  return Math.max(5, Math.round(previousTime * 0.92 + clamped * 0.08))
}

// ── Forecast derivation ───────────────────────────────────────────────────

function deriveForecast(totalPilgrims: number, prev: ForecastPoint[]): {
  forecast: ForecastPoint[]
  forecast30Delta: string
  forecast60Delta: string
} {
  // Grow the forecast values slightly each tick, capped at realistic levels
  const now = totalPilgrims
  const prev30 = prev[1]?.value ?? now * 1.08
  const prev60 = prev[2]?.value ?? now * 1.18

  const new30 = Math.round(prev30 * (1 + 0.001 + Math.random() * 0.001))
  const new60 = Math.round(prev60 * (1 + 0.0015 + Math.random() * 0.001))

  const d30 = ((new30 - now) / now * 100)
  const d60 = ((new60 - now) / now * 100)

  const fmt = (v: number) => `+${v.toFixed(1)}%`

  return {
    forecast: [
      { label: 'NOW',     value: now,  delta: '—',      isForecast: false },
      { label: '+30 MIN', value: new30, delta: fmt(d30), isForecast: true  },
      { label: '+60 MIN', value: new60, delta: fmt(d60), isForecast: true  },
    ],
    forecast30Delta: fmt(d30),
    forecast60Delta: fmt(d60),
  }
}

// ── Movement flow derivation ──────────────────────────────────────────────

function deriveMovement(zones: LiveZoneData[], prev: MovementFlow): MovementFlow {
  const maxLoad = Math.max(...zones.map(z => z.currentLoad))
  const status  = maxLoad >= 85 ? 'high' : maxLoad >= 65 ? 'elevated' : 'normal'
  const delta   = maxLoad >= 85 ? `+${Math.round(maxLoad * 0.22)}%`
                : maxLoad >= 65 ? `+${Math.round(maxLoad * 0.12)}%`
                : `+${Math.round(maxLoad * 0.04)}%`
  const flowRate = Math.round(prev.flowRate * (1 + (Math.random() - 0.48) * 0.04))
  return { ...prev, status, congestionDelta: delta, flowRate: Math.max(80, Math.min(flowRate, 600)) }
}

// ── Trajectory store (persists across ticks) ─────────────────────────────
// Keyed by mukamId
const trajectoryStore: Record<string, TrajectoryMap> = {}

function getTrajectories(mukam: Mukam): TrajectoryMap {
  if (!trajectoryStore[mukam.id]) {
    trajectoryStore[mukam.id] = buildTrajectories(mukam)
  }
  return trajectoryStore[mukam.id]
}

// ── Tick function ─────────────────────────────────────────────────────────

/** Advance one Mukam's simulation by one tick. Returns the new state. */
export function tickMukam(prev: MukamLiveState, mukamStatic: Mukam): MukamLiveState {
  const trajectories = getTrajectories(mukamStatic)
  const tickCount    = prev.tickCount + 1

  // ── Update zones ────────────────────────────────────────────────────
  const updatedZones: LiveZoneData[] = prev.zones.map(z => {
    const traj = trajectories[z.id]
    if (!traj) return z

    // Deterministic step + bounded noise
    const noise   = (Math.random() - 0.5) * 2 * traj.noise
    const rawLoad = z.currentLoad + traj.step + noise
    const newLoad = Math.max(traj.min, Math.min(traj.max, rawLoad))

    // Predicted load is always 15–35% higher than current, bounded
    const predFactor = 1.18 + Math.random() * 0.10
    const newPred = Math.min(130, newLoad * predFactor)

    const newStatus = deriveStatus(newLoad, newPred)
    const newCrowd  = Math.round(newLoad * traj.crowdPerLoad)

    return {
      ...z,
      currentLoad: parseFloat(newLoad.toFixed(1)),
      predictedLoad: parseFloat(newPred.toFixed(1)),
      crowd: newCrowd,
      status: newStatus,
    }
  })

  // ── Recalculate highest-risk zone for Priority Action ────────────────
  const sortedZones = [...updatedZones].sort((a, b) => {
    const rankDiff = severityRank(a.status) - severityRank(b.status)
    if (rankDiff !== 0) return rankDiff
    return b.currentLoad - a.currentLoad
  })
  const topZone       = sortedZones[0]
  const topZoneStatic = mukamStatic.zones.find(z => z.id === topZone.id)!
  const newAlert      = buildAlert(topZone, topZoneStatic, mukamStatic, prev.alert)

  // ── Global metrics ───────────────────────────────────────────────────
  const totalCrowd    = updatedZones.reduce((sum, z) => sum + z.crowd, 0)
  const criticalCount = updatedZones.filter(z => z.status === 'critical').length
  const highCount     = updatedZones.filter(z => z.status === 'high').length
  // Confidence drifts based on how many zones are elevated
  const confNoise  = (Math.random() - 0.5) * 0.4
  const newConf    = Math.max(88, Math.min(99, prev.metrics.aiConfidence + confNoise))

  const now        = new Date()
  const timeStr    = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} IST`

  const newMetrics: GlobalMetrics = {
    ...prev.metrics,
    totalPilgrims: totalCrowd,
    criticalZones: criticalCount,
    aiConfidence: parseFloat(newConf.toFixed(1)),
    lastUpdate: timeStr,
  }

  // ── Sanitation ───────────────────────────────────────────────────────
  // Sanitation load correlates with the zone at highest load
  const maxZoneLoad = Math.max(...updatedZones.map(z => z.currentLoad))
  const sanNoise    = (Math.random() - 0.48) * 1.2
  const newSanLoad  = Math.max(20, Math.min(125, prev.sanitationLoad + sanNoise + (maxZoneLoad > 85 ? 0.4 : 0.1)))
  const newSanPred  = Math.min(140, newSanLoad * (1.30 + Math.random() * 0.12))

  // ── Movement ─────────────────────────────────────────────────────────
  const newMovement = deriveMovement(updatedZones, prev.movement)

  // ── Forecast ─────────────────────────────────────────────────────────
  const { forecast, forecast30Delta, forecast60Delta } = deriveForecast(totalCrowd, prev.forecast)

  return {
    mukamId: prev.mukamId,
    zones: updatedZones,
    metrics: newMetrics,
    alert: newAlert,
    movement: newMovement,
    sanitationLoad: parseFloat(newSanLoad.toFixed(1)),
    sanitationPredicted: parseFloat(newSanPred.toFixed(1)),
    forecast,
    forecast30Delta,
    forecast60Delta,
    tickCount,
  }
}

// ── Build initial live state from static Mukam data ───────────────────────

export function buildInitialState(mukam: Mukam): MukamLiveState {
  const zones: LiveZoneData[] = mukam.zones.map(z => ({
    id: z.id,
    currentLoad: z.currentLoad,
    predictedLoad: z.predictedLoad,
    crowd: z.crowd,
    status: z.status,
  }))

  return {
    mukamId: mukam.id,
    zones,
    metrics: { ...mukam.metrics },
    alert: { ...mukam.alert },
    movement: { ...mukam.movement },
    sanitationLoad: mukam.sanitationLoad,
    sanitationPredicted: mukam.sanitationPredicted,
    forecast: [...mukam.forecast],
    forecast30Delta: mukam.forecast30Delta,
    forecast60Delta: mukam.forecast60Delta,
    tickCount: 0,
  }
}

/** Build initial states for all Mukams */
export function buildAllInitialStates(): Map<string, MukamLiveState> {
  const map = new Map<string, MukamLiveState>()
  for (const m of MUKAMS) {
    map.set(m.id, buildInitialState(m))
  }
  return map
}
