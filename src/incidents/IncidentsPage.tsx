// ── IncidentsPage.tsx ─────────────────────────────────────────────────────
// Page 02 — Operational alert management.
// Consumes shared state (ops + simulation) from App.tsx.
// Zero new intervals, zero duplicate state.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect } from 'react'
import AtmosphericBackground from '../components/AtmosphericBackground'
import DeploymentPanel       from '../components/DeploymentPanel'
import IncidentSummary       from './IncidentSummary'
import IncidentQueue         from './IncidentQueue'
import IncidentDetail        from './IncidentDetail'
import type { MukamLiveState } from '../simulation/simulationEngine'
import type { OperationalResource } from '../data/mockResources'
import type { DeploymentState, Incident } from '../types/operations'
import { MUKAMS } from '../data/mockCommandData'

type FilterKey = 'all' | 'critical' | 'active' | 'watch' | 'resolved'

// ── Props injected from App ───────────────────────────────────────────────
interface IncidentsPageProps {
  liveState: MukamLiveState
  resources: OperationalResource[]
  deployment: DeploymentState
  incidents: Map<string, Incident>
  openDeployment:   (alert: import('../data/mockCommandData').Alert, mukamId: string) => void
  cancelDeployment: () => void
  toggleResource:   (id: string) => void
  confirmDeployment: () => void
  markResolved:     () => void
}

// ── Demo seed incidents (so the page has content before any deployment) ───
// These are generated once from existing MUKAM static data.
// They complement — not replace — real runtime incidents from the hook.

function buildSeedIncidents(): Incident[] {
  const now = Date.now()
  const seeds: Incident[] = []

  MUKAMS.forEach((m, idx) => {
    m.zones.forEach((z, zi) => {
      if (z.status === 'safe') return  // skip truly safe zones

      const severity = z.status === 'critical' ? 'critical'
                     : z.status === 'high'     ? 'high'
                     : z.status === 'watch'    ? 'watch'
                     : z.status === 'forecast' ? 'watch'
                     : 'watch'

      const titleMap: Record<string, string> = {
        critical: 'SANITATION OVERFLOW',
        high:     'ELEVATED CROWD DENSITY',
        watch:    'CROWD DENSITY WATCH',
      }

      const recMap: Record<string, string> = {
        critical: `Deploy 2 mobile sanitation units and 1 response team to ${z.label} via primary route.`,
        high:     `Pre-position response teams near ${z.label}. Monitor inflow and prepare diversion routes.`,
        watch:    `Continue monitoring ${z.label}. Pre-position 1 crowd management team as a precaution.`,
      }

      // Give resolved status to last Mukam's zones for demo variety
      const isResolved = idx === MUKAMS.length - 1 && zi === 0

      seeds.push({
        id: `SEED_${m.id}_${z.id}`,
        zoneId:    z.id,
        zoneLabel: z.label,
        mukamId:   m.id,
        severity,
        incidentType: titleMap[severity] ?? 'ALERT',
        title:        titleMap[severity] ?? 'ZONE ALERT',
        createdAt:    now - (idx * 8 + zi * 3) * 60000,   // staggered timestamps
        status:       isResolved ? 'resolved' : 'new',
        assignedResourceIds: [],
        recommendedAction: recMap[severity] ?? '',
        timeToEvent:  m.alert.timeToEvent,
        currentLoad:  z.currentLoad,
        predictedLoad: z.predictedLoad,
      })
    })
  })

  return seeds
}

const SEED_INCIDENTS = buildSeedIncidents()

// ── Helper: merge seed + live incidents ───────────────────────────────────
function mergeIncidents(
  live: Map<string, Incident>,
  seeds: Incident[],
  dep: DeploymentState,
): Incident[] {
  const result = new Map<string, Incident>()

  // Seeds first (lower priority — overwritten by live)
  for (const s of seeds) {
    result.set(s.id, s)
  }

  // Live incidents override seeds with matching zone+mukam
  for (const [id, inc] of live) {
    result.set(id, inc)
  }

  // Apply deployment phase to the active incident
  if (dep.incident) {
    const inc = result.get(dep.incident.id) ?? dep.incident
    const updatedStatus: Incident['status'] =
      dep.phase === 'resolved'   ? 'resolved'
      : dep.phase === 'active'   ? 'active'
      : dep.phase === 'en_route' ? 'deployed'
      : dep.phase === 'confirming' || dep.phase === 'selecting' ? 'acknowledged'
      : inc.status
    result.set(dep.incident.id, {
      ...inc,
      status: updatedStatus,
      assignedResourceIds: dep.incident.assignedResourceIds,
    })
  }

  return Array.from(result.values())
}

// ── Filter ─────────────────────────────────────────────────────────────────
function applyFilter(incidents: Incident[], filter: FilterKey, query: string): Incident[] {
  let list = incidents

  if (filter === 'critical') list = list.filter(i => i.severity === 'critical' && i.status !== 'resolved')
  else if (filter === 'active') list = list.filter(i => i.status === 'active' || i.status === 'deployed' || i.status === 'acknowledged')
  else if (filter === 'watch')  list = list.filter(i => i.severity === 'watch' && i.status !== 'resolved')
  else if (filter === 'resolved') list = list.filter(i => i.status === 'resolved')
  else list = list  // 'all'

  if (query.trim()) {
    const q = query.toLowerCase()
    list = list.filter(i =>
      i.id.toLowerCase().includes(q)         ||
      i.title.toLowerCase().includes(q)      ||
      i.zoneLabel.toLowerCase().includes(q)  ||
      i.mukamId.toLowerCase().includes(q)    ||
      i.zoneId.toLowerCase().includes(q)
    )
  }

  return list
}

// ── Main component ────────────────────────────────────────────────────────
export default function IncidentsPage({
  liveState, resources, deployment, incidents,
  openDeployment, cancelDeployment, toggleResource, confirmDeployment, markResolved,
}: IncidentsPageProps) {

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [selectedId,   setSelectedId]   = useState<string | null>(null)

  // Merge seed + runtime incidents
  const allIncidents = useMemo(
    () => mergeIncidents(incidents, SEED_INCIDENTS, deployment),
    [incidents, deployment]
  )

  const filtered = useMemo(
    () => applyFilter(allIncidents, activeFilter, searchQuery),
    [allIncidents, activeFilter, searchQuery]
  )

  // Auto-select highest-priority unresolved incident on first render
  useEffect(() => {
    if (selectedId) return
    const first = filtered.find(i => i.status !== 'resolved') ?? filtered[0]
    if (first) setSelectedId(first.id)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Keep selectedId valid when list changes
  const selectedIncident = allIncidents.find(i => i.id === selectedId) ?? null

  // Handler: open deployment for an incident from the detail panel
  const handleOpenDeployForIncident = (inc: Incident) => {
    // Build a minimal alert-compatible object from the incident
    openDeployment(
      {
        id:              inc.id,
        zoneId:          inc.zoneId,
        zoneLabel:       inc.zoneLabel,
        severity:        inc.severity as import('../data/mockCommandData').ZoneStatus,
        title:           inc.title,
        description:     inc.title,
        timeToEvent:     inc.timeToEvent,
        currentLoad:     inc.currentLoad,
        predictedLoad:   inc.predictedLoad,
        recommendation:  inc.recommendedAction,
      },
      inc.mukamId,
    )
  }

  const now     = new Date()
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`

  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AtmosphericBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* ── Page header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 28px 14px',
          borderBottom: '1px solid #1C2520',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.375rem', color: '#F3F6F4', lineHeight: 1 }}>
              INCIDENTS
            </div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              Operational alert management
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block', boxShadow: '0 0 6px rgba(45,212,168,0.55)' }} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>
                LIVE SYSTEM
              </span>
            </div>
            <div style={{ width: 1, height: 14, background: '#28332D' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>LAST SYNC</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#9AA7A0' }}>{liveState.metrics.lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* ── Main body ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 28px 20px', minHeight: 0 }}>

          {/* Summary strip */}
          <IncidentSummary
            incidents={allIncidents}
            deployment={deployment}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />

          {/* Filter + search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
          }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {(['all', 'critical', 'active', 'watch', 'resolved'] as FilterKey[]).map(f => {
                const isActive = activeFilter === f
                const accentMap: Record<FilterKey, string> = {
                  all:      '#9AA7A0',
                  critical: '#EF5B5B',
                  active:   '#2DD4A8',
                  watch:    '#E8C45A',
                  resolved: '#66736C',
                }
                const ac = accentMap[f]
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem',
                      letterSpacing: '0.09em', padding: '5px 13px',
                      background: isActive ? `${ac}15` : 'transparent',
                      border: `1px solid ${isActive ? `${ac}40` : 'transparent'}`,
                      borderRadius: 10, color: isActive ? ac : '#66736C',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      fontWeight: isActive ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#66736C' }}
                  >
                    {f.toUpperCase()}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4" stroke="#66736C" strokeWidth="1.3"/>
                <path d="M9.5 9.5L12 12" stroke="#66736C" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by zone, Mukam or incident…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem',
                  background: '#111714', border: '1px solid #28332D',
                  borderRadius: 12, padding: '7px 14px 7px 30px',
                  color: '#F3F6F4', outline: 'none', width: 280,
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#3D4F47'}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#28332D'}
              />
            </div>
          </div>

          {/* ── Master / Detail ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '38% 1fr',
            gap: 14,
            flex: 1,
            minHeight: 0,
          }}
          className="incidents-grid"
          >
            {/* Left — queue */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              background: '#111714', border: '1px solid #28332D', borderRadius: 24,
              padding: '14px 10px 14px 14px',
              minHeight: 0, overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
                letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase',
                marginBottom: 10, paddingLeft: 4, flexShrink: 0,
              }}>
                {filtered.length} {filtered.length === 1 ? 'INCIDENT' : 'INCIDENTS'}
                {activeFilter !== 'all' && (
                  <span style={{ color: '#3D4F47' }}> · {activeFilter.toUpperCase()}</span>
                )}
              </div>

              {filtered.length === 0 && searchQuery ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 8, padding: 24 }}>
                  <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#9AA7A0', textAlign: 'center' }}>
                    No matching incidents
                  </div>
                  <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#66736C', textAlign: 'center' }}>
                    Try searching by Mukam, zone, or incident type.
                  </div>
                </div>
              ) : (
                <IncidentQueue
                  incidents={filtered}
                  selectedId={selectedId}
                  deployment={deployment}
                  onSelect={setSelectedId}
                />
              )}
            </div>

            {/* Right — detail */}
            <IncidentDetail
              incident={selectedIncident}
              deployment={deployment}
              allResources={resources}
              onOpenDeploy={handleOpenDeployForIncident}
              onMarkResolved={markResolved}
            />
          </div>

        </div>
      </div>

      {/* Deployment panel — shared, same as CommandCentre */}
      {deployment.phase === 'selecting' && deployment.incident && (
        <DeploymentPanel
          deployment={deployment}
          resources={resources}
          alert={{
            id:             deployment.incident.id,
            zoneId:         deployment.incident.zoneId,
            zoneLabel:      deployment.incident.zoneLabel,
            severity:       deployment.incident.severity as import('../data/mockCommandData').ZoneStatus,
            title:          deployment.incident.title,
            description:    deployment.incident.title,
            timeToEvent:    deployment.incident.timeToEvent,
            currentLoad:    deployment.incident.currentLoad,
            predictedLoad:  deployment.incident.predictedLoad,
            recommendation: deployment.incident.recommendedAction,
          }}
          mukamId={deployment.incident.mukamId}
          onToggleResource={toggleResource}
          onConfirm={confirmDeployment}
          onCancel={cancelDeployment}
        />
      )}
    </div>
  )
}
