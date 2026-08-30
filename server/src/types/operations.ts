// ── server/src/types/operations.ts ───────────────────────────────────────
// Shared operational types — kept in sync with frontend src/types/operations.ts.
// Do not import from the frontend — server is a standalone package.

export type IncidentStatus = 'new' | 'acknowledged' | 'deployed' | 'active' | 'resolved'

export interface Incident {
  id: string
  zoneId: string
  zoneLabel: string
  mukamId: string
  severity: string
  incidentType: string
  title: string
  createdAt: number        // Date.now()
  status: IncidentStatus
  assignedResourceIds: string[]
  recommendedAction: string
  timeToEvent?: number
  currentLoad?: number
  predictedLoad?: number
}

export type ResourceType   = 'response_team' | 'mobile_sanitation' | 'waste_response' | 'medical'
export type ResourceStatus = 'available' | 'assigned' | 'en_route' | 'active' | 'resolved' | 'unavailable'

export interface OperationalResource {
  id: string
  name: string
  type: ResourceType
  status: ResourceStatus
  mukamId: string | null
  zoneId: string | null
  estimatedResponseTime: number
  capacity: number
  baseLocation: string
}

export interface Deployment {
  id: string
  incidentId: string
  resourceIds: string[]
  createdAt: number
}
