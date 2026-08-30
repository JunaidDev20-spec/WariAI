// ── DeploymentPanel.tsx ────────────────────────────────────────────────────
// Compact dark deployment workflow panel.
// Positioned as an overlay anchored inside the right column — never leaves
// the viewport, never covers the map.
// Follows the existing WARI.AI visual language exactly.

import { useEffect, useRef } from 'react'
import { resourceTypeLabel, type OperationalResource } from '../data/mockResources'
import type { DeploymentState } from '../types/operations'
import type { Alert } from '../data/mockCommandData'

interface Props {
  deployment: DeploymentState
  resources: OperationalResource[]
  alert: Alert
  mukamId: string
  onToggleResource: (id: string) => void
  onConfirm: () => void
  onCancel: () => void
}

// Mono label style reused throughout
const mono = (color = '#9AA7A0', size = '0.688rem'): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono',monospace",
  fontSize: size,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color,
})

export default function DeploymentPanel({
  deployment, resources, alert, mukamId,
  onToggleResource, onConfirm, onCancel,
}: Props) {
  const { phase, selectedResourceIds } = deployment

  // Prevent interaction during confirming/lifecycle phases
  const isLocked = phase === 'confirming' || phase === 'en_route' || phase === 'active' || phase === 'resolved'

  // Available resources the operator can choose from
  const eligible = resources.filter(r =>
    r.status === 'available' || selectedResourceIds.includes(r.id)
  )

  // ETAest of selected
  const maxEta = selectedResourceIds.length > 0
    ? Math.max(...selectedResourceIds.map(id => resources.find(r => r.id === id)?.estimatedResponseTime ?? 0))
    : 0

  const panelRef = useRef<HTMLDivElement>(null)

  // Trap focus inside panel for a11y
  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  if (phase === 'idle') return null

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(9,13,11,0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        animation: 'ccFadeIn 0.2s ease both',
        padding: '20px',
      }}
      onClick={e => {
        // Click outside panel cancels (unless locked)
        if (e.target === e.currentTarget && !isLocked) onCancel()
      }}
    >
      <div
        style={{
          background: '#111714',
          border: '1px solid #28332D',
          borderRadius: 28,
          width: '100%',
          maxWidth: 440,
          maxHeight: 'calc(100vh - 80px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'ccFadeUp 0.22s ease both',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px 14px',
          background: 'linear-gradient(150deg, rgba(45,212,168,0.07) 0%, transparent 55%)',
          borderBottom: '1px solid #1C2520',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={mono('#66736C')}>Deploy Response</div>
            {!isLocked && (
              <button
                onClick={onCancel}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#66736C', fontSize: '1rem', lineHeight: 1, padding: '2px 4px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F3F6F4' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#66736C' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Target zone + incident */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.9375rem', letterSpacing: '0.06em', color: '#F3F6F4', fontWeight: 600 }}>
              {alert.zoneLabel}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(239,91,91,0.1)', border: '1px solid rgba(239,91,91,0.28)',
              borderRadius: 8, padding: '2px 9px',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF5B5B', display: 'inline-block' }} />
              <span style={mono('#EF5B5B')}>CRITICAL</span>
            </span>
          </div>
          <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.875rem', color: '#9AA7A0', marginTop: 4 }}>
            {alert.title}
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 }}>

          {/* AI recommendation */}
          <div style={{
            background: 'rgba(155,138,251,0.06)', border: '1px solid rgba(155,138,251,0.18)',
            borderRadius: 14, padding: '10px 14px',
          }}>
            <div style={{ ...mono('#9B8AFB'), marginBottom: 5 }}>AI Recommendation</div>
            <p style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#BCC8C1', lineHeight: 1.55, margin: 0 }}>
              {alert.recommendation}
            </p>
          </div>

          {/* Resource list */}
          <div>
            <div style={{ ...mono('#66736C'), marginBottom: 10 }}>Available Resources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {eligible.map(r => {
                const isSelected = selectedResourceIds.includes(r.id)
                const isUnavailable = r.status !== 'available' && !isSelected
                return (
                  <button
                    key={r.id}
                    onClick={() => !isLocked && !isUnavailable && onToggleResource(r.id)}
                    disabled={isLocked || isUnavailable}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(45,212,168,0.08)' : 'rgba(243,246,244,0.03)',
                      border: `1px solid ${isSelected ? 'rgba(45,212,168,0.3)' : '#1C2520'}`,
                      borderRadius: 12, cursor: isLocked || isUnavailable ? 'default' : 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                      textAlign: 'left', opacity: isUnavailable ? 0.4 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!isLocked && !isUnavailable) {
                        (e.currentTarget as HTMLButtonElement).style.background = isSelected ? 'rgba(45,212,168,0.12)' : 'rgba(243,246,244,0.06)'
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = isSelected ? 'rgba(45,212,168,0.08)' : 'rgba(243,246,244,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Checkbox */}
                      <div style={{
                        width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                        background: isSelected ? '#2DD4A8' : 'transparent',
                        border: `1.5px solid ${isSelected ? '#2DD4A8' : '#3D4F47'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}>
                        {isSelected && (
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6 8 1" stroke="#060F0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.8125rem', letterSpacing: '0.06em', color: isSelected ? '#2DD4A8' : '#F3F6F4', fontWeight: 600 }}>
                          {r.name}
                        </div>
                        <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: '#9AA7A0', marginTop: 1 }}>
                          {resourceTypeLabel(r.type)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.75rem', color: isSelected ? '#2DD4A8' : '#9AA7A0', fontWeight: 600 }}>
                        AVAILABLE
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.688rem', color: '#66736C', marginTop: 1 }}>
                        ETA {r.estimatedResponseTime} MIN
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ETA summary */}
          {selectedResourceIds.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px',
              background: 'rgba(243,246,244,0.03)', border: '1px solid #1C2520', borderRadius: 10,
            }}>
              <span style={{ fontFamily: 'Manrope,sans-serif', fontSize: '0.8125rem', color: '#9AA7A0' }}>
                {selectedResourceIds.length} resource{selectedResourceIds.length > 1 ? 's' : ''} selected
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.75rem', color: '#F3F6F4', fontWeight: 600 }}>
                ETA ~{maxEta} MIN
              </span>
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #1C2520', flexShrink: 0, display: 'flex', gap: 10 }}>
          {!isLocked ? (
            <>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, height: 40, background: 'transparent',
                  border: '1px solid #28332D', borderRadius: 14,
                  fontFamily: 'Manrope,sans-serif', fontWeight: 500,
                  fontSize: '0.875rem', color: '#9AA7A0', cursor: 'pointer',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { borderColor: '#3D4F47', color: '#F3F6F4' }) }}
                onMouseLeave={e => { Object.assign((e.currentTarget as HTMLButtonElement).style, { borderColor: '#28332D', color: '#9AA7A0' }) }}
              >
                CANCEL
              </button>

              <button
                onClick={onConfirm}
                disabled={selectedResourceIds.length === 0}
                style={{
                  flex: 2, height: 40,
                  background: selectedResourceIds.length > 0 ? '#2DD4A8' : '#1C2520',
                  border: 'none', borderRadius: 14,
                  fontFamily: 'Manrope,sans-serif', fontWeight: 700,
                  fontSize: '0.875rem', letterSpacing: '0.05em',
                  color: selectedResourceIds.length > 0 ? '#060F0C' : '#66736C',
                  cursor: selectedResourceIds.length > 0 ? 'pointer' : 'not-allowed',
                  transition: 'filter 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
                onMouseEnter={e => { if (selectedResourceIds.length > 0) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = '' }}
              >
                CONFIRM DEPLOYMENT
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5h9M8 3l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          ) : (
            <div style={{
              flex: 1, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(45,212,168,0.08)', border: '1px solid rgba(45,212,168,0.22)', borderRadius: 14,
            }}>
              {phase === 'confirming' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                    <circle cx="7" cy="7" r="5.5" stroke="#2DD4A8" strokeWidth="1.5" strokeDasharray="20 16" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#2DD4A8' }}>DEPLOYING...</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
