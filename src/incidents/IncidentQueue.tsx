// ── IncidentQueue.tsx ─────────────────────────────────────────────────────
// Scrollable left column — sortable list of incidents.
// Each row shows: severity, relative time, title, location, and op-state.
// ─────────────────────────────────────────────────────────────────────────

import type { Incident, DeploymentState } from '../types/operations'

// ── Helpers ───────────────────────────────────────────────────────────────

const SEV_COLORS: Record<string, { dot: string; label: string }> = {
  critical: { dot: '#EF5B5B', label: '#EF5B5B' },
  high:     { dot: '#F28B4B', label: '#F28B4B' },
  watch:    { dot: '#E8C45A', label: '#E8C45A' },
  safe:     { dot: '#2DD4A8', label: '#2DD4A8' },
  forecast: { dot: '#9B8AFB', label: '#9B8AFB' },
}

const STATUS_LABEL: Record<string, string> = {
  new:          'AWAITING',
  acknowledged: 'ACKNOWLEDGED',
  deployed:     'DEPLOYING',
  active:       'ACTIVE',
  resolved:     'RESOLVED',
}

const STATUS_COLOR: Record<string, string> = {
  new:          '#66736C',
  acknowledged: '#9AA7A0',
  deployed:     '#E8C45A',
  active:       '#2DD4A8',
  resolved:     '#66736C',
}

function relativeTime(ts: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ago`
}

// Map deployment phase → incident status label override
function opLabel(inc: Incident, deployment: DeploymentState | null): string {
  if (deployment?.incident?.id === inc.id) {
    const p = deployment.phase
    if (p === 'selecting' || p === 'confirming') return 'DEPLOYING'
    if (p === 'en_route') return 'EN ROUTE'
    if (p === 'active')   return 'ACTIVE'
    if (p === 'resolved') return 'RESOLVED'
  }
  return STATUS_LABEL[inc.status] ?? inc.status.toUpperCase()
}

function opColor(inc: Incident, deployment: DeploymentState | null): string {
  if (deployment?.incident?.id === inc.id) {
    const p = deployment.phase
    if (p === 'en_route' || p === 'active') return '#2DD4A8'
    if (p === 'selecting' || p === 'confirming') return '#E8C45A'
  }
  return STATUS_COLOR[inc.status] ?? '#66736C'
}

// ── Sort logic ────────────────────────────────────────────────────────────
const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, watch: 2, safe: 3, forecast: 4 }
const STATUS_RANK: Record<string, number>   = { active: 0, deployed: 1, new: 2, acknowledged: 3, resolved: 4 }

function sortIncidents(list: Incident[]): Incident[] {
  return [...list].sort((a, b) => {
    // Resolved always last
    const aResolved = a.status === 'resolved' ? 1 : 0
    const bResolved = b.status === 'resolved' ? 1 : 0
    if (aResolved !== bResolved) return aResolved - bResolved
    // By severity
    const sevA = SEVERITY_RANK[a.severity] ?? 5
    const sevB = SEVERITY_RANK[b.severity] ?? 5
    if (sevA !== sevB) return sevA - sevB
    // By operational urgency
    const stA = STATUS_RANK[a.status] ?? 5
    const stB = STATUS_RANK[b.status] ?? 5
    if (stA !== stB) return stA - stB
    // By recency
    return b.createdAt - a.createdAt
  })
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  incidents: Incident[]
  selectedId: string | null
  deployment: DeploymentState | null
  onSelect: (id: string) => void
}

export default function IncidentQueue({ incidents, selectedId, deployment, onSelect }: Props) {
  const sorted = sortIncidents(incidents)

  if (sorted.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 10, padding: 40 }}>
        <div style={{ fontSize: '1.25rem', color: '#2DD4A8' }}>✓</div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#F3F6F4', textAlign: 'center' }}>
          No Active Incidents
        </div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', textAlign: 'center', maxWidth: 220, lineHeight: 1.55 }}>
          All monitored zones are currently within operational thresholds.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
      {sorted.map(inc => {
        const sev      = SEV_COLORS[inc.severity] ?? SEV_COLORS.watch
        const isSelected = inc.id === selectedId
        const isResolved = inc.status === 'resolved'
        const label    = opLabel(inc, deployment)
        const color    = opColor(inc, deployment)
        const isActive = label === 'EN ROUTE' || label === 'ACTIVE' || label === 'DEPLOYING'

        return (
          <button
            key={inc.id}
            onClick={() => onSelect(inc.id)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 7,
              padding: '13px 16px',
              background: isSelected ? '#171F1B' : '#111714',
              border: isSelected
                ? `1px solid ${sev.dot}40`
                : '1px solid #1C2520',
              borderLeft: `3px solid ${isSelected ? sev.dot : 'transparent'}`,
              borderRadius: 18,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.18s ease, border-color 0.18s ease',
              opacity: isResolved ? 0.6 : 1,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#141C18'
            }}
            onMouseLeave={e => {
              if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#111714'
            }}
          >
            {/* Row 1: severity dot + label + relative time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className={isActive && !isResolved ? 'live-dot' : ''}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: sev.dot, display: 'inline-block', flexShrink: 0 }}
                />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.1em', color: sev.label, fontWeight: 500 }}>
                  {inc.severity.toUpperCase()}
                </span>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', color: '#66736C', letterSpacing: '0.04em' }}>
                {relativeTime(inc.createdAt)}
              </span>
            </div>

            {/* Row 2: incident title */}
            <div style={{
              fontFamily: 'Manrope,sans-serif', fontWeight: 700,
              fontSize: '0.9375rem', color: isResolved ? '#9AA7A0' : '#F3F6F4',
              lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {inc.title}
            </div>

            {/* Row 3: location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#C8A96B' }}>
                {inc.zoneLabel}
              </span>
              <span style={{ color: '#3D4F47', fontSize: '0.75rem' }}>·</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#66736C' }}>
                {inc.mukamId}
              </span>
            </div>

            {/* Row 4: operational state */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
                letterSpacing: '0.08em', color,
                background: `${color}12`,
                border: `1px solid ${color}28`,
                borderRadius: 7, padding: '2px 8px',
              }}>
                {label}
              </span>
              {!isResolved && (
                <span style={{ color: '#3D4F47', fontSize: '0.8rem' }}>›</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
