// ── IncidentSummary.tsx ───────────────────────────────────────────────────
// Four-section unified strip: CRITICAL / ACTIVE / WATCH / RESOLVED counts.
// Clicking a section filters the queue. Clicking again resets the filter.
// ─────────────────────────────────────────────────────────────────────────

import type { Incident, DeploymentState } from '../types/operations'

type FilterKey = 'all' | 'critical' | 'active' | 'watch' | 'resolved'

interface Props {
  incidents: Incident[]
  deployment: DeploymentState | null
  activeFilter: FilterKey
  onFilterChange: (f: FilterKey) => void
}

function resolveDisplayStatus(inc: Incident, dep: DeploymentState | null): string {
  if (dep?.incident?.id === inc.id) {
    const p = dep.phase
    if (p === 'en_route' || p === 'active' || p === 'confirming') return 'active'
  }
  return inc.status
}

export default function IncidentSummary({ incidents, deployment, activeFilter, onFilterChange }: Props) {
  // Derive counts
  const counts = {
    critical: incidents.filter(i => i.severity === 'critical' && resolveDisplayStatus(i, deployment) !== 'resolved').length,
    active:   incidents.filter(i => {
      const s = resolveDisplayStatus(i, deployment)
      return s === 'active' || s === 'deployed'
    }).length,
    watch:    incidents.filter(i => i.severity === 'watch' && resolveDisplayStatus(i, deployment) !== 'resolved').length,
    resolved: incidents.filter(i => resolveDisplayStatus(i, deployment) === 'resolved').length,
  }

  const sections: { key: FilterKey; label: string; count: number; color: string }[] = [
    { key: 'critical', label: 'CRITICAL', count: counts.critical, color: '#EF5B5B' },
    { key: 'active',   label: 'ACTIVE',   count: counts.active,   color: '#2DD4A8' },
    { key: 'watch',    label: 'WATCH',    count: counts.watch,    color: '#E8C45A' },
    { key: 'resolved', label: 'RESOLVED', count: counts.resolved, color: '#9AA7A0' },
  ]

  return (
    <div style={{
      background: '#111714',
      border: '1px solid #28332D',
      borderRadius: 20,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {sections.map(({ key, label, count, color }, i) => {
        const isActive = activeFilter === key
        const isLast   = i === sections.length - 1

        return (
          <button
            key={key}
            onClick={() => onFilterChange(isActive ? 'all' : key)}
            style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '14px 20px',
              background: isActive ? `${color}0E` : 'transparent',
              borderRight: isLast ? 'none' : '1px solid #1C2520',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
              textAlign: 'left',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(243,246,244,0.03)'
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            {/* Active top-border accent */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: color, borderRadius: '999px 999px 0 0',
              }} />
            )}

            <div style={{
              fontFamily: 'Manrope,sans-serif', fontWeight: 800,
              fontSize: 'clamp(1.25rem,2.2vw,1.75rem)',
              color: isActive ? color : '#F3F6F4',
              lineHeight: 1, letterSpacing: '-0.02em',
              transition: 'color 0.15s ease',
            }}>
              {String(count).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
              letterSpacing: '0.14em', color: isActive ? color : '#66736C',
              textTransform: 'uppercase',
              transition: 'color 0.15s ease',
            }}>
              {label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
