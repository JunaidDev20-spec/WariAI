// ── useRoadRouteSegments.ts ─────────────────────────────────────────────────
// Isolated routing layer for the Event Overview map.
//
// Given an ordered list of [lat, lng] waypoints (the existing Palkhi sequence:
// Pune → M01..M05 → Pandharpur), it resolves the road-following geometry for
// every consecutive pair via the public OSRM / OpenStreetMap routing service.
//
// Design:
//  • No straight-line interpolation — geometry comes from the routing engine.
//  • Each segment is fetched independently and cached in a module-level Map,
//    so navigation never triggers a repeat request for an already-known leg.
//  • In-flight requests are de-duplicated (only one promise per segment).
//  • On any failure (network / non-OK / empty geometry) the segment resolves to
//    null; the consumer falls back to a straight line so the map never breaks
//    and Mukam markers always stay visible.
//  • Rendering logic lives in PalkhiMap — this hook only calculates geometry.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

// Module-level caches — persist across mounts/navigation.
const segmentCache = new Map<string, [number, number][]>()
const inflight = new Map<string, Promise<[number, number][] | null>>()

function segmentKey(a: [number, number], b: [number, number]): string {
  const r = (n: number) => n.toFixed(5)
  return `${r(a[0])},${r(a[1])}->${r(b[0])},${r(b[1])}`
}

async function fetchSegment(a: [number, number], b: [number, number]): Promise<[number, number][] | null> {
  const k = segmentKey(a, b)
  const cached = segmentCache.get(k)
  if (cached) return cached
  const pending = inflight.get(k)
  if (pending) return pending

  const promise = (async (): Promise<[number, number][] | null> => {
    try {
      // OSRM expects lon,lat pairs separated by ';'
      const coord = `${a[1]},${a[0]};${b[1]},${b[0]}`
      const res = await fetch(`${OSRM_BASE}/${coord}?overview=full&geometries=geojson`)
      if (!res.ok) return null
      const data = await res.json()
      const geom = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
      if (!Array.isArray(geom) || geom.length === 0) return null
      // GeoJSON coordinates are [lon, lat] → convert to [lat, lng]
      const path = geom.map(([lon, lat]) => [lat, lon] as [number, number])
      segmentCache.set(k, path)
      return path
    } catch {
      return null
    } finally {
      inflight.delete(k)
    }
  })()

  inflight.set(k, promise)
  return promise
}

export interface UseRoadRouteSegmentsResult {
  /** Road geometry per consecutive pair; null while loading or if routing failed. */
  segments: ([number, number][] | null)[]
  isLoading: boolean
  hasError: boolean
}

export function useRoadRouteSegments(waypoints: [number, number][]): UseRoadRouteSegmentsResult {
  const [segments, setSegments] = useState<([number, number][] | null)[]>(() =>
    waypoints.slice(0, -1).map((_, i) => segmentCache.get(segmentKey(waypoints[i], waypoints[i + 1])) ?? null)
  )
  const [isLoading, setIsLoading] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // waypoints must be a stable reference (memoized by the caller); the sequence
  // is fixed, so this runs once and only fills in legs that are not cached yet.
  useEffect(() => {
    let active = true
    const pairs = waypoints.slice(0, -1)
    const pending: Promise<void>[] = []
    let anyLoading = false

    pairs.forEach((_, i) => {
      const a = waypoints[i]
      const b = waypoints[i + 1]
      if (segmentCache.has(segmentKey(a, b))) return
      anyLoading = true
      const p = fetchSegment(a, b).then(path => {
        if (!active) return
        setSegments(prev => {
          if (prev[i] === path) return prev
          const next = prev.slice()
          next[i] = path
          return next
        })
      })
      pending.push(p)
    })

    setIsLoading(anyLoading)
    if (pending.length) {
      Promise.all(pending).then(() => { if (active) setIsLoading(false) })
    }

    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypoints])

  const hasError = !isLoading && segments.some(s => s === null)

  return { segments, isLoading, hasError }
}
