// ── src/data/toiletZoneMap.ts ──────────────────────────────────────────────
// Maps simulation zone IDs to toilet IDs for critical-alert triggering.
// Zone IDs come from the simulation engine (mockCommandData.ts).
// Toilet IDs come from the backend toilet config (toiletConfig.ts).
//
// Each zone can have multiple associated toilets.
// When a zone transitions to CRITICAL, all mapped toilets are alerted.

export interface ToiletConfigSummary {
  id: string
  name: string
  mukamId?: string
  sanitationPointId?: string
  team: Array<{ name: string; phone: string }>
}

const ZONE_TO_TOILET_MAP: Record<string, Record<string, string[]>> = {
  M01: {
    'S01_Z1': ['TOILET-M01-01'],
    'S01_Z2': ['TOILET-M01-01', 'TOILET-M01-02'],
    'S01_Z3': ['TOILET-M01-02'],
    'S01_Z4': ['TOILET-M01-01', 'TOILET-M01-02'],
  },
  M02: {
    'J02_Z1': ['TOILET-M02-01'],
    'J02_Z2': ['TOILET-M02-01', 'TOILET-M02-02'],
    'J02_Z3': ['TOILET-M02-02'],
    'J02_Z4': ['TOILET-M02-01', 'TOILET-M02-02'],
  },
  M03: {
    'L03_Z1': ['TOILET-M03-01'],
    'L03_Z2': ['TOILET-M03-01', 'TOILET-M03-02'],
    'L03_Z3': ['TOILET-M03-02'],
    'L03_Z4': ['TOILET-M03-01', 'TOILET-M03-02'],
  },
  M04: {
    'N04_Z1': ['TOILET-M04-01'],
    'N04_Z2': ['TOILET-M04-01'],
    'N04_Z3': ['TOILET-M04-01'],
    'N04_Z4': ['TOILET-M04-01'],
  },
  M05: {
    'ML05_Z1': ['TOILET-M05-01'],
    'ML05_Z2': ['TOILET-M05-01', 'TOILET-M05-02'],
    'ML05_Z3': ['TOILET-M05-02'],
    'ML05_Z4': ['TOILET-M05-01', 'TOILET-M05-02'],
  },
}

export function getToiletIdsForZone(mukamId: string, zoneId: string): string[] {
  const mukamMap = ZONE_TO_TOILET_MAP[mukamId]
  if (!mukamMap) return []
  return mukamMap[zoneId] || []
}

export function getAllToiletIdsForMukam(mukamId: string): string[] {
  const mukamMap = ZONE_TO_TOILET_MAP[mukamId]
  if (!mukamMap) return []
  const ids = new Set<string>()
  const zoneMap = mukamMap as Record<string, string[]>
  for (const toiletIds of Object.values(zoneMap)) {
    for (const id of toiletIds) ids.add(id)
  }
  return Array.from(ids)
}
