// ── PalkiMarker.tsx ────────────────────────────────────────────────────────
// Animated Palki (pilgrimage palanquin) marker for the Event Overview map.
//
// It travels along the EXISTING road-route geometry (the full Pune → Pandharpur
// route returned by useRoadRouteSegments) — never a straight line and never a
// separately invented path.
//
// Behaviour (deliberately slow / operational):
//  • The marker is anchored to a real point on the route via `startDistance`
//    (default: the Lonand demo position, computed from the route geometry).
//  • Movement is constant-speed, interpolated by arc-length, so it reads as a
//    live operational indicator rather than a playback animation.
//  • Speed is a single configurable value (PALKI_SPEED_KMH) — no hard-coded
//    timing scattered through the component.
//  • Default state is PAUSED (a live snapshot at the anchor point). Set
//    `playing` to true (or flip PALKI_AUTOPLAY in PalkhiMap) to creep slowly.
//  • The marker is updated imperatively (no React re-render per frame).
//  • Cleanup cancels the rAF and removes the Leaflet marker on unmount / when
//    the route or parameters change.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  cumulativeLengths,
  positionAtDistance,
  type RoutePosition,
} from './routeGeometry'

interface Props {
  /** [lat, lng] FULL road geometry (Pune → … → Pandharpur). */
  path: [number, number][]
  /** True once real road geometry is available; marker holds position until then. */
  ready: boolean
  reducedMotion: boolean
  /** Arc-length distance (m) from route start where the Palki is anchored. */
  startDistance: number
  /** Demo speed in km/h (single source of truth). */
  speedKmh: number
  /** When true the Palki slowly advances along the route. */
  playing: boolean
  /** Called once when the Palki reaches the end of the route. */
  onArrive?: () => void
}

// Teal command-centre disc with a directional pointer.
const ICON_HTML = `<div class="palki-pin" style="width:30px;height:30px;will-change:transform;">
  <svg width="30" height="30" viewBox="0 0 30 30" style="display:block;overflow:visible">
    <circle cx="15" cy="15" r="11" fill="rgba(11,20,16,0.92)" stroke="#2DD4A8" stroke-width="2"/>
    <circle cx="15" cy="15" r="3.5" fill="#2DD4A8"/>
    <path d="M15 1.5 L19.5 9 L10.5 9 Z" fill="#2DD4A8"/>
  </svg>
</div>`

export default function PalkiMarker({
  path,
  ready,
  reducedMotion,
  startDistance,
  speedKmh,
  playing,
  onArrive,
}: Props) {
  const map = useMap()
  // Keep latest onArrive without restarting the animation effect.
  const onArriveRef = useRef(onArrive)
  onArriveRef.current = onArrive

  useEffect(() => {
    if (!path || path.length < 2) return

    // Precompute cumulative arc-length so traversal speed is constant.
    const cum = cumulativeLengths(path)
    const total = cum[cum.length - 1] || 1
    const start = Math.max(0, Math.min(startDistance, total))

    // Anchor the marker at the configured route position.
    let pos: RoutePosition = positionAtDistance(path, cum, start)
    const marker = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({
        className: 'palki-marker',
        html: ICON_HTML,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
      zIndexOffset: 1000,
      interactive: false,
    })
    marker.addTo(map)

    const applyRotation = (deg: number) => {
      const el = marker.getElement()?.firstElementChild as HTMLElement | null
      if (el) el.style.transform = `rotate(${deg}deg)`
    }
    applyRotation(pos.bearingDeg)

    // Paused / reduced-motion / geometry-not-ready → hold the position.
    if (reducedMotion || !ready || !playing) {
      return () => { map.removeLayer(marker) }
    }

    // Metres per second from the configurable km/h value.
    const speedMs = (speedKmh > 0 ? speedKmh : 1) * (1000 / 3600)
    let raf = 0
    let arrived = false
    const t0 = performance.now()

    const frame = (now: number) => {
      const elapsedMs = now - t0
      const dist = start + (elapsedMs / 1000) * speedMs
      const d = Math.min(dist, total)
      pos = positionAtDistance(path, cum, d)
      marker.setLatLng([pos.lat, pos.lng])
      applyRotation(pos.bearingDeg)

      if (dist >= total) {
        if (!arrived) {
          arrived = true
          onArriveRef.current?.()
        }
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      map.removeLayer(marker)
    }
  }, [path, ready, reducedMotion, startDistance, speedKmh, playing, map])

  return null
}
