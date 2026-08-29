// ── src/components/SanitationForecastPanel.tsx ─────────────────────────────
// M2/M3 sanitation planning panel (demo data only — see src/intelligence/m2m3Data.ts).
// Driven entirely by the selected Mukam id; switching Mukam re-derives everything.
//
// All toilet/dustbin figures are ESTIMATED DEMO values: M1 detects people,
// not actual toilet or dustbin usage, so these are planning estimates only.
// ─────────────────────────────────────────────────────────────────────────

import {
  getMukamForecast, computeSanitation,
  getMukamInfrastructure,
  SANITATION_STATUS_COLOR, type SanitationStatus,
  type ToiletRecord, type DustbinRecord,
} from '../intelligence/m2m3Data'
import { MUKAMS } from '../data/mockCommandData'

interface Props {
  mukamId: string
}

function StatusBadge({ status }: { status: SanitationStatus }) {
  const color = SANITATION_STATUS_COLOR[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: `${color}14`, border: `1px solid ${color}30`,
      borderRadius: 8, padding: '3px 10px',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
        letterSpacing: '0.08em', color, fontWeight: 500,
      }}>{status}</span>
    </div>
  )
}

function UtilBar({ label, value, available, required }: {
  label: string; value: number; available: number; required: number
}) {
  const color = SANITATION_STATUS_COLOR[
    value > 100 ? 'CRITICAL' : value >= 85 ? 'HIGH' : value >= 60 ? 'MODERATE' : 'LOW'
  ]
  const barPct = Math.min(100, value)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>{label}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.875rem', color }}>
          {value}%{value > 100 ? ' · OVER CAPACITY' : ''}
        </span>
      </div>
      <div style={{ height: 5, background: '#1C2520', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${barPct}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: '#66736C' }}>
          REQ {required.toLocaleString()}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: '#66736C' }}>
          AVAIL {available.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

export default function SanitationForecastPanel({ mukamId }: Props) {
  const f = getMukamForecast(mukamId)
  const plan = computeSanitation(f)
  const infra = getMukamInfrastructure(mukamId)
  const currentMukam = MUKAMS.find(m => m.id === mukamId)
  const mukamName = currentMukam?.name ?? mukamId
  const zoneLabel = currentMukam?.alert.zoneLabel ?? '—'

  const statusColor = (s: string) =>
    s === 'OPERATIONAL' ? '#2DD4A8' : s === 'PARTIAL' ? '#E8C45A' : '#EF5B5B'

  const renderTable = (title: string, count: number, rows: (ToiletRecord | DustbinRecord)[], idLabel: string) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem',
        letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase', marginBottom: 8,
      }}>{title} ({count.toLocaleString()})</div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px', gap: 8,
        padding: '6px 10px', background: 'rgba(243,246,244,0.03)', borderRadius: 8, marginBottom: 2,
      }}>
        {['Location', idLabel, 'Status', 'Capacity'].map(h => (
          <span key={h} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
            letterSpacing: '0.08em', color: '#66736C', textTransform: 'uppercase',
          }}>{h}</span>
        ))}
      </div>
      {rows.map(row => (
        <div key={row.id} style={{
          display: 'grid', gridTemplateColumns: '1fr 100px 90px 70px', gap: 8,
          padding: '5px 10px', borderTop: '1px solid #1C2520',
        }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#9AA7A0' }}>{row.location}</span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#F3F6F4' }}>{row.id}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor(row.status), display: 'inline-block' }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: statusColor(row.status) }}>{row.status}</span>
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#F3F6F4', textAlign: 'right' }}>{row.capacity}</span>
        </div>
      ))}
    </div>
  )

  return (
    <>
      <div
        className="cc-right-enter"
        style={{
          background: '#111714', border: '1px solid #28332D', borderRadius: 28,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px 12px',
          background: 'linear-gradient(150deg, rgba(45,212,168,0.07) 0%, transparent 60%)',
          borderBottom: '1px solid #1C2520',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem',
              letterSpacing: '0.16em', color: '#2DD4A8', textTransform: 'uppercase', marginBottom: 4,
            }}>M2 // M3 SANITATION PLANNING</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.5rem',
                color: '#F3F6F4', lineHeight: 1, letterSpacing: '-0.02em',
              }}>{plan.forecastPopulation.toLocaleString()}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>
                +60 min forecast
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
              letterSpacing: '0.1em', color: '#66736C', border: '1px solid #28332D',
              borderRadius: 6, padding: '2px 7px',
            }}>ESTIMATED · DEMO</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', color: '#9AA7A0' }}>
              +{f.growthPercent}% · {f.confidence}% conf
            </span>
          </div>
        </div>

        {/* Forecast strip: Now / +30 / +60 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #1C2520' }}>
          {[
            { label: 'NOW', value: f.currentPopulation, color: '#2DD4A8' },
            { label: '+30 MIN', value: f.forecast30Min, color: '#7DC3B9' },
            { label: '+60 MIN', value: f.forecast60Min, color: '#9B8AFB' },
          ].map((pt, i, arr) => (
            <div key={pt.label} style={{
              padding: '10px 14px',
              borderLeft: i > 0 ? '1px solid #1C2520' : 'none',
            }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>{pt.label}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1rem', color: pt.color, marginTop: 2 }}>
                {pt.value.toLocaleString()}
              </div>
              {i < arr.length - 1 && (
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', color: '#9AA7A0', marginTop: 1 }}>
                  +{Math.round((pt.value / f.currentPopulation - 1) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sanitation demand */}
        <div style={{ padding: '14px 20px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase' }}>
              Sanitation Demand · 1 / 50 people
            </span>
            <StatusBadge status={plan.status} />
          </div>

          <UtilBar label="Toilet utilization" value={plan.toiletUtilization} available={plan.availableToilets} required={plan.requiredToilets} />
          <UtilBar label="Dustbin utilization" value={plan.dustbinUtilization} available={plan.availableDustbins} required={plan.requiredDustbins} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 2 }}>
            <div style={{ background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 12, padding: '8px 12px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>TOILETS</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#F3F6F4' }}>
                {plan.requiredToilets.toLocaleString()} <span style={{ color: '#66736C' }}>/ {plan.availableToilets.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 12, padding: '8px 12px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#66736C' }}>DUSTBINS</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#F3F6F4' }}>
                {plan.requiredDustbins.toLocaleString()} <span style={{ color: '#66736C' }}>/ {plan.availableDustbins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo disclaimer */}
        <div style={{
          margin: '6px 16px 14px', padding: '8px 12px',
          border: '1px dashed #28332D', borderRadius: 10,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
          lineHeight: 1.5, color: '#66736C',
        }}>
          ESTIMATED DEMO VALUES. M1 detects people, not actual toilet/dustbin usage.
          Required = forecast ÷ 50 (1 per 50 people). Replace with M2/M3 API output later.
        </div>
      </div>

      {/* Infrastructure section */}
      <div style={{
        background: '#111714', border: '1px solid #28332D', borderRadius: 28,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          padding: '14px 20px 12px',
          background: 'linear-gradient(150deg, rgba(45,212,168,0.05) 0%, transparent 60%)',
          borderBottom: '1px solid #1C2520',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem',
            letterSpacing: '0.16em', color: '#2DD4A8', textTransform: 'uppercase',
          }}>MUKAM → ZONE → SANITATION INFRASTRUCTURE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#F3F6F4' }}>
              {mukamName}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', color: '#66736C' }}>
              {zoneLabel}
            </span>
          </div>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
            letterSpacing: '0.1em', color: '#66736C', border: '1px solid #28332D',
            borderRadius: 6, padding: '2px 7px', alignSelf: 'flex-start',
          }}>ESTIMATED · DEMO</div>
        </div>

        <div style={{ padding: '14px 20px 8px' }}>
          {renderTable('AVAILABLE TOILETS', plan.availableToilets, infra.toilets, 'Toilet ID')}
          {renderTable('AVAILABLE DUSTBINS', plan.availableDustbins, infra.dustbins, 'Dustbin ID')}
        </div>

        <div style={{
          margin: '6px 16px 14px', padding: '8px 12px',
          border: '1px dashed #28332D', borderRadius: 10,
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
          lineHeight: 1.5, color: '#66736C',
        }}>
          ESTIMATED DEMO VALUES. M1 detects people, not actual toilet/dustbin usage.
          Required = forecast ÷ 50 (1 per 50 people). Replace with M2/M3 API output later.
          Toilet/dustbin availability is currently hardcoded demo infrastructure data.
        </div>
      </div>
    </>
  )
}
