// ── server/src/data/toiletConfig.ts ────────────────────────────────────────
// Central configuration for toilets and assigned teams.
// This is the single source of truth for toilet metadata and team assignments.

export interface ToiletTeamMember {
  name: string
  phone: string
}

export interface ToiletConfig {
  id: string
  name: string
  mukamId?: string
  sanitationPointId?: string
  team: ToiletTeamMember[]
}

export const TOILET_CONFIGS: ToiletConfig[] = [
  {
    id: 'TOILET-001',
    name: 'Main Campus Toilet',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M01-01',
    name: 'TC_S01A — Saswad',
    mukamId: 'M01',
    sanitationPointId: 'SP1',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M01-02',
    name: 'TC_S01C — Saswad',
    mukamId: 'M01',
    sanitationPointId: 'SP3',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M02-01',
    name: 'TC_J02B — Jejuri',
    mukamId: 'M02',
    sanitationPointId: 'SP2',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M02-02',
    name: 'TC_J02D — Jejuri',
    mukamId: 'M02',
    sanitationPointId: 'SP4',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M03-01',
    name: 'TC_L03B — Lonand',
    mukamId: 'M03',
    sanitationPointId: 'SP2',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M03-02',
    name: 'TC_L03C — Lonand',
    mukamId: 'M03',
    sanitationPointId: 'SP3',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M04-01',
    name: 'TC_N04C — Natepute',
    mukamId: 'M04',
    sanitationPointId: 'SP3',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M05-01',
    name: 'TC_ML05A — Malshiras',
    mukamId: 'M05',
    sanitationPointId: 'SP1',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
  {
    id: 'TOILET-M05-02',
    name: 'TC_ML05B — Malshiras',
    mukamId: 'M05',
    sanitationPointId: 'SP2',
    team: [
      { name: 'Atharv Patil', phone: '+91808005995' },
      { name: 'Taha Bhai',    phone: '+919763486984' },
    ],
  },
]

export function findToiletConfig(toiletId: string): ToiletConfig | undefined {
  return TOILET_CONFIGS.find(t => t.id === toiletId)
}

export function getToiletTeam(toiletId: string): ToiletTeamMember[] {
  const config = findToiletConfig(toiletId)
  return config ? config.team : []
}

export function getToiletName(toiletId: string): string | undefined {
  const config = findToiletConfig(toiletId)
  return config ? config.name : undefined
}

export function findToiletConfigsByMukamId(mukamId: string): ToiletConfig[] {
  return TOILET_CONFIGS.filter(t => t.mukamId === mukamId)
}
