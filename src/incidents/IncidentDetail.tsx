// ── IncidentDetail.tsx ────────────────────────────────────────────────────
// Right panel — full incident detail: header, operation block,
// timeline, assigned resources, and action area.
// Consumes existing DeploymentState and OperationalResource types.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import type { Incident, DeploymentState } from '../types/operations'
import type { OperationalResource } from '../data/mockResources'
import { resourceTypeLabel } from '../data/mockResources'

// ── Color maps ────────────────────────────────────────────────────────────

const SEV_COLORS: Record<string, string> = {
  critical: '#EF5B5B',
  high:     '#F28B4B',
  watch:    '#E8C45A',
  safe:     '#2DD4A8',
  forecast: '#9B8AFB',
}

function sevColor(s: string) { return SEV_COLORS[s] ?? '#9AA7A0' }

function relativeTime(ts: number): string {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
}

function hhMM(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Derive the "live" status from deployment if this incident is active ───

function resolveOpPhase(inc: Incident, dep: DeploymentState | null): string {
  if (dep?.incident?.id === inc.id) {
    const p = dep.phase
    if (p === 'selecting' || p === 'confirming') return 'deploying'
    if (p === 'en_route')  return 'en_route'
    if (p === 'active')    return 'active'
    if (p === 'resolved')  return 'resolved'
  }
  if (inc.status === 'resolved') return 'resolved'
  if (inc.status === 'active')   return 'active'
  if (inc.status === 'deployed') return 'en_route'
  return 'new'
}

// ── Timeline builder (deterministic from createdAt + status) ─────────────

interface TimelineEvent {
  time: string
  label: string
  description: string
  state: 'done' | 'current' | 'pending'
}

function buildTimeline(inc: Incident, opPhase: string): TimelineEvent[] {
  const base = inc.createdAt
  const events: TimelineEvent[] = [
    {
      time: hhMM(base),
      label: 'RISK DETECTED',
      description: 'AI model identified threshold breach in ' + inc.zoneLabel + '.',
      state: 'done',
    },
    {
      time: hhMM(base + 2 * 60000),
      label: 'ESCALATED TO ' + inc.severity.toUpperCase(),
      description: inc.zoneLabel + ' elevated to ' + inc.severity + ' status.',
      state: opPhase === 'new' ? 'current' : 'done',
    },
    {
      time: hhMM(base + 4 * 60000),
      label: 'RESPONSE DEPLOYED',
      description: 'Resources assigned and dispatched.',
      state: opPhase === 'deploying' ? 'current'
           : (opPhase === 'new' || opPhase === 'escalated') ? 'pending'
           : 'done',
    },
    {
      time: hhMM(base + 6 * 60000),
      label: 'EN ROUTE',
      description: 'Response team travelling to ' + inc.zoneLabel + '.',
      state: opPhase === 'en_route' ? 'current'
           : (opPhase === 'new' || opPhase === 'deploying') ? 'pending'
           : 'done',
    },
    {
      time: hhMM(base + 12 * 60000),
      label: 'RESPONSE ACTIVE',
      description: 'Resources operating in zone.',
      state: opPhase === 'active' ? 'current'
           : opPhase === 'resolved' ? 'done'
           : 'pending',
    },
    {
      time: opPhase === 'resolved' ? hhMM(base + 20 * 60000) : '—',
      label: 'RESOLVED',
      description: 'Incident contained. Resources returning to standby.',
      state: opPhase === 'resolved' ? 'done' : 'pending',
    },
  ]
  return events
}

// ── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
      letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase',
      marginBottom: 10,
    }}>
      {text}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#1C2520', margin: '4px 0' }} />
}

// ── Main export ───────────────────────────────────────────────────────────

interface Props {
  incident: Incident | null
  deployment: DeploymentState | null
  allResources: OperationalResource[]
  onOpenDeploy: (inc: Incident) => void
  onMarkResolved: () => void
}

export default function IncidentDetail({
  incident, deployment, allResources, onOpenDeploy, onMarkResolved,
}: Props) {

  // ── Empty state ───────────────────────────────────────────────────────
  if (!incident) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', flex: 1, gap: 12, padding: 40,
        background: '#111714', borderRadius: 24, border: '1px solid #28332D',
      }}>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: '#9AA7A0', textAlign: 'center' }}>
          Select an incident to view details
        </div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#66736C', textAlign: 'center', maxWidth: 220, lineHeight: 1.55 }}>
          Choose from the queue on the left.
        </div>
      </div>
    )
  }

  const sc         = sevColor(incident.severity)
  const opPhase    = resolveOpPhase(incident, deployment)
  const timeline   = useMemo(() => buildTimeline(incident, opPhase), [incident, opPhase])
  const isThisActive = deployment?.incident?.id === incident.id

  // Resources assigned to this specific incident
  const assigned = isThisActive && deployment?.incident
    ? allResources.filter(r => deployment.incident!.assignedResourceIds.includes(r.id))
    : incident.assignedResourceIds.length > 0
      ? allResources.filter(r => incident.assignedResourceIds.includes(r.id))
      : []

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#111714', border: '1px solid #28332D', borderRadius: 24,
      overflow: 'hidden', flex: 1, minHeight: 0,
    }}>
      {/* ── Header gradient ── */}
      <div style={{
        padding: '20px 24px 18px',
        background: `linear-gradient(150deg, ${sc}10 0%, transparent 55%)`,
        borderBottom: '1px solid #1C2520',
        flexShrink: 0,
      }}>
        {/* ID + severity badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.1em', color: '#66736C' }}>
            {incident.id}
          </span>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${sc}15`, border: `1px solid ${sc}38`,
            borderRadius: 9, padding: '3px 11px',
          }}>
            <span
              className={incident.severity === 'critical' && opPhase !== 'resolved' ? 'live-dot' : ''}
              style={{ width: 6, height: 6, borderRadius: '50%', background: sc, display: 'inline-block' }}
            />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: sc, fontWeight: 500 }}>
              {incident.severity.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'Manrope,sans-serif', fontWeight: 800,
          fontSize: '1.25rem', color: '#F3F6F4', lineHeight: 1.15, marginBottom: 8,
        }}>
          {incident.title}
        </div>

        {/* Location row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.07em', color: '#C8A96B', fontWeight: 500 }}>
            {incident.zoneLabel}
          </span>
          <span style={{ color: '#3D4F47' }}>·</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.07em', color: '#9AA7A0' }}>
            {incident.mukamId}
          </span>
        </div>

        {/* Detected */}
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#66736C' }}>
          Detected {relativeTime(incident.createdAt)}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* ── Current operation block ── */}
        <div>
          <SectionLabel text="Current Operation" />
          <OperationBlock incident={incident} opPhase={opPhase} isThisActive={isThisActive} deployment={deployment} />
        </div>

        <Divider />

        {/* ── AI recommendation ── */}
        {incident.recommendedAction && (
          <div>
            <SectionLabel text="Recommended Action" />
            <div style={{
              background: 'rgba(155,138,251,0.05)', border: '1px solid rgba(155,138,251,0.14)',
              borderRadius: 14, padding: '12px 14px',
            }}>
              <p style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#BCC8C1', lineHeight: 1.6, margin: 0 }}>
                {incident.recommendedAction}
              </p>
            </div>
          </div>
        )}

        <Divider />

        {/* ── Timeline ── */}
        <div>
          <SectionLabel text="Incident Timeline" />
          <Timeline events={timeline} />
        </div>

        <Divider />

        {/* ── Assigned resources ── */}
        <div>
          <SectionLabel text="Assigned Resources" />
          {assigned.length === 0 ? (
            <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#66736C', fontStyle: 'italic' }}>
              No resources assigned
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {assigned.map(r => <ResourceRow key={r.id} resource={r} opPhase={opPhase} />)}
            </div>
          )}
        </div>

      </div>

      {/* ── Sticky action footer ── */}
      <ActionFooter
        incident={incident}
        opPhase={opPhase}
        isThisActive={isThisActive}
        onOpenDeploy={onOpenDeploy}
        onMarkResolved={onMarkResolved}
      />
    </div>
  )
}

// ── OperationBlock ─────────────────────────────────────────────────────────
function OperationBlock({ incident, opPhase, isThisActive, deployment }: {
  incident: Incident
  opPhase: string
  isThisActive: boolean
  deployment: DeploymentState | null
}) {
  const phase = isThisActive ? (deployment?.phase ?? 'idle') : opPhase

  const STATUS_MAP: Record<string, { label: string; color: string; desc: string }> = {
    new:       { label: 'AWAITING RESPONSE',   color: '#9AA7A0', desc: 'No response deployed yet.' },
    deploying: { label: 'DEPLOYING',            color: '#E8C45A', desc: 'Resources being dispatched.' },
    en_route:  { label: 'EN ROUTE',             color: '#2DD4A8', desc: 'Response team travelling to zone.' },
    active:    { label: 'RESPONSE ACTIVE',      color: '#2DD4A8', desc: 'Resources operating in zone.' },
    resolved:  { label: 'RESOLVED',             color: '#9AA7A0', desc: 'Incident contained.' },
  }

  const s = STATUS_MAP[phase] ?? STATUS_MAP.new
  const eta = deployment?.incident?.id === incident.id && phase === 'en_route'
    ? 'in progress'
    : undefined

  return (
    <div style={{
      background: '#171F1B', border: `1px solid ${s.color}22`,
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          className={phase === 'en_route' || phase === 'active' ? 'live-dot' : ''}
          style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }}
        />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.08em', color: s.color, fontWeight: 600 }}>
          {s.label}
        </span>
      </div>
      <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>
        {s.desc}
        {eta && <span style={{ marginLeft: 4, color: s.color }}>{eta}</span>}
      </div>
      {(incident.currentLoad !== undefined || incident.timeToEvent !== undefined) && (
        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #1C2520', paddingTop: 10, flexWrap: 'wrap' }}>
          {incident.currentLoad !== undefined && (
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C', marginBottom: 2 }}>LOAD</div>
              <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#F3F6F4' }}>{incident.currentLoad}%</div>
            </div>
          )}
          {incident.predictedLoad !== undefined && (
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C', marginBottom: 2 }}>PREDICTED</div>
              <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '1rem', color: incident.predictedLoad > 100 ? '#EF5B5B' : '#F28B4B' }}>{incident.predictedLoad}%</div>
            </div>
          )}
          {incident.timeToEvent !== undefined && phase !== 'resolved' && (
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C', marginBottom: 2 }}>ETA</div>
              <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#EF5B5B' }}>{incident.timeToEvent} MIN</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Timeline ───────────────────────────────────────────────────────────────
function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {events.map((ev, i) => {
        const isLast   = i === events.length - 1
        const dotColor = ev.state === 'done' ? '#3D4F47'
                       : ev.state === 'current' ? '#2DD4A8'
                       : '#1C2520'
        const dotBorder = ev.state === 'current' ? '#2DD4A8' : '#28332D'

        return (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            {/* Left: dot + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: dotColor,
                border: `1.5px solid ${dotBorder}`,
                boxShadow: ev.state === 'current' ? '0 0 8px rgba(45,212,168,0.4)' : 'none',
                animation: ev.state === 'current' ? 'livePulse 2.4s ease-in-out infinite' : 'none',
                marginTop: 2,
              }} />
              {!isLast && (
                <div style={{ width: 1, flex: 1, minHeight: 20, background: '#1C2520', margin: '3px 0' }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.08em', color: '#66736C' }}>
                  {ev.time}
                </span>
                <span style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem',
                  letterSpacing: '0.1em', fontWeight: 500,
                  color: ev.state === 'current' ? '#2DD4A8' : ev.state === 'done' ? '#9AA7A0' : '#3D4F47',
                }}>
                  {ev.label}
                </span>
              </div>
              <div style={{
                fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem',
                color: ev.state === 'pending' ? '#3D4F47' : '#9AA7A0',
                lineHeight: 1.45,
              }}>
                {ev.description}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Resource row ───────────────────────────────────────────────────────────
function ResourceRow({ resource, opPhase }: { resource: OperationalResource; opPhase: string }) {
  const statusColor = resource.status === 'active'   ? '#2DD4A8'
                    : resource.status === 'en_route'  ? '#2DD4A8'
                    : resource.status === 'assigned'  ? '#E8C45A'
                    : '#9AA7A0'
  const statusLabel = resource.status === 'en_route' ? 'EN ROUTE'
                    : resource.status === 'active'    ? 'ACTIVE'
                    : resource.status === 'assigned'  ? 'ASSIGNED'
                    : resource.status.toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '10px 14px',
      background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 13,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.06em', color: '#F3F6F4', fontWeight: 600 }}>
          {resource.name}
        </div>
        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0', marginTop: 2 }}>
          {resourceTypeLabel(resource.type)}
          {opPhase === 'en_route' && (
            <span style={{ marginLeft: 6, color: '#66736C' }}>· ETA {resource.estimatedResponseTime} MIN</span>
          )}
        </div>
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: `${statusColor}12`, border: `1px solid ${statusColor}28`,
        borderRadius: 8, padding: '2px 9px', flexShrink: 0,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.07em', color: statusColor }}>
          {statusLabel}
        </span>
      </div>
    </div>
  )
}

// ── Action footer ──────────────────────────────────────────────────────────
function ActionFooter({ incident, opPhase, isThisActive, onOpenDeploy, onMarkResolved }: {
  incident: Incident
  opPhase: string
  isThisActive: boolean
  onOpenDeploy: (inc: Incident) => void
  onMarkResolved: () => void
}) {
  const baseBtn: React.CSSProperties = {
    width: '100%', height: 42, borderRadius: 14,
    fontFamily: 'Manrope,sans-serif', fontWeight: 600,
    fontSize: '0.875rem', letterSpacing: '0.05em', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: 'none', transition: 'filter 0.15s ease',
  }

  return (
    <div style={{ padding: '14px 24px', borderTop: '1px solid #1C2520', flexShrink: 0 }}>
      {opPhase === 'new' && (
        <button
          onClick={() => onOpenDeploy(incident)}
          style={{ ...baseBtn, background: '#2DD4A8', color: '#060F0C' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
        >
          DEPLOY RESPONSE
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5h9M8 3l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {(opPhase === 'deploying' || opPhase === 'en_route') && (
        <div style={{ ...baseBtn, background: 'rgba(45,212,168,0.07)', border: '1px solid rgba(45,212,168,0.2)', color: '#2DD4A8', cursor: 'default' }}>
          <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }} />
          RESPONSE IN PROGRESS
        </div>
      )}
      {opPhase === 'active' && isThisActive && (
        <button
          onClick={onMarkResolved}
          style={{ ...baseBtn, background: 'rgba(45,212,168,0.08)', border: '1px solid rgba(45,212,168,0.28)', color: '#2DD4A8' }}
          onMouseEnter={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'rgba(45,212,168,0.14)', borderColor: 'rgba(45,212,168,0.45)' }) }}
          onMouseLeave={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'rgba(45,212,168,0.08)', borderColor: 'rgba(45,212,168,0.28)' }) }}
        >
          MARK RESOLVED
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5l3.5 3.5 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {opPhase === 'resolved' && (
        <div style={{ ...baseBtn, background: 'transparent', border: '1px solid #1C2520', color: '#66736C', cursor: 'default' }}>
          ✓ INCIDENT RESOLVED
        </div>
      )}
    </div>
  )
}
