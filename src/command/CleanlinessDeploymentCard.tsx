// ── CleanlinessDeploymentCard.tsx ───────────────────────────────────────────
// Consolidates the former PriorityActionPanel + the cleanliness/demand
// summary that lived in BottomIntelligenceStrip + the sanitation resource
// summary that lived in SanitationForecastPanel (top section only — the full
// toilet/dustbin inventory table stays on the Resources + Intelligence pages).
//
// Drives M1 live CCTV population, cleanliness demand %, demand level
// (LOW/MODERATE/HIGH/CRITICAL), required-vs-available sanitation resources
// and the DEPLOY CLEANLINESS TEAM action in one card.
//
// All deployment lifecycle phases (idle / confirming / en_route / active /
// resolved) are preserved verbatim from PriorityActionPanel.

import { useEffect, useRef } from 'react'
import MonoTag from '../components/MonoTag'
import { SEVERITY_COLOR, type Alert } from '../data/mockCommandData'
import type { OperationalResource } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'
import type { CleanlinessDemand } from '../api/operationsApi'
import {
  getMukamForecast, computeSanitation,
  SANITATION_STATUS_COLOR, type SanitationStatus,
} from '../intelligence/m2m3Data'

interface Props {
  alert: Alert
  mukamId: string
  deployment: DeploymentState        // always provided — guarded internally
  assignedResources: OperationalResource[]
  deploymentAvailable: boolean       // true when cleanliness demand is HIGH/CRITICAL
  cleanlinessDemand: CleanlinessDemand | null
  onOpenDeploy: () => void
  onMarkResolved: () => void
}

const MONO: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono',monospace",
}

function StatusBadge({ status }: { status: SanitationStatus }) {
  const color = SANITATION_STATUS_COLOR[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: `${color}14`, border: `1px solid ${color}30`,
      borderRadius: 8, padding: '3px 10px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color, fontWeight: 500 }}>
        {status}
      </span>
    </div>
  )
}

function UtilBlock({ label, available, required }: {
  label: string; available: number; required: number
}) {
  const util = required === 0 ? 0 : Math.round((required / available) * 100)
  const color = util > 100 ? '#EF5B5B' : util >= 85 ? '#F28B4B' : util >= 60 ? '#E8C45A' : '#2DD4A8'
  return (
    <div style={{
      background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520',
      borderRadius: 12, padding: '8px 12px', minWidth: 0,
    }}>
      <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F3F6F4', lineHeight: 1 }}>
        {required.toLocaleString()} <span style={{ color: '#66736C' }}> / {available.toLocaleString()}</span>
      </div>
      <div style={{ height: 4, background: '#1C2520', borderRadius: 999, marginTop: 5, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.08em', color: '#66736C', marginTop: 3 }}>
        {util}% utilization
      </div>
    </div>
  )
}

// ── Cleanliness + sanitation summary (shown in idle state) ──────────────────
function CleanlinessSummary({
  mukamId, cleanlinessDemand, deploymentAvailable,
}: {
  mukamId: string
  cleanlinessDemand: CleanlinessDemand | null
  deploymentAvailable: boolean
}) {
  const plan = computeSanitation(getMukamForecast(mukamId))

  const demandPercent = cleanlinessDemand?.percent ?? 0
  const demandLevel   = cleanlinessDemand?.level ?? 'LOW'
  const sanColor      = demandPercent > 90 ? '#EF5B5B' : demandPercent > 75 ? '#F28B4B' : demandPercent > 55 ? '#E8C45A' : '#2DD4A8'
  const cctvPop       = cleanlinessDemand?.current_population ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* M1 live CCTV population + cleanliness demand */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520',
        borderRadius: 12, padding: '10px 12px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <div style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>M1 LIVE CCTV · {cleanlinessDemand?.mukamId ?? mukamId}</div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F3F6F4' }}>
            {cctvPop.toLocaleString()} pilgrims
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sanColor, display: 'inline-block' }} />
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: sanColor, fontWeight: 600 }}>
              {demandLevel}
            </span>
          </div>
          <span style={{ ...MONO, fontSize: '0.8125rem', letterSpacing: '0.06em', color: '#F3F6F4' }}>
            {demandPercent}%
          </span>
        </div>
      </div>

      {/* Sanitation resource summary — Required / Available / Utilization / Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase' }}>
          Sanitation Resources · {plan.forecastPopulation.toLocaleString()} projected @ +60min
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <UtilBlock label="TOILETS" available={plan.availableToilets}  required={plan.requiredToilets}  />
          <UtilBlock label="DUSTBINS" available={plan.availableDustbins} required={plan.requiredDustbins} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.1em', color: '#66736C' }}>Overall status</span>
          <StatusBadge status={plan.status} />
        </div>
       </div>
    </div>
  )
}

export default function CleanlinessDeploymentCard({
  alert, mukamId, deployment, assignedResources, deploymentAvailable,
  cleanlinessDemand, onOpenDeploy, onMarkResolved,
}: Props) {
  const phase = deployment?.phase ?? 'idle'
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
      className="cc-right-enter cc-right-card"
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
      <div style={{
        padding: '12px 18px 12px', background: headerBg,
        borderBottom: '1px solid #1C2520',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase' }}>
            {phase === 'idle' ? 'Priority Action' : phase === 'active' ? 'Response Active' : phase === 'resolved' ? 'Incident Resolved' : phase === 'confirming' ? 'Deploying' : phase === 'en_route' ? 'En Route' : 'Response Deployed'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: phase === 'idle' ? `${sevColor}1A` : 'rgba(45,212,168,0.1)',
            border: `1px solid ${phase === 'idle' ? `${sevColor}45` : 'rgba(45,212,168,0.28)'}`,
            borderRadius: 8, padding: '3px 10px', transition: 'all 0.3s ease',
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
              ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em',
              color: phase === 'idle' ? sevColor : '#2DD4A8', transition: 'color 0.3s ease',
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
          <span style={{ ...MONO, fontSize: '0.875rem', letterSpacing: '0.06em', color: '#F3F6F4', fontWeight: 600 }}>
            {alert.zoneLabel}
          </span>
          <MonoTag color="default">{mukamId}</MonoTag>
        </div>
      </div>

      {/* ── Body ── */}
      <div ref={bodyRef} style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>Current Load</span>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F28B4B' }}>{alert.currentLoad ?? 0}%</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>Predicted Load</span>
                <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: sevColor }}>{alert.predictedLoad ?? 0}%</span>
              </div>
            </div>
            <div style={{ height: 5, background: '#1C2520', borderRadius: 999, position: 'relative', overflow: 'visible' }}>
              <div style={{ width: `${Math.min(alert.currentLoad ?? 0, 100)}%`, height: '100%', background: 'linear-gradient(90deg,#2DD4A8 0%,#E8C45A 60%,#F28B4B 100%)', borderRadius: 999, position: 'absolute' }} />
              <div style={{ position: 'absolute', left: '100%', top: -2, bottom: -2, width: 2, background: sevColor, borderRadius: 1, boxShadow: `0 0 4px ${sevColor}` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ ...MONO, fontSize: '0.688rem', color: '#66736C' }}>0%</span>
              <span style={{ ...MONO, fontSize: '0.688rem', color: sevColor }}>OVERFLOW</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* Cleanliness + sanitation resource summary */}
          <CleanlinessSummary
            mukamId={mukamId}
            cleanlinessDemand={cleanlinessDemand}
            deploymentAvailable={deploymentAvailable}
          />

          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.12em', color: '#66736C', textTransform: 'uppercase' }}>
            Recommended Action
          </div>
          <p style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#BCC8C1', lineHeight: 1.55, margin: 0 }}>
            {alert.recommendation}
          </p>

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
              <div style={{ marginTop: 6, ...MONO, fontSize: '0.625rem', letterSpacing: '0.08em', color: '#EF5B5B', textAlign: 'center' }}>
                HIGH CLEANLINESS DEMAND - DEPLOYMENT RECOMMENDED
              </div>
            )}
          </div>
        </>)}

        {/* ═══════════════════════════ CONFIRMING / EN_ROUTE / ACTIVE ════ */}
        {(phase === 'confirming' || phase === 'en_route' || phase === 'active') && (<>

          {/* Assigned resources */}
          <div>
            <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase', marginBottom: 10 }}>
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
                    <div style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#2DD4A8', fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0', marginTop: 1 }}>
                      {phase === 'en_route' ? `ETA ${r.estimatedResponseTime} min` : phase === 'active' ? `Operating in ${alert.zoneLabel}` : 'Assigned'}
                    </div>
                  </div>
                  <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>
                    {phase === 'confirming' ? 'ASSIGNED' : phase === 'en_route' ? 'EN ROUTE' : 'ACTIVE'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* Compact cleanliness status (always visible during response) */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 12,
            padding: '8px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.1em', color: '#66736C' }}>
                Cleanliness demand {cleanlinessDemand ? `${cleanlinessDemand.percent}% — ${cleanlinessDemand.level}` : '—'}
              </span>
            </div>
            <StatusBadge status={computeSanitation(getMukamForecast(mukamId)).status} />
          </div>

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
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.1em', color: '#2DD4A8' }}>
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
