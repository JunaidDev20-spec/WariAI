    import { useState } from 'react'
import MonoTag from '../components/MonoTag'
import type { ForecastPoint } from '../data/mockCommandData'

interface Props {
  series: ForecastPoint[]
  confidence: number
}

// ── Mini SVG forecast chart ───────────────────────────────────────────────
function ForecastChart({
  series,
  activeIndex,
  onHover,
}: {
  series: ForecastPoint[]
  activeIndex: number | null
  onHover: (i: number | null) => void
}) {
  const W = 260
  const H = 80
  const PAD = { t: 10, r: 12, b: 20, l: 12 }
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const values = series.map(s => s.value)
  const minV = Math.min(...values) * 0.97
  const maxV = Math.max(...values) * 1.02

  const toX = (i: number) => PAD.l + (i / (series.length - 1)) * innerW
  const toY = (v: number) => PAD.t + innerH - ((v - minV) / (maxV - minV)) * innerH

  // Split into live (index 0) and forecast (index 1+)
  const livePoints  = series.filter((_, i) => !series[i].isForecast)
  const fcPoints    = series.filter((_, i) => series[i].isForecast)
  const liveIdxEnd  = series.findIndex(s => s.isForecast) - 1

  const livePath = livePoints
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(s.value)}`)
    .join(' ')

  // Forecast starts from last live point → forecast points
  const joinIdx   = liveIdxEnd >= 0 ? liveIdxEnd : 0
  const fcPath    = [
    `M ${toX(joinIdx)} ${toY(series[joinIdx].value)}`,
    ...fcPoints.map((s, i) => `L ${toX(joinIdx + 1 + i)} ${toY(s.value)}`),
  ].join(' ')

  // Area fill under forecast
  const fcAreaPath = fcPath
    + ` L ${toX(series.length - 1)} ${PAD.t + innerH}`
    + ` L ${toX(joinIdx)} ${PAD.t + innerH} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 80, display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="fcAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#9B8AFB" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#9B8AFB" stopOpacity="0"    />
        </linearGradient>
        <style>{`
          .fc-live-draw {
            stroke-dasharray: 300;
            animation: fcLiveDraw 0.7s 0.2s ease forwards;
            stroke-dashoffset: 300;
          }
          .fc-pred-draw {
            stroke-dasharray: 200;
            animation: fcPredDraw 0.6s 0.75s ease forwards;
            stroke-dashoffset: 200;
          }
          @keyframes fcLiveDraw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fcPredDraw {
            to { stroke-dashoffset: 0; }
          }
          @media (prefers-reduced-motion: reduce) {
            .fc-live-draw, .fc-pred-draw {
              animation: none;
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </defs>

      {/* Horizontal guide lines */}
      <g stroke="#1C2520" strokeWidth="0.6">
        {[0.33, 0.66, 1].map(f => (
          <line key={f} x1={PAD.l} y1={PAD.t + innerH * f} x2={PAD.l + innerW} y2={PAD.t + innerH * f} />
        ))}
      </g>

      {/* NOW divider */}
      <line
        x1={toX(liveIdxEnd < 0 ? 0 : liveIdxEnd)}
        y1={PAD.t}
        x2={toX(liveIdxEnd < 0 ? 0 : liveIdxEnd)}
        y2={PAD.t + innerH}
        stroke="#28332D" strokeWidth="1" strokeDasharray="3 3"
      />
      <text
        x={toX(liveIdxEnd < 0 ? 0 : liveIdxEnd) + 4}
        y={PAD.t + 9}
        fontFamily="IBM Plex Mono,monospace" fontSize="7"
        fill="#66736C" letterSpacing="0.08em"
      >
        NOW
      </text>

      {/* Forecast area fill */}
      <path d={fcAreaPath} fill="url(#fcAreaGrad)" />

      {/* Live line — teal */}
      <path
        className="fc-live-draw"
        d={livePath}
        fill="none" stroke="#2DD4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />

      {/* Forecast line — violet */}
      <path
        className="fc-pred-draw"
        d={fcPath}
        fill="none" stroke="#9B8AFB" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="5 3"
      />

      {/* Data points */}
      {series.map((s, i) => {
        const x = toX(i)
        const y = toY(s.value)
        const isActive = activeIndex === i
        const color = s.isForecast ? '#9B8AFB' : '#2DD4A8'
        return (
          <g key={i}>
            {isActive && (
              <circle cx={x} cy={y} r={10} fill={color} opacity="0.1" />
            )}
            <circle
              cx={x} cy={y} r={isActive ? 5 : 3.5}
              fill={color} stroke="#0B1410" strokeWidth="1.5"
              style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
              onMouseEnter={() => onHover(i)}
              onMouseLeave={() => onHover(null)}
            />
          </g>
        )
      })}

      {/* X-axis labels */}
      {series.map((s, i) => (
        <text
          key={i} x={toX(i)} y={H - 4}
          textAnchor="middle"
          fontFamily="IBM Plex Mono,monospace" fontSize="7.5"
          fill={activeIndex === i ? (s.isForecast ? '#9B8AFB' : '#2DD4A8') : '#66736C'}
          letterSpacing="0.06em"
          style={{ transition: 'fill 0.15s ease' }}
        >
          {s.label}
        </text>
      ))}
    </svg>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function AIForecastPanel({ series, confidence }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const active = activeIndex !== null ? series[activeIndex] : null
  const lastFc = series[series.length - 1]

  return (
    <div
      className="cc-right-enter"
      style={{
        background: '#111714',
        border: '1px solid #28332D',
        borderRadius: 28,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animationDelay: '0.1s',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px 12px',
        background: 'linear-gradient(150deg, rgba(155,138,251,0.07) 0%, transparent 60%)',
        borderBottom: '1px solid #1C2520',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
            letterSpacing: '0.16em', color: '#9B8AFB', textTransform: 'uppercase',
            marginBottom: 4,
          }}>
            AI // FORECAST · NEXT 60 MIN
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{
              fontFamily: 'Manrope,sans-serif', fontWeight: 800,
              fontSize: '1.75rem', color: '#9B8AFB', lineHeight: 1, letterSpacing: '-0.02em',
            }}>
              {lastFc.delta}
            </span>
            <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>
              expected growth
            </span>
          </div>
        </div>
        <MonoTag color="violet">PREDICTED</MonoTag>
      </div>

      {/* ── Chart ── */}
      <div style={{ padding: '14px 20px 4px' }}>
        <ForecastChart
          series={series}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
        />
      </div>

      {/* ── Hovered point tooltip ── */}
      <div style={{
        margin: '0 20px',
        minHeight: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {active ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: active.isForecast ? 'rgba(155,138,251,0.08)' : 'rgba(45,212,168,0.08)',
            border: `1px solid ${active.isForecast ? 'rgba(155,138,251,0.2)' : 'rgba(45,212,168,0.2)'}`,
            borderRadius: 10, padding: '6px 14px', width: '100%', justifyContent: 'space-between',
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem',
              color: active.isForecast ? '#9B8AFB' : '#2DD4A8', letterSpacing: '0.08em',
            }}>
              {active.label}
            </span>
            <span style={{
              fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem',
              color: '#F3F6F4',
            }}>
              {active.value.toLocaleString()}
            </span>
            <span style={{
              fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.875rem',
              color: active.isForecast ? '#9B8AFB' : '#2DD4A8',
            }}>
              {active.delta}
            </span>
          </div>
        ) : (
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
            color: '#3D4F47', letterSpacing: '0.08em',
          }}>
            HOVER CHART TO INSPECT
          </span>
        )}
      </div>

      {/* ── Data rows ── */}
      <div style={{ padding: '12px 20px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ borderTop: '1px solid #1C2520', paddingTop: 12 }} />
        {[
          { label: 'Current estimate', value: series[0].value.toLocaleString(), accent: '#2DD4A8',  mono: false },
          { label: '30 min forecast',  value: series[1]?.delta ?? '—',          accent: '#9B8AFB',  mono: false },
          { label: '60 min forecast',  value: lastFc.delta,                     accent: '#9B8AFB',  mono: false },
          { label: 'Confidence',       value: `${confidence}%`,                 accent: '#F3F6F4',  mono: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: accent }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
