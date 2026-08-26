// CommandCentre no longer owns the hooks.
// It receives liveState/switchMukam + ops state from App so the Incidents
// page can share the same single source of truth.

import { useState, useCallback } from 'react'
import AtmosphericBackground   from '../components/AtmosphericBackground'
import CommandNav              from './CommandNav'
import GlobalMetricsStrip      from './GlobalMetricsStrip'
import CommandMap              from './CommandMap'
import PriorityActionPanel     from './PriorityActionPanel'
import AIForecastPanel         from './AIForecastPanel'
import BottomIntelligenceStrip from './BottomIntelligenceStrip'
import DeploymentPanel         from '../components/DeploymentPanel'
import { MUKAMS, type Mukam }  from '../data/mockCommandData'
import type { MukamLiveState } from '../simulation/simulationEngine'
import type { OperationalResource } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'

// ── Props — injected from App ─────────────────────────────────────────────
interface CommandCentreProps {
  // simulation
  liveState: MukamLiveState
  switchMukam: (id: string) => void
  // ops
  resources: OperationalResource[]
  deployment: DeploymentState
  openDeployment: ReturnType<typeof import('../hooks/useResponseOperations').useResponseOperations>['openDeployment']
  cancelDeployment: () => void
  toggleResource: (id: string) => void
  confirmDeployment: () => void
  markResolved: () => void
}

export default function CommandCentre({
  liveState, switchMukam,
  resources, deployment,
  openDeployment, cancelDeployment,
  toggleResource, confirmDeployment, markResolved,
}: CommandCentreProps) {

  // UI-only state — purely local to the map view
  const [currentMukam, setCurrentMukam] = useState<Mukam>(MUKAMS[0])
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(MUKAMS[0].alert.zoneId)
  const [showDeployRoute, setShowDeployRoute] = useState(false)

  const handleMukamChange = useCallback((mukam: Mukam) => {
    setCurrentMukam(mukam)
    setShowDeployRoute(false)
    setSelectedZoneId(mukam.alert.zoneId)
    switchMukam(mukam.id)
  }, [switchMukam])

  // Merge static geometry with live zone data
  const mergedMukam: Mukam = {
    ...currentMukam,
    zones: currentMukam.zones.map(sz => {
      const live = liveState.zones.find(lz => lz.id === sz.id)
      if (!live) return sz
      return { ...sz, currentLoad: live.currentLoad, predictedLoad: live.predictedLoad, crowd: live.crowd, status: live.status }
    }),
    metrics:             liveState.metrics,
    alert:               liveState.alert,
    movement:            liveState.movement,
    sanitationLoad:      liveState.sanitationLoad,
    sanitationPredicted: liveState.sanitationPredicted,
    forecast:            liveState.forecast,
    forecast30Delta:     liveState.forecast30Delta,
    forecast60Delta:     liveState.forecast60Delta,
  }

  const assignedResources = deployment.incident
    ? resources.filter(r => deployment.incident!.assignedResourceIds.includes(r.id))
    : []

  const handleOpenDeploy = useCallback(() => {
    openDeployment(mergedMukam.alert, mergedMukam.id)
  }, [openDeployment, mergedMukam.alert, mergedMukam.id])

  return (
    <div style={{ background: '#090D0B', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <AtmosphericBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CommandNav
          alertCount={mergedMukam.metrics.criticalZones}
          currentMukamId={mergedMukam.id}
          lastUpdate={mergedMukam.metrics.lastUpdate}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, padding: '16px 20px 20px', minHeight: 0 }}>
          <GlobalMetricsStrip metrics={mergedMukam.metrics} />

          <div className="cc-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, flex: 1, minHeight: 0 }}>
            <CommandMap
              selectedZoneId={selectedZoneId}
              onZoneSelect={setSelectedZoneId}
              showDeployRoute={showDeployRoute}
              onMukamChange={handleMukamChange}
              liveMukam={mergedMukam}
            />

            <div className="cc-right-col" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, overflowY: 'auto' }}>
              <PriorityActionPanel
                alert={mergedMukam.alert}
                mukamId={mergedMukam.id}
                deployment={deployment}
                assignedResources={assignedResources}
                onOpenDeploy={handleOpenDeploy}
                onMarkResolved={markResolved}
              />
              <AIForecastPanel
                series={mergedMukam.forecast}
                confidence={mergedMukam.metrics.aiConfidence}
              />
            </div>
          </div>

          <BottomIntelligenceStrip
            metrics={mergedMukam.metrics}
            movement={mergedMukam.movement}
            sanitationLoad={mergedMukam.sanitationLoad}
            sanitationPredicted={mergedMukam.sanitationPredicted}
            forecast30Delta={mergedMukam.forecast30Delta}
            forecast60Delta={mergedMukam.forecast60Delta}
          />
        </div>
      </div>

      {deployment.phase === 'selecting' && (
        <DeploymentPanel
          deployment={deployment}
          resources={resources}
          alert={mergedMukam.alert}
          mukamId={mergedMukam.id}
          onToggleResource={toggleResource}
          onConfirm={confirmDeployment}
          onCancel={cancelDeployment}
        />
      )}
    </div>
  )
}
