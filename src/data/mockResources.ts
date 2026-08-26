// ── mockResources.ts ─────────────────────────────────────────────────────
// Centralized resource registry.
// All components read from this — never duplicate state.

export type ResourceType = 'response_team' | 'mobile_sanitation' | 'waste_response' | 'medical'
export type ResourceStatus = 'available' | 'assigned' | 'en_route' | 'active' | 'resolved' | 'unavailable'

export interface OperationalResource {
  id: string
  name: string
  type: ResourceType
  status: ResourceStatus
  mukamId: string | null      // null = at base
  zoneId: string | null
  estimatedResponseTime: number  // minutes
  capacity: number               // units of work
  baseLocation: string
}

export const INITIAL_RESOURCES: OperationalResource[] = [
  // ── Response Teams ────────────────────────────────────────────────────
  {
    id: 'TEAM_C03', name: 'TEAM_C03', type: 'response_team',
    status: 'available', mukamId: 'MUKAM_07', zoneId: 'A01',
    estimatedResponseTime: 8, capacity: 50, baseLocation: 'ZONE_A01',
  },
  {
    id: 'TEAM_A12', name: 'TEAM_A12', type: 'response_team',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 14, capacity: 50, baseLocation: 'BASE_NORTH',
  },
  {
    id: 'TEAM_B07', name: 'TEAM_B07', type: 'response_team',
    status: 'available', mukamId: 'MUKAM_08', zoneId: null,
    estimatedResponseTime: 22, capacity: 50, baseLocation: 'BASE_EAST',
  },

  // ── Mobile Sanitation Units ───────────────────────────────────────────
  {
    id: 'MSU_01', name: 'MSU_01', type: 'mobile_sanitation',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 10, capacity: 200, baseLocation: 'BASE_NORTH',
  },
  {
    id: 'MSU_02', name: 'MSU_02', type: 'mobile_sanitation',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 12, capacity: 200, baseLocation: 'BASE_WEST',
  },
  {
    id: 'MSU_03', name: 'MSU_03', type: 'mobile_sanitation',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 18, capacity: 200, baseLocation: 'BASE_EAST',
  },
  {
    id: 'MSU_04', name: 'MSU_04', type: 'mobile_sanitation',
    status: 'available', mukamId: 'MUKAM_08', zoneId: null,
    estimatedResponseTime: 25, capacity: 200, baseLocation: 'BASE_SOUTH',
  },

  // ── Waste Response Units ──────────────────────────────────────────────
  {
    id: 'WRU_02', name: 'WRU_02', type: 'waste_response',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 15, capacity: 300, baseLocation: 'BASE_NORTH',
  },
  {
    id: 'WRU_05', name: 'WRU_05', type: 'waste_response',
    status: 'available', mukamId: 'MUKAM_09', zoneId: null,
    estimatedResponseTime: 20, capacity: 300, baseLocation: 'BASE_EAST',
  },

  // ── Medical ───────────────────────────────────────────────────────────
  {
    id: 'MED_01', name: 'MED_01', type: 'medical',
    status: 'available', mukamId: 'MUKAM_07', zoneId: null,
    estimatedResponseTime: 12, capacity: 20, baseLocation: 'BASE_NORTH',
  },
  {
    id: 'MED_02', name: 'MED_02', type: 'medical',
    status: 'available', mukamId: 'MUKAM_09', zoneId: null,
    estimatedResponseTime: 16, capacity: 20, baseLocation: 'BASE_EAST',
  },
]

// ── Resource selection logic ─────────────────────────────────────────────

/** Determine which resources to recommend for a given alert type + Mukam */
export function selectRecommendedResources(
  resources: OperationalResource[],
  mukamId: string,
  alertTitle: string,
): string[] {
  const available = resources.filter(r => r.status === 'available')

  // Prefer same-Mukam resources, then by ETA
  const byMukamThenEta = (a: OperationalResource, b: OperationalResource) => {
    const aSame = a.mukamId === mukamId ? 0 : 1
    const bSame = b.mukamId === mukamId ? 0 : 1
    if (aSame !== bSame) return aSame - bSame
    return a.estimatedResponseTime - b.estimatedResponseTime
  }

  const isSanitation = /sanitation|overflow|sewage|waste/i.test(alertTitle)
  const isRoute      = /route|congestion|traffic|flow/i.test(alertTitle)
  const isMedical    = /medical|heat|exhaustion|injury/i.test(alertTitle)
  const isCrowd      = /crowd|density|capacity/i.test(alertTitle)

  const ids: string[] = []

  if (isSanitation || isCrowd || isRoute || true) {
    // Always include 1 response team
    const team = [...available]
      .filter(r => r.type === 'response_team')
      .sort(byMukamThenEta)[0]
    if (team) ids.push(team.id)

    if (isSanitation) {
      // 2 MSUs for sanitation
      const msus = [...available]
        .filter(r => r.type === 'mobile_sanitation' && !ids.includes(r.id))
        .sort(byMukamThenEta)
        .slice(0, 2)
      msus.forEach(r => ids.push(r.id))
    } else if (isMedical) {
      const med = [...available]
        .filter(r => r.type === 'medical' && !ids.includes(r.id))
        .sort(byMukamThenEta)[0]
      if (med) ids.push(med.id)
    } else {
      // Generic: 1 MSU
      const msu = [...available]
        .filter(r => r.type === 'mobile_sanitation' && !ids.includes(r.id))
        .sort(byMukamThenEta)[0]
      if (msu) ids.push(msu.id)
    }
  }

  return ids
}

/** Human-readable type label */
export function resourceTypeLabel(type: ResourceType): string {
  switch (type) {
    case 'response_team':    return 'Response Team'
    case 'mobile_sanitation': return 'Mobile Sanitation Unit'
    case 'waste_response':   return 'Waste Response Unit'
    case 'medical':          return 'Medical Unit'
  }
}
