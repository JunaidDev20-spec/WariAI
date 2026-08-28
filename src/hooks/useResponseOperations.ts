// ── useResponseOperations.ts ──────────────────────────────────────────────
// Single source of truth for all response workflow state.
//
// AFTER backend integration:
//   • Resources loaded from GET /api/resources on mount
//     (INITIAL_RESOURCES used as immediate fallback so UI is never blank)
//   • openDeployment → POST /api/incidents to persist the incident
//   • confirmDeployment → POST /api/deployments (atomic server update)
//     then local UI lifecycle timers drive confirming → en_route → active
//   • markResolved → POST /api/deployments/:id/resolve
//
// Public API is unchanged — all consumers (CommandCentre, DeploymentPanel,
// PriorityActionPanel, IncidentsPage) require zero edits.
// ─────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { INITIAL_RESOURCES, selectRecommendedResources, type OperationalResource } from '../data/mockResources'
import type { Incident, DeploymentState } from '../types/operations'
import type { Alert } from '../data/mockCommandData'
import {
  getResources,
  getIncidents,
  createIncident,
  deployResources,
  resolveDeployment,
} from '../api/operationsApi'

// ── Local helper (still used for optimistic UI during lifecycle phases) ───

function applyResourcePatch(
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

  // Start with INITIAL_RESOURCES so the UI renders immediately on cold start.
  // Replaced with server data as soon as the fetch resolves.
  const [resources, setResources] = useState<OperationalResource[]>(INITIAL_RESOURCES)

  const [deployment, setDeployment] = useState<DeploymentState>({
    phase: 'idle',
    incident: null,
    selectedResourceIds: [],
    enRouteAt: null,
  })

  // Incident history — keyed by id
  const [incidents, setIncidents] = useState<Map<string, Incident>>(new Map())

  const lifecycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef     = useRef(true)

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

  // ── Load resources + incidents from backend on mount ─────────────────
  useEffect(() => {
    // Resources
    getResources()
      .then(data => { if (mountedRef.current) setResources(data) })
      .catch(() => { /* keep INITIAL_RESOURCES fallback — server not running */ })

    // Incidents (pre-existing from a previous session)
    getIncidents()
      .then(data => {
        if (!mountedRef.current) return
        setIncidents(prev => {
          const m = new Map(prev)
          data.forEach(i => m.set(i.id, i))
          return m
        })
      })
      .catch(() => { /* non-fatal */ })
  }, [])

  // ── Open deployment selector ─────────────────────────────────────────
  // Persists the incident to the backend immediately so it appears in the
  // Incidents page even before the operator confirms the deployment.
  const openDeployment = useCallback((alert: Alert, mukamId: string) => {
    if (deployment.phase !== 'idle') return

    const recommended = selectRecommendedResources(resources, mukamId, alert.title)

    const incidentPayload: Omit<Incident, 'status' | 'assignedResourceIds'> = {
      id:               `INC_${alert.zoneId}_${mukamId}_${Date.now()}`,
      zoneId:           alert.zoneId,
      zoneLabel:        alert.zoneLabel,
      mukamId,
      severity:         alert.severity,
      incidentType:     alert.title,
      title:            alert.title,
      createdAt:        Date.now(),
      recommendedAction: alert.recommendation,
      timeToEvent:      alert.timeToEvent,
      currentLoad:      alert.currentLoad,
      predictedLoad:    alert.predictedLoad,
    }

    // Optimistic local state — show the selecting UI immediately
    const localIncident: Incident = {
      ...incidentPayload,
      status:              'new',
      assignedResourceIds: [],
    }

    setDeployment({
      phase:              'selecting',
      incident:           localIncident,
      selectedResourceIds: recommended,
      enRouteAt:          null,
    })

    // Persist to backend (fire-and-forget; failure is non-fatal)
    createIncident(incidentPayload)
      .then(saved => {
        if (!mountedRef.current) return
        setIncidents(m => new Map(m).set(saved.id, saved))
      })
      .catch(() => {
        // Backend unavailable — keep local state, incident still works in-memory
        if (mountedRef.current) {
          setIncidents(m => new Map(m).set(localIncident.id, localIncident))
        }
      })
  }, [deployment.phase, resources])

  // ── Cancel ───────────────────────────────────────────────────────────
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
  // Calls POST /api/deployments — backend validates availability, updates
  // incident + resources atomically. We apply server response to local state,
  // then drive the UI lifecycle (confirming → en_route → active) via timers.
  const confirmDeployment = useCallback(() => {
    setDeployment(prev => {
      if (!prev.incident || prev.selectedResourceIds.length === 0) return prev

      const incidentId  = prev.incident.id
      const resourceIds = prev.selectedResourceIds

      // Transition to 'confirming' immediately for responsive UI
      const optimisticIncident: Incident = {
        ...prev.incident,
        status:              'deployed',
        assignedResourceIds: resourceIds,
      }

      setIncidents(m => new Map(m).set(incidentId, optimisticIncident))

      // Optimistic resource update
      setResources(r => applyResourcePatch(r, resourceIds, 'assigned', prev.incident!.zoneId))

      // Call backend
      clearTimer()
      deployResources(incidentId, resourceIds)
        .then(result => {
          if (!mountedRef.current) return
          // Apply authoritative server state
          setIncidents(m => new Map(m).set(result.incident.id, result.incident))
          setResources(prev => {
            const updated = [...prev]
            result.resources.forEach(sr => {
              const idx = updated.findIndex(r => r.id === sr.id)
              if (idx !== -1) updated[idx] = sr
            })
            return updated
          })
        })
        .catch(() => { /* keep optimistic state — server unavailable */ })

      // 1.5s → EN_ROUTE (UI phase only, not a server call)
      lifecycleTimer.current = setTimeout(() => {
        if (!mountedRef.current) return
        setDeployment(d => ({ ...d, phase: 'en_route', enRouteAt: Date.now() }))
        setResources(r => applyResourcePatch(r, resourceIds, 'en_route'))
        setIncidents(m => {
          const updated = new Map(m)
          const inc = updated.get(incidentId)
          if (inc) updated.set(incidentId, { ...inc, status: 'deployed' })
          return updated
        })

        // 6s → ACTIVE
        lifecycleTimer.current = setTimeout(() => {
          if (!mountedRef.current) return
          setDeployment(d => ({ ...d, phase: 'active' }))
          setResources(r => applyResourcePatch(r, resourceIds, 'active', prev.incident!.zoneId))
          setIncidents(m => {
            const updated = new Map(m)
            const inc = updated.get(incidentId)
            if (inc) updated.set(incidentId, { ...inc, status: 'active' })
            return updated
          })
          lifecycleTimer.current = null
        }, 6000)
      }, 1500)

      return { ...prev, phase: 'confirming', incident: optimisticIncident, enRouteAt: null }
    })
  }, [clearTimer])

  // ── Mark resolved ────────────────────────────────────────────────────
  const markResolved = useCallback(() => {
    clearTimer()
    setDeployment(prev => {
      if (!prev.incident) return prev

      const incidentId  = prev.incident.id
      const assignedIds = prev.incident.assignedResourceIds

      // Optimistic local update
      setResources(r => applyResourcePatch(r, assignedIds, 'available', null))
      setIncidents(m => {
        const updated = new Map(m)
        const inc = updated.get(incidentId)
        if (inc) updated.set(incidentId, { ...inc, status: 'resolved' })
        return updated
      })

      // Call backend resolve endpoint
      resolveDeployment(incidentId)
        .then(result => {
          if (!mountedRef.current) return
          setIncidents(m => new Map(m).set(result.incident.id, result.incident))
          setResources(prev => {
            const updated = [...prev]
            result.freedResources.forEach(sr => {
              const idx = updated.findIndex(r => r.id === sr.id)
              if (idx !== -1) updated[idx] = sr
            })
            return updated
          })
        })
        .catch(() => { /* keep optimistic state */ })

      return { phase: 'resolved', incident: prev.incident, selectedResourceIds: assignedIds, enRouteAt: null }
    })

    // 2s → reset panel to idle
    lifecycleTimer.current = setTimeout(() => {
      if (!mountedRef.current) return
      setDeployment({ phase: 'idle', incident: null, selectedResourceIds: [], enRouteAt: null })
      lifecycleTimer.current = null
    }, 2000)
  }, [clearTimer])

  // ── Simulation override flag ─────────────────────────────────────────
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
