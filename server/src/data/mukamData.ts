// ── server/src/data/mukamData.ts ──────────────────────────────────────────
// Mukam operational data — mirrors frontend src/data/mockCommandData.ts.
// Used by the chat endpoint to answer website-grounded questions.

export type ZoneStatus = 'safe' | 'watch' | 'high' | 'critical' | 'forecast'

export interface Zone {
  id: string
  label: string
  status: ZoneStatus
  currentLoad: number
  predictedLoad: number
  crowd: number
  capacity: number
}

export interface SanitationPoint {
  id: string
  type: 'mobile_unit' | 'toilet_cluster' | 'waste_point'
  label: string
  status: 'operational' | 'at_capacity' | 'offline'
}

export interface Alert {
  id: string
  zoneId: string
  zoneLabel: string
  severity: ZoneStatus
  title: string
  description: string
  recommendation: string
}

export interface Mukam {
  id: string
  name: string
  location: string
  zones: Zone[]
  sanitationPoints: SanitationPoint[]
  alert: Alert
  metrics: {
    totalPilgrims: number
    activeZones: number
    criticalZones: number
    lastUpdate: string
    systemStatus: 'live' | 'degraded' | 'offline'
  }
  sanitationLoad: number
  sanitationPredicted: number
}

export interface SiteInfo {
  mukamId: string
  mukamName: string
  location: string
  totalPilgrims: number
  totalZones: number
  criticalZones: number
  toilets: number
  dustbins: number
  mobileUnits: number
  garbageHotspots: string[]
  avgCrowdDensity: number
  sanitationStatus: string
}

// ── Data ──────────────────────────────────────────────────────────────────

export const MUKAMS: Mukam[] = [
  {
    id: 'M01',
    name: 'Mukam 01 — Saswad',
    location: 'Saswad, Pune District',
    zones: [
      { id: 'S01_Z1', label: 'ZONE_S01', status: 'safe', currentLoad: 38, predictedLoad: 48, crowd: 16400, capacity: 43000 },
      { id: 'S01_Z2', label: 'ZONE_S02', status: 'watch', currentLoad: 62, predictedLoad: 75, crowd: 26800, capacity: 43200 },
      { id: 'S01_Z3', label: 'ZONE_S03', status: 'safe', currentLoad: 41, predictedLoad: 52, crowd: 17900, capacity: 43600 },
      { id: 'S01_Z4', label: 'ZONE_S04', status: 'forecast', currentLoad: 50, predictedLoad: 68, crowd: 21800, capacity: 43600 },
    ],
    sanitationPoints: [
      { id: 'SP1', type: 'toilet_cluster', label: 'TC_S01A', status: 'operational' },
      { id: 'SP2', type: 'mobile_unit', label: 'MOB_S01B', status: 'operational' },
      { id: 'SP3', type: 'toilet_cluster', label: 'TC_S01C', status: 'operational' },
      { id: 'SP4', type: 'waste_point', label: 'WP_S01D', status: 'operational' },
    ],
    alert: {
      id: 'ALT_M01',
      zoneId: 'S01_Z2',
      zoneLabel: 'ZONE_S02',
      severity: 'watch',
      title: 'CROWD DENSITY WATCH',
      description: 'ZONE_S02 density trending above normal threshold',
      recommendation: 'Pre-position 1 response team near ZONE_S02.',
    },
    metrics: { totalPilgrims: 182900, activeZones: 7, criticalZones: 0, lastUpdate: '08:14 IST', systemStatus: 'live' },
    sanitationLoad: 55,
    sanitationPredicted: 69,
  },
  {
    id: 'M02',
    name: 'Mukam 02 — Jejuri',
    location: 'Jejuri, Pune District',
    zones: [
      { id: 'J02_Z1', label: 'ZONE_J01', status: 'safe', currentLoad: 35, predictedLoad: 44, crowd: 15200, capacity: 43500 },
      { id: 'J02_Z2', label: 'ZONE_J02', status: 'high', currentLoad: 75, predictedLoad: 92, crowd: 33000, capacity: 44000 },
      { id: 'J02_Z3', label: 'ZONE_J03', status: 'watch', currentLoad: 63, predictedLoad: 77, crowd: 27700, capacity: 44000 },
      { id: 'J02_Z4', label: 'ZONE_J04', status: 'forecast', currentLoad: 47, predictedLoad: 68, crowd: 20500, capacity: 43700 },
    ],
    sanitationPoints: [
      { id: 'SP1', type: 'mobile_unit', label: 'MOB_J02A', status: 'at_capacity' },
      { id: 'SP2', type: 'toilet_cluster', label: 'TC_J02B', status: 'operational' },
      { id: 'SP3', type: 'waste_point', label: 'WP_J02C', status: 'operational' },
      { id: 'SP4', type: 'toilet_cluster', label: 'TC_J02D', status: 'operational' },
    ],
    alert: {
      id: 'ALT_M02',
      zoneId: 'J02_Z2',
      zoneLabel: 'ZONE_J02',
      severity: 'high',
      title: 'ROUTE CONGESTION',
      description: 'ROUTE_JEJURI_N approaching capacity limit',
      recommendation: 'Divert incoming pilgrims to ROUTE_JEJURI_E.',
    },
    metrics: { totalPilgrims: 216400, activeZones: 10, criticalZones: 1, lastUpdate: '08:15 IST', systemStatus: 'live' },
    sanitationLoad: 70,
    sanitationPredicted: 87,
  },
  {
    id: 'M03',
    name: 'Mukam 03 — Lonand',
    location: 'Lonand, Satara District',
    zones: [
      { id: 'L03_Z1', label: 'ZONE_L01', status: 'safe', currentLoad: 40, predictedLoad: 50, crowd: 17200, capacity: 43000 },
      { id: 'L03_Z2', label: 'ZONE_L02', status: 'critical', currentLoad: 84, predictedLoad: 121, crowd: 49600, capacity: 59000 },
      { id: 'L03_Z3', label: 'ZONE_L03', status: 'high', currentLoad: 73, predictedLoad: 90, crowd: 32100, capacity: 44000 },
      { id: 'L03_Z4', label: 'ZONE_L04', status: 'forecast', currentLoad: 56, predictedLoad: 80, crowd: 23100, capacity: 41200 },
    ],
    sanitationPoints: [
      { id: 'SP1', type: 'mobile_unit', label: 'MOB_L03A', status: 'at_capacity' },
      { id: 'SP2', type: 'toilet_cluster', label: 'TC_L03B', status: 'operational' },
      { id: 'SP3', type: 'toilet_cluster', label: 'TC_L03C', status: 'operational' },
      { id: 'SP4', type: 'waste_point', label: 'WP_L03D', status: 'operational' },
    ],
    alert: {
      id: 'ALT_M03',
      zoneId: 'L03_Z2',
      zoneLabel: 'ZONE_L02',
      severity: 'critical',
      title: 'SANITATION OVERFLOW',
      description: 'Sanitation capacity failure predicted',
      recommendation: 'Deploy 2 mobile sanitation units and 1 response team to ZONE_L02.',
    },
    metrics: { totalPilgrims: 251000, activeZones: 12, criticalZones: 3, lastUpdate: '08:16 IST', systemStatus: 'live' },
    sanitationLoad: 84,
    sanitationPredicted: 121,
  },
  {
    id: 'M04',
    name: 'Mukam 04 — Natepute',
    location: 'Natepute, Solapur District',
    zones: [
      { id: 'N04_Z1', label: 'ZONE_N01', status: 'high', currentLoad: 79, predictedLoad: 97, crowd: 34800, capacity: 44000 },
      { id: 'N04_Z2', label: 'ZONE_N02', status: 'critical', currentLoad: 89, predictedLoad: 126, crowd: 52600, capacity: 59200 },
      { id: 'N04_Z3', label: 'ZONE_N03', status: 'watch', currentLoad: 66, predictedLoad: 83, crowd: 29000, capacity: 44000 },
      { id: 'N04_Z4', label: 'ZONE_N04', status: 'forecast', currentLoad: 53, predictedLoad: 75, crowd: 23200, capacity: 44000 },
    ],
    sanitationPoints: [
      { id: 'SP1', type: 'mobile_unit', label: 'MOB_N04A', status: 'at_capacity' },
      { id: 'SP2', type: 'mobile_unit', label: 'MOB_N04B', status: 'at_capacity' },
      { id: 'SP3', type: 'toilet_cluster', label: 'TC_N04C', status: 'operational' },
      { id: 'SP4', type: 'waste_point', label: 'WP_N04D', status: 'operational' },
    ],
    alert: {
      id: 'ALT_M04',
      zoneId: 'N04_Z2',
      zoneLabel: 'ZONE_N02',
      severity: 'critical',
      title: 'WATER SUPPLY CRITICAL',
      description: 'Water supply exhaustion predicted',
      recommendation: 'Dispatch 3 water tankers to ZONE_N02 immediately.',
    },
    metrics: { totalPilgrims: 289600, activeZones: 14, criticalZones: 4, lastUpdate: '08:17 IST', systemStatus: 'live' },
    sanitationLoad: 93,
    sanitationPredicted: 137,
  },
  {
    id: 'M05',
    name: 'Mukam 05 — Malshiras',
    location: 'Malshiras, Solapur District',
    zones: [
      { id: 'ML05_Z1', label: 'ZONE_M01', status: 'safe', currentLoad: 28, predictedLoad: 36, crowd: 12100, capacity: 43000 },
      { id: 'ML05_Z2', label: 'ZONE_M02', status: 'safe', currentLoad: 34, predictedLoad: 45, crowd: 14800, capacity: 43500 },
      { id: 'ML05_Z3', label: 'ZONE_M03', status: 'watch', currentLoad: 55, predictedLoad: 69, crowd: 24000, capacity: 43700 },
      { id: 'ML05_Z4', label: 'ZONE_M04', status: 'forecast', currentLoad: 39, predictedLoad: 58, crowd: 17000, capacity: 43700 },
    ],
    sanitationPoints: [
      { id: 'SP1', type: 'toilet_cluster', label: 'TC_ML05A', status: 'operational' },
      { id: 'SP2', type: 'toilet_cluster', label: 'TC_ML05B', status: 'operational' },
      { id: 'SP3', type: 'mobile_unit', label: 'MOB_ML05C', status: 'operational' },
      { id: 'SP4', type: 'waste_point', label: 'WP_ML05D', status: 'operational' },
    ],
    alert: {
      id: 'ALT_M05',
      zoneId: 'ML05_Z3',
      zoneLabel: 'ZONE_M03',
      severity: 'watch',
      title: 'CROWD DENSITY WATCH',
      description: 'ZONE_M03 density gradually increasing',
      recommendation: 'Monitor ZONE_M03 closely.',
    },
    metrics: { totalPilgrims: 127900, activeZones: 6, criticalZones: 0, lastUpdate: '08:18 IST', systemStatus: 'live' },
    sanitationLoad: 46,
    sanitationPredicted: 58,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

export function getMukamById(id: string): Mukam | undefined {
  return MUKAMS.find(m => m.id === id)
}

export function findMukamByLocation(query: string): Mukam | undefined {
  const q = query.toLowerCase()
  return MUKAMS.find(m =>
    m.name.toLowerCase().includes(q) ||
    m.location.toLowerCase().includes(q) ||
    m.id.toLowerCase().includes(q)
  )
}

export function buildSiteInfo(mukam: Mukam): SiteInfo {
  const toilets = mukam.sanitationPoints.filter(sp => sp.type === 'toilet_cluster').length
  const dustbins = mukam.sanitationPoints.filter(sp => sp.type === 'waste_point').length
  const mobileUnits = mukam.sanitationPoints.filter(sp => sp.type === 'mobile_unit').length
  const garbageHotspots = mukam.zones
    .filter(z => z.status === 'critical' || z.status === 'high')
    .map(z => `${mukam.name} — ${z.label}`)

  const totalCapacity = mukam.zones.reduce((s, z) => s + z.capacity, 0)
  const totalCrowd = mukam.zones.reduce((s, z) => s + z.crowd, 0)
  const avgDensity = totalCapacity > 0 ? Math.round((totalCrowd / totalCapacity) * 100) : 0

  let sanitationStatus = 'Operational'
  if (mukam.sanitationLoad >= 90) sanitationStatus = 'Critical — overflow predicted'
  else if (mukam.sanitationLoad >= 70) sanitationStatus = 'High — near capacity'

  return {
    mukamId: mukam.id,
    mukamName: mukam.name,
    location: mukam.location,
    totalPilgrims: mukam.metrics.totalPilgrims,
    totalZones: mukam.zones.length,
    criticalZones: mukam.metrics.criticalZones,
    toilets,
    dustbins,
    mobileUnits,
    garbageHotspots,
    avgCrowdDensity: avgDensity,
    sanitationStatus,
  }
}
