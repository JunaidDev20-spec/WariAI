import type { ReactNode } from 'react'

type Variant = 'primary' | 'forecast' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  disabled?: boolean
  onClick?: () => void
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: '#2DD4A8',
    color: '#060F0C',
    border: '1px solid transparent',
    fontWeight: 700,
  },
  forecast: {
    background: 'rgba(155,138,251,0.12)',
    color: '#B5ACFD',
    border: '1px solid rgba(155,138,251,0.3)',
    fontWeight: 600,
  },
  secondary: {
    background: 'rgba(243,246,244,0.06)',
    color: '#BCC8C1',
    border: '1px solid #28332D',
    fontWeight: 500,
  },
  ghost: {
    background: 'transparent',
    color: '#9AA7A0',
    border: '1px solid rgba(154,167,160,0.15)',
    fontWeight: 500,
  },
  danger: {
    background: 'rgba(239,91,91,0.1)',
    color: '#F07070',
    border: '1px solid rgba(239,91,91,0.28)',
    fontWeight: 600,
  },
}

/* Hover handled via inline style in onMouseEnter/Leave for precision */
const SIZE_STYLES: Record<'sm' | 'md' | 'lg', {
  padding: string; fontSize: string; borderRadius: string; height: string
}> = {
  sm: { padding: '0 18px', fontSize: '0.8125rem', borderRadius: '14px', height: '34px' },
  md: { padding: '0 22px', fontSize: '0.875rem',  borderRadius: '16px', height: '40px' },
  lg: { padding: '0 28px', fontSize: '0.9375rem', borderRadius: '18px', height: '46px' },
}

export default function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  icon,
  size = 'md',
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant]
  const sizeStyle    = SIZE_STYLES[size]

  const hoverMap: Record<Variant, React.CSSProperties> = {
    primary:   { filter: 'brightness(1.1)', boxShadow: '0 0 20px 0 rgba(45,212,168,0.28)' },
    forecast:  { background: 'rgba(155,138,251,0.2)', borderColor: 'rgba(155,138,251,0.45)' },
    secondary: { background: 'rgba(243,246,244,0.1)', borderColor: '#3D4F47', color: '#F3F6F4' },
    ghost:     { background: 'rgba(243,246,244,0.06)', color: '#F3F6F4' },
    danger:    { background: 'rgba(239,91,91,0.18)', borderColor: 'rgba(239,91,91,0.45)' },
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-base inline-flex items-center justify-center gap-2 font-sans"
      style={{
        ...variantStyle,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        borderRadius: sizeStyle.borderRadius,
        height: sizeStyle.height,
        letterSpacing: '0.045em',
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.36 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!disabled) Object.assign((e.currentTarget as HTMLButtonElement).style, hoverMap[variant])
      }}
      onMouseLeave={e => {
        if (!disabled) {
          const el = e.currentTarget as HTMLButtonElement
          Object.assign(el.style, variantStyle)
          el.style.filter = ''
          el.style.boxShadow = ''
        }
      }}
    >
      {icon && <span className="flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}
