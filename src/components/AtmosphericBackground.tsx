// Extremely subtle topographic / spatial background layer.
// Low opacity — atmosphere only, never competes with UI content.

export default function AtmosphericBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Base radial ambient gradients */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 15% 85%, rgba(200,169,107,0.045) 0%, transparent 65%),
            radial-gradient(ellipse 55% 55% at 85% 15%, rgba(45,212,168,0.04) 0%, transparent 65%),
            radial-gradient(ellipse 90% 70% at 50% 50%, rgba(155,138,251,0.025) 0%, transparent 70%)
          `,
        }}
      />

      {/* Topographic contour SVG */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          <radialGradient id="contourFade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#9AA7A0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#9AA7A0" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Contour ring cluster — bottom left (terrain feel) */}
        <g fill="none" stroke="url(#contourFade)" strokeWidth="0.75" opacity="0.55">
          <ellipse cx="180" cy="760" rx="260" ry="110" />
          <ellipse cx="180" cy="760" rx="210" ry="86" />
          <ellipse cx="180" cy="760" rx="162" ry="64" />
          <ellipse cx="180" cy="760" rx="118" ry="45" />
          <ellipse cx="180" cy="760" rx="76"  ry="28" />
          <ellipse cx="180" cy="760" rx="38"  ry="13" />
        </g>

        {/* Contour ring cluster — top right */}
        <g fill="none" stroke="url(#contourFade)" strokeWidth="0.75" opacity="0.45">
          <ellipse cx="1290" cy="140" rx="300" ry="130" />
          <ellipse cx="1290" cy="140" rx="240" ry="100" />
          <ellipse cx="1290" cy="140" rx="182" ry="74" />
          <ellipse cx="1290" cy="140" rx="128" ry="52" />
          <ellipse cx="1290" cy="140" rx="78"  ry="32" />
        </g>

        {/* Mid-page secondary cluster */}
        <g fill="none" stroke="url(#contourFade)" strokeWidth="0.6" opacity="0.3">
          <ellipse cx="760" cy="460" rx="380" ry="160" />
          <ellipse cx="760" cy="460" rx="300" ry="124" />
          <ellipse cx="760" cy="460" rx="220" ry="90" />
          <ellipse cx="760" cy="460" rx="145" ry="60" />
        </g>

        {/* Sparse grid — very low opacity */}
        <g stroke="#2DD4A8" strokeWidth="0.4" opacity="0.06">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`vg${i}`} x1={i * 160} y1="0" x2={i * 160} y2="900" />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <line key={`hg${i}`} x1="0" y1={i * 150} x2="1440" y2={i * 150} />
          ))}
        </g>

        {/* Route / path suggestion — bottom left to center */}
        <path
          d="M 60 820 C 160 760, 280 700, 420 640 C 560 580, 680 530, 820 480"
          fill="none"
          stroke="#2DD4A8"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.12"
        />

        {/* Secondary route — top right down */}
        <path
          d="M 1380 80 C 1300 160, 1200 240, 1080 320 C 960 400, 860 440, 760 470"
          fill="none"
          stroke="#9B8AFB"
          strokeWidth="0.8"
          strokeDasharray="3 10"
          opacity="0.1"
        />

        {/* Tiny coordinate labels */}
        <text x="48" y="830" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.2" letterSpacing="0.06em">
          19.0760° N
        </text>
        <text x="48" y="845" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.2" letterSpacing="0.06em">
          74.8790° E
        </text>
        <text x="1240" y="36" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.18" letterSpacing="0.06em">
          MUKAM_07
        </text>
        <text x="1240" y="50" fontFamily="IBM Plex Mono" fontSize="9" fill="#9AA7A0" opacity="0.18" letterSpacing="0.06em">
          ZONE_Z02
        </text>

        {/* Tiny cross markers */}
        <g stroke="#2DD4A8" strokeWidth="0.8" opacity="0.15">
          <line x1="820" y1="477" x2="820" y2="483" />
          <line x1="817" y1="480" x2="823" y2="480" />
        </g>
        <g stroke="#C8A96B" strokeWidth="0.8" opacity="0.15">
          <line x1="420" y1="637" x2="420" y2="643" />
          <line x1="417" y1="640" x2="423" y2="640" />
        </g>
      </svg>
    </div>
  )
}
