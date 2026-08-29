// ── routeGeometry.ts ──────────────────────────────────────────────────────
// Small geometry helpers shared by the Event Overview Palki animation.
//
//  • All distances are great-circle (meters).
//  • All points are [lat, lng] tuples.
//  • These helpers only READ existing route geometry — they never invent or
//    replace the road-following path resolved by useRoadRouteSegments.
// ─────────────────────────────────────────────────────────────────────────

export const EARTH_R = 6371000 // meters

export function haversine(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Compass bearing from a → b (0 = north), used to orient the pointer.
export function bearing(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const dLon = toRad(b[1] - a[1])
  const y = Math.sin(dLon) * Math.cos(toRad(b[0]))
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(dLon)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// Cumulative arc-length (meters) at each vertex of the path.
export function cumulativeLengths(path: [number, number][]): number[] {
  const cum = [0]
  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1] + haversine(path[i - 1], path[i]))
  }
  return cum
}

export interface RoutePosition {
  lat: number
  lng: number
  bearingDeg: number
}

// Position + heading at a given arc-length distance (meters) along the path.
export function positionAtDistance(
  path: [number, number][],
  cum: number[],
  dist: number,
): RoutePosition {
  const total = cum[cum.length - 1] || 1
  const d = Math.max(0, Math.min(dist, total))

  if (d <= 0) {
    return { lat: path[0][0], lng: path[0][1], bearingDeg: bearing(path[0], path[1] ?? path[0]) }
  }
  if (d >= total) {
    const n = path.length
    return {
      lat: path[n - 1][0],
      lng: path[n - 1][1],
      bearingDeg: bearing(path[Math.max(0, n - 2)], path[n - 1]),
    }
  }

  let i = 1
  while (i < cum.length && cum[i] < d) i++
  const segLen = (cum[i] - cum[i - 1]) || 1
  const f = (d - cum[i - 1]) / segLen
  const a = path[i - 1]
  const b = path[i]
  return {
    lat: a[0] + (b[0] - a[0]) * f,
    lng: a[1] + (b[1] - a[1]) * f,
    bearingDeg: bearing(a, b),
  }
}

// Arc-length distance (meters) from the path start to the point on the path
// that is nearest to `target`. Used to anchor the Palki to a real route point
// (e.g. the Lonand demo position) rather than an arbitrary map coordinate.
export function distanceToNearestPoint(
  path: [number, number][],
  target: [number, number],
): number {
  if (path.length < 2) return 0

  let acc = 0
  let best = Infinity
  let bestDist = 0

  for (let i = 1; i < path.length; i++) {
    const segLen = haversine(path[i - 1], path[i])
    const proj = projectOnSegment(path[i - 1], path[i], target)
    const d = haversine(target, proj)
    if (d < best) {
      best = d
      bestDist = acc + haversine(path[i - 1], proj)
    }
    acc += segLen
  }
  return bestDist
}

// Project `p` onto segment [a,b] (in lat/lng space; fine for short route legs).
function projectOnSegment(
  a: [number, number],
  b: [number, number],
  p: [number, number],
): [number, number] {
  const abLat = b[0] - a[0]
  const abLng = b[1] - a[1]
  const denom = abLat * abLat + abLng * abLng
  if (denom === 0) return a
  let t = ((p[0] - a[0]) * abLat + (p[1] - a[1]) * abLng) / denom
  t = Math.max(0, Math.min(1, t))
  return [a[0] + abLat * t, a[1] + abLng * t]
}
