// ── CommandMap ────────────────────────────────────────────────────────────
// Interactive SVG spatial map.
// Pan: left-mouse-button hold + drag only.
// Zoom: mouse wheel (cursor-centered) + +/−/RESET buttons.
// Mukam nav: PREV/NEXT with 3-phase cinematic transition.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import MonoTag from '../components/MonoTag'
import { useMapInteraction } from '../hooks/useMapInteraction'
import ResponseRoute from '../components/ResponseRoute'
import {
  MUKAMS, STATUS_COLORS,
  type Zone, type SanitationPoint, type Mukam,
} from '../data/mockCommandData'
import type { OperationalResource } from '../data/mockResources'
import type { DeployPhase } from '../types/operations'

type TransitionPhase = 'idle' | 'zoom-out' | 'travel' | 'zoom-in'

// SVG viewBox dimensions
const VW = 800
const VH = 420

// Terrain contour paths — shared atmosphere layer
const CONTOURS = [
  'M 40 370 C 95 338,168 308,252 328 C 336 348,398 316,478 294 C 558 272,638 244,740 232',
  'M 22 408 C 78 382,155 348,242 368 C 328 388,390 358,470 334 C 550 310,630 284,740 270',
  'M 8  446 C 65 424,140 392,228 412 C 316 432,378 402,458 376 C 538 350,618 324,740 308',
  'M 58 332 C 114 298,186 268,270 288 C 352 308,414 274,494 254 C 574 234,652 208,740 196',
  'M 78 294 C 135 260,205 234,290 252 C 372 270,432 240,512 220 C 592 200,668 178,740 166',
]

// ── Sub-components ────────────────────────────────────────────────────────

function SanitationIcon({ sp }: { sp: SanitationPoint }) {
  const color = sp.status === 'operational' ? '#2DD4A8'
              : sp.status === 'at_capacity' ? '#E8C45A' : '#66736C'
  const s = 7
  if (sp.type === 'mobile_unit') return (
    <g>
      <rect x={sp.x - s} y={sp.y - s * 0.8} width={s * 2} height={s * 1.6}
        rx={s * 0.5} fill={`${color}18`} stroke={color} strokeWidth="1.2" />
      <circle cx={sp.x - s * 0.4} cy={sp.y + s * 0.9} r={s * 0.3} fill={color} opacity="0.7" />
      <circle cx={sp.x + s * 0.4} cy={sp.y + s * 0.9} r={s * 0.3} fill={color} opacity="0.7" />
      <text x={sp.x} y={sp.y + s * 2.6} textAnchor="middle"
        fontFamily="IBM Plex Mono,monospace" fontSize="8" fill={color} opacity="0.85" letterSpacing="0.04em">
        {sp.label}
      </text>
    </g>
  )
  if (sp.type === 'toilet_cluster') return (
    <g>
      <circle cx={sp.x} cy={sp.y} r={s} fill={`${color}14`} stroke={color} strokeWidth="1.2" />
      <text x={sp.x} y={sp.y + 3} textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="7" fill={color} opacity="0.9">TC</text>
      <text x={sp.x} y={sp.y + s + 12} textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="8" fill={color} opacity="0.75" letterSpacing="0.04em">{sp.label}</text>
    </g>
  )
  return (
    <g>
      <polygon points={`${sp.x},${sp.y - s} ${sp.x + s * 0.87},${sp.y + s * 0.5} ${sp.x - s * 0.87},${sp.y + s * 0.5}`}
        fill={`${color}14`} stroke={color} strokeWidth="1.2" />
      <text x={sp.x} y={sp.y + s + 12} textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="8" fill={color} opacity="0.75" letterSpacing="0.04em">{sp.label}</text>
    </g>
  )
}

function ZoneTooltip({ zone, onClose }: { zone: Zone; onClose: () => void }) {
  const c = STATUS_COLORS[zone.status]
  return (
    <div style={{
      position: 'absolute', bottom: 60, left: 16,
      background: 'rgba(9,13,11,0.93)', backdropFilter: 'blur(20px)',
      border: `1px solid ${c.stroke}40`, borderRadius: 14,
      padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10,
      minWidth: 190, maxWidth: 220, zIndex: 20,
      animation: 'ccFadeUp 0.2s ease both',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.06em', color: c.text, fontWeight: 600 }}>{zone.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: c.glow, borderRadius: 8, padding: '2px 8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.stroke, display: 'inline-block' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.08em', color: c.text }}>{zone.status.toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#66736C', fontSize: '0.875rem', lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      </div>
      {[
        { label: 'Current load', value: `${zone.currentLoad}%`,   color: zone.currentLoad > 80 ? '#F28B4B' : '#F3F6F4' },
        { label: 'Predicted',    value: `${zone.predictedLoad}%`, color: zone.predictedLoad > 100 ? '#EF5B5B' : zone.predictedLoad > 85 ? '#F28B4B' : c.text },
        { label: 'Crowd',        value: zone.crowd.toLocaleString(), color: '#F3F6F4' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>{label}</span>
          <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.875rem', color }}>{value}</span>
        </div>
      ))}
      <div style={{ height: 4, background: '#1C2520', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(zone.currentLoad, 100)}%`, height: '100%', background: `linear-gradient(90deg,${c.stroke}88,${c.stroke})`, borderRadius: 999 }} />
      </div>
    </div>
  )
}

function MapControls({ onZoomIn, onZoomOut, onReset }: { onZoomIn: () => void; onZoomOut: () => void; onReset: () => void }) {
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
      <button onClick={e => { e.stopPropagation(); onZoomIn() }} style={base} onMouseEnter={enter} onMouseLeave={leave}>+</button>
      <button onClick={e => { e.stopPropagation(); onZoomOut() }} style={base} onMouseEnter={enter} onMouseLeave={leave}>−</button>
      <div style={{ height: 1, background: '#28332D', margin: '2px 0' }} />
      <button onClick={e => { e.stopPropagation(); onReset() }} style={{ ...base, height: 26, fontSize: '0.6rem', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }} onMouseEnter={enter} onMouseLeave={leave}>RESET</button>
    </div>
  )
}

function MukamNav({ mukams, currentIndex, isTransitioning, onPrev, onNext }: {
  mukams: Mukam[]; currentIndex: number; isTransitioning: boolean; onPrev: () => void; onNext: () => void
}) {
  const current = mukams[currentIndex]
  const hasPrev = true  // always enabled — loops
  const hasNext = true  // always enabled — loops
  const btnStyle = (enabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'none', border: 'none',
    fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
    letterSpacing: '0.1em', padding: '6px 14px',
    color: enabled ? '#9AA7A0' : '#3D4F47',
    cursor: enabled && !isTransitioning ? 'pointer' : 'not-allowed',
    transition: 'color 0.15s ease',
    whiteSpace: 'nowrap' as const,
  })
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center',
      background: 'rgba(9,13,11,0.92)', backdropFilter: 'blur(18px)',
      border: '1px solid #28332D', borderRadius: 14, overflow: 'hidden',
      zIndex: 20, opacity: isTransitioning ? 0.5 : 1,
      pointerEvents: isTransitioning ? 'none' : 'auto',
      transition: 'opacity 0.25s ease',
    }}>
      <button disabled={!hasPrev || isTransitioning} onClick={e => { e.stopPropagation(); onPrev() }} style={btnStyle(hasPrev)}
        onMouseEnter={e => { if (hasPrev) e.currentTarget.style.color = '#F3F6F4' }}
        onMouseLeave={e => { if (hasPrev) e.currentTarget.style.color = '#9AA7A0' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        PREV
      </button>
      <div style={{ width: 1, height: 32, background: '#28332D' }} />
      <div style={{ padding: '6px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.08em', color: '#C8A96B', fontWeight: 600 }}>{current.id}</div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0', whiteSpace: 'nowrap' }}>{current.location}</div>
      </div>
      <div style={{ width: 1, height: 32, background: '#28332D' }} />
      <button disabled={!hasNext || isTransitioning} onClick={e => { e.stopPropagation(); onNext() }} style={btnStyle(hasNext)}
        onMouseEnter={e => { if (hasNext) e.currentTarget.style.color = '#F3F6F4' }}
        onMouseLeave={e => { if (hasNext) e.currentTarget.style.color = '#9AA7A0' }}>
        NEXT
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

function TransitionOverlay({ phase, from, to }: { phase: TransitionPhase; from: Mukam; to: Mukam }) {
  if (phase === 'idle') return null
  const path = from.transitionPath ?? 'M 60 210 C 200 195, 400 182, 620 172 C 710 168, 770 168, 800 168'
  const visible = phase === 'travel'
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
      opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease' }}>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        <defs>
          <style>{`
            @keyframes travelLine { from { stroke-dashoffset:900 } to { stroke-dashoffset:0 } }
            .t-path { stroke-dasharray:900; animation: travelLine 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
            @media(prefers-reduced-motion:reduce){ .t-path{animation:none;stroke-dashoffset:0;} }
          `}</style>
          <radialGradient id="tvGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2DD4A8" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
        </defs>
        <g fill="none" stroke="#C8A96B" strokeWidth="0.6" opacity="0.18">
          <path d="M 0 110 C 200 98, 400 118, 600 102 C 700 94, 760 105, 800 99" />
          <path d="M 0 165 C 200 153, 400 173, 600 157 C 700 149, 760 161, 800 154" />
          <path d="M 0 345 C 200 335, 400 353, 600 337 C 700 329, 760 341, 800 334" />
        </g>
        <rect x="0" y="148" width="800" height="124" fill="url(#tvGlow)" />
        <path d={path} fill="none" stroke="#2DD4A8" strokeWidth="5" opacity="0.06" strokeLinecap="round" />
        <path className="t-path" d={path} fill="none" stroke="#2DD4A8" strokeWidth="2" opacity="0.75" strokeLinecap="round" />
        <path d={path} fill="none" stroke="#2DD4A8" strokeWidth="1" opacity="0.25" strokeDasharray="4 14" strokeLinecap="round" />
        <circle cx="100" cy="210" r="5" fill="#2DD4A8" opacity="0.7" />
        <text x="100" y="199" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#2DD4A8" opacity="0.85" letterSpacing="0.07em">{from.id}</text>
        <circle cx="700" cy="165" r="5" fill="#9B8AFB" opacity="0.7" />
        <text x="700" y="154" textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#9B8AFB" opacity="0.85" letterSpacing="0.07em">{to.id}</text>
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.2em', color: '#66736C' }}>TRAVELLING TO</div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.25rem', color: '#C8A96B', letterSpacing: '0.08em' }}>{to.id}</div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>{to.location}</div>
      </div>
    </div>
  )
}

// ── Map content (rendered inside the SVG transform group) ─────────────────

function MapContent({ mukam, selectedZoneId, onZoneSelect, showDeployRoute, opacity }: {
  mukam: Mukam; selectedZoneId: string | null
  onZoneSelect: (id: string | null) => void; showDeployRoute: boolean; opacity: number
}) {
  return (
    <g opacity={opacity} style={{ transition: 'opacity 0.3s ease' }}>
      <rect width={VW} height={VH} fill="url(#terrainAmb)" />
      <g stroke="#2DD4A8" strokeWidth="0.3" opacity="0.07">
        {[100,200,300,400,500,600,700].map(x => <line key={`vx${x}`} x1={x} y1="0" x2={x} y2={VH} />)}
        {[84,168,252,336].map(y => <line key={`hy${y}`} x1="0" y1={y} x2={VW} y2={y} />)}
      </g>
      <g fill="none" stroke="#C8A96B" strokeWidth="0.8" opacity="0.16">
        {CONTOURS.map((d, i) => <path key={i} d={d} />)}
      </g>
      <g fill="none" stroke="#9AA7A0" strokeWidth="0.5" opacity="0.08">
        <path d="M 0 190 C 100 180,200 200,310 184 C 420 168,520 188,630 172 C 720 158,780 166,800 162"/>
        <path d="M 0 248 C 110 238,220 258,330 242 C 440 226,540 246,640 230 C 730 216,780 222,800 218"/>
        <path d="M 0 144 C 120 132,250 152,380 136 C 500 120,610 140,720 124 C 770 117,800 120,800 120"/>
      </g>

      {mukam.densityDots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#2DD4A8" opacity={d.op} />
      ))}

      {mukam.routes.filter(r => r.type === 'secondary').map(r => (
        <path key={r.id} d={r.path} fill="none" stroke="#9AA7A0" strokeWidth="1" strokeDasharray="4 4" opacity="0.18" strokeLinecap="round" />
      ))}

      {mukam.routes.filter(r => r.type === 'live').map(r => {
        const col = r.congestion === 'high' ? '#F28B4B' : r.congestion === 'elevated' ? '#E8C45A' : '#2DD4A8'
        return (
          <g key={r.id}>
            <path d={r.path} fill="none" stroke={col} strokeWidth="4" opacity="0.06" strokeLinecap="round" />
            <path d={r.path} fill="none" stroke={col} strokeWidth="1.8" opacity="0.5" strokeLinecap="round" />
            <path className="route-anim" d={r.path} fill="none" stroke={col} strokeWidth="1.8" opacity="0.78" strokeLinecap="round" />
          </g>
        )
      })}

      {mukam.routes.filter(r => r.type === 'forecast').map(r => (
        <g key={r.id}>
          <path d={r.path} fill="none" stroke="#9B8AFB" strokeWidth="3" opacity="0.05" strokeLinecap="round" />
          <path className="dash-move" d={r.path} fill="none" stroke="#9B8AFB" strokeWidth="1.6" opacity="0.65" strokeLinecap="round" />
        </g>
      ))}

      {showDeployRoute && (
        <path className="deploy-path" d="M 175 195 C 230 210,280 232,330 246 C 342 250,352 254,358 258"
          fill="none" stroke="#2DD4A8" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      )}

      {mukam.zones.map(z => {
        const c = STATUS_COLORS[z.status]
        const isSelected = z.id === selectedZoneId
        const isDimmed   = selectedZoneId !== null && !isSelected
        return (
          <g key={z.id} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); onZoneSelect(z.id === selectedZoneId ? null : z.id) }}>
            {z.status === 'critical' && <ellipse className="crit-glow" cx={z.cx} cy={z.cy} rx={z.rx+34} ry={z.ry+26} fill="url(#critAura)" />}
            {z.status === 'high'     && <ellipse cx={z.cx} cy={z.cy} rx={z.rx+20} ry={z.ry+15} fill="url(#highAura)" opacity="0.08" />}
            <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
              fill={c.fill} stroke={c.stroke}
              strokeWidth={isSelected ? 2 : 1.3}
              strokeDasharray={isSelected || z.status === 'critical' ? 'none' : '5 3'}
              opacity={isDimmed ? 0.35 : 1}
            />
            {isSelected && (
              <>
                <ellipse cx={z.cx} cy={z.cy} rx={z.rx+13} ry={z.ry+10} fill="none" stroke={c.stroke} strokeWidth="0.8" strokeDasharray="4 7" opacity="0.35" />
                <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry} fill={c.stroke} opacity="0.04" />
              </>
            )}
            <text x={z.cx} y={z.cy - z.ry - 9} textAnchor="middle" fontFamily="IBM Plex Mono,monospace" fontSize="9.5" fontWeight="500" letterSpacing="0.07em" fill={c.text} opacity={isDimmed ? 0.3 : 0.92}>{z.label}</text>
            <text x={z.cx} y={z.cy + 5} textAnchor="middle" fontFamily="Manrope,sans-serif" fontSize="11" fontWeight="700" fill={c.text} opacity={isDimmed ? 0.2 : 0.5}>{z.currentLoad}%</text>
            <g stroke={c.stroke} strokeWidth="0.9" opacity={isDimmed ? 0.12 : 0.35}>
              <line x1={z.cx} y1={z.cy-6} x2={z.cx} y2={z.cy+6} />
              <line x1={z.cx-6} y1={z.cy} x2={z.cx+6} y2={z.cy} />
            </g>
          </g>
        )
      })}

      {mukam.liveMarkers.map((m, i) => (
        <g key={i}>
          <circle className="ring-pulse" cx={m.x} cy={m.y} r="8" fill="#2DD4A8" style={{ animationDelay: `${m.delay}s` }} />
          <circle cx={m.x} cy={m.y} r={m.intensity==='high'?4.5:m.intensity==='medium'?3.5:2.5} fill="#2DD4A8" opacity="0.88" />
          <circle cx={m.x} cy={m.y} r={m.intensity==='high'?2:1.5} fill="#090D0B" opacity="0.9" />
        </g>
      ))}

      {mukam.sanitationPoints.map(sp => <SanitationIcon key={sp.id} sp={sp} />)}

      <text x="16" y="413" fontFamily="IBM Plex Mono,monospace" fontSize="9" fill="#9AA7A0" opacity="0.22" letterSpacing="0.05em">
        {mukam.coordinates.lat.toFixed(4)}° N · {mukam.coordinates.lng.toFixed(4)}° E
      </text>
    </g>
  )
}

// ── Main export ───────────────────────────────────────────────────────────

interface CommandMapProps {
  selectedZoneId: string | null
  onZoneSelect: (id: string | null) => void
  showDeployRoute?: boolean
  onMukamChange?: (mukam: Mukam) => void
  liveMukam?: Mukam
  deployPhase?: DeployPhase
  deployedResources?: OperationalResource[]
}

export default function CommandMap({ selectedZoneId, onZoneSelect, showDeployRoute = false, onMukamChange, liveMukam, deployPhase = 'idle', deployedResources = [] }: CommandMapProps) {

  // ── Mukam / transition state ──────────────────────────────────────────
  const [mukamIndex,   setMukamIndex]   = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const [transFrom, setTransFrom] = useState(0)
  const [transTo,   setTransTo]   = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const isTransitioning = phase !== 'idle'

  // ── Map interaction hook ──────────────────────────────────────────────
  const { transform, isDragging, containerRef, svgRef, zoomIn, zoomOut, resetTransform, animateTo, cursor, didDragRef }
    = useMapInteraction({ minScale: 0.65, maxScale: 2.8, zoomStep: 0.25 })

  const { scale, tx, ty } = transform

  // Center-pivot transform: zoom around SVG center (400, 210)
  const cx = VW / 2, cy = VH / 2
  const svgTransform = `translate(${cx + tx},${cy + ty}) scale(${scale}) translate(${-cx},${-cy})`

  const displayMukam = MUKAMS[displayIndex]
  // For content rendering (zones, AI card), prefer the live-updated version
  // so zone statuses reflect simulation data. Falls back to static if not provided.
  const contentMukam = (liveMukam && liveMukam.id === displayMukam.id)
    ? liveMukam
    : displayMukam

  // ── Cinematic Mukam transition ────────────────────────────────────────
  const startTransition = useCallback((toIndex: number) => {
    if (isTransitioning) return

    // Wrap around — loop through all mukams
    const wrappedIndex = ((toIndex % MUKAMS.length) + MUKAMS.length) % MUKAMS.length

    const fromIndex = mukamIndex
    timers.current.forEach(clearTimeout)
    timers.current = []

    setTransFrom(fromIndex)
    setTransTo(wrappedIndex)

    // Phase 1: zoom out (0–500ms)
    setPhase('zoom-out')
    animateTo({ scale: 0.5, tx: 0, ty: 0 }, 480)

    // Phase 2: show travel overlay (500ms)
    timers.current.push(setTimeout(() => {
      setPhase('travel')
    }, 500))

    // Phase 3: swap data, zoom back in (1100ms)
    timers.current.push(setTimeout(() => {
      setDisplayIndex(wrappedIndex)
      setMukamIndex(wrappedIndex)
      onZoneSelect(null)
      setPhase('zoom-in')
      animateTo({ scale: 1, tx: 0, ty: 0 }, 500)
      onMukamChange?.(MUKAMS[wrappedIndex])
    }, 1100))

    // Phase 4: idle (1620ms)
    timers.current.push(setTimeout(() => {
      setPhase('idle')
    }, 1620))
  }, [isTransitioning, mukamIndex, animateTo, onZoneSelect, onMukamChange])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // ── Zone click ────────────────────────────────────────────────────────
  // The SVG onClick fires after pointerup — check didDragRef to suppress
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (didDragRef.current.moved) return
    onZoneSelect(null)
  }, [didDragRef, onZoneSelect])

  const selectedZone = contentMukam.zones.find(z => z.id === selectedZoneId) ?? null
  const contentOpacity = phase === 'travel' ? 0.12 : 1

  return (
    <div className="cc-map-enter" style={{
      position: 'relative', background: '#0B1410',
      borderRadius: 28, border: '1px solid #28332D',
      overflow: 'hidden', height: '100%', minHeight: 420,
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header bar */}
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
          <MonoTag color="teal">LIVE</MonoTag>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          position: 'relative', flex: 1,
          cursor: isTransitioning ? 'default' : cursor,
          userSelect: 'none', overflow: 'hidden',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0 }}
          onClick={handleCanvasClick}
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
            <radialGradient id="vignette" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="transparent"/>
              <stop offset="100%" stopColor="#0B1410" stopOpacity="0.55"/>
            </radialGradient>
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

          <rect width={VW} height={VH} fill="#0B1410" />

          <g transform={svgTransform}>
            <MapContent
              mukam={contentMukam}
              selectedZoneId={selectedZoneId}
              onZoneSelect={id => { if (!didDragRef.current.moved) onZoneSelect(id) }}
              showDeployRoute={showDeployRoute}
              opacity={contentOpacity}
            />
          </g>

          <rect width={VW} height={VH} fill="url(#vignette)" style={{ pointerEvents: 'none' }} />
        </svg>

        {/* Overlays */}
        <TransitionOverlay phase={phase} from={MUKAMS[transFrom]} to={MUKAMS[transTo]} />

        <MapControls onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={resetTransform} />

        {selectedZone && !isTransitioning && (
          <ZoneTooltip zone={selectedZone} onClose={() => onZoneSelect(null)} />
        )}

        {/* AI forecast card */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(9,13,11,0.9)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(155,138,251,0.22)',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          zIndex: 10, minWidth: 148,
          opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.15em', color: '#9B8AFB', textTransform: 'uppercase' }}>AI // Forecast</div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#9B8AFB', lineHeight: 1, letterSpacing: '-0.01em' }}>{contentMukam.alert.timeToEvent} min</div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>to critical threshold</div>
        </div>

        <MukamNav
          mukams={MUKAMS}
          currentIndex={mukamIndex}
          isTransitioning={isTransitioning}
          onPrev={() => startTransition(mukamIndex - 1)}
          onNext={() => startTransition(mukamIndex + 1)}
        />
      </div>
    </div>
  )
}
