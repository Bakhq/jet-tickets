import { Link } from 'react-router-dom'
import JetLogo from './JetLogo.jsx'

// Used on Checkout, OrderConfirmation, Auth — a minimal header with no site nav.
// action: { label, to } renders a right-aligned link/button (e.g. "✕ Отмена").
export default function SimpleHeader({ note, action, center = false }) {
  return (
    <header className="bg-white border-b border-border">
      <div
        className={`max-w-[1440px] mx-auto flex items-center h-16 sm:h-[76px] px-5 sm:px-12 ${
          center ? 'justify-center relative' : 'justify-between'
        }`}
      >
        <Link to="/">
          <JetLogo size={20} textClass="text-lg sm:text-[22px]" />
        </Link>
        {note && (
          <div className="hidden sm:flex items-center gap-2 text-[13px] text-muted">
            <svg width="14" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="#8A8578" strokeWidth="1.6" />
              <path d="M8 10 V7 a4 4 0 0 1 8 0 v3" stroke="#8A8578" strokeWidth="1.6" />
            </svg>
            {note}
          </div>
        )}
        {action && (
          <Link
            to={action.to}
            className={`text-sm font-semibold text-muted-2 ${center ? 'absolute right-5 sm:right-12' : ''}`}
          >
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
