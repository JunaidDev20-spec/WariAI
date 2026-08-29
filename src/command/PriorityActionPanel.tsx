// ── PriorityActionPanel.tsx ───────────────────────────────────────────────
// Right-column priority action panel.
// Renders different content based on DeployPhase from useResponseOperations.
// No internal deploy state — all state comes from the hook via props.

import { useEffect, useRef } from 'react'
import MonoTag from '../components/MonoTag'
import { SEVERITY_COLOR, type Alert } from '../data/mockCommandData'
import type { OperationalResource } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'

interface Props {
  alert: Alert
  mukamId: string
  deployment: DeploymentState   // always provided — guarded internally
  assignedResources: OperationalResource[]
  deploymentAvailable: boolean  // true when cleanliness demand is HIGH/CRITICAL
  onOpenDeploy: () => void
  onMarkResolved: () => void
}

export default function PriorityActionPanel({
  alert, mukamId, deployment, assignedResources, deploymentAvailable, onOpenDeploy, onMarkResolved,
}: Props) {
  // Safe fallback — treat missing deployment as idle
  const phase = deployment?.phase ?? 'idle'

  // Reset scroll on phase change
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bodyRef.current?.scrollTo(0, 0) }, [phase])

  const sevColor   = SEVERITY_COLOR[alert.severity]
  const isCritical = alert.severity === 'critical'
  const borderColor = phase === 'idle'
    ? (isCritical ? 'rgba(239,91,91,0.28)' : `${sevColor}30`)
    : phase === 'active'
      ? 'rgba(45,212,168,0.3)'
      : 'rgba(45,212,168,0.18)'
  const headerBg = phase === 'idle'
    ? (isCritical ? 'linear-gradient(150deg,rgba(239,91,91,0.09) 0%,transparent 60%)' : `linear-gradient(150deg,${sevColor}0F 0%,transparent 60%)`)
    : 'linear-gradient(150deg,rgba(45,212,168,0.06) 0%,transparent 60%)'

  return (
    <div
      className="cc-right-enter"
      style={{
        background: '#111714',
        border: `1px solid ${borderColor}`,
        borderRadius: 28,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 14px', background: headerBg, borderBottom: '1px solid #1C2520' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase' }}>
            {phase === 'idle' ? 'Priority Action' : phase === 'active' ? 'Response Active' : phase === 'resolved' ? 'Incident Resolved' : 'Response Deployed'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: phase === 'idle' ? `${sevColor}1A` : 'rgba(45,212,168,0.1)',
            border: `1px solid ${phase === 'idle' ? `${sevColor}45` : 'rgba(45,212,168,0.28)'}`,
            borderRadius: 8, padding: '3px 10px',
            transition: 'all 0.3s ease',
          }}>
            <span
              className={phase === 'idle' && isCritical ? 'live-dot' : phase === 'active' ? 'live-dot' : ''}
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: phase === 'idle' ? sevColor : '#2DD4A8',
                display: 'inline-block', transition: 'background 0.3s ease',
              }}
            />
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.08em',
              color: phase === 'idle' ? sevColor : '#2DD4A8',
              transition: 'color 0.3s ease',
            }}>
              {phase === 'idle'    ? alert.severity.toUpperCase()
               : phase === 'confirming' ? 'DEPLOYING'
               : phase === 'en_route'   ? 'EN ROUTE'
               : phase === 'active'     ? 'ACTIVE'
               : phase === 'resolved'   ? 'RESOLVED'
               : alert.severity.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.875rem', letterSpacing: '0.06em', color: '#F3F6F4', fontWeight: 600 }}>
            {alert.zoneLabel}
          </span>
          <MonoTag color="default">{mukamId}</MonoTag>
        </div>
      </div>

      {/* ── Body ── */}
      <div ref={bodyRef} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>

        {/* ═══════════════════════════════════ IDLE — normal alert view ═══ */}
        {phase === 'idle' && (<>
          <div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '1rem', color: sevColor, marginBottom: 4, lineHeight: 1.2 }}>
              {alert.title}
            </div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0', lineHeight: 1.5 }}>
              {alert.description} in
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: 'clamp(2rem,3.5vw,2.75rem)', color: sevColor, lineHeight: 1, letterSpacing: '-0.025em' }}>
                {alert.timeToEvent}
              </span>
              <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '1rem', color: '#9AA7A0' }}>MINUTES</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Current Load',   value: `${alert.currentLoad ?? 0}%`,   accent: '#F28B4B' },
              { label: 'Predicted Load', value: `${alert.predictedLoad ?? 0}%`, accent: sevColor  },
            ].map(({ label, value, accent }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>{label}</span>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: accent }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 4 }}>
              <div style={{ height: 5, background: '#1C2520', borderRadius: 999, position: 'relative', overflow: 'visible' }}>
                <div style={{ width: `${Math.min(alert.currentLoad ?? 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#2DD4A8 0%,#E8C45A 60%,#F28B4B 100%)', borderRadius: 999, position: 'absolute' }} />
                <div style={{ position: 'absolute', left: '100%', top: -2, bottom: -2, width: 2, background: sevColor, borderRadius: 1, boxShadow: `0 0 4px ${sevColor}` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', color: '#66736C' }}>0%</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', color: sevColor }}>OVERFLOW</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />
          <div style={{ background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 14, padding: '10px 14px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.12em', color: '#66736C', marginBottom: 6, textTransform: 'uppercase' }}>
              Recommended Action
            </div>
            <p style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#BCC8C1', lineHeight: 1.55, margin: 0 }}>
              {alert.recommendation}
            </p>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 4 }}>
            <button
              onClick={onOpenDeploy}
              className="btn-base deploy-pulse"
              style={{
                width: '100%', height: 44, background: deploymentAvailable ? '#EF5B5B' : '#2DD4A8', color: '#060F0C',
                border: 'none', borderRadius: 16, fontFamily: 'Manrope,sans-serif',
                fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.06em',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
            >
              {deploymentAvailable ? 'DEPLOY CLEANLINESS TEAM' : 'DEPLOY RESPONSE'}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {deploymentAvailable && (
              <div style={{ marginTop: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.625rem', letterSpacing: '0.08em', color: '#EF5B5B', textAlign: 'center' }}>
                HIGH CLEANLINESS DEMAND - DEPLOYMENT RECOMMENDED
              </div>
            )}
          </div>
        </>)}

        {/* ═══════════════════════════ CONFIRMING / EN_ROUTE / ACTIVE ════ */}
        {(phase === 'confirming' || phase === 'en_route' || phase === 'active') && (<>

          {/* Assigned resources */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase', marginBottom: 10 }}>
              Assigned Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {assignedResources.map((r, i) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: 'rgba(45,212,168,0.06)',
                    border: '1px solid rgba(45,212,168,0.18)',
                    borderRadius: 12,
                    animation: `ccFadeUp 0.25s ${i * 0.08}s ease both`,
                  }}
                >
                  <span className={phase === 'active' ? 'live-dot' : ''}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#2DD4A8', fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0', marginTop: 1 }}>
                      {phase === 'en_route' ? `ETA ${r.estimatedResponseTime} min` : phase === 'active' ? `Operating in ${alert.zoneLabel}` : 'Assigned'}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>
                    {phase === 'confirming' ? 'ASSIGNED' : phase === 'en_route' ? 'EN ROUTE' : 'ACTIVE'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* Overall status */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 0',
            background: phase === 'active' ? 'rgba(45,212,168,0.06)' : 'transparent',
            borderRadius: 14,
            transition: 'background 0.4s ease',
          }}>
            <span className={phase === 'active' ? 'live-dot' : ''}
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.1em', color: '#2DD4A8' }}>
              {phase === 'confirming' ? 'DEPLOYING...'
               : phase === 'en_route' ? 'EN ROUTE TO ' + alert.zoneLabel
               : 'RESPONSE ACTIVE — ' + alert.zoneLabel}
            </span>
          </div>

          {/* MARK RESOLVED — only when active */}
          {phase === 'active' && (
            <div style={{ marginTop: 'auto', paddingTop: 4 }}>
              <button
                onClick={onMarkResolved}
                style={{
                  width: '100%', height: 40,
                  background: 'rgba(45,212,168,0.08)',
                  border: '1px solid rgba(45,212,168,0.28)',
                  borderRadius: 14,
                  fontFamily: 'Manrope,sans-serif', fontWeight: 600,
                  fontSize: '0.875rem', letterSpacing: '0.05em',
                  color: '#2DD4A8', cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
                onMouseEnter={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'rgba(45,212,168,0.14)', borderColor: 'rgba(45,212,168,0.45)' }) }}
                onMouseLeave={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { background: 'rgba(45,212,168,0.08)', borderColor: 'rgba(45,212,168,0.28)' }) }}
              >
                MARK RESOLVED
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5l3.5 3.5 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </>)}

        {/* ══════════════════════════════════════════════ RESOLVED ════════ */}
        {phase === 'resolved' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '12px 0', textAlign: 'center' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(45,212,168,0.1)', border: '1px solid rgba(45,212,168,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4 4 8-8" stroke="#2DD4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#2DD4A8' }}>
              Incident Resolved
            </div>
            <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>
              Resources returning to standby.
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
