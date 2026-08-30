// ── ResourcesPage.tsx ─────────────────────────────────────────────────────
// Page 04 — RESOURCES
// Operational fleet view. Reads live resource state from useResponseOperations
// (passed from App). Zero new intervals, zero new simulation.
// ─────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import AtmosphericBackground from '../components/AtmosphericBackground'
import { resourceTypeLabel, type OperationalResource, type ResourceStatus } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'

// ── Props ─────────────────────────────────────────────────────────────────
interface Props {
  resources: OperationalResource[]
  deployment: DeploymentState
}

// ── Shared style shortcuts ────────────────────────────────────────────────
const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
const SANS: React.CSSProperties = { fontFamily: 'Manrope, sans-serif' }

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CFG: Record<ResourceStatus, { color: string; label: string; pulse: boolean }> = {
  available:   { color: '#2DD4A8', label: 'AVAILABLE',   pulse: false },
  assigned:    { color: '#E8C45A', label: 'ASSIGNED',    pulse: false },
  en_route:    { color: '#2DD4A8', label: 'EN ROUTE',    pulse: true  },
  active:      { color: '#2DD4A8', label: 'ACTIVE',      pulse: true  },
  resolved:    { color: '#66736C', label: 'RESOLVED',    pulse: false },
  unavailable: { color: '#66736C', label: 'UNAVAILABLE', pulse: false },
}

function statusCfg(s: ResourceStatus) {
  return STATUS_CFG[s] ?? STATUS_CFG.unavailable
}

// ── Summary strip ─────────────────────────────────────────────────────────
function SummaryStrip({ resources }: { resources: OperationalResource[] }) {
  const total     = resources.length
  const available = resources.filter(r => r.status === 'available').length
  const enRoute   = resources.filter(r => r.status === 'en_route').length
  const active    = resources.filter(r => r.status === 'active').length

  const sections = [
    { label: 'TOTAL',     value: total,     color: '#F3F6F4' },
    { label: 'AVAILABLE', value: available, color: '#2DD4A8' },
    { label: 'EN ROUTE',  value: enRoute,   color: '#E8C45A' },
    { label: 'ACTIVE',    value: active,    color: '#9B8AFB' },
  ]

  return (
    <div style={{
      background: '#111714', border: '1px solid #28332D', borderRadius: 20,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {sections.map(({ label, value, color }, i) => (
        <div key={label} style={{
          padding: '14px 20px',
          borderRight: i < sections.length - 1 ? '1px solid #1C2520' : 'none',
        }}>
          <div style={{ ...SANS, fontWeight: 800, fontSize: 'clamp(1.375rem,2.2vw,1.875rem)', color, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {String(value).padStart(2, '0')}
          </div>
          <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', marginTop: 5 }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Resource list row ─────────────────────────────────────────────────────
function ResourceRow({
  resource, isSelected, onClick,
}: { resource: OperationalResource; isSelected: boolean; onClick: () => void }) {
  const cfg = statusCfg(resource.status)

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 5,
        padding: '12px 14px',
        background: isSelected ? '#171F1B' : '#111714',
        border: isSelected ? `1px solid ${cfg.color}38` : '1px solid #1C2520',
        borderLeft: `3px solid ${isSelected ? cfg.color : 'transparent'}`,
        borderRadius: 16, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#141C18' }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = '#111714' }}
    >
      {/* Status + ID */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className={cfg.pulse ? 'live-dot' : ''}
            style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }}
          />
          <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.09em', color: cfg.color, fontWeight: 500 }}>
            {cfg.label}
          </span>
        </div>
        {!isSelected && <span style={{ color: '#3D4F47', fontSize: '0.8rem' }}>›</span>}
      </div>

      {/* Name */}
      <div style={{ ...MONO, fontSize: '0.875rem', letterSpacing: '0.07em', color: '#F3F6F4', fontWeight: 600 }}>
        {resource.name}
      </div>

      {/* Type */}
      <div style={{ ...SANS, fontSize: '0.8125rem', color: '#9AA7A0' }}>
        {resourceTypeLabel(resource.type)}
      </div>

      {/* Location hint */}
      {(resource.zoneId || resource.mukamId) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {resource.zoneId && (
            <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.06em', color: '#C8A96B' }}>
              → {resource.zoneId}
            </span>
          )}
          {!resource.zoneId && resource.mukamId && (
            <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.06em', color: '#66736C' }}>
              {resource.mukamId}
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ── Resource detail ───────────────────────────────────────────────────────
function ResourceDetail({
  resource, deployment,
}: { resource: OperationalResource | null; deployment: DeploymentState }) {
  if (!resource) {
    return (
      <div style={{
        background: '#111714', border: '1px solid #28332D', borderRadius: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1,
        padding: 32,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...SANS, fontWeight: 600, fontSize: '0.9375rem', color: '#9AA7A0' }}>
            Select a resource
          </div>
          <div style={{ ...SANS, fontSize: '0.8125rem', color: '#66736C', marginTop: 6 }}>
            Choose from the list to view operational details.
          </div>
        </div>
      </div>
    )
  }

  const cfg = statusCfg(resource.status)

  // Find active incident for this resource from deployment
  const incidentId = deployment?.incident?.assignedResourceIds?.includes(resource.id)
    ? deployment.incident.id
    : null

  const rows: { label: string; value: string; color?: string }[] = [
    { label: 'CURRENT STATUS', value: cfg.label, color: cfg.color },
    { label: 'CURRENT MUKAM',  value: resource.mukamId ?? resource.baseLocation ?? '—' },
    { label: 'TARGET ZONE',    value: resource.zoneId ?? '—', color: resource.zoneId ? '#C8A96B' : undefined },
    { label: 'ETA',            value: resource.status === 'en_route' ? `${resource.estimatedResponseTime} MIN` : '—' },
    { label: 'BASE LOCATION',  value: resource.baseLocation },
    { label: 'CAPACITY',       value: String(resource.capacity) },
    { label: 'ASSIGNED INCIDENT', value: incidentId ?? 'NO ACTIVE ASSIGNMENT', color: incidentId ? '#9B8AFB' : undefined },
  ]

  return (
    <div style={{
      background: '#111714', border: '1px solid #28332D', borderRadius: 24,
      overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1,
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px 16px',
        background: `linear-gradient(150deg, ${cfg.color}0D 0%, transparent 55%)`,
        borderBottom: '1px solid #1C2520',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.18em', color: '#66736C', marginBottom: 6 }}>
              RESOURCE
            </div>
            <div style={{ ...MONO, fontSize: '1.125rem', letterSpacing: '0.07em', color: '#F3F6F4', fontWeight: 700, lineHeight: 1 }}>
              {resource.name}
            </div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: '#9AA7A0', marginTop: 5 }}>
              {resourceTypeLabel(resource.type)}
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: `${cfg.color}14`, border: `1px solid ${cfg.color}30`,
            borderRadius: 9, padding: '4px 12px',
          }}>
            <span
              className={cfg.pulse ? 'live-dot' : ''}
              style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }}
            />
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: cfg.color, fontWeight: 500 }}>
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>
        {rows.map(({ label, value, color }, i) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
              <span style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.13em', color: '#66736C' }}>
                {label}
              </span>
              <span style={{ ...MONO, fontSize: '0.8125rem', letterSpacing: '0.06em', color: color ?? '#F3F6F4', fontWeight: 500, textAlign: 'right' }}>
                {value}
              </span>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: '#1C2520' }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ResourcesPage({ resources, deployment }: Props) {
  // Auto-select first resource
  const [selectedId, setSelectedId] = useState<string | null>(
    resources.length > 0 ? resources[0].id : null
  )

  const selected = resources.find(r => r.id === selectedId) ?? null

  // Sort: active/en_route first, then available, then others
  const ORDER: Partial<Record<ResourceStatus, number>> = {
    active: 0, en_route: 1, assigned: 2, available: 3, resolved: 4, unavailable: 5,
  }
  const sorted = [...resources].sort((a, b) =>
    (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9)
  )

  const lastUpdate = deployment?.incident?.id ? 'LIVE' : '—'

  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AtmosphericBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '18px 28px 14px', borderBottom: '1px solid #1C2520', flexShrink: 0,
        }}>
          <div>
            <div style={{ ...SANS, fontWeight: 800, fontSize: '1.375rem', color: '#F3F6F4', lineHeight: 1 }}>
              RESOURCES
            </div>
            <div style={{ ...SANS, fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              Operational assets &amp; deployment status
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              className="live-dot"
              style={{ width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block', boxShadow: '0 0 6px rgba(45,212,168,0.55)' }}
            />
            <span style={{ ...MONO, fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>
              LIVE FLEET
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 28px 24px', minHeight: 0 }}>

          <SummaryStrip resources={resources} />

          {/* List + Detail */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40% 1fr',
            gap: 14, flex: 1, minHeight: 0,
          }}
          className="resources-grid"
          >
            {/* List */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              background: '#111714', border: '1px solid #28332D', borderRadius: 24,
              padding: '14px 10px 14px 14px', minHeight: 0, overflow: 'hidden',
            }}>
              <div style={{ ...MONO, fontSize: '0.688rem', letterSpacing: '0.16em', color: '#66736C', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4, flexShrink: 0 }}>
                {sorted.length} RESOURCES
              </div>

              {sorted.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <div style={{ ...SANS, fontSize: '0.875rem', color: '#66736C', textAlign: 'center' }}>
                    NO RESOURCE DATA AVAILABLE
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
                  {sorted.map(r => (
                    <ResourceRow
                      key={r.id}
                      resource={r}
                      isSelected={r.id === selectedId}
                      onClick={() => setSelectedId(r.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Detail */}
            <ResourceDetail resource={selected} deployment={deployment} />
          </div>

        </div>
      </div>
    </div>
  )
}
