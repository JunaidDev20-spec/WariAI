import { useEffect, useState, useRef } from 'react'
import type { GlobalMetrics } from '../data/mockCommandData'

interface Props { metrics: GlobalMetrics }

// Animate smoothly from previous value to new target on every change
function useCountUp(target: number, decimals = 0) {
  const [value, setValue] = useState(target)
  const prevRef = useRef(target)

  useEffect(() => {
    const from     = prevRef.current
    const to       = target
    prevRef.current = target
    if (from === to) return

    const start    = performance.now()
    const duration = Math.min(600, Math.abs(to - from) * 2)  // faster for small changes
    let rafId: number

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(parseFloat((from + (to - from) * eased).toFixed(decimals)))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, decimals])

  return value
}

function Metric({
  value, label, accent, format, delay,
}: {
  value: string | number
  label: string
  accent: string
  format?: 'number' | 'plain'
  delay: number
}) {
  return (
    <div
      className="metric-reveal"
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontWeight: 800,
        fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
        color: accent, letterSpacing: '-0.02em', lineHeight: 1,
      }}>
        {format === 'number' && typeof value === 'number'
          ? value.toLocaleString()
          : value}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem',
        letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase',
      }}>
        {label}
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: '#1C2520', margin: '0 4px' }} />
}

export default function GlobalMetricsStrip({ metrics }: Props) {
  const pilgrims = useCountUp(metrics.totalPilgrims)
  const zones    = useCountUp(metrics.activeZones)
  const critical = useCountUp(metrics.criticalZones)
  const conf     = useCountUp(metrics.aiConfidence, 1)

  return (
    <div
      className="cc-strip-enter"
      style={{
        background: '#111714',
        border: '1px solid #28332D',
        borderRadius: 20,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexShrink: 0,
        animation: 'none',   // suppress re-animation on data updates
      }}
    >
      {/* Metrics */}
      <div
        className="cc-metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          flex: 1,
        }}
      >
        {[
          { value: pilgrims,        label: 'Total Pilgrims',  accent: '#F3F6F4', format: 'number' as const, delay: 0.12 },
          { value: zones,           label: 'Active Zones',    accent: '#2DD4A8', format: 'number' as const, delay: 0.18 },
          { value: critical,        label: 'Critical Zones',  accent: '#EF5B5B', format: 'number' as const, delay: 0.24 },
          { value: `${conf}%`,      label: 'AI Confidence',   accent: '#9B8AFB', format: 'plain'  as const, delay: 0.30 },
        ].map((m, i, arr) => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Divider before each except first */}
            {i > 0 && <Divider />}
            <div style={{ flex: 1, padding: '0 24px' }}>
              <Metric {...m} />
            </div>
          </div>
        ))}
      </div>

      {/* Right cluster */}
      <Divider />
      <div style={{ padding: '0 0 0 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            className="live-dot"
            style={{
              width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8',
              display: 'inline-block', boxShadow: '0 0 6px rgba(45,212,168,0.5)',
            }}
          />
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
            letterSpacing: '0.08em', color: '#2DD4A8',
          }}>
            LIVE
          </span>
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem',
          letterSpacing: '0.07em', color: '#66736C',
        }}>
          {metrics.lastUpdate}
        </div>
      </div>
    </div>
  )
}
