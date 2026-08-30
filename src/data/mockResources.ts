// ── mockResources.ts ─────────────────────────────────────────────────────
// Centralized resource registry.
// Resources are associated with M01–M05 (Pune→Pandharpur route).
// All components read from this — never duplicate state.

export type ResourceType = 'response_team' | 'mobile_sanitation' | 'waste_response' | 'medical'
export type ResourceStatus = 'available' | 'assigned' | 'en_route' | 'active' | 'resolved' | 'unavailable'

export interface OperationalResource {
  id: string
  name: string
  type: ResourceType
  status: ResourceStatus
  mukamId: string | null      // null = at base / not assigned to a Mukam
  zoneId: string | null
  estimatedResponseTime: number  // minutes
  capacity: number               // units of work
  baseLocation: string
}

export const INITIAL_RESOURCES: OperationalResource[] = [
  // ── Response Teams ────────────────────────────────────────────────────
  {
    id: 'TEAM_C03', name: 'TEAM_C03', type: 'response_team',
    status: 'available', mukamId: 'M03', zoneId: 'L03_Z1',
    estimatedResponseTime: 8, capacity: 50, baseLocation: 'ZONE_L01',
  },
  {
    id: 'TEAM_A12', name: 'TEAM_A12', type: 'response_team',
    status: 'available', mukamId: 'M01', zoneId: null,
    estimatedResponseTime: 14, capacity: 50, baseLocation: 'BASE_SASWAD',
  },
  {
    id: 'TEAM_B07', name: 'TEAM_B07', type: 'response_team',
    status: 'available', mukamId: 'M02', zoneId: null,
    estimatedResponseTime: 22, capacity: 50, baseLocation: 'BASE_JEJURI',
  },

  // ── Mobile Sanitation Units ───────────────────────────────────────────
  {
    id: 'MSU_01', name: 'MSU_01', type: 'mobile_sanitation',
    status: 'available', mukamId: 'M03', zoneId: null,
    estimatedResponseTime: 10, capacity: 200, baseLocation: 'BASE_LONAND_N',
  },
  {
    id: 'MSU_02', name: 'MSU_02', type: 'mobile_sanitation',
    status: 'available', mukamId: 'M03', zoneId: null,
    estimatedResponseTime: 12, capacity: 200, baseLocation: 'BASE_LONAND_W',
  },
  {
    id: 'MSU_03', name: 'MSU_03', type: 'mobile_sanitation',
    status: 'available', mukamId: 'M04', zoneId: null,
    estimatedResponseTime: 18, capacity: 200, baseLocation: 'BASE_NATEPUTE_E',
  },
  {
    id: 'MSU_04', name: 'MSU_04', type: 'mobile_sanitation',
    status: 'available', mukamId: 'M05', zoneId: null,
    estimatedResponseTime: 25, capacity: 200, baseLocation: 'BASE_MALSHIRAS_S',
  },

  // ── Waste Response Units ──────────────────────────────────────────────
  {
    id: 'WRU_02', name: 'WRU_02', type: 'waste_response',
    status: 'available', mukamId: 'M03', zoneId: null,
    estimatedResponseTime: 15, capacity: 300, baseLocation: 'BASE_LONAND_N',
  },
  {
    id: 'WRU_05', name: 'WRU_05', type: 'waste_response',
    status: 'available', mukamId: 'M05', zoneId: null,
    estimatedResponseTime: 20, capacity: 300, baseLocation: 'BASE_MALSHIRAS_E',
  },

  // ── Medical ───────────────────────────────────────────────────────────
  {
    id: 'MED_01', name: 'MED_01', type: 'medical',
    status: 'available', mukamId: 'M02', zoneId: null,
    estimatedResponseTime: 12, capacity: 20, baseLocation: 'BASE_JEJURI_N',
  },
  {
    id: 'MED_02', name: 'MED_02', type: 'medical',
    status: 'available', mukamId: 'M04', zoneId: null,
    estimatedResponseTime: 16, capacity: 20, baseLocation: 'BASE_NATEPUTE_E',
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
  const isMedical    = /medical|heat|exhaustion|injury/i.test(alertTitle)

  const ids: string[] = []

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

  return ids
}

/** Human-readable type label */
export function resourceTypeLabel(type: ResourceType): string {
  switch (type) {
    case 'response_team':     return 'Response Team'
    case 'mobile_sanitation': return 'Mobile Sanitation Unit'
    case 'waste_response':    return 'Waste Response Unit'
    case 'medical':           return 'Medical Unit'
  }
}
