// Base panel — primary surface unit in WariAI.
// Consistent radius + border + optional glow + hover lift.

import type { ReactNode, CSSProperties } from 'react'

interface PanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  hover?: boolean
  glow?: 'none' | 'teal' | 'violet' | 'critical'
  radius?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const GLOW_SHADOW = {
  none:     'none',
  teal:     '0 0 36px 0 rgba(45,212,168,0.09)',
  violet:   '0 0 36px 0 rgba(155,138,251,0.09)',
  critical: '0 0 40px 0 rgba(239,91,91,0.11)',
}

// Normalized radius scale — no random values
const RADIUS_MAP = {
  md:    '16px',
  lg:    '20px',
  xl:    '24px',
  '2xl': '28px',
  '3xl': '32px',
}

export default function Panel({
  children,
  className = '',
  style = {},
  hover = false,
  glow = 'none',
  radius = 'xl',
}: PanelProps) {
  return (
    <div
      className={`${hover ? 'panel-hover' : ''} ${className}`}
      style={{
        background: '#111714',
        border: '1px solid #28332D',
        borderRadius: RADIUS_MAP[radius],
        boxShadow: GLOW_SHADOW[glow],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
