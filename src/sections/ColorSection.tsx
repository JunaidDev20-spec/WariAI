import SectionLabel from '../components/SectionLabel'
import Panel from '../components/Panel'
import MonoTag from '../components/MonoTag'

// ── Shared ────────────────────────────────────────────────────────────────
const overline: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.688rem',
  letterSpacing: '0.16em',
  color: '#66736C',
  textTransform: 'uppercase' as const,
  marginBottom: '1.5rem',
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ── Color Swatch ──────────────────────────────────────────────────────────
function ColorSwatch({
  hex, name, role, border, tall = false,
}: { hex: string; name: string; role: string; border?: string; tall?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          height: tall ? 84 : 60,
          borderRadius: 14,
          background: hex,
          border: border ?? '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(140deg, rgba(255,255,255,0.045) 0%, transparent 55%)',
          }}
        />
      </div>
      <div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#F3F6F4', lineHeight: 1.3 }}>
          {name}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#66736C', marginTop: 2 }}>
          {hex}
        </div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', marginTop: 3, lineHeight: 1.4 }}>
          {role}
        </div>
      </div>
    </div>
  )
}

// ── Semantic Card ─────────────────────────────────────────────────────────
function SemanticCard({
  color, title, subtitle, description, pulse = false,
}: { color: string; title: string; subtitle: string; description: string; pulse?: boolean }) {
  return (
    <div
      className="panel-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: '24px',
        background: '#171F1B',
        border: '1px solid #28332D',
        borderRadius: 24,
        borderTop: `2px solid ${color}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          className={pulse ? 'live-dot' : ''}
          style={{
            width: 9, height: 9,
            borderRadius: '50%',
            background: color,
            display: 'inline-block',
            boxShadow: `0 0 8px ${color}55`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: '#F3F6F4' }}>
          {title}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.1em', color, marginBottom: 6, textTransform: 'uppercase' as const }}>
          {subtitle}
        </div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0', lineHeight: 1.6 }}>
          {description}
        </div>
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.06em', color, marginTop: 'auto' }}>
        {color}
      </div>
    </div>
  )
}

// ── Risk Row ──────────────────────────────────────────────────────────────
function RiskRow() {
  const risks = [
    { label: 'SAFE',     color: '#2DD4A8', desc: 'Normal operations — no action required.' },
    { label: 'WATCH',    color: '#E8C45A', desc: 'Elevated density — monitor closely.'     },
    { label: 'HIGH',     color: '#F28B4B', desc: 'Threshold breached — alert teams now.'   },
    { label: 'CRITICAL', color: '#EF5B5B', desc: 'Immediate deployment required.'          },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {risks.map(({ label, color, desc }) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '18px 20px',
            background: `rgba(${hexToRgb(color)}, 0.06)`,
            border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
            borderRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.1em', color, fontWeight: 500 }}>
              {label}
            </span>
          </div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', lineHeight: 1.55, margin: 0 }}>
            {desc}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function ColorSection() {
  return (
    <section className="section-enter">
      <SectionLabel index="02" label="Color System" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Surface palette */}
        <Panel radius="3xl" style={{ padding: '36px 40px' }}>
          <div style={overline}>Surface & Text Palette</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>
            <ColorSwatch hex="#090D0B" name="Base BG"    role="Page background"   border="1px solid #28332D" />
            <ColorSwatch hex="#111714" name="Surface 1"  role="Primary panel"     border="1px solid #28332D" />
            <ColorSwatch hex="#171F1B" name="Surface 2"  role="Raised panel"      border="1px solid #28332D" />
            <ColorSwatch hex="#1C2621" name="Surface 3"  role="Hover / elevated"  border="1px solid #28332D" />
          </div>

          <div style={{ borderTop: '1px solid #1C2520', marginBottom: 24 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            <ColorSwatch hex="#F3F6F4" name="Text Primary"   role="Headings, data"         border="1px solid #28332D" />
            <ColorSwatch hex="#9AA7A0" name="Text Secondary" role="Labels, descriptions"   border="1px solid #28332D" />
            <ColorSwatch hex="#66736C" name="Text Muted"     role="Metadata, placeholders" border="1px solid #28332D" />
            <ColorSwatch hex="#28332D" name="Border"         role="Panel edges"             tall border="1px solid #3D4F47" />
          </div>
        </Panel>

        {/* Semantic colors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <SemanticCard
            color="#2DD4A8"
            title="Live / Current"
            subtitle="Teal · Current state"
            description="Active zones, live data feeds, real-time status. Means happening right now."
            pulse
          />
          <SemanticCard
            color="#9B8AFB"
            title="AI Forecast"
            subtitle="Violet · Predicted state"
            description="AI model outputs, future predictions, 30–60 min capacity forecasts."
          />
          <SemanticCard
            color="#C8A96B"
            title="Terrain / Planning"
            subtitle="Gold · Spatial context"
            description="Geography, terrain overlays, zone planning boundaries and identifiers."
          />
        </div>

        {/* Risk scale */}
        <Panel radius="3xl" style={{ padding: '36px 40px' }}>
          <div style={overline}>Risk State Scale</div>
          <RiskRow />
        </Panel>

        {/* Usage proportion */}
        <Panel radius="3xl" style={{ padding: '36px 40px' }}>
          <div style={overline}>Intended Color Proportion</div>
          <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', display: 'flex', gap: 3, marginBottom: 16 }}>
            <div style={{ flex: 80, background: '#1C2621', borderRadius: 999 }} />
            <div style={{ flex: 10, background: '#2DD4A8', borderRadius: 999, opacity: 0.85 }} />
            <div style={{ flex: 5,  background: '#9B8AFB', borderRadius: 999, opacity: 0.85 }} />
            <div style={{ flex: 3,  background: '#F28B4B', borderRadius: 999, opacity: 0.85 }} />
            <div style={{ flex: 2,  background: '#C8A96B', borderRadius: 999, opacity: 0.85 }} />
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { color: '#9AA7A0', label: '80% Dark neutral surfaces' },
              { color: '#2DD4A8', label: '10% Live teal'             },
              { color: '#9B8AFB', label: '5%  Forecast violet'       },
              { color: '#F28B4B', label: '3%  Risk colors'           },
              { color: '#C8A96B', label: '2%  Terrain gold'          },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>

      </div>
    </section>
  )
}
