// ── resourceData.ts ─────────────────────────────────────────────────────────
// Physical resource inventory for the Resources page.
// Hardcoded demo data — easy to replace with backend/API data later.
//
// Concepts kept separate:
//   M1 = live CCTV people count / cleanliness demand
//   M2/M3 = forecast population + sanitation planning
//   Resources = physical inventory/allocation of teams, toilets, dustbins
// ─────────────────────────────────────────────────────────────────────────

export interface ToiletResource {
  id: string
  name: string
  location: string
  mukamId: string
  zoneId: string
  capacity: number
}

export interface DustbinResource {
  id: string
  name: string
  location: string
  mukamId: string
  zoneId: string
  capacity: number
}

// ── Toilet inventory ────────────────────────────────────────────────────────

export const TOILET_RESOURCES: ToiletResource[] = [
  // M01 — Saswad
  { id: 'T_M01_01', name: 'Vitthal Seva Toilet Block A',     location: 'Near Mukam Entry Gate', mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 50 },
  { id: 'T_M01_02', name: 'Pandurang Toilet Block B',        location: 'Main Path - Left Side',  mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 40 },
  { id: 'T_M01_03', name: 'Wari Seva Toilet Block C',        location: 'Near Water Point',       mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 60 },
  { id: 'T_M01_04', name: 'Saswad Public Toilet D',          location: 'Market Road',            mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 50 },
  { id: 'T_M01_05', name: 'Hanuman Mandir Toilet E',         location: 'Temple Side Lane',       mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 50 },
  { id: 'T_M01_06', name: 'Temporary Toilet Unit F',         location: 'Open Ground - North',    mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 50 },

  // M02 — Jejuri
  { id: 'T_M02_01', name: 'Jejuri Entry Toilet A',           location: 'Near Mukam Entry Gate', mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 60 },
  { id: 'T_M02_02', name: 'Jejuri Main Path Toilet B',       location: 'Main Path - Left Side',  mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 50 },
  { id: 'T_M02_03', name: 'Jejuri Right Path Toilet C',      location: 'Main Path - Right Side', mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 50 },
  { id: 'T_M02_04', name: 'Jejuri Market Toilet D',          location: 'Market Road',            mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 60 },
  { id: 'T_M02_05', name: 'Jejuri Temple Toilet E',          location: 'Temple Side Lane',       mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 50 },
  { id: 'T_M02_06', name: 'Jejuri Ground Toilet F',          location: 'Open Ground - North',    mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 60 },

  // M03 — Lonand
  { id: 'T_M03_01', name: 'Lonand Entry Toilet A',           location: 'Near Mukam Entry Gate', mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 55 },
  { id: 'T_M03_02', name: 'Lonand Main Path Toilet B',       location: 'Main Path - Left Side',  mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 45 },
  { id: 'T_M03_03', name: 'Lonand Right Path Toilet C',      location: 'Main Path - Right Side', mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 55 },
  { id: 'T_M03_04', name: 'Lonand Market Toilet D',          location: 'Market Road',            mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 50 },
  { id: 'T_M03_05', name: 'Lonand Temple Toilet E',          location: 'Temple Side Lane',       mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 50 },
  { id: 'T_M03_06', name: 'Lonand Ground Toilet F',          location: 'Open Ground - North',    mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 55 },

  // M04 — Natepute
  { id: 'T_M04_01', name: 'Natepute Entry Toilet A',         location: 'Near Mukam Entry Gate', mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 50 },
  { id: 'T_M04_02', name: 'Natepute Main Path Toilet B',     location: 'Main Path - Left Side',  mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 40 },
  { id: 'T_M04_03', name: 'Natepute Right Path Toilet C',    location: 'Main Path - Right Side', mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 50 },
  { id: 'T_M04_04', name: 'Natepute Market Toilet D',        location: 'Market Road',            mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 50 },
  { id: 'T_M04_05', name: 'Natepute Temple Toilet E',        location: 'Temple Side Lane',       mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 50 },
  { id: 'T_M04_06', name: 'Natepute Ground Toilet F',        location: 'Open Ground - North',    mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 50 },

  // M05 — Malshiras
  { id: 'T_M05_01', name: 'Malshiras Entry Toilet A',        location: 'Near Mukam Entry Gate', mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 60 },
  { id: 'T_M05_02', name: 'Malshiras Main Path Toilet B',    location: 'Main Path - Left Side',  mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 50 },
  { id: 'T_M05_03', name: 'Malshiras Right Path Toilet C',   location: 'Main Path - Right Side', mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 50 },
  { id: 'T_M05_04', name: 'Malshiras Market Toilet D',       location: 'Market Road',            mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 60 },
  { id: 'T_M05_05', name: 'Malshiras Temple Toilet E',       location: 'Temple Side Lane',       mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 50 },
  { id: 'T_M05_06', name: 'Malshiras Ground Toilet F',       location: 'Open Ground - North',    mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 60 },
]

// ── Dustbin inventory ───────────────────────────────────────────────────────

export const DUSTBIN_RESOURCES: DustbinResource[] = [
  // M01 — Saswad
  { id: 'D_M01_01', name: 'Main Path Dustbin 01',    location: 'Main Path - Entry',   mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_02', name: 'Main Path Dustbin 02',    location: 'Main Path - Middle',  mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_03', name: 'Market Area Dustbin 01',  location: 'Market Road',         mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 150 },
  { id: 'D_M01_04', name: 'Market Area Dustbin 02',  location: 'Market Area',         mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 150 },
  { id: 'D_M01_05', name: 'Water Point Dustbin 01',  location: 'Near Water Point',    mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_06', name: 'Open Ground Dustbin 01',  location: 'Open Ground - North', mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_07', name: 'Open Ground Dustbin 02',  location: 'Open Ground - East',  mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_08', name: 'Temple Area Dustbin 01',  location: 'Temple Side',         mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_09', name: 'Bus Stand Dustbin 01',    location: 'Near Bus Stand',      mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },
  { id: 'D_M01_10', name: 'Temporary Bin Unit 01',   location: 'Overflow Point',      mukamId: 'M01', zoneId: 'ZONE_S02', capacity: 100 },

  // M02 — Jejuri
  { id: 'D_M02_01', name: 'Main Path Dustbin 01',    location: 'Main Path - Entry',   mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_02', name: 'Main Path Dustbin 02',    location: 'Main Path - Middle',  mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_03', name: 'Market Area Dustbin 01',  location: 'Market Road',         mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 150 },
  { id: 'D_M02_04', name: 'Market Area Dustbin 02',  location: 'Market Area',         mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 150 },
  { id: 'D_M02_05', name: 'Water Point Dustbin 01',  location: 'Near Water Point',    mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_06', name: 'Open Ground Dustbin 01',  location: 'Open Ground - North', mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_07', name: 'Open Ground Dustbin 02',  location: 'Open Ground - East',  mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_08', name: 'Temple Area Dustbin 01',  location: 'Temple Side',         mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_09', name: 'Bus Stand Dustbin 01',    location: 'Near Bus Stand',      mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },
  { id: 'D_M02_10', name: 'Overflow Bin Unit 01',    location: 'Overflow Point',      mukamId: 'M02', zoneId: 'ZONE_J02', capacity: 120 },

  // M03 — Lonand
  { id: 'D_M03_01', name: 'Main Path Dustbin 01',    location: 'Main Path - Entry',   mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_02', name: 'Main Path Dustbin 02',    location: 'Main Path - Middle',  mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_03', name: 'Market Area Dustbin 01',  location: 'Market Road',         mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 140 },
  { id: 'D_M03_04', name: 'Market Area Dustbin 02',  location: 'Market Area',         mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 140 },
  { id: 'D_M03_05', name: 'Water Point Dustbin 01',  location: 'Near Water Point',    mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_06', name: 'Open Ground Dustbin 01',  location: 'Open Ground - North', mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_07', name: 'Open Ground Dustbin 02',  location: 'Open Ground - East',  mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_08', name: 'Temple Area Dustbin 01',  location: 'Temple Side',         mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_09', name: 'Bus Stand Dustbin 01',    location: 'Near Bus Stand',      mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },
  { id: 'D_M03_10', name: 'Overflow Bin Unit 01',    location: 'Overflow Point',      mukamId: 'M03', zoneId: 'ZONE_L02', capacity: 110 },

  // M04 — Natepute
  { id: 'D_M04_01', name: 'Main Path Dustbin 01',    location: 'Main Path - Entry',   mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_02', name: 'Main Path Dustbin 02',    location: 'Main Path - Middle',  mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_03', name: 'Market Area Dustbin 01',  location: 'Market Road',         mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 120 },
  { id: 'D_M04_04', name: 'Market Area Dustbin 02',  location: 'Market Area',         mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 120 },
  { id: 'D_M04_05', name: 'Water Point Dustbin 01',  location: 'Near Water Point',    mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_06', name: 'Open Ground Dustbin 01',  location: 'Open Ground - North', mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_07', name: 'Open Ground Dustbin 02',  location: 'Open Ground - East',  mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_08', name: 'Temple Area Dustbin 01',  location: 'Temple Side',         mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_09', name: 'Bus Stand Dustbin 01',    location: 'Near Bus Stand',      mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },
  { id: 'D_M04_10', name: 'Overflow Bin Unit 01',    location: 'Overflow Point',      mukamId: 'M04', zoneId: 'ZONE_N02', capacity: 100 },

  // M05 — Malshiras
  { id: 'D_M05_01', name: 'Main Path Dustbin 01',    location: 'Main Path - Entry',   mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_02', name: 'Main Path Dustbin 02',    location: 'Main Path - Middle',  mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_03', name: 'Market Area Dustbin 01',  location: 'Market Road',         mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 160 },
  { id: 'D_M05_04', name: 'Market Area Dustbin 02',  location: 'Market Area',         mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 160 },
  { id: 'D_M05_05', name: 'Water Point Dustbin 01',  location: 'Near Water Point',    mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_06', name: 'Open Ground Dustbin 01',  location: 'Open Ground - North', mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_07', name: 'Open Ground Dustbin 02',  location: 'Open Ground - East',  mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_08', name: 'Temple Area Dustbin 01',  location: 'Temple Side',         mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_09', name: 'Bus Stand Dustbin 01',    location: 'Near Bus Stand',      mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
  { id: 'D_M05_10', name: 'Overflow Bin Unit 01',    location: 'Overflow Point',      mukamId: 'M05', zoneId: 'ZONE_M02', capacity: 130 },
]

// ── Helpers ────────────────────────────────────────────────────────────────

export function getToiletsByMukam(mukamId: string): ToiletResource[] {
  return TOILET_RESOURCES.filter(t => t.mukamId === mukamId)
}

export function getDustbinsByMukam(mukamId: string): DustbinResource[] {
  return DUSTBIN_RESOURCES.filter(d => d.mukamId === mukamId)
}

export function getAllMukamIds(): string[] {
  return Array.from(new Set([...TOILET_RESOURCES, ...DUSTBIN_RESOURCES].map(r => r.mukamId)))
}
