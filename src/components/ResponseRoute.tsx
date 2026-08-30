// ── ResponseRoute.tsx ─────────────────────────────────────────────────────
// Rendered inside the CommandMap SVG canvas (inside the transform group).
// Shows animated teal deployment routes from resource origin toward target zone.
// Zero map interference — purely additive SVG elements.

import type { OperationalResource } from '../data/mockResources'
import type { DeployPhase } from '../types/operations'

interface Props {
  phase: DeployPhase
  assignedResources: OperationalResource[]
  targetZone: { cx: number; cy: number; label: string } | null
}

// Fixed departure points for each resource (SVG space, relative to M07 viewBox)
// These represent staging areas around the map edges
const DEPARTURE_POINTS: Record<string, { x: number; y: number }> = {
  TEAM_C03: { x:  88, y: 195 },   // northwest — ZONE_A01 area
  TEAM_A12: { x:  60, y: 140 },   // far northwest
  TEAM_B07: { x:  50, y: 360 },   // southwest
  MSU_01:   { x:  65, y: 320 },   // west staging
  MSU_02:   { x:  72, y: 355 },   // west staging, slightly south
  MSU_03:   { x: 730, y: 340 },   // east staging
  MSU_04:   { x: 740, y: 300 },   // far east
  WRU_02:   { x:  55, y: 290 },   // west waste depot
  WRU_05:   { x: 745, y: 260 },   // east waste depot
  MED_01:   { x:  80, y: 160 },   // medical bay north
  MED_02:   { x: 720, y: 380 },   // medical bay east
}

// Generate a gentle curved path from origin to target
function buildPath(ox: number, oy: number, tx: number, ty: number): string {
  // Mid-control point slightly offset for a curve
  const mx = (ox + tx) / 2 + (oy - ty) * 0.15
  const my = (oy + ty) / 2 + (tx - ox) * 0.10
  return `M ${ox} ${oy} Q ${mx} ${my} ${tx} ${ty}`
}

export default function ResponseRoute({ phase, assignedResources, targetZone }: Props) {
  if (!targetZone || (phase !== 'en_route' && phase !== 'active')) return null

  const tx = targetZone.cx
  const ty = targetZone.cy

  return (
    <g>
      <defs>
        <style>{`
          @keyframes routeDraw {
            from { stroke-dashoffset: 400; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes resourcePulse {
            0%,100% { opacity:0.9; }
            50%      { opacity:0.5; }
          }
          .resp-route { stroke-dasharray:400; animation: routeDraw 1.1s cubic-bezier(0.22,1,0.36,1) forwards; }
          .resp-flow  { stroke-dasharray:6 8;  animation: routeDraw 2s linear infinite; }
          .resp-pulse { animation: resourcePulse 2s ease-in-out infinite; }
          @media(prefers-reduced-motion:reduce){
            .resp-route,.resp-flow,.resp-pulse { animation:none; stroke-dashoffset:0; opacity:1; }
          }
        `}</style>
      </defs>

      {assignedResources.map((r, i) => {
        const origin = DEPARTURE_POINTS[r.id] ?? { x: 60 + i * 30, y: 200 + i * 25 }
        const path   = buildPath(origin.x, origin.y, tx, ty)
        // Stagger animations
        const delay  = `${i * 0.18}s`

        return (
          <g key={r.id}>
            {/* Glow base */}
            <path d={path} fill="none" stroke="#2DD4A8" strokeWidth="4" opacity="0.06" strokeLinecap="round" />

            {/* Drawn route */}
            <path
              className="resp-route"
              d={path}
              fill="none" stroke="#2DD4A8" strokeWidth="1.8" opacity="0.75"
              strokeLinecap="round"
              style={{ animationDelay: delay }}
            />

            {/* Directional flow */}
            <path
              className="resp-flow"
              d={path}
              fill="none" stroke="#2DD4A8" strokeWidth="1.4" opacity="0.45"
              strokeLinecap="round"
              style={{ animationDelay: delay }}
            />

            {/* Origin marker */}
            <circle
              className="resp-pulse"
              cx={origin.x} cy={origin.y} r={4}
              fill="#2DD4A8" opacity="0.85"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
            <circle cx={origin.x} cy={origin.y} r={1.8} fill="#090D0B" opacity="0.9" />

            {/* Resource label near origin */}
            <text
              x={origin.x + 7} y={origin.y + 3}
              fontFamily="IBM Plex Mono,monospace" fontSize="7.5"
              fill="#2DD4A8" opacity="0.8" letterSpacing="0.05em"
            >
              {r.id}
            </text>
          </g>
        )
      })}

      {/* Target zone marker ring */}
      {phase === 'en_route' && (
        <g>
          <circle cx={tx} cy={ty} r={20} fill="none" stroke="#2DD4A8" strokeWidth="1" strokeDasharray="3 5" opacity="0.4" />
          <circle cx={tx} cy={ty} r={8}  fill="none" stroke="#2DD4A8" strokeWidth="1.2" opacity="0.6" />
        </g>
      )}

      {/* ACTIVE — solid ring around target */}
      {phase === 'active' && (
        <g>
          <circle cx={tx} cy={ty} r={22} fill="rgba(45,212,168,0.06)" stroke="#2DD4A8" strokeWidth="1.5" opacity="0.7" />
          <text
            x={tx} y={ty - 26}
            textAnchor="middle"
            fontFamily="IBM Plex Mono,monospace" fontSize="8" letterSpacing="0.1em"
            fill="#2DD4A8" opacity="0.85"
          >
            ACTIVE
          </text>
        </g>
      )}
    </g>
  )
}
