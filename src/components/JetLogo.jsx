import JetMark from './JetMark.jsx'

export default function JetLogo({ dark = false, size = 24, textClass = 'text-xl', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <JetMark size={size} />
      <span
        className={`font-extrabold tracking-tight ${textClass} ${dark ? 'text-cream' : 'text-ink-2'}`}
      >
        Jetūna
      </span>
    </span>
  )
}
