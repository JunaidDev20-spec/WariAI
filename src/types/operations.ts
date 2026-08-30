// ── operations.ts ─────────────────────────────────────────────────────────
// All types for the response / operations workflow.

export type IncidentStatus = 'new' | 'acknowledged' | 'deployed' | 'active' | 'resolved'
export type DeployPhase = 'idle' | 'selecting' | 'confirming' | 'en_route' | 'active' | 'resolved'

export interface Incident {
  id: string
  zoneId: string
  zoneLabel: string
  mukamId: string
  severity: string
  incidentType: string
  title: string
  createdAt: number      // Date.now()
  status: IncidentStatus
  assignedResourceIds: string[]
  recommendedAction: string
  timeToEvent?: number
  currentLoad?: number
  predictedLoad?: number
}

export interface DeploymentState {
  phase: DeployPhase
  incident: Incident | null
  selectedResourceIds: string[]
  /** When en_route started — for lifecycle timer */
  enRouteAt: number | null
}
