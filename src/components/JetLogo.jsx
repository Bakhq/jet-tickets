export default function JetLogo({ dark = false, size = 24, textClass = 'text-xl', className = '' }) {
  return (
    <span
      className={`font-extrabold tracking-tight whitespace-nowrap ${textClass} ${dark ? 'text-cream' : 'text-ink-2'} ${className}`}
    >
      Jet<span className={`u-ticket ${dark ? 'u-ticket--dark' : ''}`}>ū</span>na
    </span>
  )
}
