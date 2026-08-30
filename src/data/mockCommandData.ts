// ── WariAI Mock Command Data ─────────────────────────────────────────────
// Pune → Pandharpur Wari route — 5 operational Mukams.
// M01 Saswad → M02 Jejuri → M03 Lonand → M04 Natepute → M05 Malshiras
// All coordinates verified for OpenStreetMap accuracy.
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

export type ZoneStatus = 'safe' | 'watch' | 'high' | 'critical' | 'forecast'

export interface Zone {
  id: string
  label: string
  status: ZoneStatus
  currentLoad: number
  predictedLoad: number
  crowd: number
  capacity: number
  cx: number; cy: number; rx: number; ry: number
}

export interface Route {
  id: string
  type: 'live' | 'forecast' | 'secondary'
  path: string
  label?: string
  congestion?: 'normal' | 'elevated' | 'high'
}

export interface SanitationPoint {
  id: string
  type: 'mobile_unit' | 'toilet_cluster' | 'waste_point'
  label: string
  x: number; y: number
  status: 'operational' | 'at_capacity' | 'offline'
}

export interface LiveMarker {
  x: number; y: number
  intensity: 'low' | 'medium' | 'high'
  delay: number
}

export interface DensityDot {
  x: number; y: number; r: number; op: number
}

export interface Alert {
  id: string
  zoneId: string
  zoneLabel: string
  severity: ZoneStatus
  title: string
  description: string
  timeToEvent?: number
  currentLoad?: number
  predictedLoad?: number
  recommendation: string
}

export interface ForecastPoint {
  label: string
  value: number
  delta: string
  isForecast: boolean
}

export interface Resource {
  id: string
  type: 'sanitation_team' | 'mobile_unit' | 'response_team' | 'medical'
  label: string
  status: 'standby' | 'deployed' | 'en_route'
  location: string
}

export interface GlobalMetrics {
  totalPilgrims: number
  activeZones: number
  criticalZones: number
  aiConfidence: number
  lastUpdate: string
  systemStatus: 'live' | 'degraded' | 'offline'
}

export interface MovementFlow {
  routeId: string
  label: string
  status: 'normal' | 'elevated' | 'high'
  congestionDelta: string
  flowRate: number
}

export interface Mukam {
  id: string
  name: string
  location: string
  coordinates: { lat: number; lng: number }
  zones: Zone[]
  routes: Route[]
  sanitationPoints: SanitationPoint[]
  liveMarkers: LiveMarker[]
  densityDots: DensityDot[]
  forecast: ForecastPoint[]
  metrics: GlobalMetrics
  alert: Alert
  movement: MovementFlow
  sanitationLoad: number
  sanitationPredicted: number
  forecast30Delta: string
  forecast60Delta: string
  transitionPath?: string
}

// ─────────────────────────────────────────────────────────────────────────
// SEMANTIC COLORS
// ─────────────────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<ZoneStatus, { stroke: string; fill: string; text: string; glow: string }> = {
  safe:     { stroke: '#2DD4A8', fill: 'rgba(45,212,168,0.07)',  text: '#2DD4A8', glow: 'rgba(45,212,168,0.18)'  },
  watch:    { stroke: '#E8C45A', fill: 'rgba(232,196,90,0.08)',  text: '#E8C45A', glow: 'rgba(232,196,90,0.15)'  },
  high:     { stroke: '#F28B4B', fill: 'rgba(242,139,75,0.09)',  text: '#F28B4B', glow: 'rgba(242,139,75,0.15)'  },
  critical: { stroke: '#EF5B5B', fill: 'rgba(239,91,91,0.1)',    text: '#EF5B5B', glow: 'rgba(239,91,91,0.2)'    },
  forecast: { stroke: '#9B8AFB', fill: 'rgba(155,138,251,0.08)', text: '#9B8AFB', glow: 'rgba(155,138,251,0.15)' },
}

export const SEVERITY_COLOR: Record<ZoneStatus, string> = {
  safe:     '#2DD4A8',
  watch:    '#E8C45A',
  high:     '#F28B4B',
  critical: '#EF5B5B',
  forecast: '#9B8AFB',
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTE ENDPOINTS (non-operational — display only on Leaflet map)
// ─────────────────────────────────────────────────────────────────────────

export const ROUTE_START = { id: 'PUNE',        name: 'Pune',        lat: 18.5204, lng: 73.8567 }
export const ROUTE_END   = { id: 'PANDHARPUR',  name: 'Pandharpur',  lat: 17.6794, lng: 75.3295 }

// ─────────────────────────────────────────────────────────────────────────
// M01 — SASWAD  (WATCH — moderate crowd build-up)
// Saswad: 18.3437° N, 74.0175° E
// ─────────────────────────────────────────────────────────────────────────

const M01: Mukam = {
  id: 'M01', name: 'Mukam 01 — Saswad', location: 'Saswad, Pune District',
  coordinates: { lat: 18.3437, lng: 74.0175 },

  zones: [
    { id: 'S01_Z1', label: 'ZONE_S01', status: 'safe',     currentLoad: 38, predictedLoad: 48, crowd: 16400, capacity: 43000, cx: 170, cy: 205, rx: 62, ry: 46 },
    { id: 'S01_Z2', label: 'ZONE_S02', status: 'watch',    currentLoad: 62, predictedLoad: 75, crowd: 26800, capacity: 43200, cx: 345, cy: 245, rx: 75, ry: 55 },
    { id: 'S01_Z3', label: 'ZONE_S03', status: 'safe',     currentLoad: 41, predictedLoad: 52, crowd: 17900, capacity: 43600, cx: 526, cy: 188, rx: 61, ry: 44 },
    { id: 'S01_Z4', label: 'ZONE_S04', status: 'forecast', currentLoad: 50, predictedLoad: 68, crowd: 21800, capacity: 43600, cx: 660, cy: 296, rx: 56, ry: 41 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 90 228 C 142 215,208 222,268 232 C 308 238,332 241,345 245', label: 'ROUTE_SASWAD_N', congestion: 'elevated' },
    { id: 'R2', type: 'live',      path: 'M 345 245 C 402 225,460 206,526 193',                           label: 'ROUTE_SASWAD_E', congestion: 'normal'   },
    { id: 'R3', type: 'forecast',  path: 'M 526 185 C 568 170,614 175,652 192 C 658 196,660 238,660 280'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 170 250 C 228 270,282 267,316 258',                           congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'toilet_cluster', label: 'TC_S01A', x: 282, y: 298, status: 'operational' },
    { id: 'SP2', type: 'mobile_unit',    label: 'MOB_S01B', x: 412, y: 270, status: 'operational' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_S01C',  x: 484, y: 232, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_S01D',  x: 580, y: 248, status: 'operational' },
  ],
  liveMarkers: [
    { x: 345, y: 245, intensity: 'medium', delay: 0   },
    { x: 170, y: 205, intensity: 'low',    delay: 0.5 },
    { x: 526, y: 188, intensity: 'low',    delay: 0.8 },
  ],
  densityDots: [
    { x: 328, y: 238, r: 2.5, op: 0.40 }, { x: 358, y: 250, r: 2,   op: 0.35 },
    { x: 340, y: 258, r: 2,   op: 0.37 }, { x: 362, y: 240, r: 1.5, op: 0.30 },
    { x: 508, y: 182, r: 2,   op: 0.30 }, { x: 536, y: 196, r: 1.5, op: 0.24 },
    { x: 156, y: 200, r: 1.5, op: 0.22 }, { x: 180, y: 210, r: 1.5, op: 0.20 },
  ],
  forecast: [
    { label: 'NOW',     value: 182900, delta: '—',     isForecast: false },
    { label: '+30 MIN', value: 196400, delta: '+7.4%', isForecast: true  },
    { label: '+60 MIN', value: 211600, delta: '+15.7%', isForecast: true },
  ],
  metrics: { totalPilgrims: 182900, activeZones: 7, criticalZones: 0, aiConfidence: 93.8, lastUpdate: '08:14 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M01', zoneId: 'S01_Z2', zoneLabel: 'ZONE_S02', severity: 'watch',
    title: 'CROWD DENSITY WATCH',
    description: 'ZONE_S02 density trending above normal threshold',
    timeToEvent: 58, currentLoad: 62, predictedLoad: 75,
    recommendation: 'Pre-position 1 response team near ZONE_S02. Monitor inflow rate via ROUTE_SASWAD_N.',
  },
  movement: { routeId: 'ROUTE_SASWAD_N', label: 'ROUTE_SASWAD_N', status: 'elevated', congestionDelta: '+8%', flowRate: 218 },
  sanitationLoad: 55, sanitationPredicted: 69,
  forecast30Delta: '+7.4%', forecast60Delta: '+15.7%',
  transitionPath: 'M 400 212 C 480 196,598 180,718 170 C 758 166,790 168,800 168',
}

// ─────────────────────────────────────────────────────────────────────────
// M02 — JEJURI  (HIGH — route congestion building)
// Jejuri: 18.2729° N, 74.1615° E
// ─────────────────────────────────────────────────────────────────────────

const M02: Mukam = {
  id: 'M02', name: 'Mukam 02 — Jejuri', location: 'Jejuri, Pune District',
  coordinates: { lat: 18.2729, lng: 74.1615 },

  zones: [
    { id: 'J02_Z1', label: 'ZONE_J01', status: 'safe',     currentLoad: 35, predictedLoad: 44, crowd: 15200, capacity: 43500, cx: 160, cy: 218, rx: 60, ry: 44 },
    { id: 'J02_Z2', label: 'ZONE_J02', status: 'high',     currentLoad: 75, predictedLoad: 92, crowd: 33000, capacity: 44000, cx: 342, cy: 248, rx: 78, ry: 57 },
    { id: 'J02_Z3', label: 'ZONE_J03', status: 'watch',    currentLoad: 63, predictedLoad: 77, crowd: 27700, capacity: 44000, cx: 526, cy: 190, rx: 62, ry: 45 },
    { id: 'J02_Z4', label: 'ZONE_J04', status: 'forecast', currentLoad: 47, predictedLoad: 68, crowd: 20500, capacity: 43700, cx: 662, cy: 298, rx: 56, ry: 41 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 88 232 C 140 218,204 225,265 233 C 306 239,332 243,342 248', label: 'ROUTE_JEJURI_N', congestion: 'high'     },
    { id: 'R2', type: 'live',      path: 'M 342 248 C 400 228,458 208,526 195',                           label: 'ROUTE_JEJURI_E', congestion: 'elevated' },
    { id: 'R3', type: 'forecast',  path: 'M 526 186 C 570 172,616 177,654 194 C 660 198,662 238,662 280'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 160 264 C 218 280,278 276,316 265',                           congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_J02A', x: 285, y: 304, status: 'at_capacity' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_J02B',  x: 413, y: 272, status: 'operational' },
    { id: 'SP3', type: 'waste_point',    label: 'WP_J02C',  x: 488, y: 234, status: 'operational' },
    { id: 'SP4', type: 'toilet_cluster', label: 'TC_J02D',  x: 594, y: 252, status: 'operational' },
  ],
  liveMarkers: [
    { x: 342, y: 248, intensity: 'high',   delay: 0   },
    { x: 160, y: 218, intensity: 'low',    delay: 0.6 },
    { x: 526, y: 190, intensity: 'medium', delay: 0.3 },
    { x: 432, y: 217, intensity: 'medium', delay: 0.8 },
  ],
  densityDots: [
    { x: 326, y: 240, r: 3.0, op: 0.48 }, { x: 356, y: 254, r: 2.5, op: 0.42 },
    { x: 344, y: 261, r: 2.5, op: 0.44 }, { x: 368, y: 242, r: 2,   op: 0.36 },
    { x: 510, y: 183, r: 2,   op: 0.34 }, { x: 540, y: 197, r: 1.5, op: 0.28 },
    { x: 146, y: 213, r: 1.5, op: 0.22 }, { x: 170, y: 222, r: 1.5, op: 0.20 },
    { x: 647, y: 290, r: 2,   op: 0.28 }, { x: 672, y: 302, r: 1.5, op: 0.22 },
  ],
  forecast: [
    { label: 'NOW',     value: 216400, delta: '—',      isForecast: false },
    { label: '+30 MIN', value: 233700, delta: '+8.0%',  isForecast: true  },
    { label: '+60 MIN', value: 253700, delta: '+17.2%', isForecast: true  },
  ],
  metrics: { totalPilgrims: 216400, activeZones: 10, criticalZones: 1, aiConfidence: 92.1, lastUpdate: '08:15 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M02', zoneId: 'J02_Z2', zoneLabel: 'ZONE_J02', severity: 'high',
    title: 'ROUTE CONGESTION',
    description: 'ROUTE_JEJURI_N approaching capacity limit',
    timeToEvent: 24, currentLoad: 75, predictedLoad: 92,
    recommendation: 'Divert incoming pilgrims to ROUTE_JEJURI_E. Increase crowd management at ZONE_J02 entry points.',
  },
  movement: { routeId: 'ROUTE_JEJURI_N', label: 'ROUTE_JEJURI_N', status: 'high', congestionDelta: '+18%', flowRate: 415 },
  sanitationLoad: 70, sanitationPredicted: 87,
  forecast30Delta: '+8.0%', forecast60Delta: '+17.2%',
  transitionPath: 'M 400 215 C 480 198,600 182,720 172 C 760 168,790 170,800 172',
}

// ─────────────────────────────────────────────────────────────────────────
// M03 — LONAND  (CRITICAL — sanitation overflow predicted)
// Lonand: 17.9558° N, 74.2837° E
// ─────────────────────────────────────────────────────────────────────────

const M03: Mukam = {
  id: 'M03', name: 'Mukam 03 — Lonand', location: 'Lonand, Satara District',
  coordinates: { lat: 17.9558, lng: 74.2837 },

  zones: [
    { id: 'L03_Z1', label: 'ZONE_L01', status: 'safe',     currentLoad: 40, predictedLoad: 50, crowd: 17200, capacity: 43000, cx: 172, cy: 198, rx: 66, ry: 48 },
    { id: 'L03_Z2', label: 'ZONE_L02', status: 'critical', currentLoad: 84, predictedLoad: 121, crowd: 49600, capacity: 59000, cx: 356, cy: 256, rx: 82, ry: 60 },
    { id: 'L03_Z3', label: 'ZONE_L03', status: 'high',     currentLoad: 73, predictedLoad: 90,  crowd: 32100, capacity: 44000, cx: 528, cy: 184, rx: 64, ry: 46 },
    { id: 'L03_Z4', label: 'ZONE_L04', status: 'forecast', currentLoad: 56, predictedLoad: 80,  crowd: 23100, capacity: 41200, cx: 662, cy: 298, rx: 58, ry: 42 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 98 220 C 146 207,202 200,260 210 C 310 218,336 238,356 256', label: 'ROUTE_LONAND_M', congestion: 'elevated' },
    { id: 'R2', type: 'live',      path: 'M 356 256 C 408 236,462 208,528 190',                           label: 'ROUTE_LONAND_C', congestion: 'high'     },
    { id: 'R3', type: 'forecast',  path: 'M 528 180 C 568 166,612 170,652 188 C 658 192,662 232,662 278'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 172 244 C 225 265,282 262,318 255',                           congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_L03A', x: 292, y: 308, status: 'at_capacity' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_L03B',  x: 416, y: 277, status: 'operational' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_L03C',  x: 490, y: 229, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_L03D',  x: 598, y: 254, status: 'operational' },
  ],
  liveMarkers: [
    { x: 356, y: 256, intensity: 'high',   delay: 0   },
    { x: 172, y: 198, intensity: 'low',    delay: 0.5 },
    { x: 528, y: 184, intensity: 'medium', delay: 0.9 },
    { x: 288, y: 232, intensity: 'medium', delay: 0.3 },
  ],
  densityDots: [
    { x: 338, y: 246, r: 3.5, op: 0.54 }, { x: 370, y: 260, r: 2.5, op: 0.44 },
    { x: 326, y: 268, r: 3,   op: 0.50 }, { x: 384, y: 248, r: 2,   op: 0.40 },
    { x: 348, y: 276, r: 2.5, op: 0.42 }, { x: 316, y: 254, r: 2,   op: 0.38 },
    { x: 396, y: 256, r: 2,   op: 0.36 }, { x: 360, y: 234, r: 3,   op: 0.48 },
    { x: 514, y: 176, r: 2.5, op: 0.40 }, { x: 544, y: 190, r: 2,   op: 0.34 },
  ],
  forecast: [
    { label: 'NOW',     value: 251000, delta: '—',     isForecast: false },
    { label: '+30 MIN', value: 272000, delta: '+8.4%', isForecast: true  },
    { label: '+60 MIN', value: 296000, delta: '+17.9%', isForecast: true },
  ],
  metrics: { totalPilgrims: 251000, activeZones: 12, criticalZones: 3, aiConfidence: 94.5, lastUpdate: '08:16 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M03', zoneId: 'L03_Z2', zoneLabel: 'ZONE_L02', severity: 'critical',
    title: 'SANITATION OVERFLOW',
    description: 'Sanitation capacity failure predicted',
    timeToEvent: 34, currentLoad: 84, predictedLoad: 121,
    recommendation: 'Deploy 2 mobile sanitation units and 1 response team to ZONE_L02 via ROUTE_LONAND_M immediately.',
  },
  movement: { routeId: 'ROUTE_LONAND_C', label: 'ROUTE_LONAND_C', status: 'high', congestionDelta: '+14%', flowRate: 348 },
  sanitationLoad: 84, sanitationPredicted: 121,
  forecast30Delta: '+8.4%', forecast60Delta: '+17.9%',
  transitionPath: 'M 400 210 C 480 194,596 178,716 168 C 756 164,788 166,800 166',
}

// ─────────────────────────────────────────────────────────────────────────
// M04 — NATEPUTE  (HIGH — water supply and crowd management pressure)
// Natepute: 17.7478° N, 74.9908° E
// ─────────────────────────────────────────────────────────────────────────

const M04: Mukam = {
  id: 'M04', name: 'Mukam 04 — Natepute', location: 'Natepute, Solapur District',
  coordinates: { lat: 17.7478, lng: 74.9908 },

  zones: [
    { id: 'N04_Z1', label: 'ZONE_N01', status: 'high',     currentLoad: 79, predictedLoad: 97,  crowd: 34800, capacity: 44000, cx: 170, cy: 205, rx: 70, ry: 52 },
    { id: 'N04_Z2', label: 'ZONE_N02', status: 'critical', currentLoad: 89, predictedLoad: 126, crowd: 52600, capacity: 59200, cx: 354, cy: 254, rx: 84, ry: 62 },
    { id: 'N04_Z3', label: 'ZONE_N03', status: 'watch',    currentLoad: 66, predictedLoad: 83,  crowd: 29000, capacity: 44000, cx: 528, cy: 186, rx: 64, ry: 46 },
    { id: 'N04_Z4', label: 'ZONE_N04', status: 'forecast', currentLoad: 53, predictedLoad: 75,  crowd: 23200, capacity: 44000, cx: 660, cy: 298, rx: 58, ry: 42 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 94 218 C 144 205,204 198,264 208 C 312 216,336 237,354 254', label: 'ROUTE_NATEPUTE_M', congestion: 'high'     },
    { id: 'R2', type: 'live',      path: 'M 354 254 C 406 234,462 207,528 190',                           label: 'ROUTE_NATEPUTE_N', congestion: 'elevated' },
    { id: 'R3', type: 'forecast',  path: 'M 528 182 C 568 168,612 172,652 188 C 658 192,660 232,660 278'                                                    },
    { id: 'R4', type: 'secondary', path: 'M 170 250 C 226 268,284 263,318 256',                           congestion: 'elevated' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_N04A', x: 290, y: 308, status: 'at_capacity' },
    { id: 'SP2', type: 'mobile_unit',    label: 'MOB_N04B', x: 414, y: 276, status: 'at_capacity' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_N04C',  x: 490, y: 228, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_N04D',  x: 598, y: 253, status: 'operational' },
  ],
  liveMarkers: [
    { x: 354, y: 254, intensity: 'high',   delay: 0   },
    { x: 170, y: 205, intensity: 'high',   delay: 0.4 },
    { x: 528, y: 186, intensity: 'medium', delay: 0.8 },
    { x: 286, y: 232, intensity: 'medium', delay: 0.2 },
  ],
  densityDots: [
    { x: 336, y: 245, r: 4.0, op: 0.56 }, { x: 368, y: 258, r: 3.0, op: 0.48 },
    { x: 322, y: 266, r: 3.5, op: 0.52 }, { x: 382, y: 244, r: 2.5, op: 0.42 },
    { x: 346, y: 274, r: 3.0, op: 0.44 }, { x: 313, y: 251, r: 2.5, op: 0.40 },
    { x: 394, y: 254, r: 2.5, op: 0.38 }, { x: 356, y: 232, r: 3.5, op: 0.50 },
    { x: 156, y: 198, r: 2.5, op: 0.38 }, { x: 182, y: 210, r: 2.0, op: 0.34 },
    { x: 510, y: 178, r: 2.5, op: 0.38 }, { x: 542, y: 192, r: 2.0, op: 0.32 },
  ],
  forecast: [
    { label: 'NOW',     value: 289600, delta: '—',      isForecast: false },
    { label: '+30 MIN', value: 315100, delta: '+8.8%',  isForecast: true  },
    { label: '+60 MIN', value: 346600, delta: '+19.7%', isForecast: true  },
  ],
  metrics: { totalPilgrims: 289600, activeZones: 14, criticalZones: 4, aiConfidence: 91.3, lastUpdate: '08:17 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M04', zoneId: 'N04_Z2', zoneLabel: 'ZONE_N02', severity: 'critical',
    title: 'WATER SUPPLY CRITICAL',
    description: 'Water supply exhaustion predicted',
    timeToEvent: 19, currentLoad: 89, predictedLoad: 126,
    recommendation: 'Dispatch 3 water tankers to ZONE_N02 immediately. Activate emergency water distribution via ROUTE_NATEPUTE_N.',
  },
  movement: { routeId: 'ROUTE_NATEPUTE_M', label: 'ROUTE_NATEPUTE_M', status: 'high', congestionDelta: '+22%', flowRate: 518 },
  sanitationLoad: 93, sanitationPredicted: 137,
  forecast30Delta: '+8.8%', forecast60Delta: '+19.7%',
  transitionPath: 'M 400 208 C 480 192,596 176,716 166 C 756 162,788 164,800 164',
}

// ─────────────────────────────────────────────────────────────────────────
// M05 — MALSHIRAS  (STABLE — final Mukam before Pandharpur, low stress)
// Malshiras: 17.8600° N, 75.1100° E
// ─────────────────────────────────────────────────────────────────────────

const M05: Mukam = {
  id: 'M05', name: 'Mukam 05 — Malshiras', location: 'Malshiras, Solapur District',
  coordinates: { lat: 17.8600, lng: 75.1100 },

  zones: [
    { id: 'ML05_Z1', label: 'ZONE_M01', status: 'safe',     currentLoad: 28, predictedLoad: 36, crowd: 12100, capacity: 43000, cx: 165, cy: 212, rx: 57, ry: 42 },
    { id: 'ML05_Z2', label: 'ZONE_M02', status: 'safe',     currentLoad: 34, predictedLoad: 45, crowd: 14800, capacity: 43500, cx: 340, cy: 250, rx: 69, ry: 51 },
    { id: 'ML05_Z3', label: 'ZONE_M03', status: 'watch',    currentLoad: 55, predictedLoad: 69, crowd: 24000, capacity: 43700, cx: 520, cy: 190, rx: 61, ry: 44 },
    { id: 'ML05_Z4', label: 'ZONE_M04', status: 'forecast', currentLoad: 39, predictedLoad: 58, crowd: 17000, capacity: 43700, cx: 658, cy: 296, rx: 54, ry: 40 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 86 228 C 138 216,206 222,268 230 C 308 236,328 243,340 250', label: 'ROUTE_MALSHIRAS_M', congestion: 'normal' },
    { id: 'R2', type: 'live',      path: 'M 340 250 C 396 230,454 210,520 194',                           label: 'ROUTE_MALSHIRAS_N', congestion: 'normal' },
    { id: 'R3', type: 'forecast',  path: 'M 520 186 C 562 172,608 176,648 192 C 654 196,656 234,656 278'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 165 255 C 222 274,278 270,314 260',                           congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'toilet_cluster', label: 'TC_ML05A', x: 276, y: 302, status: 'operational' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_ML05B', x: 406, y: 271, status: 'operational' },
    { id: 'SP3', type: 'mobile_unit',    label: 'MOB_ML05C', x: 480, y: 230, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_ML05D',  x: 576, y: 250, status: 'operational' },
  ],
  liveMarkers: [
    { x: 340, y: 250, intensity: 'low',    delay: 0   },
    { x: 165, y: 212, intensity: 'low',    delay: 0.5 },
    { x: 520, y: 190, intensity: 'medium', delay: 0.9 },
  ],
  densityDots: [
    { x: 324, y: 244, r: 2.0, op: 0.28 }, { x: 350, y: 256, r: 1.5, op: 0.24 },
    { x: 335, y: 262, r: 1.5, op: 0.26 }, { x: 502, y: 184, r: 2.0, op: 0.30 },
    { x: 528, y: 196, r: 1.5, op: 0.26 }, { x: 152, y: 208, r: 1.5, op: 0.18 },
    { x: 642, y: 290, r: 1.5, op: 0.22 },
  ],
  forecast: [
    { label: 'NOW',     value: 127900, delta: '—',      isForecast: false },
    { label: '+30 MIN', value: 134900, delta: '+5.5%',  isForecast: true  },
    { label: '+60 MIN', value: 143500, delta: '+12.2%', isForecast: true  },
  ],
  metrics: { totalPilgrims: 127900, activeZones: 6, criticalZones: 0, aiConfidence: 97.1, lastUpdate: '08:18 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M05', zoneId: 'ML05_Z3', zoneLabel: 'ZONE_M03', severity: 'watch',
    title: 'CROWD DENSITY WATCH',
    description: 'ZONE_M03 density gradually increasing',
    timeToEvent: 74, currentLoad: 55, predictedLoad: 69,
    recommendation: 'Monitor ZONE_M03 closely. Pre-position 1 crowd management team as a precaution before Pandharpur approach.',
  },
  movement: { routeId: 'ROUTE_MALSHIRAS_N', label: 'ROUTE_MALSHIRAS_N', status: 'normal', congestionDelta: '+4%', flowRate: 142 },
  sanitationLoad: 46, sanitationPredicted: 58,
  forecast30Delta: '+5.5%', forecast60Delta: '+12.2%',
  transitionPath: undefined,
}

// ─────────────────────────────────────────────────────────────────────────
// REGISTRY — Pune → Pandharpur route order
// ─────────────────────────────────────────────────────────────────────────

export const MUKAMS: Mukam[] = [M01, M02, M03, M04, M05]

// ─────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS (backward compat)
// ─────────────────────────────────────────────────────────────────────────

export const GLOBAL_METRICS    = M01.metrics
export const ZONES             = M01.zones
export const ROUTES            = M01.routes
export const SANITATION_POINTS = M01.sanitationPoints
export const LIVE_MARKERS      = M01.liveMarkers
export const PRIMARY_ALERT     = M01.alert
export const FORECAST_SERIES   = M01.forecast
export const MOVEMENT_FLOW     = M01.movement
export const RESOURCES: Resource[] = [
  { id: 'RC1', type: 'sanitation_team', label: 'TEAM_S01', status: 'standby',  location: 'BASE_NORTH' },
  { id: 'RC2', type: 'mobile_unit',     label: 'MOB_U02',  status: 'standby',  location: 'BASE_EAST'  },
  { id: 'RC3', type: 'response_team',   label: 'TEAM_C03', status: 'standby',  location: 'ZONE_M01'   },
  { id: 'RC4', type: 'medical',         label: 'MED_01',   status: 'deployed', location: 'ZONE_M03'   },
]
