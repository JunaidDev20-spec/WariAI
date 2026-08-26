// Section divider label — numbered, with horizontal rule.

interface SectionLabelProps {
  index: string
  label: string
}

export default function SectionLabel({ index, label }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',   /* 12px — readable */
          letterSpacing: '0.12em',
          color: '#66736C',
          fontWeight: 400,
        }}
      >
        {index}
      </span>
      <div className="flex-1 h-px" style={{ background: '#1C2520' }} />
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',   /* 12px */
          letterSpacing: '0.2em',
          color: '#66736C',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <div className="w-8 h-px" style={{ background: '#1C2520' }} />
    </div>
  )
}
