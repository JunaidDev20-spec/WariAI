// ── BottomIntelligenceStrip ───────────────────────────────────────────────
// Four intelligence sections in a clean 4-column grid.
// Zero overlap, zero bleed. Each cell is fully isolated.
// ─────────────────────────────────────────────────────────────────────────
import type { GlobalMetrics, MovementFlow } from '../data/mockCommandData'

interface Props {
  metrics: GlobalMetrics
  movement: MovementFlow
  sanitationLoad: number
  sanitationPredicted: number
  forecast30Delta: string
  forecast60Delta: string
}

// ── Badge ─────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${color}14`,
      border: `1px solid ${color}30`,
      borderRadius: 8, padding: '2px 9px',
      flexShrink: 0,           // never squash or overflow
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.08em', color, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

// ── Detail row ────────────────────────────────────────────────────────────
function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
      <span style={{
        fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem',
        color: '#9AA7A0', minWidth: 0, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.875rem',
        color: valueColor ?? '#F3F6F4',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Single cell ───────────────────────────────────────────────────────────
interface CellProps {
  overline: string
  overlineColor: string
  badge?: { label: string; color: string }
  metric: string
  metricColor: string
  metricSub?: string
  details: Array<{ label: string; value: string; color?: string }>
  accentColor: string
  delay: number
}

function Cell({ overline, overlineColor, badge, metric, metricColor, metricSub, details, accentColor, delay }: CellProps) {
  return (
    <div
      className="cc-bottom-enter"
      style={{
        // Cell is fully self-contained — it cannot bleed into adjacent cells
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,          // allow shrinking
        boxSizing: 'border-box',
        animationDelay: `${delay}s`,
      }}
    >
      {/* Overline row — label + optional badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
          letterSpacing: '0.14em', color: overlineColor,
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
        }}>
          {overline}
        </div>
        {badge && <Badge label={badge.label} color={badge.color} />}
      </div>

      {/* Primary metric */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'Manrope,sans-serif', fontWeight: 800,
          fontSize: 'clamp(1.375rem, 2vw, 1.875rem)',
          color: metricColor, lineHeight: 1, letterSpacing: '-0.02em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {metric}
        </div>
        {metricSub && (
          <div style={{
            fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem',
            color: '#9AA7A0', marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {metricSub}
          </div>
        )}
      </div>

      {/* Detail rows */}
      {details.length > 0 && (
        <div style={{ borderTop: '1px solid #1C2520', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
          {details.map(d => (
            <DetailRow key={d.label} label={d.label} value={d.value} valueColor={d.color} />
          ))}
        </div>
      )}

      {/* Accent bar at bottom */}
      <div style={{
        height: 2, borderRadius: 999, marginTop: 'auto',
        background: `linear-gradient(90deg, ${accentColor} 0%, transparent 100%)`,
        opacity: 0.45,
      }} />
    </div>
  )
}

// ── Vertical separator ────────────────────────────────────────────────────
function Sep() {
  return (
    <div className="cc-sep" style={{
      width: 1, alignSelf: 'stretch', flexShrink: 0,
      background: 'linear-gradient(180deg, transparent 0%, #28332D 15%, #28332D 85%, transparent 100%)',
    }} />
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function BottomIntelligenceStrip({ metrics, movement, sanitationLoad, sanitationPredicted, forecast30Delta, forecast60Delta }: Props) {
  const movColor  = movement.status === 'high' ? '#F28B4B' : movement.status === 'elevated' ? '#E8C45A' : '#2DD4A8'
  const sanColor  = sanitationLoad > 90 ? '#EF5B5B' : sanitationLoad > 75 ? '#F28B4B' : sanitationLoad > 55 ? '#E8C45A' : '#2DD4A8'
  const sanBadgeLabel = sanitationLoad > 75 ? 'AT RISK' : 'NORMAL'
  const sanBadgeColor = sanColor

  return (
    <div
      className="cc-bottom-enter cc-bottom-strip"
      style={{
        background: '#111714',
        border: '1px solid #28332D',
        borderRadius: 24,
        padding: '18px 24px',
        boxSizing: 'border-box',
        // 4-column grid with fixed-width separators — cells never share space
        display: 'grid',
        gridTemplateColumns: '1fr 1px 1fr 1px 1fr 1px 1fr',
        columnGap: 20,
        alignItems: 'start',
        minWidth: 0,
      }}
    >
      <Cell
        overline="Live Crowd"
        overlineColor="#2DD4A8"
        badge={{ label: 'LIVE', color: '#2DD4A8' }}
        metric={metrics.totalPilgrims.toLocaleString()}
        metricColor="#2DD4A8"
        metricSub="+4.2% since last hour"
        details={[
          { label: 'Active zones',  value: String(metrics.activeZones), color: '#F3F6F4' },
          { label: 'Last updated',  value: metrics.lastUpdate,          color: '#9AA7A0' },
        ]}
        accentColor="#2DD4A8"
        delay={0.35}
      />

      <Sep />

      <Cell
        overline="AI Forecast"
        overlineColor="#9B8AFB"
        metric={forecast60Delta}
        metricColor="#9B8AFB"
        metricSub="Next 60 minutes"
        details={[
          { label: '30 min delta', value: forecast30Delta,                  color: '#9B8AFB' },
          { label: 'Confidence',   value: `${metrics.aiConfidence}%`,       color: '#F3F6F4' },
        ]}
        accentColor="#9B8AFB"
        delay={0.40}
      />

      <Sep />

      <Cell
        overline="Sanitation Demand"
        overlineColor={sanColor}
        badge={{ label: sanBadgeLabel, color: sanBadgeColor }}
        metric={`${sanitationLoad}%`}
        metricColor={sanColor}
        metricSub="Current capacity load"
        details={[
          { label: 'Predicted load',  value: `${sanitationPredicted}%`, color: '#EF5B5B' },
          { label: 'Critical units',  value: '1 / 5',                    color: '#F28B4B' },
        ]}
        accentColor={sanColor}
        delay={0.45}
      />

      <Sep />

      <Cell
        overline="Movement Flow"
        overlineColor={movColor}
        metric={movement.status.toUpperCase()}
        metricColor={movColor}
        metricSub={movement.label}
        details={[
          { label: 'Congestion', value: movement.congestionDelta, color: movColor    },
          { label: 'Flow rate',  value: `${movement.flowRate}/min`, color: '#F3F6F4' },
        ]}
        accentColor={movColor}
        delay={0.50}
      />
    </div>
  )
}
