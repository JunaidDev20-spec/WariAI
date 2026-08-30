import SectionLabel from '../components/SectionLabel'
import Button from '../components/Button'
import Panel from '../components/Panel'
import MonoTag from '../components/MonoTag'

const overline: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.688rem',
  letterSpacing: '0.16em',
  color: '#66736C',
  textTransform: 'uppercase' as const,
  marginBottom: '1rem',
}

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const AIIcon = () => (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" opacity="0.75"/>
    <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
  </svg>
)
const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
    <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
)

const Divider = () => <div style={{ borderTop: '1px solid #1C2520' }} />

export default function ButtonSection() {
  return (
    <section className="section-enter">
      <SectionLabel index="04" label="Button System" />

      <Panel radius="3xl" style={{ padding: '36px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Primary */}
          <div>
            <div style={overline}>Primary Actions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="primary" size="lg" icon={<ArrowIcon />}>DEPLOY RESOURCE</Button>
              <Button variant="primary" size="md">ACTIVATE ZONE</Button>
              <Button variant="primary" size="sm">CONFIRM</Button>
            </div>
          </div>

          <Divider />

          {/* AI / Forecast */}
          <div>
            <div style={overline}>AI / Forecast Actions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="forecast" size="lg" icon={<AIIcon />}>ANALYZE FORECAST</Button>
              <Button variant="forecast" size="md">RUN SIMULATION</Button>
              <Button variant="forecast" size="sm">PREDICT</Button>
            </div>
          </div>

          <Divider />

          {/* Secondary / Ghost */}
          <div>
            <div style={overline}>Secondary / Ghost</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="secondary" size="lg" icon={<EyeIcon />}>VIEW DETAILS</Button>
              <Button variant="secondary" size="md">EXPORT DATA</Button>
              <Button variant="ghost" size="md">CANCEL</Button>
              <Button variant="ghost" size="sm">DISMISS</Button>
            </div>
          </div>

          <Divider />

          {/* Danger */}
          <div>
            <div style={overline}>Danger / Alert</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="danger" size="lg">EMERGENCY ALERT</Button>
              <Button variant="danger" size="md">LOCK ZONE</Button>
            </div>
          </div>

          <Divider />

          {/* Disabled */}
          <div>
            <div style={overline}>Disabled States</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <Button variant="primary"   size="md" disabled>DEPLOY RESOURCE</Button>
              <Button variant="forecast"  size="md" disabled>ANALYZE FORECAST</Button>
              <Button variant="secondary" size="md" disabled>VIEW DETAILS</Button>
              <Button variant="danger"    size="md" disabled>EMERGENCY ALERT</Button>
            </div>
            <MonoTag color="muted">opacity 36% · pointer-events none</MonoTag>
          </div>

          <Divider />

          {/* Size reference */}
          <div>
            <div style={overline}>Size Reference</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
              {[
                { size: 'sm' as const, spec: 'h34 · r14px · 13px'  },
                { size: 'md' as const, spec: 'h40 · r16px · 14px'  },
                { size: 'lg' as const, spec: 'h46 · r18px · 15px'  },
              ].map(({ size, spec }) => (
                <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                  <Button variant="primary" size={size}>
                    {size.toUpperCase()}
                  </Button>
                  <MonoTag color="muted">{spec}</MonoTag>
                </div>
              ))}
            </div>
          </div>

        </div>
      </Panel>
    </section>
  )
}
