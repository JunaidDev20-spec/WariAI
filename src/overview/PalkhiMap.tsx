// ── PalkhiMap.tsx ─────────────────────────────────────────────────────────
// Real interactive Leaflet map showing the Palkhi route across all Mukams.
// Uses OpenStreetMap tiles — no API key required.
//
// Design decisions:
//  • Fixes the broken Leaflet default marker icon (known Vite issue).
//  • Active Mukam gets a distinct pulsing teal circle marker.
//  • All 5 Mukams connected by a Polyline in MUKAMS order.
//  • Completed segments (up to active) are teal; upcoming are grey.
//  • Map auto-fits to show all markers on first load and when active changes.
//  • Clicking a marker calls onMukamSelect so the parent can call switchMukam.
//  • PREV / NEXT buttons inside the map panel use the same callback.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from 'react'
import {
  MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { MUKAMS, ROUTE_START, ROUTE_END } from '../data/mockCommandData'
import { useRoadRouteSegments } from './useRoadRouteSegments'
import { distanceToNearestPoint } from './routeGeometry'
import PalkiMarker from './PalkiMarker'

// ── Palki live-position config (Event Overview only) ───────────────────────
// The Palki is a slow operational / live-position indicator, not a playback
// animation. Tune the whole feel from these two values:
//  • PALKI_SPEED_KMH — demo speed along the real road route (single source).
//    The original code moved at ~2200 m/s; this is dramatically slower so the
//    Palki takes a long time to crawl between Mukkams.
//  • PALKI_AUTOPLAY  — start moving (true) or hold a live snapshot (false).
const PALKI_SPEED_KMH = 8   // ~walking palanquin pace; bump to speed up
const PALKI_AUTOPLAY  = true // false = frozen live snapshot at the Lonand anchor

// Demo anchor: Lonand (Mukam 03). The Palki is initialised at the point on the
// existing calculated road route nearest to these coordinates.
const LONAND_ANCHOR: [number, number] = (() => {
  const m = MUKAMS.find(x => x.id === 'M03')
  return m ? [m.coordinates.lat, m.coordinates.lng] : [17.9558, 74.2837]
})()

// ── Fix Leaflet's broken default icon in Vite/webpack bundles ─────────────
// Leaflet tries to resolve icon URLs relative to its own CSS file,
// which breaks with module bundlers. We override the defaults explicitly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Ordered route waypoints (existing Palkhi sequence) ────────────────────
// Pune → M01..M05 → Pandharpur. Module-level constant so the routing hook
// receives a stable reference and does not refetch on every render.
const ROUTE_WAYPOINTS: [number, number][] = [
  [ROUTE_START.lat, ROUTE_START.lng],
  ...MUKAMS.map(m => [m.coordinates.lat, m.coordinates.lng] as [number, number]),
  [ROUTE_END.lat,   ROUTE_END.lng],
]

// ── Status → color map (mirrors existing design tokens) ──────────────────
const STATUS_COLOR: Record<string, string> = {
  CRITICAL: '#EF5B5B',
  HIGH:     '#F28B4B',
  WATCH:    '#E8C45A',
  STABLE:   '#2DD4A8',
}

function getMukamStatus(m: typeof MUKAMS[0]): { label: string; color: string } {
  if (m.zones.some(z => z.status === 'critical')) return { label: 'CRITICAL', color: STATUS_COLOR.CRITICAL }
  if (m.zones.some(z => z.status === 'high'))     return { label: 'HIGH',     color: STATUS_COLOR.HIGH     }
  if (m.zones.some(z => z.status === 'watch'))    return { label: 'WATCH',    color: STATUS_COLOR.WATCH    }
  return { label: 'STABLE', color: STATUS_COLOR.STABLE }
}

// ── FitBounds helper — includes Pune and Pandharpur endpoints ─────────────
function MapFitter({ activeMukamId }: { activeMukamId: string }) {
  const map = useMap()

  useEffect(() => {
    const allCoords: [number, number][] = [
      [ROUTE_START.lat, ROUTE_START.lng],
      ...MUKAMS.map(m => [m.coordinates.lat, m.coordinates.lng] as [number, number]),
      [ROUTE_END.lat,   ROUTE_END.lng],
    ]
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords)
      map.fitBounds(bounds, { padding: [48, 48] })
    }
  }, [activeMukamId, map])

  return null
}

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
  activeMukamId: string
  onMukamSelect: (mukamId: string) => void
}

// ── Style shortcuts ───────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' }

// ── Main component ────────────────────────────────────────────────────────
export default function PalkhiMap({ activeMukamId, onMukamSelect }: Props) {
  const activeIdx  = MUKAMS.findIndex(m => m.id === activeMukamId)
  const safeIdx    = activeIdx >= 0 ? activeIdx : 0
  // ── Road routing (OSRM / OpenStreetMap) ─────────────────────────────────
  // Resolves real road geometry for every consecutive leg of ROUTE_WAYPOINTS.
  const { segments } = useRoadRouteSegments(ROUTE_WAYPOINTS)

  // Each leg resolves to real road geometry; fall back to a straight line
  // (between the two endpoints) while loading or if routing fails.
  const legPath = (i: number): [number, number][] =>
    segments[i] ?? [ROUTE_WAYPOINTS[i], ROUTE_WAYPOINTS[i + 1]]

  const concat = (legs: [number, number][][]): [number, number][] =>
    legs.reduce<[number, number][]>((acc, p) => acc.concat(p), [])

  // Completed = every leg up to and including the active Mukam
  const completedPath: [number, number][] = concat(
    Array.from({ length: safeIdx + 1 }, (_, i) => legPath(i))
  )
  // Upcoming = active Mukam → next Mukam … → Pandharpur (includes current journey)
  const upcomingPath: [number, number][] = concat(
    Array.from({ length: ROUTE_WAYPOINTS.length - 1 - (safeIdx + 1) }, (_, i) => legPath(safeIdx + 1 + i))
  )
  // Faint full-route ghost for context — memoised on the route geometry so the
  // Palki's anchor distance (and animation loop) stay stable between renders.
  const allPath: [number, number][] = useMemo(
    () => concat(Array.from({ length: ROUTE_WAYPOINTS.length - 1 }, (_, i) => legPath(i))),
    [segments]
  )

  // Centre on Maharashtra / route midpoint
  const center: [number, number] = [18.0, 74.5]

  // ── Palki live-position setup ──────────────────────────────────────────
  // The Palki rides the FULL existing road route (allPath) so it always stays
  // on the road geometry. It is anchored to the route point nearest Lonand.
  const routeReady = segments.length > 0 && segments.every(s => s != null)

  // Arc-length distance (m) from route start to the point nearest Lonand.
  // Recomputed only when the route geometry changes (i.e. once roads load).
  const palkiStartDistance = useMemo(
    () => distanceToNearestPoint(allPath, LONAND_ANCHOR),
    [allPath]
  )

  // Respect prefers-reduced-motion.
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  return (
    <div style={{ borderRadius: 20, border: '1px solid #1C2520', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 18px 9px',
        background: '#0D1712',
        borderBottom: '1px solid #1C2520',
      }}>
        <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C' }}>
          PALKHI ROUTE · PUNE – PANDHARPUR
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span
              className="live-dot"
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }}
            />
            <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>POSITION</span>
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.07em', color: '#C8A96B', fontWeight: 600 }}>
              {MUKAMS.find(m => m.id === activeMukamId)?.id ?? activeMukamId}
            </span>
          </div>
        </div>
      </div>

      {/* Leaflet map — explicit height required */}
      <div style={{ position: 'relative' }}>
        <MapContainer
          center={center}
          zoom={9}
          style={{ height: 420, width: '100%' }}
          scrollWheelZoom={true}
          attributionControl={true}
        >
          {/* OpenStreetMap tiles — free, no API key */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Auto-fit bounds (includes Pune + Pandharpur) */}
          <MapFitter activeMukamId={activeMukamId} />

          {/* Full route ghost line — very faint gold for context */}
          {allPath.length > 1 && (
            <Polyline
              positions={allPath}
              pathOptions={{ color: '#C8A96B', weight: 1, opacity: 0.18, dashArray: '2 6' }}
            />
          )}

          {/* Completed route segment — teal (real roads) */}
          {completedPath.length > 1 && (
            <Polyline
              positions={completedPath}
              pathOptions={{ color: '#2DD4A8', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
            />
          )}

          {/* Upcoming route segment — grey dashed (current journey + remaining) */}
          {upcomingPath.length > 1 && (
            <Polyline
              positions={upcomingPath}
              pathOptions={{ color: '#9AA7A0', weight: 2.5, opacity: 0.45, dashArray: '8 8', lineCap: 'round' }}
            />
          )}

          {/* PUNE — start endpoint (non-operational) */}
          <CircleMarker
            center={[ROUTE_START.lat, ROUTE_START.lng]}
            radius={8}
            pathOptions={{ color: '#C8A96B', weight: 2, opacity: 0.8, fillColor: '#C8A96B', fillOpacity: 0.15 }}
          >
            <Popup closeButton={true}>
              <div style={{ fontFamily: 'Manrope, sans-serif', minWidth: 150 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>PUNE</div>
                <div style={{ fontSize: 12, color: '#555' }}>Route start point</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#888', marginTop: 4 }}>18.5204°N, 73.8567°E</div>
              </div>
            </Popup>
          </CircleMarker>

          {/* PANDHARPUR — destination endpoint (non-operational) */}
          <CircleMarker
            center={[ROUTE_END.lat, ROUTE_END.lng]}
            radius={8}
            pathOptions={{ color: '#9B8AFB', weight: 2, opacity: 0.8, fillColor: '#9B8AFB', fillOpacity: 0.15 }}
          >
            <Popup closeButton={true}>
              <div style={{ fontFamily: 'Manrope, sans-serif', minWidth: 150 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>PANDHARPUR</div>
                <div style={{ fontSize: 12, color: '#555' }}>Destination — Vithoba Temple</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#888', marginTop: 4 }}>17.6794°N, 75.3295°E</div>
              </div>
            </Popup>
          </CircleMarker>

          {/* Mukam markers */}
          {MUKAMS.map((m, i) => {
            const pos     = [m.coordinates.lat, m.coordinates.lng] as [number, number]
            const st      = getMukamStatus(m)
            const isActive = m.id === activeMukamId
            const isPast   = i < safeIdx
            const crowd    = m.zones.reduce((s, z) => s + z.crowd, 0)

            return (
              <CircleMarker
                key={m.id}
                center={pos}
                radius={isActive ? 14 : isPast ? 10 : 8}
                pathOptions={{
                  color:       isActive ? '#2DD4A8' : st.color,
                  weight:      isActive ? 3 : 2,
                  opacity:     isActive ? 1 : isPast ? 0.9 : 0.55,
                  fillColor:   isActive ? '#2DD4A8' : st.color,
                  fillOpacity: isActive ? 0.25 : 0.18,
                }}
                eventHandlers={{
                  click: () => onMukamSelect(m.id),
                }}
              >
                <Popup
                  className="wari-popup"
                  closeButton={true}
                >
                  <div style={{
                    fontFamily: 'Manrope, sans-serif',
                    minWidth: 200,
                    padding: '2px 0',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.04em' }}>
                        {m.id}
                      </span>
                      {isActive && (
                        <span style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 10, letterSpacing: '0.08em',
                          background: '#2DD4A820', color: '#1a9a7a',
                          border: '1px solid #2DD4A840', borderRadius: 6,
                          padding: '2px 7px',
                        }}>
                          CURRENT POSITION
                        </span>
                      )}
                    </div>

                    {/* Name */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{m.location}</div>

                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: st.color, display: 'inline-block',
                      }} />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: st.color, letterSpacing: '0.06em' }}>
                        {st.label}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div style={{ borderTop: '1px solid #eee', paddingTop: 7, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[
                        { label: 'Pilgrims',  value: crowd.toLocaleString() },
                        { label: 'Zones',     value: String(m.zones.length) },
                        { label: 'Coords',    value: `${m.coordinates.lat.toFixed(3)}°N, ${m.coordinates.lng.toFixed(3)}°E` },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#888', letterSpacing: '0.06em' }}>{label}</span>
                          <span style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Select button */}
                    {!isActive && (
                      <button
                        onClick={() => onMukamSelect(m.id)}
                        style={{
                          marginTop: 10, width: '100%',
                          background: '#111714', color: '#2DD4A8',
                          border: '1px solid #2DD4A840', borderRadius: 8,
                          padding: '6px 0', cursor: 'pointer',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 11, letterSpacing: '0.1em',
                        }}
                      >
                        SET AS CURRENT →
                      </button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* Palki — slow live-position indicator riding the real road route */}
          <PalkiMarker
            path={allPath}
            ready={routeReady}
            reducedMotion={reducedMotion}
            startDistance={palkiStartDistance}
            speedKmh={PALKI_SPEED_KMH}
            playing={PALKI_AUTOPLAY}
          />
        </MapContainer>
      </div>

      {/* Legend strip + Prev/Next nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap',
        padding: '9px 18px 11px',
        background: '#0D1712',
        borderTop: '1px solid #1C2520',
      }}>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { dash: false, color: '#2DD4A8', label: 'Completed' },
            { dash: true,  color: '#9AA7A0', label: 'Upcoming'  },
          ].map(({ dash, color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="16" height="4" viewBox="0 0 16 4">
                {dash
                  ? <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="1.5" strokeDasharray="4 3"/>
                  : <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
                }
              </svg>
              <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.07em', color: '#9AA7A0' }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }}/>
            <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.07em', color: '#9AA7A0' }}>Current position</span>
          </div>
        </div>

        {/* Prev / Next Mukam nav */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(9,13,11,0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid #28332D', borderRadius: 12, overflow: 'hidden',
        }}>
          <NavBtn
            label="← PREV"
            disabled={safeIdx === 0}
            onClick={() => {
              const prevIdx = ((safeIdx - 1) + MUKAMS.length) % MUKAMS.length
              onMukamSelect(MUKAMS[prevIdx].id)
            }}
          />
          <div style={{ width: 1, height: 28, background: '#28332D' }} />
          <div style={{ padding: '5px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: '#C8A96B', fontWeight: 600 }}>
              {MUKAMS[safeIdx]?.id ?? activeMukamId}
            </span>
            <span style={{ ...SANS, fontSize: '0.6875rem', color: '#9AA7A0', whiteSpace: 'nowrap' }}>
              {MUKAMS[safeIdx]?.location.split(',')[0] ?? ''}
            </span>
          </div>
          <div style={{ width: 1, height: 28, background: '#28332D' }} />
          <NavBtn
            label="NEXT →"
            disabled={safeIdx === MUKAMS.length - 1}
            onClick={() => {
              const nextIdx = (safeIdx + 1) % MUKAMS.length
              onMukamSelect(MUKAMS[nextIdx].id)
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Small nav button ──────────────────────────────────────────────────────
function NavBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.688rem', letterSpacing: '0.1em',
        padding: '7px 14px', border: 'none', background: 'none',
        color: disabled ? '#3D4F47' : '#9AA7A0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'color 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
    >
      {label}
    </button>
  )
}
