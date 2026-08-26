// ── WariAI Mock Command Data ────────────────────────────────────────────────
// Single source of truth for all Command Centre state.
// All components read from selectedMukam — no independent hardcoded values.

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ZoneStatus = 'safe' | 'watch' | 'high' | 'critical' | 'forecast'

export interface Zone {
  id: string
  label: string
  status: ZoneStatus
  currentLoad: number       // 0–100+
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
  zoneLabel: string         // display label e.g. "ZONE_Z02"
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
  // Sanitation KPI values (used by BottomIntelligenceStrip)
  sanitationLoad: number
  sanitationPredicted: number
  // AI forecast headline values (derived from forecast[] but cached for convenience)
  forecast30Delta: string
  forecast60Delta: string
  // SVG path to next Mukam (for transition overlay)
  transitionPath?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC COLORS
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<ZoneStatus, { stroke: string; fill: string; text: string; glow: string }> = {
  safe:     { stroke: '#2DD4A8', fill: 'rgba(45,212,168,0.07)',  text: '#2DD4A8', glow: 'rgba(45,212,168,0.18)'  },
  watch:    { stroke: '#E8C45A', fill: 'rgba(232,196,90,0.08)',  text: '#E8C45A', glow: 'rgba(232,196,90,0.15)'  },
  high:     { stroke: '#F28B4B', fill: 'rgba(242,139,75,0.09)',  text: '#F28B4B', glow: 'rgba(242,139,75,0.15)'  },
  critical: { stroke: '#EF5B5B', fill: 'rgba(239,91,91,0.1)',    text: '#EF5B5B', glow: 'rgba(239,91,91,0.2)'    },
  forecast: { stroke: '#9B8AFB', fill: 'rgba(155,138,251,0.08)', text: '#9B8AFB', glow: 'rgba(155,138,251,0.15)' },
}

// Severity → border/badge color used by PriorityActionPanel header
export const SEVERITY_COLOR: Record<ZoneStatus, string> = {
  safe:     '#2DD4A8',
  watch:    '#E8C45A',
  high:     '#F28B4B',
  critical: '#EF5B5B',
  forecast: '#9B8AFB',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUKAM_07 — Phaltan, Satara District  (CRITICAL — sanitation overflow)
// ─────────────────────────────────────────────────────────────────────────────
const M07: Mukam = {
  id: 'MUKAM_07', name: 'Mukam 07 — Phaltan', location: 'Phaltan, Satara',
  coordinates: { lat: 17.987, lng: 74.432 },

  zones: [
    { id: 'A01', label: 'ZONE_A01', status: 'safe',     currentLoad: 42, predictedLoad: 51,  crowd: 18200, capacity: 43000, cx: 175, cy: 195, rx: 68, ry: 50 },
    { id: 'Z02', label: 'ZONE_Z02', status: 'critical', currentLoad: 82, predictedLoad: 118, crowd: 48320, capacity: 59000, cx: 358, cy: 258, rx: 82, ry: 60 },
    { id: 'C03', label: 'ZONE_C03', status: 'high',     currentLoad: 71, predictedLoad: 88,  crowd: 31400, capacity: 44000, cx: 530, cy: 182, rx: 64, ry: 46 },
    { id: 'B04', label: 'ZONE_B04', status: 'forecast', currentLoad: 55, predictedLoad: 79,  crowd: 22600, capacity: 41000, cx: 665, cy: 300, rx: 58, ry: 42 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 100 220 C 148 208,200 200,260 210 C 310 218,338 240,358 258', label: 'ROUTE_MAIN', congestion: 'elevated' },
    { id: 'R2', type: 'live',      path: 'M 358 258 C 410 238,462 210,530 190',                            label: 'ROUTE_C03',  congestion: 'high'     },
    { id: 'R3', type: 'forecast',  path: 'M 530 182 C 568 168,610 172,650 188 C 660 192,665 220,665 260'                                                },
    { id: 'R4', type: 'secondary', path: 'M 175 245 C 220 268,280 270,320 262',                            congestion: 'normal' },
    { id: 'R5', type: 'secondary', path: 'M 358 318 C 410 340,470 348,530 338 C 570 330,625 320,665 342', congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_01', x: 295, y: 310, status: 'at_capacity' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_02',  x: 418, y: 278, status: 'operational' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_03',  x: 492, y: 228, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_04',  x: 600, y: 256, status: 'operational' },
    { id: 'SP5', type: 'mobile_unit',    label: 'MOB_05', x: 148, y: 156, status: 'operational' },
  ],
  liveMarkers: [
    { x: 358, y: 258, intensity: 'high',   delay: 0   },
    { x: 175, y: 195, intensity: 'low',    delay: 0.5 },
    { x: 530, y: 182, intensity: 'medium', delay: 0.9 },
    { x: 290, y: 235, intensity: 'medium', delay: 0.3 },
    { x: 440, y: 222, intensity: 'low',    delay: 0.7 },
  ],
  densityDots: [
    { x: 340, y: 248, r: 3.5, op: 0.55 }, { x: 372, y: 262, r: 2.5, op: 0.45 },
    { x: 328, y: 272, r: 3,   op: 0.50 }, { x: 385, y: 244, r: 2,   op: 0.40 },
    { x: 350, y: 278, r: 2.5, op: 0.42 }, { x: 318, y: 255, r: 2,   op: 0.38 },
    { x: 398, y: 258, r: 2,   op: 0.36 }, { x: 362, y: 232, r: 3,   op: 0.48 },
    { x: 516, y: 174, r: 2.5, op: 0.42 }, { x: 548, y: 186, r: 2,   op: 0.36 },
    { x: 504, y: 192, r: 2,   op: 0.38 }, { x: 534, y: 168, r: 3,   op: 0.44 },
    { x: 162, y: 192, r: 2,   op: 0.28 }, { x: 188, y: 202, r: 1.5, op: 0.24 },
    { x: 174, y: 182, r: 1.5, op: 0.22 },
    { x: 652, y: 295, r: 2,   op: 0.30 }, { x: 678, y: 308, r: 1.5, op: 0.26 },
  ],
  forecast: [
    { label: 'NOW',     value: 248400, delta: '—',     isForecast: false },
    { label: '+30 MIN', value: 269300, delta: '+8.4%', isForecast: true  },
    { label: '+60 MIN', value: 293300, delta: '+18%',  isForecast: true  },
  ],
  metrics: { totalPilgrims: 248400, activeZones: 12, criticalZones: 3, aiConfidence: 94.2, lastUpdate: '14:32 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M07', zoneId: 'Z02', zoneLabel: 'ZONE_Z02', severity: 'critical',
    title: 'SANITATION OVERFLOW',
    description: 'Sanitation capacity failure predicted',
    timeToEvent: 34, currentLoad: 82, predictedLoad: 118,
    recommendation: 'Deploy 2 mobile sanitation units and 1 response team to ZONE_Z02 via ROUTE_MAIN.',
  },
  movement: { routeId: 'ROUTE_C03', label: 'ROUTE_C03', status: 'high', congestionDelta: '+12%', flowRate: 340 },
  sanitationLoad: 82, sanitationPredicted: 118,
  forecast30Delta: '+8.4%', forecast60Delta: '+18%',
  transitionPath: 'M 400 210 C 480 190,600 170,720 160 C 760 156,790 158,800 160',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUKAM_08 — Lonand  (HIGH — crowd congestion building on main route)
// ─────────────────────────────────────────────────────────────────────────────
const M08: Mukam = {
  id: 'MUKAM_08', name: 'Mukam 08 — Lonand', location: 'Lonand, Satara',
  coordinates: { lat: 17.854, lng: 74.358 },

  zones: [
    { id: 'L01', label: 'ZONE_L01', status: 'safe',     currentLoad: 34, predictedLoad: 42, crowd: 14600, capacity: 43000, cx: 155, cy: 215, rx: 60, ry: 44 },
    { id: 'L02', label: 'ZONE_L02', status: 'high',     currentLoad: 74, predictedLoad: 91, crowd: 32600, capacity: 44000, cx: 345, cy: 248, rx: 78, ry: 56 },
    { id: 'L03', label: 'ZONE_L03', status: 'watch',    currentLoad: 62, predictedLoad: 75, crowd: 27200, capacity: 44000, cx: 528, cy: 188, rx: 62, ry: 45 },
    { id: 'L04', label: 'ZONE_L04', status: 'forecast', currentLoad: 46, predictedLoad: 67, crowd: 20100, capacity: 43500, cx: 662, cy: 296, rx: 56, ry: 41 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 90 232 C 142 220,204 224,265 232 C 308 238,334 242,345 248', label: 'ROUTE_LONAND_N', congestion: 'high'     },
    { id: 'R2', type: 'live',      path: 'M 345 248 C 402 228,460 208,528 194',                           label: 'ROUTE_LONAND_E', congestion: 'elevated' },
    { id: 'R3', type: 'forecast',  path: 'M 528 185 C 570 170,615 175,655 192 C 660 196,662 236,662 280'                                                  },
    { id: 'R4', type: 'secondary', path: 'M 155 260 C 215 278,278 274,318 264',                           congestion: 'normal' },
    { id: 'R5', type: 'secondary', path: 'M 345 300 C 405 322,468 330,528 320 C 572 312,624 302,662 320', congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_08A', x: 288, y: 302, status: 'at_capacity' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_08B',  x: 415, y: 272, status: 'operational' },
    { id: 'SP3', type: 'waste_point',    label: 'WP_08C',  x: 488, y: 232, status: 'operational' },
    { id: 'SP4', type: 'toilet_cluster', label: 'TC_08D',  x: 594, y: 250, status: 'operational' },
  ],
  liveMarkers: [
    { x: 345, y: 248, intensity: 'high',   delay: 0   },
    { x: 155, y: 215, intensity: 'low',    delay: 0.6 },
    { x: 528, y: 188, intensity: 'medium', delay: 0.3 },
    { x: 435, y: 215, intensity: 'medium', delay: 0.8 },
  ],
  densityDots: [
    { x: 330, y: 240, r: 3.0, op: 0.50 }, { x: 360, y: 254, r: 2.5, op: 0.44 },
    { x: 348, y: 262, r: 2.5, op: 0.46 }, { x: 372, y: 242, r: 2,   op: 0.38 },
    { x: 512, y: 180, r: 2,   op: 0.36 }, { x: 542, y: 194, r: 1.5, op: 0.30 },
    { x: 142, y: 210, r: 1.5, op: 0.22 }, { x: 168, y: 220, r: 1.5, op: 0.20 },
    { x: 648, y: 288, r: 2,   op: 0.28 }, { x: 674, y: 300, r: 1.5, op: 0.24 },
  ],
  forecast: [
    { label: 'NOW',     value: 214500, delta: '—',      isForecast: false },
    { label: '+30 MIN', value: 231600, delta: '+8.0%',  isForecast: true  },
    { label: '+60 MIN', value: 251500, delta: '+17.2%', isForecast: true  },
  ],
  metrics: { totalPilgrims: 214500, activeZones: 10, criticalZones: 1, aiConfidence: 92.4, lastUpdate: '14:33 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M08', zoneId: 'L02', zoneLabel: 'ZONE_L02', severity: 'high',
    title: 'ROUTE CONGESTION',
    description: 'ROUTE_LONAND_N approaching capacity limit',
    timeToEvent: 22, currentLoad: 74, predictedLoad: 91,
    recommendation: 'Divert incoming pilgrims to ROUTE_LONAND_E and increase crowd management presence at ZONE_L02 entry points.',
  },
  movement: { routeId: 'ROUTE_LONAND_N', label: 'ROUTE_LONAND_N', status: 'high', congestionDelta: '+17%', flowRate: 420 },
  sanitationLoad: 68, sanitationPredicted: 84,
  forecast30Delta: '+8.0%', forecast60Delta: '+17.2%',
  transitionPath: 'M 400 215 C 480 198,600 182,720 172 C 760 168,790 170,800 172',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUKAM_09 — Wathar  (WATCH — medical assistance demand rising)
// ─────────────────────────────────────────────────────────────────────────────
const M09: Mukam = {
  id: 'MUKAM_09', name: 'Mukam 09 — Wathar', location: 'Wathar, Satara',
  coordinates: { lat: 17.724, lng: 74.162 },

  zones: [
    { id: 'W01', label: 'ZONE_W01', status: 'safe',     currentLoad: 31, predictedLoad: 39, crowd: 13400, capacity: 43000, cx: 168, cy: 208, rx: 58, ry: 42 },
    { id: 'W02', label: 'ZONE_W02', status: 'watch',    currentLoad: 60, predictedLoad: 76, crowd: 26200, capacity: 43500, cx: 342, cy: 248, rx: 72, ry: 53 },
    { id: 'W03', label: 'ZONE_W03', status: 'safe',     currentLoad: 38, predictedLoad: 48, crowd: 16600, capacity: 43500, cx: 524, cy: 186, rx: 60, ry: 44 },
    { id: 'W04', label: 'ZONE_W04', status: 'forecast', currentLoad: 44, predictedLoad: 64, crowd: 19200, capacity: 43500, cx: 660, cy: 294, rx: 55, ry: 40 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 88 226 C 140 214,208 220,270 230 C 312 237,333 242,342 248', label: 'ROUTE_WATHAR_M', congestion: 'elevated' },
    { id: 'R2', type: 'live',      path: 'M 342 248 C 400 228,458 208,524 192',                           label: 'ROUTE_WATHAR_E', congestion: 'normal'   },
    { id: 'R3', type: 'forecast',  path: 'M 524 184 C 565 170,612 174,652 190 C 658 194,660 232,660 278'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 168 252 C 225 270,282 266,316 257',                           congestion: 'normal' },
    { id: 'R5', type: 'secondary', path: 'M 342 296 C 400 318,466 326,524 314 C 568 306,618 295,660 314', congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'toilet_cluster', label: 'TC_09A', x: 280, y: 298, status: 'operational' },
    { id: 'SP2', type: 'mobile_unit',    label: 'MOB_09B', x: 410, y: 268, status: 'operational' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_09C',  x: 482, y: 228, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_09D',  x: 578, y: 248, status: 'operational' },
  ],
  liveMarkers: [
    { x: 342, y: 248, intensity: 'medium', delay: 0   },
    { x: 168, y: 208, intensity: 'low',    delay: 0.5 },
    { x: 524, y: 186, intensity: 'low',    delay: 0.8 },
  ],
  densityDots: [
    { x: 327, y: 241, r: 2.5, op: 0.40 }, { x: 354, y: 253, r: 2,   op: 0.34 },
    { x: 340, y: 260, r: 2,   op: 0.36 }, { x: 368, y: 243, r: 1.5, op: 0.28 },
    { x: 508, y: 180, r: 2,   op: 0.30 }, { x: 536, y: 193, r: 1.5, op: 0.24 },
    { x: 154, y: 204, r: 1.5, op: 0.20 }, { x: 178, y: 214, r: 1.5, op: 0.18 },
    { x: 645, y: 286, r: 1.5, op: 0.24 }, { x: 669, y: 298, r: 1.5, op: 0.20 },
  ],
  forecast: [
    { label: 'NOW',     value: 175400, delta: '—',     isForecast: false },
    { label: '+30 MIN', value: 187900, delta: '+7.1%', isForecast: true  },
    { label: '+60 MIN', value: 203700, delta: '+16.2%', isForecast: true },
  ],
  metrics: { totalPilgrims: 175400, activeZones: 8, criticalZones: 0, aiConfidence: 93.5, lastUpdate: '14:34 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M09', zoneId: 'W02', zoneLabel: 'ZONE_W02', severity: 'watch',
    title: 'MEDICAL DEMAND ELEVATED',
    description: 'Heat exhaustion incidents trending upward in',
    timeToEvent: 45, currentLoad: 60, predictedLoad: 76,
    recommendation: 'Deploy 1 medical response team to ZONE_W02. Increase water distribution frequency along ROUTE_WATHAR_M.',
  },
  movement: { routeId: 'ROUTE_WATHAR_M', label: 'ROUTE_WATHAR_M', status: 'elevated', congestionDelta: '+9%', flowRate: 265 },
  sanitationLoad: 58, sanitationPredicted: 72,
  forecast30Delta: '+7.1%', forecast60Delta: '+16.2%',
  transitionPath: 'M 400 212 C 480 196,598 180,718 170 C 758 166,790 168,800 168',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUKAM_10 — Satara  (CRITICAL — water supply shortage + crowd overflow)
// ─────────────────────────────────────────────────────────────────────────────
const M10: Mukam = {
  id: 'MUKAM_10', name: 'Mukam 10 — Satara', location: 'Satara, Satara District',
  coordinates: { lat: 17.686, lng: 74.006 },

  zones: [
    { id: 'S01', label: 'ZONE_S01', status: 'high',     currentLoad: 78, predictedLoad: 96,  crowd: 34200, capacity: 44000, cx: 172, cy: 202, rx: 70, ry: 52 },
    { id: 'S02', label: 'ZONE_S02', status: 'critical', currentLoad: 88, predictedLoad: 124, crowd: 52100, capacity: 59200, cx: 355, cy: 255, rx: 84, ry: 62 },
    { id: 'S03', label: 'ZONE_S03', status: 'watch',    currentLoad: 65, predictedLoad: 82,  crowd: 28600, capacity: 44000, cx: 528, cy: 184, rx: 64, ry: 46 },
    { id: 'S04', label: 'ZONE_S04', status: 'forecast', currentLoad: 52, predictedLoad: 74,  crowd: 22900, capacity: 44000, cx: 660, cy: 298, rx: 58, ry: 42 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 95 218 C 146 205,205 198,264 208 C 312 216,337 238,355 255', label: 'ROUTE_SATARA_M', congestion: 'high'     },
    { id: 'R2', type: 'live',      path: 'M 355 255 C 408 235,462 208,528 190',                           label: 'ROUTE_SATARA_N', congestion: 'elevated' },
    { id: 'R3', type: 'forecast',  path: 'M 528 180 C 568 166,612 170,652 187 C 658 192,660 232,660 278'                                                   },
    { id: 'R4', type: 'secondary', path: 'M 172 248 C 228 268,284 264,318 256',                           congestion: 'elevated' },
    { id: 'R5', type: 'secondary', path: 'M 355 308 C 408 332,468 340,528 328 C 570 320,624 308,660 326', congestion: 'normal'   },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'mobile_unit',    label: 'MOB_10A', x: 292, y: 308, status: 'at_capacity' },
    { id: 'SP2', type: 'mobile_unit',    label: 'MOB_10B', x: 415, y: 276, status: 'at_capacity' },
    { id: 'SP3', type: 'toilet_cluster', label: 'TC_10C',  x: 490, y: 228, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_10D',  x: 598, y: 253, status: 'operational' },
    { id: 'SP5', type: 'toilet_cluster', label: 'TC_10E',  x: 148, y: 154, status: 'operational' },
  ],
  liveMarkers: [
    { x: 355, y: 255, intensity: 'high',   delay: 0   },
    { x: 172, y: 202, intensity: 'high',   delay: 0.4 },
    { x: 528, y: 184, intensity: 'medium', delay: 0.8 },
    { x: 288, y: 232, intensity: 'medium', delay: 0.2 },
    { x: 442, y: 218, intensity: 'low',    delay: 0.6 },
  ],
  densityDots: [
    { x: 338, y: 246, r: 4.0, op: 0.58 }, { x: 370, y: 260, r: 3.0, op: 0.50 },
    { x: 324, y: 268, r: 3.5, op: 0.54 }, { x: 384, y: 244, r: 2.5, op: 0.44 },
    { x: 348, y: 276, r: 3.0, op: 0.46 }, { x: 315, y: 252, r: 2.5, op: 0.42 },
    { x: 396, y: 255, r: 2.5, op: 0.40 }, { x: 358, y: 232, r: 3.5, op: 0.52 },
    { x: 158, y: 196, r: 2.5, op: 0.40 }, { x: 184, y: 208, r: 2.0, op: 0.36 },
    { x: 170, y: 186, r: 2.0, op: 0.34 }, { x: 512, y: 176, r: 2.5, op: 0.40 },
    { x: 544, y: 190, r: 2.0, op: 0.34 }, { x: 648, y: 290, r: 2.0, op: 0.30 },
  ],
  forecast: [
    { label: 'NOW',     value: 286200, delta: '—',      isForecast: false },
    { label: '+30 MIN', value: 311600, delta: '+8.9%',  isForecast: true  },
    { label: '+60 MIN', value: 343400, delta: '+19.9%', isForecast: true  },
  ],
  metrics: { totalPilgrims: 286200, activeZones: 14, criticalZones: 4, aiConfidence: 91.6, lastUpdate: '14:35 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M10', zoneId: 'S02', zoneLabel: 'ZONE_S02', severity: 'critical',
    title: 'WATER SUPPLY CRITICAL',
    description: 'Water supply exhaustion predicted',
    timeToEvent: 18, currentLoad: 88, predictedLoad: 124,
    recommendation: 'Dispatch 3 water tankers to ZONE_S02 immediately. Activate emergency water distribution protocol via ROUTE_SATARA_N.',
  },
  movement: { routeId: 'ROUTE_SATARA_M', label: 'ROUTE_SATARA_M', status: 'high', congestionDelta: '+21%', flowRate: 510 },
  sanitationLoad: 91, sanitationPredicted: 134,
  forecast30Delta: '+8.9%', forecast60Delta: '+19.9%',
  transitionPath: 'M 400 208 C 480 192,596 176,716 166 C 756 162,788 164,800 164',
}

// ─────────────────────────────────────────────────────────────────────────────
// MUKAM_11 — Karad  (NORMAL — well-managed, low stress)
// ─────────────────────────────────────────────────────────────────────────────
const M11: Mukam = {
  id: 'MUKAM_11', name: 'Mukam 11 — Karad', location: 'Karad, Satara District',
  coordinates: { lat: 17.288, lng: 74.184 },

  zones: [
    { id: 'K01', label: 'ZONE_K01', status: 'safe',     currentLoad: 26, predictedLoad: 34, crowd: 11200, capacity: 43000, cx: 165, cy: 212, rx: 56, ry: 42 },
    { id: 'K02', label: 'ZONE_K02', status: 'safe',     currentLoad: 33, predictedLoad: 44, crowd: 14300, capacity: 43000, cx: 338, cy: 250, rx: 68, ry: 50 },
    { id: 'K03', label: 'ZONE_K03', status: 'watch',    currentLoad: 54, predictedLoad: 68, crowd: 23600, capacity: 43700, cx: 520, cy: 188, rx: 60, ry: 44 },
    { id: 'K04', label: 'ZONE_K04', status: 'forecast', currentLoad: 38, predictedLoad: 57, crowd: 16600, capacity: 43700, cx: 658, cy: 296, rx: 54, ry: 39 },
  ],
  routes: [
    { id: 'R1', type: 'live',      path: 'M 86 228 C 138 216,206 222,268 230 C 308 236,328 242,338 250', label: 'ROUTE_KARAD_M', congestion: 'normal' },
    { id: 'R2', type: 'live',      path: 'M 338 250 C 396 230,454 210,520 194',                           label: 'ROUTE_KARAD_N', congestion: 'normal' },
    { id: 'R3', type: 'forecast',  path: 'M 520 186 C 562 172,608 176,648 192 C 654 196,656 234,656 278'                                               },
    { id: 'R4', type: 'secondary', path: 'M 165 255 C 222 274,278 270,314 260',                           congestion: 'normal' },
    { id: 'R5', type: 'secondary', path: 'M 338 298 C 396 320,460 328,520 316 C 562 308,616 296,656 316', congestion: 'normal' },
  ],
  sanitationPoints: [
    { id: 'SP1', type: 'toilet_cluster', label: 'TC_11A', x: 274, y: 300, status: 'operational' },
    { id: 'SP2', type: 'toilet_cluster', label: 'TC_11B', x: 404, y: 270, status: 'operational' },
    { id: 'SP3', type: 'mobile_unit',    label: 'MOB_11C', x: 478, y: 228, status: 'operational' },
    { id: 'SP4', type: 'waste_point',    label: 'WP_11D',  x: 574, y: 248, status: 'operational' },
  ],
  liveMarkers: [
    { x: 338, y: 250, intensity: 'low',    delay: 0   },
    { x: 165, y: 212, intensity: 'low',    delay: 0.5 },
    { x: 520, y: 188, intensity: 'medium', delay: 0.9 },
  ],
  densityDots: [
    { x: 323, y: 243, r: 2.0, op: 0.28 }, { x: 348, y: 255, r: 1.5, op: 0.24 },
    { x: 334, y: 262, r: 1.5, op: 0.26 }, { x: 500, y: 182, r: 2.0, op: 0.30 },
    { x: 528, y: 194, r: 1.5, op: 0.26 }, { x: 152, y: 208, r: 1.5, op: 0.18 },
    { x: 640, y: 290, r: 1.5, op: 0.20 },
  ],
  forecast: [
    { label: 'NOW',     value: 125800, delta: '—',     isForecast: false },
    { label: '+30 MIN', value: 132600, delta: '+5.4%', isForecast: true  },
    { label: '+60 MIN', value: 141200, delta: '+12.2%', isForecast: true },
  ],
  metrics: { totalPilgrims: 125800, activeZones: 6, criticalZones: 0, aiConfidence: 97.3, lastUpdate: '14:36 IST', systemStatus: 'live' },
  alert: {
    id: 'ALT_M11', zoneId: 'K03', zoneLabel: 'ZONE_K03', severity: 'watch',
    title: 'CROWD DENSITY WATCH',
    description: 'ZONE_K03 density gradually increasing',
    timeToEvent: 72, currentLoad: 54, predictedLoad: 68,
    recommendation: 'Continue monitoring ZONE_K03. Pre-position 1 crowd management team as a precaution.',
  },
  movement: { routeId: 'ROUTE_KARAD_N', label: 'ROUTE_KARAD_N', status: 'normal', congestionDelta: '+4%', flowRate: 138 },
  sanitationLoad: 44, sanitationPredicted: 56,
  forecast30Delta: '+5.4%', forecast60Delta: '+12.2%',
  transitionPath: undefined,
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const MUKAMS: Mukam[] = [M07, M08, M09, M10, M11]

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY EXPORTS (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export const GLOBAL_METRICS    = M07.metrics
export const ZONES             = M07.zones
export const ROUTES            = M07.routes
export const SANITATION_POINTS = M07.sanitationPoints
export const LIVE_MARKERS      = M07.liveMarkers
export const PRIMARY_ALERT     = M07.alert
export const FORECAST_SERIES   = M07.forecast
export const MOVEMENT_FLOW     = M07.movement
export const RESOURCES: Resource[] = [
  { id: 'RC1', type: 'sanitation_team', label: 'TEAM_S01', status: 'standby',  location: 'BASE_NORTH' },
  { id: 'RC2', type: 'mobile_unit',     label: 'MOB_U02',  status: 'standby',  location: 'BASE_EAST'  },
  { id: 'RC3', type: 'response_team',   label: 'TEAM_C03', status: 'standby',  location: 'ZONE_A01'   },
  { id: 'RC4', type: 'medical',         label: 'MED_01',   status: 'deployed', location: 'ZONE_C03'   },
]
