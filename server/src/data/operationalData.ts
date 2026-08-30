// ── server/src/data/operationalData.ts ───────────────────────────────────
// In-memory operational state — single source of truth for the server.
// Seeded from the same initial data as the frontend mockResources.ts.
// No database — this is the hackathon MVP in-memory store.

import type { Incident, OperationalResource, Deployment } from '../types/operations.js'

// ── Resource seed data (mirrors frontend src/data/mockResources.ts) ──────

const seedResources: OperationalResource[] = [
  { id: 'TEAM_C03', name: 'TEAM_C03', type: 'response_team',    status: 'available', mukamId: 'M03', zoneId: 'L03_Z1', estimatedResponseTime: 8,  capacity: 50,  baseLocation: 'ZONE_L01'         },
  { id: 'TEAM_A12', name: 'TEAM_A12', type: 'response_team',    status: 'available', mukamId: 'M01', zoneId: null,      estimatedResponseTime: 14, capacity: 50,  baseLocation: 'BASE_SASWAD'      },
  { id: 'TEAM_B07', name: 'TEAM_B07', type: 'response_team',    status: 'available', mukamId: 'M02', zoneId: null,      estimatedResponseTime: 22, capacity: 50,  baseLocation: 'BASE_JEJURI'      },
  { id: 'MSU_01',   name: 'MSU_01',   type: 'mobile_sanitation', status: 'available', mukamId: 'M03', zoneId: null,      estimatedResponseTime: 10, capacity: 200, baseLocation: 'BASE_LONAND_N'    },
  { id: 'MSU_02',   name: 'MSU_02',   type: 'mobile_sanitation', status: 'available', mukamId: 'M03', zoneId: null,      estimatedResponseTime: 12, capacity: 200, baseLocation: 'BASE_LONAND_W'    },
  { id: 'MSU_03',   name: 'MSU_03',   type: 'mobile_sanitation', status: 'available', mukamId: 'M04', zoneId: null,      estimatedResponseTime: 18, capacity: 200, baseLocation: 'BASE_NATEPUTE_E'  },
  { id: 'MSU_04',   name: 'MSU_04',   type: 'mobile_sanitation', status: 'available', mukamId: 'M05', zoneId: null,      estimatedResponseTime: 25, capacity: 200, baseLocation: 'BASE_MALSHIRAS_S' },
  { id: 'WRU_02',   name: 'WRU_02',   type: 'waste_response',    status: 'available', mukamId: 'M03', zoneId: null,      estimatedResponseTime: 15, capacity: 300, baseLocation: 'BASE_LONAND_N'    },
  { id: 'WRU_05',   name: 'WRU_05',   type: 'waste_response',    status: 'available', mukamId: 'M05', zoneId: null,      estimatedResponseTime: 20, capacity: 300, baseLocation: 'BASE_MALSHIRAS_E' },
  { id: 'MED_01',   name: 'MED_01',   type: 'medical',           status: 'available', mukamId: 'M02', zoneId: null,      estimatedResponseTime: 12, capacity: 20,  baseLocation: 'BASE_JEJURI_N'    },
  { id: 'MED_02',   name: 'MED_02',   type: 'medical',           status: 'available', mukamId: 'M04', zoneId: null,      estimatedResponseTime: 16, capacity: 20,  baseLocation: 'BASE_NATEPUTE_E'  },
]

// ── Mutable in-memory store ───────────────────────────────────────────────

// Deep-copy seed so every server start is fresh and repeatable
export const resources: OperationalResource[] = seedResources.map(r => ({ ...r }))
export const incidents: Incident[]            = []
export const deployments: Deployment[]        = []

// ── Helpers ───────────────────────────────────────────────────────────────

export function findResource(id: string): OperationalResource | undefined {
  return resources.find(r => r.id === id)
}

export function findIncident(id: string): Incident | undefined {
  return incidents.find(i => i.id === id)
}

/** Update a resource in-place (mutates the store array). */
export function patchResource(
  id: string,
  patch: Partial<OperationalResource>,
): OperationalResource | null {
  const idx = resources.findIndex(r => r.id === id)
  if (idx === -1) return null
  resources[idx] = { ...resources[idx], ...patch }
  return resources[idx]
}

/** Update an incident in-place. */
export function patchIncident(
  id: string,
  patch: Partial<Incident>,
): Incident | null {
  const idx = incidents.findIndex(i => i.id === id)
  if (idx === -1) return null
  incidents[idx] = { ...incidents[idx], ...patch }
  return incidents[idx]
}
