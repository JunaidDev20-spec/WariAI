import { useState } from 'react'
import MonoTag from '../components/MonoTag'

const NAV_ITEMS = ['COMMAND', 'MAP', 'FORECAST', 'SANITATION', 'ALERTS'] as const
type NavItem = typeof NAV_ITEMS[number]

interface CommandNavProps {
  alertCount?: number
  currentMukamId?: string
  lastUpdate?: string
}

export default function CommandNav({ alertCount = 3, currentMukamId = 'MUKAM_07', lastUpdate = '14:32 IST' }: CommandNavProps) {
  const [active, setActive] = useState<NavItem>('COMMAND')

  return (
    <nav
      className="cc-nav-enter"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 52,
        background: 'rgba(9,13,11,0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid #1C2520',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* ── Left: brand + nav ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 30, height: 30,
              borderRadius: 9,
              background: 'rgba(45,212,168,0.1)',
              border: '1px solid rgba(45,212,168,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="#2DD4A8" strokeWidth="1.2" opacity="0.5" />
              <circle cx="9" cy="9" r="4"   stroke="#2DD4A8" strokeWidth="1.2" opacity="0.85"/>
              <circle cx="9" cy="9" r="1.5" fill="#2DD4A8" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 800,
              fontSize: '0.9375rem', letterSpacing: '0.1em', color: '#F3F6F4', lineHeight: 1.1,
            }}>
              WARI<span style={{ color: '#2DD4A8' }}>.AI</span>
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.625rem',
              letterSpacing: '0.13em', color: '#66736C', textTransform: 'uppercase', lineHeight: 1,
            }}>
              COMMAND CENTRE
            </div>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: '#1C2520' }} />

        {/* Nav items */}
        <div className="cc-nav-items" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const isActive = active === item
            const isAlerts = item === 'ALERTS'
            return (
              <button
                key={item}
                className="nav-item"
                onClick={() => setActive(item)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#F3F6F4' : '#66736C',
                  background: isActive ? 'rgba(243,246,244,0.07)' : 'transparent',
                  border: 'none',
                  borderRadius: 8,
                  padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#BCC8C1'
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#66736C'
                }}
              >
                {item}
                {/* Alert count badge */}
                {isAlerts && alertCount > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#EF5B5B', color: '#fff',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.625rem', fontWeight: 700,
                  }}>
                    {alertCount}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: -1, left: 8, right: 8, height: 2,
                    background: '#2DD4A8', borderRadius: 2,
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: mukam selector + status ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Mukam selector */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
            letterSpacing: '0.08em', color: '#C8A96B',
            background: 'rgba(200,169,107,0.07)',
            border: '1px solid rgba(200,169,107,0.2)',
            borderRadius: 10, padding: '5px 12px',
            cursor: 'pointer',
            transition: 'background 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'rgba(200,169,107,0.12)'
            el.style.borderColor = 'rgba(200,169,107,0.35)'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.background = 'rgba(200,169,107,0.07)'
            el.style.borderColor = 'rgba(200,169,107,0.2)'
          }}
        >
          {currentMukamId}
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 1l3 3 3-3" stroke="#C8A96B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div style={{ width: 1, height: 16, background: '#1C2520' }} />

        {/* System live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            className="live-dot"
            style={{
              width: 6, height: 6, borderRadius: '50%', background: '#2DD4A8',
              display: 'inline-block', boxShadow: '0 0 6px rgba(45,212,168,0.6)',
            }}
          />
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
            letterSpacing: '0.08em', color: '#2DD4A8',
          }}>
            SYSTEM LIVE
          </span>
        </div>

        {/* Time */}
        <div style={{ width: 1, height: 16, background: '#1C2520' }} />
        <MonoTag color="muted">{lastUpdate}</MonoTag>
      </div>
    </nav>
  )
}
