import { useState, useRef, useEffect } from 'react'
import CommandCentre    from './command/CommandCentre'
import IncidentsPage    from './incidents/IncidentsPage'
import IntelligencePage from './intelligence/IntelligencePage'
import ResourcesPage    from './resources/ResourcesPage'
import EventOverviewPage from './overview/EventOverviewPage'
import { useLiveSimulation }      from './simulation/useLiveSimulation'
import { useResponseOperations }  from './hooks/useResponseOperations'

// ── Design System preview imports ─────────────────────────────────────────
import AtmosphericBackground from './components/AtmosphericBackground'
import TopBrandArea          from './sections/TopBrandArea'
import TypographySection     from './sections/TypographySection'
import ColorSection          from './sections/ColorSection'
import PanelSection          from './sections/PanelSection'
import ButtonSection         from './sections/ButtonSection'
import StatusSection         from './sections/StatusSection'
import SpatialPreview        from './sections/SpatialPreview'

// ── App page type ─────────────────────────────────────────────────────────
type AppPage = 'command' | 'incidents' | 'intelligence' | 'resources' | 'overview' | 'ds'

// ── Nav toggle bar ────────────────────────────────────────────────────────
interface NavToggleProps {
  page: AppPage
  onChange: (p: AppPage) => void
  criticalCount: number
}

function NavToggle({ page, onChange, criticalCount }: NavToggleProps) {
  const items: { id: AppPage; label: string }[] = [
    { id: 'command',      label: 'COMMAND CENTRE' },
    { id: 'incidents',    label: 'INCIDENTS'       },
    { id: 'intelligence', label: 'INTELLIGENCE'    },
    { id: 'resources',    label: 'RESOURCES'       },
    { id: 'overview',     label: 'EVENT OVERVIEW'  },
    { id: 'ds',           label: 'DESIGN SYSTEM'   },
  ]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: 'rgba(17,23,20,0.9)', backdropFilter: 'blur(16px)',
      border: '1px solid #28332D', borderRadius: 14, padding: '4px 5px',
    }}>
      {items.map(({ id, label }) => {
        const isActive = page === id
        const showBadge = id === 'incidents' && criticalCount > 0

        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.688rem', letterSpacing: '0.09em',
              color: isActive ? '#060F0C' : '#9AA7A0',
              background: isActive ? '#2DD4A8' : 'transparent',
              border: 'none', borderRadius: 10,
              padding: '5px 13px', cursor: 'pointer',
              transition: 'all 0.18s ease',
              fontWeight: isActive ? 700 : 400,
              whiteSpace: 'nowrap', lineHeight: 1,
              display: 'flex', alignItems: 'center', gap: 6,
              position: 'relative',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
          >
            {label}
            {/* Alert badge on Incidents tab */}
            {showBadge && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: '50%',
                background: isActive ? '#090D0B' : '#EF5B5B',
                color: isActive ? '#EF5B5B' : '#fff',
                fontFamily: 'Manrope,sans-serif', fontSize: '0.625rem', fontWeight: 700,
              }}>
                {criticalCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Design System preview ─────────────────────────────────────────────────
function DesignSystemPreview() {
  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', position: 'relative' }}>
      <AtmosphericBackground />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <TopBrandArea />
        <main className="main-content" style={{ maxWidth: 1320, margin: '0 auto', padding: '56px 40px 100px' }}>
          <div className="section-gap" style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
            <TypographySection />
            <ColorSection />
            <PanelSection />
            <ButtonSection />
            <StatusSection />
            <SpatialPreview />
          </div>
        </main>
        <footer style={{ borderTop: '1px solid #1C2520', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#66736C' }}>WARI.AI · DESIGN SYSTEM v0.1</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', letterSpacing: '0.07em', color: '#66736C' }}>NASHIK, INDIA</span>
        </footer>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<AppPage>('command')

  const { liveState, switchMukam, cleanlinessDemand, deploymentAvailable } = useLiveSimulation()
  const {
    resources, deployment, incidents,
    openDeployment, cancelDeployment,
    toggleResource, confirmDeployment, markResolved,
  } = useResponseOperations()

  const criticalCount = liveState.metrics.criticalZones

  const prevCleanlinessLevelRef = useRef<string | null>(null)

  useEffect(() => {
    const currentLevel = cleanlinessDemand?.level || null
    if (currentLevel === 'CRITICAL' && prevCleanlinessLevelRef.current !== 'CRITICAL') {
      const zoneId = liveState.alert.zoneId
      const zoneLabel = liveState.alert.zoneLabel
      const mukamId = liveState.mukamId
      const zoneResources = resources
        .filter(r => r.zoneId === zoneId)
        .map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          status: r.status,
          baseLocation: '',
        }))

      fetch('http://localhost:5000/api/deployments/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mukamId, zoneLabel, resources: zoneResources }),
      }).catch(() => {})
    }
    prevCleanlinessLevelRef.current = currentLevel
  }, [cleanlinessDemand, liveState, resources])

  return (
    <div style={{ minHeight: '100vh', background: '#090D0B' }}>

      {/* ── Fixed floating nav — top-center ── */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: '100vw',
        overflowX: 'auto',
        /* hide scrollbar but allow scroll on very small screens */
        scrollbarWidth: 'none',
      }}>
        <NavToggle page={page} onChange={setPage} criticalCount={criticalCount} />
      </div>

      {/* ── Page content — padded so it starts below the nav ── */}
      <div className="app-page-content">
        {page === 'command' && (
          <CommandCentre
            liveState={liveState}
            switchMukam={switchMukam}
            cleanlinessDemand={cleanlinessDemand}
            deploymentAvailable={deploymentAvailable}
            resources={resources}
            deployment={deployment}
            openDeployment={openDeployment}
            cancelDeployment={cancelDeployment}
            toggleResource={toggleResource}
            confirmDeployment={confirmDeployment}
            markResolved={markResolved}
          />
        )}
        {page === 'incidents' && (
          <IncidentsPage
            liveState={liveState}
            resources={resources}
            deployment={deployment}
            incidents={incidents}
            openDeployment={openDeployment}
            cancelDeployment={cancelDeployment}
            toggleResource={toggleResource}
            confirmDeployment={confirmDeployment}
            markResolved={markResolved}
          />
        )}
        {page === 'intelligence' && (
          <IntelligencePage liveState={liveState} />
        )}
        {page === 'resources' && (
          <ResourcesPage resources={resources} deployment={deployment} />
        )}
        {page === 'overview' && (
          <EventOverviewPage liveState={liveState} resources={resources} switchMukam={switchMukam} />
        )}
        {page === 'ds' && <DesignSystemPreview />}
      </div>

    </div>
  )
}
