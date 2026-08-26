import SectionLabel from '../components/SectionLabel'
import MonoTag from '../components/MonoTag'
import Button from '../components/Button'
import Panel from '../components/Panel'

function MetricRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 0',
        borderBottom: '1px solid #1C2520',
      }}
    >
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#9AA7A0' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: accent ?? '#F3F6F4' }}>
        {value}
      </span>
    </div>
  )
}

export default function PanelSection() {
  return (
    <section className="section-enter">
      <SectionLabel index="03" label="Panel Examples" />

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20 }}>

        {/* ── AI Forecast Panel — primary ── */}
        <Panel
          radius="3xl"
          glow="critical"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          {/* Header */}
          <div
            style={{
              padding: '28px 32px 22px',
              background: 'linear-gradient(150deg, rgba(239,91,91,0.07) 0%, transparent 55%)',
              borderBottom: '1px solid #28332D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '0.75rem',
                    letterSpacing: '0.16em',
                    color: '#9B8AFB',
                    marginBottom: 10,
                    textTransform: 'uppercase',
                  }}
                >
                  AI // Capacity Forecast
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.9375rem',
                      letterSpacing: '0.06em',
                      color: '#F3F6F4',
                      fontWeight: 600,
                    }}
                  >
                    ZONE_Z02
                  </span>
                  <MonoTag color="default">MUKAM_07</MonoTag>
                </div>
              </div>

              {/* Critical badge */}
              <div
                style={{
                  background: 'rgba(239,91,91,0.1)',
                  border: '1px solid rgba(239,91,91,0.3)',
                  borderRadius: 12,
                  padding: '6px 13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                }}
              >
                <span
                  className="live-dot"
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF5B5B', display: 'inline-block' }}
                />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#EF5B5B' }}>
                  CRITICAL
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '28px 32px 32px' }}>
            <p
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '1rem',
                color: '#9AA7A0',
                margin: '0 0 10px',
                lineHeight: 1.5,
              }}
            >
              Sanitation capacity failure predicted within
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2.8rem, 5vw, 4rem)',
                  color: '#EF5B5B',
                  lineHeight: 1,
                  letterSpacing: '-0.025em',
                }}
              >
                34
              </span>
              <span
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 600,
                  fontSize: '1.375rem',
                  color: '#9AA7A0',
                }}
              >
                MINUTES
              </span>
            </div>

            <div style={{ borderTop: '1px solid #28332D', marginBottom: 20 }} />

            <div style={{ marginBottom: 24 }}>
              <MetricRow label="Crowd Growth"  value="+29%" accent="#EF5B5B" />
              <MetricRow label="Capacity Gap"  value="+20%" accent="#F28B4B" />
              <MetricRow label="Confidence"    value="91.4%" />
            </div>

            <Button variant="danger" size="lg">ANALYZE EVENT →</Button>
          </div>
        </Panel>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Live zone status */}
          <Panel radius="2xl" glow="teal" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.13em', color: '#66736C', textTransform: 'uppercase' }}>
                Live Zone Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>LIVE</span>
              </div>
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#2DD4A8', lineHeight: 1, letterSpacing: '-0.02em' }}>
              48,320
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              pilgrims currently in zone
            </div>
            <div style={{ borderTop: '1px solid #1C2520', marginTop: 18, paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>Capacity</span>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: '#E8C45A' }}>78%</span>
              </div>
              <div style={{ height: 5, background: '#1C2520', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '78%', height: '100%', background: 'linear-gradient(90deg, #2DD4A8 0%, #E8C45A 100%)', borderRadius: 999 }} />
              </div>
            </div>
          </Panel>

          {/* AI forecast */}
          <Panel radius="2xl" glow="violet" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.13em', color: '#9B8AFB', textTransform: 'uppercase' }}>
                AI // 60-Min Forecast
              </div>
              <MonoTag color="violet">Predicted</MonoTag>
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '2.5rem', color: '#9B8AFB', lineHeight: 1, letterSpacing: '-0.02em' }}>
              62,700
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
              projected crowd in 60 min
            </div>
            <div style={{ borderTop: '1px solid #1C2520', marginTop: 18, paddingTop: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Inflow rate', value: '+340/min' }, { label: 'Model accuracy', value: '94.2%' }].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#66736C' }}>{label}</div>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F3F6F4', marginTop: 3 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Terrain / planning */}
          <Panel radius="2xl" style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.13em', color: '#C8A96B', textTransform: 'uppercase' }}>
                Terrain / Planning
              </div>
              <MonoTag color="gold">ZONE_Z02</MonoTag>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Usable area',    value: '2.4 km²' },
                { label: 'Routes active',  value: '7 / 9'   },
                { label: 'Checkpoints',    value: '14'       },
                { label: 'Exit corridors', value: '3'        },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: '12px 14px',
                    background: '#171F1B',
                    borderRadius: 14,
                    border: '1px solid #1C2520',
                  }}
                >
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#66736C' }}>{label}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1rem', color: '#F3F6F4', marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </Panel>

        </div>
      </div>
    </section>
  )
}
