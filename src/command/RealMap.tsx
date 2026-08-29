// ── RealMap ────────────────────────────────────────────────────────────────
// Drop-in replacement for CommandMap.
// Real geographic base map (Leaflet + OpenStreetMap tiles — no API key),
// mirroring the existing PalkhiMap approach.
//
// Layer model:
//  • Real geography: OSM TileLayer + Pune→Mukams→Pandharpur Polyline +
//    5 Mukam CircleMarkers (active = teal pulse). Native Leaflet pan/zoom.
//  • Operational detail: an SVGOverlay anchored to the active Mukam's REAL
//    lat/lng, re-using CommandMap's MapContent (zones, sanitation, live
//    markers, routes, density dots). The 800×420 viewBox is stretched onto a
//    small geographic footprint around the Mukam — a render transform only,
//    no Mukam/lat-lng data is changed and no coordinates are invented/stored.
//
// All CommandMap behaviors are preserved: PREV/NEXT nav, external liveMukam
// sync, zone selection + tooltip, AI forecast card, existing dark styling.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MapContainer, TileLayer, Polyline, CircleMarker,
  SVGOverlay, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  MapContent, ZoneTooltip, MukamNav,
} from './CommandMap'
import {
  MUKAMS, ROUTE_START, ROUTE_END,
  type Mukam,
} from '../data/mockCommandData'
import type { OperationalResource } from '../data/mockResources'
import type { DeployPhase } from '../types/operations'

const FOCUS_ZOOM = 12
// Geographic footprint (render-only) the 800×420 viewBox maps onto.
const SPAN_LAT = 0.08
const SPAN_LNG = 0.155

// Mukam status → color (mirrors PalkhiMap, existing design tokens)
const STATUS_COLOR: Record<string, string> = {
  CRITICAL: '#EF5B5B',
  HIGH:     '#F28B4B',
  WATCH:    '#E8C45A',
  STABLE:   '#2DD4A8',
}
function getMukamStatus(m: Mukam): { label: string; color: string } {
  if (m.zones.some(z => z.status === 'critical')) return { label: 'CRITICAL', color: STATUS_COLOR.CRITICAL }
  if (m.zones.some(z => z.status === 'high'))     return { label: 'HIGH',     color: STATUS_COLOR.HIGH }
  if (m.zones.some(z => z.status === 'watch'))    return { label: 'WATCH',    color: STATUS_COLOR.WATCH }
  return { label: 'STABLE', color: STATUS_COLOR.STABLE }
}

// ── Map bounds for the SVG overlay (render transform only) ─────────────────
function mukamBounds(m: Mukam): L.LatLngBounds {
  const { lat, lng } = m.coordinates
  return L.latLngBounds([
    [lat - SPAN_LAT / 2, lng - SPAN_LNG / 2],
    [lat + SPAN_LAT / 2, lng + SPAN_LNG / 2],
  ])
}

// ── Fly to active Mukam when it changes (replaces SVG cinematic transition) ─
function MapFocus({ mukamId }: { mukamId: string }) {
  const map = useMap()
  useEffect(() => {
    const m = MUKAMS.find(x => x.id === mukamId)
    if (m) map.flyTo([m.coordinates.lat, m.coordinates.lng], FOCUS_ZOOM, { duration: 0.8 })
  }, [mukamId, map])
  return null
}

// ── Capture the map instance for the RESET control ──────────────────────────
function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => { mapRef.current = map }, [map])
  return null
}

// ── Zoom controls (custom dark style, replaces Leaflet default) ────────────
function MapControls({ onReset }: { onReset: () => void }) {
  const map = useMap()
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, background: 'rgba(11,20,16,0.92)',
    border: '1px solid #28332D', borderRadius: 10, cursor: 'pointer',
    color: '#9AA7A0', fontFamily: 'Manrope,sans-serif', fontSize: '1.1rem',
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    userSelect: 'none',
  } as React.CSSProperties
  const enter = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.assign(e.currentTarget.style, { background: 'rgba(45,212,168,0.1)', color: '#2DD4A8', borderColor: 'rgba(45,212,168,0.3)' })
  }
  const leave = (e: React.MouseEvent<HTMLButtonElement>) => {
    Object.assign(e.currentTarget.style, { background: 'rgba(11,20,16,0.92)', color: '#9AA7A0', borderColor: '#28332D' })
  }
  return (
    <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 4, zIndex: 20 }}>
      <button onClick={() => map.zoomIn()} style={base} onMouseEnter={enter} onMouseLeave={leave}>+</button>
      <button onClick={() => map.zoomOut()} style={base} onMouseEnter={enter} onMouseLeave={leave}>−</button>
      <div style={{ height: 1, background: '#28332D', margin: '2px 0' }} />
      <button onClick={onReset} style={{ ...base, height: 26, fontSize: '0.6rem', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }} onMouseEnter={enter} onMouseLeave={leave}>RESET</button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
interface RealMapProps {
  selectedZoneId: string | null
  onZoneSelect: (id: string | null) => void
  showDeployRoute?: boolean
  onMukamChange?: (mukam: Mukam) => void
  liveMukam?: Mukam
  deployPhase?: DeployPhase
  deployedResources?: OperationalResource[]
}

export default function RealMap({
  selectedZoneId, onZoneSelect, showDeployRoute = false,
  onMukamChange, liveMukam,
}: RealMapProps) {
  const [mukamIndex, setMukamIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const mapRef = useRef<L.Map | null>(null)

  const displayMukam = MUKAMS[displayIndex]
  const contentMukam = (liveMukam && liveMukam.id === displayMukam.id)
    ? liveMukam
    : displayMukam

  // ── PREV / NEXT (non-wrapping, mirrors CommandMap behaviour) ───────────
  const goTo = useCallback((toIndex: number) => {
    const clamped = Math.max(0, Math.min(toIndex, MUKAMS.length - 1))
    if (clamped === mukamIndex) return
    setDisplayIndex(clamped)
    setMukamIndex(clamped)
    onZoneSelect(null)
    onMukamChange?.(MUKAMS[clamped])
  }, [mukamIndex, onZoneSelect, onMukamChange])

  // ── Sync when external nav changes liveMukam (top bar / overview) ───────
  useEffect(() => {
    if (!liveMukam) return
    const idx = MUKAMS.findIndex(m => m.id === liveMukam.id)
    if (idx < 0 || idx === mukamIndex) return
    setMukamIndex(idx)
    setDisplayIndex(idx)
  }, [liveMukam?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedZone = contentMukam.zones.find(z => z.id === selectedZoneId) ?? null

  // ── Route polyline: Pune → M01..M05 → Pandharpur ───────────────────────
  const routeCoords: [number, number][] = [
    [ROUTE_START.lat, ROUTE_START.lng],
    ...MUKAMS.map(m => [m.coordinates.lat, m.coordinates.lng] as [number, number]),
    [ROUTE_END.lat, ROUTE_END.lng],
  ]

  const activeIdx = MUKAMS.findIndex(m => m.id === contentMukam.id)

  return (
    <div className="cc-map-enter" style={{
      position: 'relative', background: '#0B1410',
      borderRadius: 28, border: '1px solid #28332D',
      overflow: 'hidden', height: '100%', minHeight: 420,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header bar — identical to CommandMap */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 18px', background: 'rgba(11,20,16,0.92)',
        borderBottom: '1px solid #1C2520', flexShrink: 0, zIndex: 20, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F3F6F4' }}>
            {displayMukam.name}
          </div>
          <div style={{ width: 1, height: 14, background: '#1C2520' }} />
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.13em', color: '#66736C' }}>
            {displayMukam.id} · {displayMukam.location}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { color: '#2DD4A8', label: 'Live',     dash: false },
            { color: '#9B8AFB', label: 'Forecast', dash: true  },
            { color: '#C8A96B', label: 'Terrain',  dash: false },
          ].map(({ color, label, dash }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="4" viewBox="0 0 14 4">
                {dash ? <line x1="0" y1="2" x2="14" y2="2" stroke={color} strokeWidth="1.5" strokeDasharray="3 2.5" />
                       : <line x1="0" y1="2" x2="14" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />}
              </svg>
              <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0' }}>{label}</span>
            </div>
          ))}
          <div style={{ width: 1, height: 14, background: '#1C2520' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.1em', color: '#2DD4A8', border: '1px solid rgba(45,212,168,0.3)', borderRadius: 6, padding: '2px 8px' }}>LIVE</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <MapContainer
          center={[displayMukam.coordinates.lat, displayMukam.coordinates.lng]}
          zoom={FOCUS_ZOOM}
          zoomControl={false}
          scrollWheelZoom={true}
          attributionControl={true}
          style={{ height: '100%', width: '100%', background: '#0B1410' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapFocus mukamId={contentMukam.id} />
          <MapRefCapture mapRef={mapRef} />
          <MapControls onReset={() => {
            const m = MUKAMS.find(x => x.id === contentMukam.id) ?? MUKAMS[0]
            if (mapRef.current) mapRef.current.setView([m.coordinates.lat, m.coordinates.lng], FOCUS_ZOOM)
          }} />

          {/* Macro route — Pune → Mukams → Pandharpur */}
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#C8A96B', weight: 1, opacity: 0.18, dashArray: '2 6' }}
          />

          {/* All Mukam markers (geographic context) */}
          {MUKAMS.map((m, i) => {
            const isActive = m.id === contentMukam.id
            const st = getMukamStatus(m)
            return (
              <CircleMarker
                key={m.id}
                center={[m.coordinates.lat, m.coordinates.lng]}
                radius={isActive ? 13 : i < activeIdx ? 9 : 7}
                pathOptions={{
                  color: isActive ? '#2DD4A8' : st.color,
                  weight: isActive ? 3 : 2,
                  opacity: isActive ? 1 : 0.6,
                  fillColor: isActive ? '#2DD4A8' : st.color,
                  fillOpacity: isActive ? 0.28 : 0.18,
                }}
              />
            )
          })}

          {/* Operational detail overlay — re-uses CommandMap's MapContent.
              bounds keyed by Mukam so it re-anchors on navigation. */}
          <SVGOverlay
            key={contentMukam.id}
            bounds={mukamBounds(contentMukam)}
            attributes={{ viewBox: '0 0 800 420', preserveAspectRatio: 'none' }}
          >
            <defs>
              <style>{`
                @keyframes critGlow  { 0%,100%{opacity:.13}  50%{opacity:.28} }
                @keyframes dashMove  { from{stroke-dashoffset:20} to{stroke-dashoffset:0} }
                @keyframes routeAnim { from{stroke-dashoffset:40} to{stroke-dashoffset:0} }
                @keyframes ringPulse { 0%{r:8;opacity:.2} 80%{r:22;opacity:0} 100%{r:22;opacity:0} }
                @keyframes deployPath{ from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
                .crit-glow  { animation: critGlow  3.4s ease-in-out infinite; }
                .dash-move  { animation: dashMove  1.6s linear infinite; stroke-dasharray:8 6; }
                .route-anim { animation: routeAnim 2s   linear infinite; stroke-dasharray:10 8; }
                .ring-pulse { animation: ringPulse 2.6s ease-out  infinite; }
                .deploy-path{ animation: deployPath 1.2s ease-out forwards; stroke-dasharray:600; }
                @media(prefers-reduced-motion:reduce){
                  .crit-glow,.dash-move,.route-anim,.ring-pulse,.deploy-path{animation:none;stroke-dashoffset:0;opacity:1;}
                }
              `}</style>
              <radialGradient id="terrainAmb" cx="30%" cy="75%" r="50%">
                <stop offset="0%" stopColor="#C8A96B" stopOpacity="0.055"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <radialGradient id="critAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EF5B5B" stopOpacity="1"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
              <radialGradient id="highAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#F28B4B" stopOpacity="1"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
            <MapContent
              mukam={contentMukam}
              selectedZoneId={selectedZoneId}
              onZoneSelect={onZoneSelect}
              showDeployRoute={showDeployRoute}
              opacity={1}
            />
          </SVGOverlay>
        </MapContainer>

        {/* Zone tooltip (reuses CommandMap's component) */}
        {selectedZone && (
          <ZoneTooltip zone={selectedZone} onClose={() => onZoneSelect(null)} />
        )}

        {/* AI forecast card */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(9,13,11,0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(155,138,251,0.22)',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          zIndex: 10, minWidth: 148, pointerEvents: 'none',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.15em', color: '#9B8AFB', textTransform: 'uppercase' }}>AI // Forecast</div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#9B8AFB', lineHeight: 1, letterSpacing: '-0.01em' }}>{contentMukam.alert.timeToEvent} min</div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>to critical threshold</div>
        </div>

        {/* PREV / NEXT nav (reuses CommandMap's component) */}
        <MukamNav
          mukams={MUKAMS}
          currentIndex={mukamIndex}
          isTransitioning={false}
          onPrev={() => goTo(mukamIndex - 1)}
          onNext={() => goTo(mukamIndex + 1)}
        />
      </div>
    </div>
  )
}
