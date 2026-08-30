import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import Panel from '../components/Panel'
import MonoTag from '../components/MonoTag'

type StatusType = 'live' | 'safe' | 'watch' | 'high' | 'critical' | 'forecast' | 'ready' | 'offline'

interface StatusRowProps {
  status: StatusType
  label: string
  description: string
  zone?: string
  metric?: string
  metricLabel?: string
  accent?: string
}

const STATUS_COLOR: Record<StatusType, string> = {
  live:     '#2DD4A8',
  safe:     '#2DD4A8',
  watch:    '#E8C45A',
  high:     '#F28B4B',
  critical: '#EF5B5B',
  forecast: '#9B8AFB',
  ready:    '#B0BDB7',
  offline:  '#7A8880',
}

function StatusRow({ status, label, description, zone, metric, metricLabel, accent }: StatusRowProps) {
  const color = STATUS_COLOR[status]
  return (
    <div
      className="status-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 18px',
        background: '#171F1B',
        border: '1px solid #28332D',
        borderRadius: 18,
        borderLeft: `3px solid ${color}`,
        cursor: 'default',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#1C2621' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#171F1B' }}
    >
      {/* Badge */}
      <div style={{ minWidth: 96, flexShrink: 0 }}>
        <StatusBadge status={status} pulse={status === 'live'} />
      </div>

      {/* Zone tag */}
      {zone && (
        <div style={{ minWidth: 80, flexShrink: 0 }}>
          <MonoTag color="default" size="xs">{zone}</MonoTag>
        </div>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#F3F6F4', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', lineHeight: 1.45 }}>
          {description}
        </div>
      </div>

      {/* Metric */}
      {metric && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: accent ?? color }}>
            {metric}
          </div>
          {metricLabel && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', letterSpacing: '0.08em', color: '#66736C', marginTop: 1 }}>
              {metricLabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StatusSection() {
  return (
    <section className="section-enter">
      <SectionLabel index="05" label="Status System" />

      <div style={{ display: 'grid', gridTemplateColumns: '8fr 4fr', gap: 20 }}>

        {/* Feed */}
        <Panel radius="3xl" style={{ padding: '32px' }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.688rem',
              letterSpacing: '0.16em',
              color: '#66736C',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            Zone Status Feed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatusRow status="critical" label="Sanitation Failure Imminent"    description="Capacity gap exceeds threshold — immediate deployment required" zone="ZONE_Z02"   metric="+29%"   metricLabel="CROWD GROWTH" accent="#EF5B5B" />
            <StatusRow status="high"     label="Elevated Crowd Density"         description="Density approaching upper operational threshold"                zone="ZONE_A04"   metric="72%"    metricLabel="CAPACITY"     accent="#F28B4B" />
            <StatusRow status="watch"    label="Movement Congestion Detected"   description="Route C03 showing signs of bottleneck formation"               zone="ROUTE_C03"  metric="+12%"   metricLabel="FLOW RATE"    accent="#E8C45A" />
            <StatusRow status="safe"     label="Zone Operating Normally"        description="All metrics within expected parameters"                         zone="ZONE_B01"   metric="41%"    metricLabel="CAPACITY"                     />
            <StatusRow status="forecast" label="AI Prediction Available"        description="60-minute capacity model updated with high confidence"          zone="ZONE_Z02"   metric="94.2%"  metricLabel="CONFIDENCE"   accent="#9B8AFB" />
            <StatusRow status="live"     label="Real-time Data Active"          description="All sensor feeds operating — 14 nodes online"                  zone="ALL ZONES"  metric="14/14"  metricLabel="NODES ONLINE"                 />
          </div>
        </Panel>

        {/* Badge reference */}
        <Panel radius="3xl" style={{ padding: '32px' }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.688rem',
              letterSpacing: '0.16em',
              color: '#66736C',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
            }}
          >
            Badge Reference
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(
              [
                { status: 'live',     desc: 'Active feed, real-time data'    },
                { status: 'safe',     desc: 'Normal — no action needed'       },
                { status: 'watch',    desc: 'Monitor — elevated state'        },
                { status: 'high',     desc: 'Intervene — threshold exceeded'  },
                { status: 'critical', desc: 'Emergency — act immediately'     },
                { status: 'forecast', desc: 'AI predicted future state'       },
                { status: 'ready',    desc: 'System or team standing by'      },
                { status: 'offline',  desc: 'Disconnected / unavailable'      },
              ] as const
            ).map(({ status, desc }) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flexShrink: 0 }}>
                  <StatusBadge status={status} pulse={status === 'live'} />
                </div>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', lineHeight: 1.3 }}>
                  {desc}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1C2520', marginTop: 20, paddingTop: 18 }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.688rem',
                letterSpacing: '0.1em',
                color: '#66736C',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              Size Variants
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatusBadge status="critical" size="md" />
              <StatusBadge status="critical" size="sm" />
            </div>
          </div>
        </Panel>
      </div>
    </section>
  )
}
