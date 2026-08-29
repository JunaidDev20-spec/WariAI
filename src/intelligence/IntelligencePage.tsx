// ── IntelligencePage.tsx ──────────────────────────────────────────────────
// Page 03: INTELLIGENCE
// Visualises the M1→M2→M3 AI pipeline, population forecast progression,
// and the highest-priority operational insight derived from live state.
//
// Consumes ONLY liveState (already in App) — no new hooks, no new intervals.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import AtmosphericBackground from '../components/AtmosphericBackground'
import SanitationForecastPanel from '../components/SanitationForecastPanel'
import type { MukamLiveState } from '../simulation/simulationEngine'
import { MUKAMS } from '../data/mockCommandData'

type Horizon = 'now' | '30' | '60'

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
  liveState: MukamLiveState
}

// ── Shared style helpers ──────────────────────────────────────────────────
const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
}
const SANS: React.CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
}

// ── Animated number: smoothly transitions between values ─────────────────
function useAnimatedNumber(target: number, decimals = 0): number {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const rafRef  = useRef<number | null>(null)

  useEffect(() => {
    const from = prevRef.current
    if (from === target) return
    prevRef.current = target

    const start    = performance.now()
    const duration = Math.min(500, Math.abs(target - from) * 0.4 + 120)

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(parseFloat((from + (target - from) * eased).toFixed(decimals)))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, decimals])

  return display
}

// ── Pipeline strip ────────────────────────────────────────────────────────
function PipelineStrip() {
  const stages = [
    {
      num: '01',
      module: 'M1 — CROWD VISION',
      label: 'SEE NOW',
      status: 'LIVE',
      statusColor: '#2DD4A8',
      accent: '#2DD4A8',
      desc: 'Crowd density estimation via distributed sensor network and computer vision analysis.',
    },
    {
      num: '02',
      module: 'M2 — SPATIAL AI',
      label: 'UNDERSTAND SPACE',
      status: 'READY',
      statusColor: '#C8A96B',
      accent: '#C8A96B',
      desc: 'Geographic capacity analysis, route mapping, and spatial headroom calculation.',
    },
    {
      num: '03',
      module: 'M3 — FORECASTING',
      label: 'PREDICT NEXT',
      status: 'ACTIVE',
      statusColor: '#9B8AFB',
      accent: '#9B8AFB',
      desc: 'Population trajectory modelling and 30/60-minute crowd movement prediction.',
    },
  ]

  return (
    <div style={{
      background: '#111714',
      border: '1px solid #28332D',
      borderRadius: 24,
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr auto 1fr',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {stages.map((s, i) => (
        <>
          <div
            key={s.num}
            style={{
              padding: '18px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              borderTop: `2px solid ${s.accent}40`,
              position: 'relative',
            }}
          >
            {/* Number */}
            <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: s.accent, opacity: 0.7 }}>
              {s.num}
            </div>

            {/* Module name */}
            <div style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.1em', color: '#F3F6F4', fontWeight: 600 }}>
              {s.module}
            </div>

            {/* Label */}
            <div style={{ ...SANS, fontSize: '0.875rem', color: s.accent, fontWeight: 700, lineHeight: 1 }}>
              {s.label}
            </div>

            {/* Description */}
            <div style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0', lineHeight: 1.5, marginTop: 2 }}>
              {s.desc}
            </div>

            {/* Status badge */}
            <div style={{ marginTop: 4 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: `${s.statusColor}10`,
                border: `1px solid ${s.statusColor}28`,
                borderRadius: 8, padding: '3px 9px',
              }}>
                <span
                  className={s.status === 'LIVE' || s.status === 'ACTIVE' ? 'live-dot' : ''}
                  style={{ width: 5, height: 5, borderRadius: '50%', background: s.statusColor, display: 'inline-block' }}
                />
                <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.08em', color: s.statusColor }}>
                  {s.status}
                </span>
              </span>
            </div>
          </div>

          {/* Arrow connector — between stages only */}
          {i < stages.length - 1 && (
            <div
              key={`arrow-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 12px',
                color: '#3D4F47',
                userSelect: 'none',
              }}
            >
              <svg width="24" height="16" viewBox="0 0 24 16" fill="none">
                <path d="M0 8h20M16 3l6 5-6 5" stroke="#3D4F47" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </>
      ))}
    </div>
  )
}

// ── Forecast hero ─────────────────────────────────────────────────────────

interface ForecastData {
  now:    number
  v30:    number
  v60:    number
  d30:    string
  d60:    string
  conf:   number
}

function ForecastHero({
  data,
  horizon,
  onHorizonChange,
}: {
  data: ForecastData
  horizon: Horizon
  onHorizonChange: (h: Horizon) => void
}) {
  const animNow = useAnimatedNumber(data.now)
  const animV30 = useAnimatedNumber(data.v30)
  const animV60 = useAnimatedNumber(data.v60)

  // Displayed primary value
  const primaryValue = horizon === 'now' ? animNow : horizon === '30' ? animV30 : animV60
  const primaryDelta = horizon === 'now' ? null : horizon === '30' ? data.d30 : data.d60
  const primaryLabel = horizon === 'now' ? 'CURRENT ESTIMATE' : horizon === '30' ? '+30 MIN FORECAST' : '+60 MIN FORECAST'
  const primaryColor = horizon === 'now' ? '#2DD4A8' : horizon === '30' ? '#7DC3B9' : '#9B8AFB'

  // SVG forecast line
  const W = 500, H = 100
  const PAD = { l: 20, r: 20, t: 16, b: 16 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const pts = [data.now, data.v30, data.v60]
  const minV = Math.min(...pts) * 0.96
  const maxV = Math.max(...pts) * 1.02
  const toX = (i: number) => PAD.l + (i / 2) * innerW
  const toY = (v: number) => PAD.t + innerH - ((v - minV) / (maxV - minV)) * innerH
  const linePath = `M ${toX(0)} ${toY(data.now)} L ${toX(1)} ${toY(data.v30)} L ${toX(2)} ${toY(data.v60)}`
  // Teal segment: 0→1, Violet segment: 1→2
  const tealSeg   = `M ${toX(0)} ${toY(data.now)} L ${toX(1)} ${toY(data.v30)}`
  const violetSeg = `M ${toX(1)} ${toY(data.v30)} L ${toX(2)} ${toY(data.v60)}`
  // Area under violet
  const areaPath = `M ${toX(1)} ${toY(data.v30)} L ${toX(2)} ${toY(data.v60)} L ${toX(2)} ${PAD.t + innerH} L ${toX(1)} ${PAD.t + innerH} Z`

  const dotPos = [
    { x: toX(0), y: toY(data.now),  color: '#2DD4A8', label: 'NOW' },
    { x: toX(1), y: toY(data.v30),  color: '#7DC3B9', label: '+30' },
    { x: toX(2), y: toY(data.v60),  color: '#9B8AFB', label: '+60' },
  ]

  return (
    <div style={{
      background: '#111714', border: '1px solid #28332D', borderRadius: 28,
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{
        padding: '18px 24px 16px',
        borderBottom: '1px solid #1C2520',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(150deg, rgba(155,138,251,0.06) 0%, transparent 55%)',
      }}>
        <div>
          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.18em', color: '#9B8AFB', textTransform: 'uppercase', marginBottom: 4 }}>
            M3 // Population Forecast
          </div>
          <div style={{ ...SANS, fontWeight: 700, fontSize: '1.0625rem', color: '#F3F6F4' }}>
            Crowd Trajectory · Next 60 Minutes
          </div>
        </div>

        {/* Time horizon control */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: '#0D1712', border: '1px solid #28332D', borderRadius: 13, padding: '3px 4px',
        }}>
          {(['now', '30', '60'] as Horizon[]).map(h => {
            const active = horizon === h
            const labels: Record<Horizon, string> = { now: 'NOW', '30': '+30 MIN', '60': '+60 MIN' }
            const colors: Record<Horizon, string> = { now: '#2DD4A8', '30': '#7DC3B9', '60': '#9B8AFB' }
            return (
              <button
                key={h}
                onClick={() => onHorizonChange(h)}
                style={{
                  ...MONO, fontSize: '0.688rem', letterSpacing: '0.09em',
                  padding: '5px 12px', borderRadius: 10, border: 'none',
                  background: active ? `${colors[h]}18` : 'transparent',
                  color: active ? colors[h] : '#66736C',
                  cursor: 'pointer', fontWeight: active ? 600 : 400,
                  transition: 'all 0.18s ease',
                  outline: active ? `1px solid ${colors[h]}35` : 'none',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#66736C' }}
              >
                {labels[h]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body: left = hero metric, right = SVG + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

        {/* Left — primary metric */}
        <div style={{ padding: '28px 28px 28px 24px', borderRight: '1px solid #1C2520', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.18em', color: '#66736C', textTransform: 'uppercase' }}>
            {primaryLabel}
          </div>

          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            transition: 'opacity 0.2s ease',
          }}>
            <span style={{
              ...SANS, fontWeight: 800,
              fontSize: 'clamp(2.2rem, 4vw, 3.25rem)',
              color: primaryColor, lineHeight: 1, letterSpacing: '-0.025em',
              transition: 'color 0.25s ease',
            }}>
              {primaryValue.toLocaleString('en-IN')}
            </span>
            {primaryDelta && (
              <span style={{ ...MONO, fontSize: '0.875rem', color: '#9B8AFB', fontWeight: 500 }}>
                {primaryDelta}
              </span>
            )}
          </div>

          <div style={{ ...SANS, fontSize: '0.875rem', color: '#9AA7A0' }}>
            pilgrims {horizon === 'now' ? 'currently active' : 'projected in ' + (horizon === '30' ? '30' : '60') + ' minutes'}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#1C2520', margin: '8px 0' }} />

          {/* Three time-point breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Current',  value: data.now,  delta: null,     color: '#2DD4A8', isActive: horizon === 'now' },
              { label: '+30 MIN',  value: data.v30,  delta: data.d30, color: '#7DC3B9', isActive: horizon === '30'  },
              { label: '+60 MIN',  value: data.v60,  delta: data.d60, color: '#9B8AFB', isActive: horizon === '60'  },
            ].map(row => (
              <div
                key={row.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: 10,
                  background: row.isActive ? `${row.color}0C` : 'transparent',
                  border: `1px solid ${row.isActive ? `${row.color}22` : 'transparent'}`,
                  transition: 'background 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, display: 'inline-block', opacity: row.isActive ? 1 : 0.45 }} />
                  <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: row.isActive ? row.color : '#9AA7A0' }}>
                    {row.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ ...SANS, fontWeight: 700, fontSize: '0.9375rem', color: row.isActive ? row.color : '#9AA7A0' }}>
                    {row.value.toLocaleString('en-IN')}
                  </span>
                  {row.delta && (
                    <span style={{ ...MONO, fontSize: '0.75rem', color: '#9B8AFB', opacity: row.isActive ? 1 : 0.55 }}>
                      {row.delta}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Confidence */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.1em', color: '#66736C' }}>
              MODEL CONFIDENCE
            </span>
            <span style={{ ...MONO, fontSize: '0.8125rem', color: '#9B8AFB', fontWeight: 600 }}>
              {data.conf.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Right — SVG line progression */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase' }}>
            Forecast Trajectory
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="#2DD4A8" />
                <stop offset="50%"  stopColor="#7DC3B9" />
                <stop offset="100%" stopColor="#9B8AFB" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%"   stopColor="#9B8AFB" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#9B8AFB" stopOpacity="0"    />
              </linearGradient>
            </defs>

            {/* Horizontal guides */}
            <g stroke="#1C2520" strokeWidth="0.6">
              {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={PAD.l} y1={PAD.t + innerH * f} x2={PAD.l + innerW} y2={PAD.t + innerH * f} />
              ))}
            </g>

            {/* Forecast area fill */}
            <path d={areaPath} fill="url(#areaGrad)" />

            {/* Teal segment NOW→+30 */}
            <path d={tealSeg} fill="none" stroke="#2DD4A8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Violet segment +30→+60 */}
            <path d={violetSeg} fill="none" stroke="#9B8AFB" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" />

            {/* Dots + labels */}
            {dotPos.map((dot, di) => {
              const isHighlighted = (di === 0 && horizon === 'now') || (di === 1 && horizon === '30') || (di === 2 && horizon === '60')
              return (
                <g key={di}>
                  {isHighlighted && (
                    <circle cx={dot.x} cy={dot.y} r="10" fill={dot.color} opacity="0.12" />
                  )}
                  <circle cx={dot.x} cy={dot.y} r={isHighlighted ? 5 : 3.5}
                    fill={dot.color} stroke="#0D1712" strokeWidth="1.5"
                    style={{ transition: 'r 0.2s ease' }}
                  />
                  <text
                    x={dot.x} y={dot.y - 12}
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace" fontSize="8.5"
                    letterSpacing="0.07em"
                    fill={dot.color}
                    opacity={isHighlighted ? 1 : 0.55}
                  >
                    {dot.label}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { color: '#2DD4A8', dash: false, label: 'Observed' },
              { color: '#9B8AFB', dash: true,  label: 'Predicted' },
            ].map(({ color, dash, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="4" viewBox="0 0 16 4">
                  {dash
                    ? <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
                    : <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
                  }
                </svg>
                <span style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── AI Operational Insight ────────────────────────────────────────────────

interface InsightProps {
  zoneLabel: string
  mukamId: string
  severity: string
  timeToEvent: number | undefined
  recommendation: string
  currentLoad: number | undefined
  predictedLoad: number | undefined
  conf: number
}

function OperationalInsight({
  zoneLabel, mukamId, severity, timeToEvent, recommendation,
  currentLoad, predictedLoad, conf,
}: InsightProps) {
  const sevColor = severity === 'critical' ? '#EF5B5B'
                 : severity === 'high'     ? '#F28B4B'
                 : severity === 'watch'    ? '#E8C45A'
                 : '#2DD4A8'

  // Deterministic signals derived from the load delta
  const loadDelta = (predictedLoad ?? 0) - (currentLoad ?? 0)
  const signals = [
    { icon: '↑', text: 'Increasing crowd inflow rate'        },
    { icon: '↑', text: loadDelta > 25 ? 'Significant spatial headroom deficit' : 'Limited spatial headroom' },
    { icon: '↑', text: 'Historical crowd progression pattern matches high-risk window' },
  ]

  return (
    <div style={{
      background: '#111714', border: '1px solid #28332D', borderRadius: 24,
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 22px 14px',
        borderBottom: '1px solid #1C2520',
        background: `linear-gradient(150deg, ${sevColor}08 0%, transparent 55%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.18em', color: '#9B8AFB', textTransform: 'uppercase', marginBottom: 4 }}>
            AI Operational Insight
          </div>
          <div style={{ ...SANS, fontWeight: 700, fontSize: '1rem', color: '#F3F6F4' }}>
            Highest-Risk Zone Analysis
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: `${sevColor}15`, border: `1px solid ${sevColor}35`,
          borderRadius: 9, padding: '4px 12px',
        }}>
          <span
            className={severity === 'critical' ? 'live-dot' : ''}
            style={{ width: 6, height: 6, borderRadius: '50%', background: sevColor, display: 'inline-block' }}
          />
          <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: sevColor, fontWeight: 500 }}>
            {severity.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Body — two columns on desktop */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 0,
      }}
      className="insight-grid"
      >
        {/* Left: narrative */}
        <div style={{ padding: '18px 20px 20px', borderRight: '1px solid #1C2520' }}>
          {/* Zone + Mukam */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ ...MONO, fontSize: '0.9375rem', letterSpacing: '0.07em', color: '#C8A96B', fontWeight: 600 }}>
              {zoneLabel}
            </span>
            <span style={{ color: '#3D4F47' }}>·</span>
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.07em', color: '#9AA7A0' }}>
              {mukamId}
            </span>
          </div>

          {/* Insight text */}
          <p style={{ ...SANS, fontSize: '0.9375rem', color: '#BCC8C1', lineHeight: 1.65, margin: '0 0 14px' }}>
            <strong style={{ color: '#F3F6F4' }}>{zoneLabel}</strong> is expected to approach
            {' '}{severity === 'critical' ? 'critical' : 'elevated'} operational capacity
            {timeToEvent != null
              ? <> within the next <strong style={{ color: sevColor }}>{timeToEvent} minutes</strong>.</>
              : <> within the current operational window.</>
            }
          </p>

          {/* Load metrics */}
          {(currentLoad != null || predictedLoad != null) && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              {currentLoad != null && (
                <div>
                  <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.12em', color: '#66736C', marginBottom: 3 }}>
                    CURRENT LOAD
                  </div>
                  <div style={{ ...SANS, fontWeight: 700, fontSize: '1.25rem', color: '#F28B4B', lineHeight: 1 }}>
                    {currentLoad}%
                  </div>
                </div>
              )}
              {predictedLoad != null && (
                <div>
                  <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.12em', color: '#66736C', marginBottom: 3 }}>
                    PREDICTED LOAD
                  </div>
                  <div style={{ ...SANS, fontWeight: 700, fontSize: '1.25rem', color: sevColor, lineHeight: 1 }}>
                    {predictedLoad}%
                  </div>
                </div>
              )}
              <div>
                <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.12em', color: '#66736C', marginBottom: 3 }}>
                  CONFIDENCE
                </div>
                <div style={{ ...SANS, fontWeight: 700, fontSize: '1.25rem', color: '#9B8AFB', lineHeight: 1 }}>
                  {conf.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: signals + recommendation */}
        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Active forecast signals */}
          <div>
            <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase', marginBottom: 10 }}>
              Active Forecast Signals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {signals.map((sig, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ ...MONO, fontSize: '0.8125rem', color: sevColor, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>
                    {sig.icon}
                  </span>
                  <span style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0', lineHeight: 1.45 }}>
                    {sig.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended action */}
          <div style={{
            background: 'rgba(45,212,168,0.05)', border: '1px solid rgba(45,212,168,0.14)',
            borderRadius: 14, padding: '12px 14px',
          }}>
            <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#2DD4A8', textTransform: 'uppercase', marginBottom: 7 }}>
              Recommended Action
            </div>
            <p style={{ ...SANS, fontSize: '0.875rem', color: '#BCC8C1', lineHeight: 1.55, margin: 0 }}>
              {recommendation}
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function IntelligencePage({ liveState }: Props) {
  const [horizon, setHorizon] = useState<Horizon>('now')

  // Safe extraction from liveState — all with fallbacks
  const mukamId     = liveState?.mukamId ?? MUKAMS[0]?.id ?? 'MUKAM_07'
  const mukamStatic = MUKAMS.find(m => m.id === mukamId)
  const mukamName   = mukamStatic?.name ?? 'Mukam 07 — Phaltan'

  const forecast = liveState?.forecast ?? []
  const now30    = forecast[1]
  const now60    = forecast[2]

  const forecastData: ForecastData = {
    now:  liveState?.metrics?.totalPilgrims  ?? 248400,
    v30:  now30?.value ?? Math.round((liveState?.metrics?.totalPilgrims ?? 248400) * 1.084),
    v60:  now60?.value ?? Math.round((liveState?.metrics?.totalPilgrims ?? 248400) * 1.172),
    d30:  liveState?.forecast30Delta ?? '+8.4%',
    d60:  liveState?.forecast60Delta ?? '+17.2%',
    conf: liveState?.metrics?.aiConfidence ?? 94.2,
  }

  const alert = liveState?.alert
  const insightProps: InsightProps = {
    zoneLabel:      alert?.zoneLabel       ?? 'ZONE_Z02',
    mukamId:        mukamId,
    severity:       alert?.severity        ?? 'critical',
    timeToEvent:    alert?.timeToEvent,
    recommendation: alert?.recommendation ?? 'Prepare additional operational capacity before the projected threshold breach.',
    currentLoad:    alert?.currentLoad,
    predictedLoad:  alert?.predictedLoad,
    conf:           forecastData.conf,
  }

  const lastUpdate = liveState?.metrics?.lastUpdate ?? '—'

  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AtmosphericBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 28px 14px', borderBottom: '1px solid #1C2520', flexShrink: 0,
        }}>
          <div>
            <div style={{ ...SANS, fontWeight: 800, fontSize: '1.375rem', color: '#F3F6F4', lineHeight: 1 }}>
              INTELLIGENCE
            </div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              Forecasts, spatial analysis &amp; operational signals
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {/* AI pipeline live */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#9B8AFB', display: 'inline-block', boxShadow: '0 0 6px rgba(155,138,251,0.5)' }} />
              <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: '#9B8AFB' }}>
                AI PIPELINE LIVE
              </span>
            </div>
            {/* Current Mukam */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <span style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.12em', color: '#66736C' }}>CURRENT MUKAM</span>
              <span style={{ ...MONO, fontSize: '0.8125rem', letterSpacing: '0.08em', color: '#C8A96B', fontWeight: 600 }}>
                {mukamName}
              </span>
            </div>
            {/* Last sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>LAST SYNC</span>
              <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#9AA7A0' }}>{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
          padding: '16px 28px 24px', overflowY: 'auto',
        }}>

          {/* 1. Pipeline strip */}
          <PipelineStrip />

          {/* 2. Forecast hero */}
          <ForecastHero
            data={forecastData}
            horizon={horizon}
            onHorizonChange={setHorizon}
          />

          {/* 3. Insight */}
          <OperationalInsight {...insightProps} />

          {/* 4. M2/M3 sanitation planning (demo data) */}
          <SanitationForecastPanel mukamId={mukamId} />

        </div>
      </div>
    </div>
  )
}
