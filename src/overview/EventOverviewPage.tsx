// ── EventOverviewPage.tsx ─────────────────────────────────────────────────
// Page 05 — EVENT OVERVIEW
// System-wide operational summary of the Wari pilgrimage.
// Reads from liveState (already at App level) + MUKAMS static data.
// Zero new intervals, zero new state.
// ─────────────────────────────────────────────────────────────────────────

import AtmosphericBackground from '../components/AtmosphericBackground'
import { MUKAMS }            from '../data/mockCommandData'
import { INITIAL_RESOURCES } from '../data/mockResources'
import type { MukamLiveState } from '../simulation/simulationEngine'
import type { OperationalResource } from '../data/mockResources'

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
  liveState: MukamLiveState
  resources: OperationalResource[]
}

// ── Style shortcuts ───────────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' }

// ── Derive overall system status from live + static data ─────────────────
type OverallStatus = 'STABLE' | 'WATCH' | 'ELEVATED' | 'CRITICAL'

function deriveOverallStatus(liveState: MukamLiveState): OverallStatus {
  const critical = liveState?.metrics?.criticalZones ?? 0
  if (critical > 0) return 'CRITICAL'

  // Check all Mukams for high/watch zones
  const hasHigh  = MUKAMS.some(m => m.zones.some(z => z.status === 'high'))
  if (hasHigh) return 'ELEVATED'

  const hasWatch = MUKAMS.some(m => m.zones.some(z => z.status === 'watch'))
  if (hasWatch) return 'WATCH'

  return 'STABLE'
}

const OVERALL_CFG: Record<OverallStatus, { color: string; bg: string; border: string; desc: string }> = {
  STABLE:   { color: '#2DD4A8', bg: 'rgba(45,212,168,0.07)',  border: 'rgba(45,212,168,0.2)',  desc: 'All monitored sectors are operating within expected parameters.' },
  WATCH:    { color: '#E8C45A', bg: 'rgba(232,196,90,0.07)',  border: 'rgba(232,196,90,0.2)',  desc: 'Some zones are approaching elevated thresholds. Continued monitoring advised.' },
  ELEVATED: { color: '#F28B4B', bg: 'rgba(242,139,75,0.07)',  border: 'rgba(242,139,75,0.2)',  desc: 'One or more sectors are at high density. Pre-positioning of resources recommended.' },
  CRITICAL: { color: '#EF5B5B', bg: 'rgba(239,91,91,0.07)',   border: 'rgba(239,91,91,0.22)', desc: 'Critical conditions detected. Immediate operational response required.' },
}

// ── Mukam status row ──────────────────────────────────────────────────────
function getMukamStatus(m: typeof MUKAMS[0]): { label: string; color: string } {
  const hasCritical = m.zones.some(z => z.status === 'critical')
  const hasHigh     = m.zones.some(z => z.status === 'high')
  const hasWatch    = m.zones.some(z => z.status === 'watch')
  if (hasCritical) return { label: 'CRITICAL', color: '#EF5B5B' }
  if (hasHigh)     return { label: 'HIGH',     color: '#F28B4B' }
  if (hasWatch)    return { label: 'WATCH',    color: '#E8C45A' }
  return            { label: 'STABLE',  color: '#2DD4A8' }
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function EventOverviewPage({ liveState, resources }: Props) {
  // Safely derive metrics
  const totalPilgrimsLive = liveState?.metrics?.totalPilgrims ?? 0
  // Aggregate estimated event-wide crowd across all Mukams (deterministic)
  const totalCrowdAllMukams = MUKAMS.reduce((sum, m) =>
    sum + m.zones.reduce((zSum, z) => zSum + z.crowd, 0), 0
  )
  // Use live value for current Mukam, pad with other Mukams' static values
  const displayCrowd = totalPilgrimsLive > 0
    ? totalPilgrimsLive + (totalCrowdAllMukams - (MUKAMS[0]?.zones.reduce((s, z) => s + z.crowd, 0) ?? 0))
    : totalCrowdAllMukams

  const activeMukams    = MUKAMS.length
  const criticalCount   = liveState?.metrics?.criticalZones ?? 0
  const deployedCount   = (resources ?? INITIAL_RESOURCES).filter(r =>
    r.status === 'en_route' || r.status === 'active' || r.status === 'assigned'
  ).length

  const overallStatus = deriveOverallStatus(liveState)
  const cfg = OVERALL_CFG[overallStatus]
  const lastUpdate = liveState?.metrics?.lastUpdate ?? '—'

  // Derive system insight from highest-risk Mukam
  const highestRiskMukam = MUKAMS.find(m => m.zones.some(z => z.status === 'critical'))
    ?? MUKAMS.find(m => m.zones.some(z => z.status === 'high'))
    ?? MUKAMS[0]

  const insight = criticalCount > 0
    ? `${highestRiskMukam.name} has active critical zone conditions. Sanitation and crowd management resources should be prioritised in this sector.`
    : `Crowd movement is progressing steadily along monitored Mukam corridors. Watch-level conditions exist in ${MUKAMS.filter(m => m.zones.some(z => z.status === 'watch')).length} sectors. Continued monitoring is advised.`

  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AtmosphericBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 28px 14px', borderBottom: '1px solid #1C2520', flexShrink: 0,
        }}>
          <div>
            <div style={{ ...SANS, fontWeight: 800, fontSize: '1.375rem', color: '#F3F6F4', lineHeight: 1 }}>
              EVENT OVERVIEW
            </div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              System-wide operational intelligence
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block', boxShadow: '0 0 6px rgba(45,212,168,0.55)' }} />
              <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>LIVE SYSTEM</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...MONO, fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>LAST SYNC</span>
              <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.06em', color: '#9AA7A0' }}>{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 28px 24px', overflowY: 'auto' }}>

          {/* ── 1. Primary status ── */}
          <div style={{
            background: '#111714', border: `1px solid ${cfg.border}`,
            borderRadius: 24, padding: '22px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 20, flexShrink: 0,
          }}>
            <div>
              <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.18em', color: '#66736C', marginBottom: 8 }}>
                OPERATIONAL STATUS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className={overallStatus === 'CRITICAL' ? 'live-dot' : ''}
                  style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 8px ${cfg.color}55` }}
                />
                <span style={{ ...SANS, fontWeight: 800, fontSize: 'clamp(1.75rem,3.5vw,2.5rem)', color: cfg.color, lineHeight: 1, letterSpacing: '-0.01em' }}>
                  {overallStatus}
                </span>
              </div>
              <div style={{ ...SANS, fontSize: '0.9rem', color: '#9AA7A0', marginTop: 10, maxWidth: 480, lineHeight: 1.55 }}>
                {cfg.desc}
              </div>
            </div>
            {/* Wari route indicator — subtle spatial accent */}
            <svg width="120" height="60" viewBox="0 0 120 60" style={{ flexShrink: 0, opacity: 0.35 }}>
              <path d="M 10 50 C 30 30, 50 20, 60 28 C 70 36, 90 15, 110 10"
                fill="none" stroke="#C8A96B" strokeWidth="1.2" strokeDasharray="4 5" strokeLinecap="round" />
              {[20, 45, 65, 95].map((x, i) => (
                <circle key={i} cx={x} cy={[42, 25, 30, 14][i]} r="3"
                  fill="none" stroke={cfg.color} strokeWidth="1.2" />
              ))}
              <circle cx={65} cy={30} r="4.5" fill={cfg.color} opacity="0.6" />
            </svg>
          </div>

          {/* ── 2. System metrics strip ── */}
          <div style={{
            background: '#111714', border: '1px solid #28332D', borderRadius: 20,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {[
              { label: 'EST. CROWD',         value: (displayCrowd / 1000000).toFixed(2) + 'M', color: '#F3F6F4' },
              { label: 'ACTIVE MUKAMS',       value: String(activeMukams).padStart(2,'0'),       color: '#2DD4A8' },
              { label: 'CRITICAL INCIDENTS',  value: String(criticalCount).padStart(2,'0'),       color: criticalCount > 0 ? '#EF5B5B' : '#66736C' },
              { label: 'DEPLOYED RESOURCES',  value: String(deployedCount).padStart(2,'0'),       color: deployedCount > 0 ? '#E8C45A' : '#66736C' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{
                padding: '14px 20px',
                borderRight: i < arr.length - 1 ? '1px solid #1C2520' : 'none',
              }}>
                <div style={{ ...SANS, fontWeight: 800, fontSize: 'clamp(1.25rem,2vw,1.75rem)', color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {value}
                </div>
                <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.13em', color: '#66736C', marginTop: 5 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ── 3. Mukam status + Insight — side by side on desktop ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1 }}
            className="overview-bottom-grid">

            {/* Mukam status list */}
            <div style={{
              background: '#111714', border: '1px solid #28332D', borderRadius: 24,
              padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 0,
            }}>
              <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase', marginBottom: 12 }}>
                Mukam Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {MUKAMS.map((m, i) => {
                  const mStatus = getMukamStatus(m)
                  const crowd   = m.zones.reduce((s, z) => s + z.crowd, 0)
                  const isLast  = i === MUKAMS.length - 1
                  return (
                    <div key={m.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ ...MONO, fontSize: '0.8125rem', letterSpacing: '0.07em', color: '#C8A96B', fontWeight: 600 }}>
                              {m.id}
                            </span>
                            <span style={{ color: '#3D4F47' }}>—</span>
                            <span style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.location}
                            </span>
                          </div>
                          <div style={{ ...SANS, fontSize: '0.75rem', color: '#66736C', marginTop: 2 }}>
                            {crowd.toLocaleString()} pilgrims
                          </div>
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
                          background: `${mStatus.color}10`, border: `1px solid ${mStatus.color}28`,
                          borderRadius: 8, padding: '2px 9px',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: mStatus.color, display: 'inline-block' }} />
                          <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.08em', color: mStatus.color }}>
                            {mStatus.label}
                          </span>
                        </div>
                      </div>
                      {!isLast && <div style={{ height: 1, background: '#1C2520' }} />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* System insight */}
            <div style={{
              background: '#111714', border: '1px solid #28332D', borderRadius: 24,
              padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase' }}>
                System Insight
              </div>

              {/* Primary insight */}
              <div style={{
                background: 'rgba(155,138,251,0.05)', border: '1px solid rgba(155,138,251,0.14)',
                borderRadius: 16, padding: '14px 16px',
              }}>
                <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#9B8AFB', marginBottom: 8 }}>
                  OPERATIONAL SIGNAL
                </div>
                <p style={{ ...SANS, fontSize: '0.9375rem', color: '#BCC8C1', lineHeight: 1.65, margin: 0 }}>
                  {insight}
                </p>
              </div>

              {/* Event vitals */}
              <div>
                <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', marginBottom: 10 }}>
                  EVENT VITALS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Route',    value: 'Dehu–Pandharpur Pilgrimage Route' },
                    { label: 'Mukams',   value: `${MUKAMS.length} active monitoring points` },
                    { label: 'Forecast', value: liveState?.forecast60Delta ? `+${liveState.forecast60Delta} in 60 min` : 'Calculating…' },
                    { label: 'AI Conf.', value: liveState?.metrics?.aiConfidence ? `${liveState.metrics.aiConfidence.toFixed(1)}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.1em', color: '#66736C' }}>{label}</span>
                      <span style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0', textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highest-risk callout */}
              {criticalCount > 0 && (
                <div style={{
                  background: 'rgba(239,91,91,0.06)', border: '1px solid rgba(239,91,91,0.2)',
                  borderRadius: 14, padding: '10px 14px',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF5B5B', display: 'inline-block' }} />
                    <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.1em', color: '#EF5B5B' }}>
                      CRITICAL ALERT ACTIVE
                    </span>
                  </div>
                  <div style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0' }}>
                    {liveState?.alert?.zoneLabel ?? 'Zone'} in {liveState?.mukamId ?? highestRiskMukam.id} — immediate attention required.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
