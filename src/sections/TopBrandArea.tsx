// ── Top Brand Area ────────────────────────────────────────────────────────
// Glass nav bar + hero wordmark + live status.

export default function TopBrandArea() {
  return (
    <header className="relative w-full">

      {/* ── Glass nav bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          height: 60,
          background: 'rgba(9,13,11,0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid #1C2520',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left — wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo mark */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(45,212,168,0.1)',
              border: '1px solid rgba(45,212,168,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="#2DD4A8" strokeWidth="1.2" opacity="0.55" />
              <circle cx="9" cy="9" r="4"   stroke="#2DD4A8" strokeWidth="1.2" opacity="0.8"  />
              <circle cx="9" cy="9" r="1.5" fill="#2DD4A8" />
              <line x1="9" y1="1.5"  x2="9"  y2="4.2"  stroke="#2DD4A8" strokeWidth="1" opacity="0.45" />
              <line x1="9" y1="13.8" x2="9"  y2="16.5" stroke="#2DD4A8" strokeWidth="1" opacity="0.45" />
              <line x1="1.5"  y1="9" x2="4.2"  y2="9"  stroke="#2DD4A8" strokeWidth="1" opacity="0.45" />
              <line x1="13.8" y1="9" x2="16.5" y2="9"  stroke="#2DD4A8" strokeWidth="1" opacity="0.45" />
            </svg>
          </div>

          <div>
            <div
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 800,
                fontSize: '1.05rem',
                letterSpacing: '0.1em',
                color: '#F3F6F4',
                lineHeight: 1.1,
              }}
            >
              WARI<span style={{ color: '#2DD4A8' }}>.AI</span>
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.688rem',   /* 11px */
                letterSpacing: '0.14em',
                color: '#66736C',
                textTransform: 'uppercase',
                marginTop: 2,
                lineHeight: 1,
              }}
            >
              SPATIAL INTELLIGENCE · DS PREVIEW
            </div>
          </div>
        </div>

        {/* Right — status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: '#2DD4A8',
            }}
          >
            <span
              className="live-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#2DD4A8',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(45,212,168,0.55)',
              }}
            />
            SYSTEM READY
          </div>

          <div style={{ width: 1, height: 16, background: '#28332D' }} />

          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.688rem',
              letterSpacing: '0.08em',
              color: '#66736C',
            }}
          >
            v0.1
          </span>
        </div>
      </div>

      {/* ── Hero ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 24px 72px',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            color: '#9AA7A0',
            marginBottom: 24,
          }}
        >
          <span style={{ display: 'inline-block', width: 28, height: 1, background: '#28332D' }} />
          SPATIAL INTELLIGENCE PLATFORM
          <span style={{ display: 'inline-block', width: 28, height: 1, background: '#28332D' }} />
        </div>

        {/* Primary wordmark */}
        <h1
          className="hero-title"
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
            letterSpacing: '0.12em',
            color: '#F3F6F4',
            lineHeight: 1,
            margin: 0,
          }}
        >
          WARI<span style={{ color: '#2DD4A8' }}>.AI</span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 400,
            fontSize: '1.0625rem',   /* 17px */
            color: '#9AA7A0',
            marginTop: 20,
            letterSpacing: '0.01em',
            lineHeight: 1.65,
            maxWidth: 460,
          }}
        >
          Crowd density monitoring, geographic space analysis,
          movement forecasting, and sanitation demand prediction.
        </p>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginTop: 28,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { text: '19.0760° N · 74.8790° E', color: '#66736C' },
            null,
            { text: 'WARI PILGRIMAGE · NASHIK', color: '#66736C' },
            null,
          ].map((item, i) =>
            item === null ? (
              <span key={i} style={{ width: 1, height: 12, background: '#28332D', display: 'inline-block' }} />
            ) : (
              <span
                key={i}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.08em',
                  color: item.color,
                }}
              >
                {item.text}
              </span>
            )
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="live-dot"
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#2DD4A8', display: 'inline-block' }}
            />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2DD4A8' }}>
              LIVE
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
