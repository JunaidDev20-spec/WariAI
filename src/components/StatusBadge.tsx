type Status = 'live' | 'safe' | 'watch' | 'high' | 'critical' | 'forecast' | 'ready' | 'offline'

interface StatusBadgeProps {
  status: Status
  label?: string
  size?: 'sm' | 'md'
  pulse?: boolean
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; border: string; label: string }> = {
  live:     { color: '#2DD4A8', bg: 'rgba(45,212,168,0.1)',   border: 'rgba(45,212,168,0.25)',  label: 'LIVE'     },
  safe:     { color: '#2DD4A8', bg: 'rgba(45,212,168,0.1)',   border: 'rgba(45,212,168,0.25)',  label: 'SAFE'     },
  watch:    { color: '#E8C45A', bg: 'rgba(232,196,90,0.1)',   border: 'rgba(232,196,90,0.25)',  label: 'WATCH'    },
  high:     { color: '#F28B4B', bg: 'rgba(242,139,75,0.1)',   border: 'rgba(242,139,75,0.25)',  label: 'HIGH'     },
  critical: { color: '#EF5B5B', bg: 'rgba(239,91,91,0.1)',    border: 'rgba(239,91,91,0.28)',   label: 'CRITICAL' },
  forecast: { color: '#9B8AFB', bg: 'rgba(155,138,251,0.1)',  border: 'rgba(155,138,251,0.25)', label: 'FORECAST' },
  ready:    { color: '#B0BDB7', bg: 'rgba(154,167,160,0.08)', border: 'rgba(154,167,160,0.2)',  label: 'READY'    },
  offline:  { color: '#7A8880', bg: 'rgba(102,115,108,0.08)', border: 'rgba(102,115,108,0.18)', label: 'OFFLINE'  },
}

export default function StatusBadge({ status, label, size = 'md', pulse = false }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  const displayLabel = label ?? cfg.label
  const dotSize = size === 'sm' ? 6 : 7

  return (
    <span
      className="inline-flex items-center gap-2 font-mono"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '999px',
        /* sm: 5/10px  md: 6/13px — normalized vertical rhythm */
        padding: size === 'sm' ? '4px 11px 4px 9px' : '5px 13px 5px 11px',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',   /* 12px / 13px */
        letterSpacing: '0.07em',
        color: cfg.color,
        fontWeight: 500,
        lineHeight: 1,
      }}
    >
      <span
        className={pulse ? 'live-dot' : ''}
        style={{
          display: 'inline-block',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
        }}
      />
      {displayLabel}
    </span>
  )
}
