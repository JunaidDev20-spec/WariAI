import SectionLabel from '../components/SectionLabel'
import MonoTag from '../components/MonoTag'
import Panel from '../components/Panel'

// Shared overline style inside panel — 11px minimum
const overline: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.688rem',
  letterSpacing: '0.18em',
  color: '#66736C',
  textTransform: 'uppercase' as const,
  marginBottom: '1.25rem',
}

export default function TypographySection() {
  return (
    <section className="section-enter">
      <SectionLabel index="01" label="Typography" />

      <Panel radius="3xl" style={{ padding: '40px 44px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* ── Row 1: Display heading ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={overline}>Display / Page heading</div>
              <h1
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 800,
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#F3F6F4',
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                Mukam Command Centre
              </h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0, paddingTop: 28 }}>
              <MonoTag color="muted">Manrope 800</MonoTag>
              <MonoTag color="muted">clamp 32–48px</MonoTag>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* ── Row 2: Subheading ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={overline}>Section subheading</div>
              <h2
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 400,
                  fontSize: '1.25rem',
                  color: '#9AA7A0',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                Spatial awareness for proactive operations.
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0, paddingTop: 28 }}>
              <MonoTag color="muted">Manrope 400</MonoTag>
              <MonoTag color="muted">20px · Secondary</MonoTag>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* ── Row 3: Technical mono label ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={overline}>Technical label / mono</div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.8125rem',   /* 13px */
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: '#9B8AFB',
                  fontWeight: 500,
                }}
              >
                AI // CAPACITY FORECAST
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
              <MonoTag color="muted">IBM Plex Mono 500</MonoTag>
              <MonoTag color="violet">Technical label</MonoTag>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* ── Row 4: Large metric ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={overline}>Primary metric</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 800,
                    fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                    color: '#F3F6F4',
                    lineHeight: 1,
                    letterSpacing: '-0.025em',
                  }}
                >
                  72,000
                </span>
                <span
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: '#9AA7A0',
                  }}
                >
                  pilgrims / zone
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
              <MonoTag color="muted">Manrope 800</MonoTag>
              <MonoTag color="teal">Live metric</MonoTag>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* ── Row 5: Mono identifiers ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={overline}>Zone / team identifiers</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {['ZONE_Z02', 'MUKAM_07', 'TEAM_C03', '14:32 IST'].map((id) => (
                  <span
                    key={id}
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.9375rem',  /* 15px */
                      letterSpacing: '0.07em',
                      color: '#C8A96B',
                      fontWeight: 500,
                    }}
                  >
                    {id}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
              <MonoTag color="muted">IBM Plex Mono 500</MonoTag>
              <MonoTag color="gold">Identifiers</MonoTag>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1C2520' }} />

          {/* ── Row 6: Type scale ── */}
          <div>
            <div style={overline}>Manrope type scale</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Display',  size: '3rem',       weight: 800, sample: 'Spatial Intelligence'             },
                { label: 'H1',       size: '2rem',       weight: 700, sample: 'Crowd Density Analysis'           },
                { label: 'H2',       size: '1.5rem',     weight: 600, sample: 'Zone Forecast — 60 min'           },
                { label: 'H3',       size: '1.125rem',   weight: 600, sample: 'Resource Deployment Status'        },
                { label: 'Body',     size: '1rem',       weight: 400, sample: 'Real-time monitoring of sanitation demand and crowd movement across all active mukam sectors.' },
                { label: 'Caption',  size: '0.875rem',   weight: 400, sample: 'Updated every 30 seconds · Data from 14 sensors' },
              ].map(({ label, size, weight, sample }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.688rem',
                      letterSpacing: '0.1em',
                      color: '#66736C',
                      minWidth: 56,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontWeight: weight,
                      fontSize: size,
                      color: '#F3F6F4',
                      lineHeight: 1.3,
                    }}
                  >
                    {sample}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Panel>
    </section>
  )
}
