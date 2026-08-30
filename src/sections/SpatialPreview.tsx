import SectionLabel from '../components/SectionLabel'
import MonoTag from '../components/MonoTag'
import Panel from '../components/Panel'

// ── Zone definitions ──────────────────────────────────────────────────────
const ZONES = [
  { id: 'Z02', cx: 305, cy: 230, rx: 74, ry: 55,  status: 'critical', label: 'ZONE_Z02', capacity: '94%',  crowd: '48,320' },
  { id: 'A04', cx: 488, cy: 158, rx: 58, ry: 42,  status: 'high',     label: 'ZONE_A04', capacity: '72%',  crowd: '31,400' },
  { id: 'B01', cx: 592, cy: 298, rx: 65, ry: 48,  status: 'safe',     label: 'ZONE_B01', capacity: '41%',  crowd: '18,200' },
  { id: 'C03', cx: 195, cy: 325, rx: 52, ry: 38,  status: 'watch',    label: 'ZONE_C03', capacity: '66%',  crowd: '22,600' },
  { id: 'D05', cx: 690, cy: 175, rx: 46, ry: 34,  status: 'safe',     label: 'ZONE_D05', capacity: '38%',  crowd: '14,100' },
]

const STATUS: Record<string, { stroke: string; fill: string; label: string }> = {
  critical: { stroke: '#EF5B5B', fill: 'rgba(239,91,91,0.1)',  label: '#EF5B5B' },
  high:     { stroke: '#F28B4B', fill: 'rgba(242,139,75,0.09)',label: '#F28B4B' },
  watch:    { stroke: '#E8C45A', fill: 'rgba(232,196,90,0.08)',label: '#E8C45A' },
  safe:     { stroke: '#2DD4A8', fill: 'rgba(45,212,168,0.07)',label: '#2DD4A8' },
}

const CONTOURS = [
  'M 80 380 C 130 342, 205 312, 285 333 C 362 352, 425 320, 505 300 C 582 280, 660 252, 755 242',
  'M 60 418 C 110 388, 192 356, 276 376 C 358 397, 418 364, 498 342 C 576 320, 656 293, 755 281',
  'M 40 458 C 98 432, 175 400, 262 422 C 346 444, 408 412, 488 387 C 568 361, 648 335, 755 321',
  'M 98 332 C 153 296, 226 266, 308 286 C 387 306, 442 275, 522 257 C 600 239, 673 214, 755 204',
]

const LIVE_ROUTE     = 'M 142 342 C 196 312, 252 270, 306 248 C 353 218, 422 186, 488 168'
const FORECAST_ROUTE = 'M 488 163 C 525 152, 564 156, 600 170 C 634 183, 660 196, 690 180'

export default function SpatialPreview() {
  return (
    <section className="section-enter">
      <SectionLabel index="06" label="Spatial Preview" />

      <Panel radius="3xl" style={{ padding: 0, overflow: 'hidden' }}>

        {/* ── Top bar ── */}
        <div
          style={{
            padding: '18px 28px',
            borderBottom: '1px solid #28332D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#111714',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.688rem',
                letterSpacing: '0.18em',
                color: '#66736C',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Spatial Intelligence Preview
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: '#F3F6F4' }}>
              Mukam Sector Map
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {[
                { color: '#2DD4A8', label: 'Live route',    dash: false },
                { color: '#9B8AFB', label: 'Forecast path', dash: true  },
                { color: '#EF5B5B', label: 'Critical zone', dash: false },
                { color: '#C8A96B', label: 'Terrain',       dash: false },
              ].map(({ color, label, dash }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="14" height="6" viewBox="0 0 14 6" fill="none">
                    {dash
                      ? <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
                      : <line x1="0" y1="3" x2="14" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
                    }
                  </svg>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: '#28332D' }} />
            <MonoTag color="teal">LIVE</MonoTag>
          </div>
        </div>

        {/* ── Map canvas ── */}
        <div style={{ position: 'relative', background: '#0C1410' }}>
          <svg
            viewBox="0 0 800 440"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', display: 'block', minHeight: 300 }}
          >
            <defs>
              <style>{`
                @keyframes critBreath {
                  0%,100% { opacity:0.12; }
                  50%     { opacity:0.24; }
                }
                @keyframes dashFlow {
                  from { stroke-dashoffset: 24; }
                  to   { stroke-dashoffset: 0; }
                }
                @keyframes markerPulse {
                  0%    { r:8;  opacity:0.14; }
                  50%   { r:18; opacity:0;    }
                  100%  { r:8;  opacity:0.14; }
                }
                .crit-aura  { animation: critBreath 3.2s ease-in-out infinite; }
                .dash-flow  { animation: dashFlow 1.8s linear infinite; stroke-dasharray:6 6; }
                .pulse-ring { animation: markerPulse 2.4s ease-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                  .crit-aura,.dash-flow,.pulse-ring { animation:none; }
                }
              `}</style>

              <radialGradient id="mapVig" cx="50%" cy="50%" r="55%">
                <stop offset="0%"   stopColor="transparent" />
                <stop offset="100%" stopColor="#0C1410" stopOpacity="0.55" />
              </radialGradient>

              <radialGradient id="terrainAmbient" cx="28%" cy="78%" r="48%">
                <stop offset="0%"   stopColor="#C8A96B" stopOpacity="0.06" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>

              <radialGradient id="critAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#EF5B5B" stopOpacity="1" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>

            {/* Background */}
            <rect width="800" height="440" fill="#0C1410" />
            <rect width="800" height="440" fill="url(#terrainAmbient)" />

            {/* ── Coordinate grid — extremely subtle ── */}
            <g stroke="#2DD4A8" strokeWidth="0.3" opacity="0.07">
              {[100,200,300,400,500,600,700].map(x => <line key={x} x1={x} y1="0" x2={x} y2="440" />)}
              {[88,176,264,352,440].map(y => <line key={y} x1="0" y1={y} x2="800" y2={y} />)}
            </g>

            {/* ── Topographic contour lines (gold) ── */}
            <g fill="none" stroke="#C8A96B" strokeWidth="0.8" opacity="0.17">
              {CONTOURS.map((d, i) => <path key={i} d={d} />)}
            </g>

            {/* ── Secondary topographic (neutral) ── */}
            <g fill="none" stroke="#9AA7A0" strokeWidth="0.5" opacity="0.09">
              <path d="M 0 198 C 100 188, 200 208, 300 193 C 400 178, 500 198, 600 183 C 700 168, 760 178, 800 172" />
              <path d="M 0 258 C 100 246, 200 266, 310 250 C 420 235, 520 254, 620 238 C 720 222, 770 231, 800 225" />
              <path d="M 0 148 C 120 138, 240 158, 360 143 C 480 128, 590 146, 700 132 C 760 125, 800 128, 800 128" />
            </g>

            {/* ── Zones ── */}
            {ZONES.map(z => {
              const c = STATUS[z.status]
              const selected = z.id === 'Z02'
              return (
                <g key={z.id}>
                  {/* Critical aura — animated breathing */}
                  {z.status === 'critical' && (
                    <ellipse
                      className="crit-aura"
                      cx={z.cx} cy={z.cy}
                      rx={z.rx + 36} ry={z.ry + 28}
                      fill="url(#critAura)"
                    />
                  )}

                  {/* Zone body */}
                  <ellipse
                    cx={z.cx} cy={z.cy}
                    rx={z.rx} ry={z.ry}
                    fill={c.fill}
                    stroke={c.stroke}
                    strokeWidth={selected ? 1.8 : 1.3}
                    strokeDasharray={selected ? 'none' : '5 3.5'}
                    opacity={selected ? 1 : 0.82}
                  />

                  {/* Selected zone outer ring */}
                  {selected && (
                    <ellipse
                      cx={z.cx} cy={z.cy}
                      rx={z.rx + 14} ry={z.ry + 11}
                      fill="none"
                      stroke={c.stroke}
                      strokeWidth="0.8"
                      strokeDasharray="4 7"
                      opacity="0.32"
                    />
                  )}

                  {/* Zone label — increased size for legibility */}
                  <text
                    x={z.cx}
                    y={z.cy - z.ry - 10}
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace"
                    fontSize="9.5"
                    fontWeight="500"
                    letterSpacing="0.08em"
                    fill={c.label}
                    opacity="0.92"
                  >
                    {z.label}
                  </text>

                  {/* Capacity label below zone */}
                  <text
                    x={z.cx}
                    y={z.cy + z.ry + 14}
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace"
                    fontSize="8"
                    letterSpacing="0.06em"
                    fill={c.label}
                    opacity="0.55"
                  >
                    {z.capacity}
                  </text>

                  {/* Center crosshair */}
                  <g stroke={c.stroke} strokeWidth="0.9" opacity={selected ? 0.55 : 0.3}>
                    <line x1={z.cx} y1={z.cy - 5} x2={z.cx} y2={z.cy + 5} />
                    <line x1={z.cx - 5} y1={z.cy} x2={z.cx + 5} y2={z.cy} />
                  </g>
                </g>
              )
            })}

            {/* ── Live route (teal, solid) ── */}
            <path
              d={LIVE_ROUTE}
              fill="none"
              stroke="#2DD4A8"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.68"
            />
            {/* Direction arrow */}
            <polygon points="482,152 497,160 482,168" fill="#2DD4A8" opacity="0.7" />

            {/* ── Forecast route (violet, animated dash) ── */}
            <path
              className="dash-flow"
              d={FORECAST_ROUTE}
              fill="none"
              stroke="#9B8AFB"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.68"
            />

            {/* ── Live pulse markers ── */}
            {[
              { x: 305, y: 230 },
              { x: 488, y: 158 },
              { x: 362, y: 192 },
            ].map((pt, i) => (
              <g key={i}>
                {/* Animated pulse ring */}
                <circle
                  className="pulse-ring"
                  cx={pt.x} cy={pt.y}
                  r="8"
                  fill="#2DD4A8"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
                {/* Static center dot */}
                <circle cx={pt.x} cy={pt.y} r="4" fill="#2DD4A8" opacity="0.9" />
                <circle cx={pt.x} cy={pt.y} r="1.8" fill="#090D0B" opacity="0.9" />
              </g>
            ))}

            {/* ── Forecast endpoint marker ── */}
            <g>
              <circle cx="690" cy="179" r="14" fill="#9B8AFB" opacity="0.06" />
              <circle cx="690" cy="179" r="7"  fill="none" stroke="#9B8AFB" strokeWidth="1.3" opacity="0.55" strokeDasharray="2.5 3" />
              <circle cx="690" cy="179" r="2.5" fill="#9B8AFB" opacity="0.85" />
              <text x="690" y="162" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="9" fill="#9B8AFB" opacity="0.78" letterSpacing="0.07em">
                +34 MIN
              </text>
            </g>

            {/* ── Map coordinate labels ── */}
            <text x="16" y="432" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.28" letterSpacing="0.05em">
              19.0760° N · 74.8790° E
            </text>
            <text x="592" y="22" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.28" letterSpacing="0.05em">
              MUKAM_07 · NASHIK
            </text>

            {/* Vignette */}
            <rect width="800" height="440" fill="url(#mapVig)" />
          </svg>

          {/* ── Floating card: selected zone ── */}
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              background: 'rgba(9,13,11,0.86)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(239,91,91,0.22)',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minWidth: 160,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', letterSpacing: '0.14em', color: '#66736C', textTransform: 'uppercase' }}>
              Selected Zone
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9375rem', letterSpacing: '0.06em', color: '#EF5B5B', fontWeight: 600 }}>
              ZONE_Z02
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF5B5B', display: 'inline-block' }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#EF5B5B' }}>CRITICAL</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(239,91,91,0.15)', paddingTop: 8, marginTop: 2 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#F3F6F4', lineHeight: 1 }}>48,320</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#9AA7A0', marginTop: 2 }}>pilgrims · 94% capacity</div>
            </div>
          </div>

          {/* ── Floating card: AI forecast ── */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(9,13,11,0.86)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(155,138,251,0.22)',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              minWidth: 160,
            }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.688rem', letterSpacing: '0.14em', color: '#9B8AFB', textTransform: 'uppercase' }}>
              AI // Forecast
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: '#9B8AFB', lineHeight: 1, letterSpacing: '-0.01em' }}>
              34 min
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#9AA7A0' }}>
              to critical threshold
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#66736C', marginTop: 2 }}>
              Confidence 91.4%
            </div>
          </div>
        </div>

        {/* ── Bottom stats bar ── */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid #28332D',
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            background: '#111714',
          }}
        >
          {[
            { label: 'Active Zones',   value: '5',         color: '#2DD4A8' },
            { label: 'Critical',       value: '1',         color: '#EF5B5B' },
            { label: 'Total Pilgrims', value: '248,400',   color: '#F3F6F4' },
            { label: 'AI Confidence',  value: '94.2%',     color: '#9B8AFB' },
            { label: 'Last Update',    value: '14:32 IST', color: '#9AA7A0' },
          ].map(({ label, value, color }, i, arr) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                flex: 1,
                paddingRight: i < arr.length - 1 ? 24 : 0,
                borderRight: i < arr.length - 1 ? '1px solid #1C2520' : 'none',
                marginRight: i < arr.length - 1 ? 24 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.688rem',
                  letterSpacing: '0.1em',
                  color: '#66736C',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1rem', color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  )
}
