// ── useResponseOperations.ts ──────────────────────────────────────────────
// Single source of truth for all response workflow state.
//
// Manages:
//   • Resource availability (mutable copy of INITIAL_RESOURCES)
//   • Incident history (one per Mukam/zone combo, preserved across Mukam switches)
//   • Deployment phase lifecycle with controlled timers
//   • Simulation override flag (prevents sim from clearing active incidents)
//
// Rules:
//   • One timer at a time, always cleaned up
//   • All resource mutations produce a new array (no direct mutation)
//   • Mukam switching preserves all state
// ─────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { INITIAL_RESOURCES, selectRecommendedResources, type OperationalResource } from '../data/mockResources'
import type { Incident, DeploymentState, DeployPhase } from '../types/operations'
import type { Alert } from '../data/mockCommandData'

// ── Helpers ───────────────────────────────────────────────────────────────

function updateResourceStatus(
  resources: OperationalResource[],
  ids: string[],
  status: OperationalResource['status'],
  zoneId?: string | null,
): OperationalResource[] {
  return resources.map(r =>
    ids.includes(r.id)
      ? { ...r, status, zoneId: zoneId !== undefined ? zoneId : r.zoneId }
      : r
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useResponseOperations() {
  // Resources — full mutable copy, never touched from outside the hook
  const [resources, setResources] = useState<OperationalResource[]>(INITIAL_RESOURCES)

  // Deployment state
  const [deployment, setDeployment] = useState<DeploymentState>({
    phase: 'idle',
    incident: null,
    selectedResourceIds: [],
    enRouteAt: null,
  })

  // Incident history — keyed by incidentId for dedup
  const [incidents, setIncidents] = useState<Map<string, Incident>>(new Map())

  // Lifecycle timer ref — single, always cleared before setting a new one
  const lifecycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (lifecycleTimer.current) clearTimeout(lifecycleTimer.current)
    }
  }, [])

  const clearTimer = useCallback(() => {
    if (lifecycleTimer.current) {
      clearTimeout(lifecycleTimer.current)
      lifecycleTimer.current = null
    }
  }, [])

  // ── Open deployment selector ─────────────────────────────────────────
  const openDeployment = useCallback((alert: Alert, mukamId: string) => {
    if (deployment.phase !== 'idle') return

    const recommended = selectRecommendedResources(resources, mukamId, alert.title)

    const incident: Incident = {
      id: `INC_${alert.zoneId}_${mukamId}_${Date.now()}`,
      zoneId: alert.zoneId,
      zoneLabel: alert.zoneLabel,
      mukamId,
      severity: alert.severity,
      incidentType: alert.title,
      title: alert.title,
      createdAt: Date.now(),
      status: 'new',
      assignedResourceIds: [],
      recommendedAction: alert.recommendation,
      timeToEvent: alert.timeToEvent,
      currentLoad: alert.currentLoad,
      predictedLoad: alert.predictedLoad,
    }

    setDeployment({
      phase: 'selecting',
      incident,
      selectedResourceIds: recommended,
      enRouteAt: null,
    })
  }, [deployment.phase, resources])

  // ── Cancel deployment ────────────────────────────────────────────────
  const cancelDeployment = useCallback(() => {
    clearTimer()
    setDeployment({ phase: 'idle', incident: null, selectedResourceIds: [], enRouteAt: null })
  }, [clearTimer])

  // ── Toggle resource selection ────────────────────────────────────────
  const toggleResource = useCallback((resourceId: string) => {
    setDeployment(prev => {
      const has = prev.selectedResourceIds.includes(resourceId)
      return {
        ...prev,
        selectedResourceIds: has
          ? prev.selectedResourceIds.filter(id => id !== resourceId)
          : [...prev.selectedResourceIds, resourceId],
      }
    })
  }, [])

  // ── Confirm deployment ───────────────────────────────────────────────
  const confirmDeployment = useCallback(() => {
    setDeployment(prev => {
      if (!prev.incident || prev.selectedResourceIds.length === 0) return prev

      const incident: Incident = {
        ...prev.incident,
        status: 'deployed',
        assignedResourceIds: prev.selectedResourceIds,
      }

      // Update resource statuses → ASSIGNED immediately
      setResources(r => updateResourceStatus(r, prev.selectedResourceIds, 'assigned', prev.incident!.zoneId))

      // Persist incident
      setIncidents(m => new Map(m).set(incident.id, incident))

      // 1.5s → EN_ROUTE
      clearTimer()
      lifecycleTimer.current = setTimeout(() => {
        if (!mountedRef.current) return
        setDeployment(d => ({ ...d, phase: 'en_route', enRouteAt: Date.now() }))
        setResources(r => updateResourceStatus(r, prev.selectedResourceIds, 'en_route'))
        setIncidents(m => {
          const updated = new Map(m)
          const inc = updated.get(incident.id)
          if (inc) updated.set(incident.id, { ...inc, status: 'deployed' })
          return updated
        })

        // 6s later → ACTIVE
        lifecycleTimer.current = setTimeout(() => {
          if (!mountedRef.current) return
          setDeployment(d => ({ ...d, phase: 'active' }))
          setResources(r => updateResourceStatus(r, prev.selectedResourceIds, 'active', prev.incident!.zoneId))
          setIncidents(m => {
            const updated = new Map(m)
            const inc = updated.get(incident.id)
            if (inc) updated.set(incident.id, { ...inc, status: 'active' })
            return updated
          })
          lifecycleTimer.current = null
        }, 6000)
      }, 1500)

      return { ...prev, phase: 'confirming', incident, enRouteAt: null }
    })
  }, [clearTimer])

  // ── Mark resolved ────────────────────────────────────────────────────
  const markResolved = useCallback(() => {
    clearTimer()
    setDeployment(prev => {
      if (!prev.incident) return prev

      const assignedIds = prev.incident.assignedResourceIds

      // Resources → available again
      setResources(r => updateResourceStatus(r, assignedIds, 'available', null))

      // Incident → resolved
      setIncidents(m => {
        const updated = new Map(m)
        const inc = updated.get(prev.incident!.id)
        if (inc) updated.set(prev.incident!.id, { ...inc, status: 'resolved' })
        return updated
      })

      return { phase: 'resolved', incident: prev.incident, selectedResourceIds: assignedIds, enRouteAt: null }
    })

    // After 2s, reset panel to idle so it shows the next alert
    lifecycleTimer.current = setTimeout(() => {
      if (!mountedRef.current) return
      setDeployment({ phase: 'idle', incident: null, selectedResourceIds: [], enRouteAt: null })
      lifecycleTimer.current = null
    }, 2000)
  }, [clearTimer])

  // ── Whether the simulation should freeze alert updates ───────────────
  // Returns true when we're mid-deployment (sim must not overwrite the alert)
  const isOperationActive = deployment.phase !== 'idle' && deployment.phase !== 'resolved'

  return {
    resources,
    deployment,
    incidents,
    isOperationActive,
    openDeployment,
    cancelDeployment,
    toggleResource,
    confirmDeployment,
    markResolved,
  }
}
