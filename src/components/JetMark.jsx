// The Jet logo mark: a torn-ticket silhouette with a brighter "gem facet" center,
// reused (scaled/recolored) across the whole site.
export default function JetMark({ size = 24, className = '' }) {
  const height = Math.round(size * (210 / 200))
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 200 210"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M56.9,83 L78,120 L100,40 L122,120 L143,83 L128,190 L72,190 Z"
        fill="#14CFBE"
        opacity="0.5"
      />
      <polygon points="100,190 116,107.5 100,40 84,107.5" fill="#14CFBE" />
    </svg>
  )
}
