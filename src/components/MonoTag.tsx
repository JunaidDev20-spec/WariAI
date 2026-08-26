// Monospace technical label — zone IDs, timestamps, team codes, etc.
// Min font size 11px (0.688rem); default 12px (0.75rem).

interface MonoTagProps {
  children: React.ReactNode
  color?: 'default' | 'teal' | 'violet' | 'gold' | 'muted'
  size?: 'xs' | 'sm'
}

const COLOR_MAP = {
  default: { color: '#9AA7A0', bg: 'rgba(154,167,160,0.08)', border: 'rgba(154,167,160,0.18)' },
  teal:    { color: '#2DD4A8', bg: 'rgba(45,212,168,0.08)',  border: 'rgba(45,212,168,0.22)'  },
  violet:  { color: '#9B8AFB', bg: 'rgba(155,138,251,0.08)', border: 'rgba(155,138,251,0.22)' },
  gold:    { color: '#C8A96B', bg: 'rgba(200,169,107,0.08)', border: 'rgba(200,169,107,0.22)' },
  muted:   { color: '#9AA7A0', bg: 'transparent',            border: 'rgba(154,167,160,0.12)' },
}

export default function MonoTag({ children, color = 'default', size = 'xs' }: MonoTagProps) {
  const c = COLOR_MAP[color]
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: size === 'xs' ? '0.75rem' : '0.8125rem',   /* 12px / 13px */
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        padding: '3px 9px',
        display: 'inline-block',
        lineHeight: 1.55,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}
