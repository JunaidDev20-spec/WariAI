// CommandCentre.tsx
// Receives liveState/switchMukam + ops state from App (single source of truth).
// currentMukam is always derived from liveState.mukamId — no duplicate state.
// Prev/Next nav calls switchMukam() directly, no wrapping at boundaries.

import { useEffect, useCallback } from 'react'
import { useState } from 'react'
import AtmosphericBackground   from '../components/AtmosphericBackground'
import GlobalMetricsStrip      from './GlobalMetricsStrip'
import RealMap                 from './RealMap'
import CleanlinessDeploymentCard from './CleanlinessDeploymentCard'
import BottomIntelligenceStrip from './BottomIntelligenceStrip'
import DeploymentPanel         from '../components/DeploymentPanel'
import { MUKAMS, type Mukam }  from '../data/mockCommandData'
import type { MukamLiveState } from '../simulation/simulationEngine'
import type { CleanlinessDemand } from '../api/operationsApi'
import type { OperationalResource } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'

// ── Types ─────────────────────────────────────────────────────────────────
interface CommandCentreProps {
  liveState: MukamLiveState
  switchMukam: (id: string) => void
  cleanlinessDemand: CleanlinessDemand | null
  deploymentAvailable: boolean
  resources: OperationalResource[]
  deployment: DeploymentState
  openDeployment: ReturnType<typeof import('../hooks/useResponseOperations').useResponseOperations>['openDeployment']
  cancelDeployment: () => void
  toggleResource: (id: string) => void
  confirmDeployment: () => void
  markResolved: () => void
}

// ── Prev/Next bar (non-wrapping) ──────────────────────────────────────────
function MukamNavBar({
  currentIndex, isFirst, isLast, onPrev, onNext,
}: { currentIndex: number; isFirst: boolean; isLast: boolean; onPrev: () => void; onNext: () => void }) {
  const MONO: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" }
  const SANS: React.CSSProperties = { fontFamily: 'Manrope, sans-serif'         }

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none',
    ...MONO, fontSize: '0.75rem', letterSpacing: '0.1em',
    padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
    transition: 'color 0.15s ease, background 0.15s ease',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#111714', border: '1px solid #1C2520', borderRadius: 16,
      padding: '0 8px', flexShrink: 0,
    }}>
      {/* PREV */}
      <button
        disabled={isFirst}
        onClick={onPrev}
        style={{ ...btnBase, color: isFirst ? '#3D4F47' : '#9AA7A0', cursor: isFirst ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => { if (!isFirst) (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
        onMouseLeave={e => { if (!isFirst) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
        title={isFirst ? 'Saswad is the first Mukam (route start)' : 'Previous Mukam'}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        PREV
      </button>

      {/* Centre — current Mukam */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '7px 20px', borderLeft: '1px solid #1C2520', borderRight: '1px solid #1C2520' }}>
        <div style={{ ...MONO, fontSize: '0.8125rem', letterSpacing: '0.08em', color: '#C8A96B', fontWeight: 600 }}>
          {MUKAMS[currentIndex]?.id}
        </div>
        <div style={{ ...SANS, fontSize: '0.6875rem', color: '#9AA7A0', whiteSpace: 'nowrap' }}>
          {MUKAMS[currentIndex]?.location.split(',')[0]}
        </div>
      </div>

      {/* NEXT */}
      <button
        disabled={isLast}
        onClick={onNext}
        style={{ ...btnBase, color: isLast ? '#3D4F47' : '#9AA7A0', cursor: isLast ? 'not-allowed' : 'pointer' }}
        onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
        onMouseLeave={e => { if (!isLast) (e.currentTarget as HTMLButtonElement).style.color = '#9AA7A0' }}
        title={isLast ? 'Malshiras is the last Mukam (Pandharpur is the destination)' : 'Next Mukam'}
      >
        NEXT
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────
export default function CommandCentre({
  liveState, switchMukam, cleanlinessDemand, deploymentAvailable,
  resources, deployment,
  openDeployment, cancelDeployment,
  toggleResource, confirmDeployment, markResolved,
}: CommandCentreProps) {

  // ── currentMukam is derived from liveState.mukamId — THE single source ──
  // We keep a local copy only for the static geometry the SVG map needs.
  // When liveState.mukamId changes (from map click, prev/next, etc.) we sync.
  const getMukamFromLive = (): Mukam =>
    MUKAMS.find(m => m.id === liveState.mukamId) ?? MUKAMS[0]

  const [currentMukam, setCurrentMukam] = useState<Mukam>(getMukamFromLive)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(getMukamFromLive().alert.zoneId)
  const [showDeployRoute, setShowDeployRoute] = useState(false)

  // Sync when liveState.mukamId changes from an external source
  // (e.g. map marker click on Event Overview → switchMukam → liveState updates)
  useEffect(() => {
    const m = MUKAMS.find(m => m.id === liveState.mukamId)
    if (m && m.id !== currentMukam.id) {
      setCurrentMukam(m)
      setSelectedZoneId(m.alert.zoneId)
      setShowDeployRoute(false)
    }
  }, [liveState.mukamId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Called by CommandMap's internal PREV/NEXT (cinematic transition)
  const handleMukamChange = useCallback((mukam: Mukam) => {
    setCurrentMukam(mukam)
    setShowDeployRoute(false)
    setSelectedZoneId(mukam.alert.zoneId)
    switchMukam(mukam.id)
  }, [switchMukam])

  // Prev/Next from the top nav bar — no cinematic transition, just data switch
  const currentIndex = MUKAMS.findIndex(m => m.id === currentMukam.id)
  const safeIndex    = currentIndex >= 0 ? currentIndex : 0

  const handlePrev = useCallback(() => {
    if (safeIndex <= 0) return
    const prev = MUKAMS[safeIndex - 1]
    setCurrentMukam(prev)
    setSelectedZoneId(prev.alert.zoneId)
    setShowDeployRoute(false)
    switchMukam(prev.id)
  }, [safeIndex, switchMukam])

  const handleNext = useCallback(() => {
    if (safeIndex >= MUKAMS.length - 1) return
    const next = MUKAMS[safeIndex + 1]
    setCurrentMukam(next)
    setSelectedZoneId(next.alert.zoneId)
    setShowDeployRoute(false)
    switchMukam(next.id)
  }, [safeIndex, switchMukam])

  // Merge static geometry with live simulation data
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 20px 20px', minHeight: 0 }}>

          {/* Mukam Prev/Next navigation bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MukamNavBar
              currentIndex={safeIndex}
              isFirst={safeIndex === 0}
              isLast={safeIndex === MUKAMS.length - 1}
              onPrev={handlePrev}
              onNext={handleNext}
            />
            {/* Route progress indicator */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden' }}>
              {MUKAMS.map((m, i) => {
                const isCurrent = m.id === currentMukam.id
                const isPast    = i < safeIndex
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: isCurrent ? 10 : 7, height: isCurrent ? 10 : 7,
                      borderRadius: '50%', flexShrink: 0,
                      background: isCurrent ? '#2DD4A8' : isPast ? '#3D4F47' : '#1C2520',
                      border: `1.5px solid ${isCurrent ? '#2DD4A8' : isPast ? '#3D4F47' : '#28332D'}`,
                      boxShadow: isCurrent ? '0 0 6px rgba(45,212,168,0.5)' : 'none',
                      transition: 'all 0.25s ease',
                    }} />
                    {i < MUKAMS.length - 1 && (
                      <div style={{ flex: 1, height: 1, background: i < safeIndex ? '#3D4F47' : '#1C2520', minWidth: 8 }} />
                    )}
                  </div>
                )
              })}
            </div>
            {/* Boundary hints */}
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem', letterSpacing: '0.1em', color: '#3D4F47', whiteSpace: 'nowrap' }}>
              {safeIndex === 0 ? '← PUNE' : safeIndex === MUKAMS.length - 1 ? 'PANDHARPUR →' : `${safeIndex + 1} / ${MUKAMS.length}`}
            </div>
          </div>

          <GlobalMetricsStrip metrics={mergedMukam.metrics} />

          {/* Row 1 — Map | Cleanliness / Deployment / Priority Action */}
          <div className="cc-dashboard cc-dashboard-r1" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'stretch' }}>
            <RealMap
              selectedZoneId={selectedZoneId}
              onZoneSelect={setSelectedZoneId}
              showDeployRoute={showDeployRoute}
              onMukamChange={handleMukamChange}
              liveMukam={mergedMukam}
            />

            <CleanlinessDeploymentCard
              alert={mergedMukam.alert}
              mukamId={mergedMukam.id}
              deployment={deployment}
              assignedResources={assignedResources}
              deploymentAvailable={deploymentAvailable}
              cleanlinessDemand={cleanlinessDemand}
              onOpenDeploy={handleOpenDeploy}
              onMarkResolved={markResolved}
            />
          </div>

          {/* Compact bottom KPI strip — restored (no oversized standalone KPI cards) */}
          <BottomIntelligenceStrip
            metrics={mergedMukam.metrics}
            movement={mergedMukam.movement}
            cleanlinessDemand={cleanlinessDemand}
            deploymentAvailable={deploymentAvailable}
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
