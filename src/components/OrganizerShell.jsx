import { Link, useNavigate } from 'react-router-dom'
import JetMark from './JetMark.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Дашборд',
    to: '/organizer',
    icon: (c) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="13" width="4" height="7" fill={c} />
        <rect x="10" y="8" width="4" height="12" fill={c} />
        <rect x="17" y="4" width="4" height="16" fill={c} />
      </svg>
    ),
  },
  {
    key: 'events',
    label: 'Мои события',
    to: '/organizer/events/new',
    icon: (c) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="14" rx="2" stroke={c} strokeWidth="1.6" />
        <line x1="4" y1="10" x2="20" y2="10" stroke={c} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: 'payouts',
    label: 'Продажи и выплаты',
    to: '/organizer',
    icon: (c) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M2 8 H22 M2 8 L4 5 H20 L22 8 M2 8 V18 H22 V8" stroke={c} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Настройки',
    to: '/organizer',
    icon: (c) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.6" />
        <path
          d="M12 3 V5 M12 19 V21 M3 12 H5 M19 12 H21 M5.6 5.6 L7 7 M17 17 L18.4 18.4 M18.4 5.6 L17 7 M7 17 L5.6 18.4"
          stroke={c}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export default function OrganizerShell({ active, children }) {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()

  const name = profile?.full_name || session?.user?.email || 'Организатор'
  const company = profile?.company_name || session?.user?.email || ''
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-cream">
      {/* SIDEBAR (desktop) / TOP BAR (mobile) */}
      <div className="lg:w-[240px] shrink-0 bg-ink flex flex-col p-4 sm:p-5 lg:p-7 lg:pt-7">
        <div className="flex items-center justify-between lg:block">
          <Link to="/organizer" className="flex items-center gap-2 lg:mb-8">
            <JetMark size={20} />
            <span className="text-lg font-bold tracking-tight text-cream">Jet</span>
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase text-ink bg-teal px-[6px] sm:px-[7px] py-[3px] rounded">
              Organizer
            </span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-ink-2 text-teal text-xs font-bold flex items-center justify-center lg:hidden">
            {initials}
          </div>
        </div>

        <nav className="flex lg:flex-col gap-2 lg:gap-0.5 mt-4 lg:mt-0 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === active
            return (
              <Link
                key={item.key}
                to={item.to}
                className={`shrink-0 flex items-center gap-2.5 lg:gap-3 rounded-[10px] px-3 lg:px-3 py-2 lg:py-3 whitespace-nowrap transition-colors ${
                  isActive ? 'bg-teal/[0.14]' : 'hover:bg-white/[0.06]'
                }`}
              >
                {item.icon(isActive ? '#14CFBE' : '#B7B2A5')}
                <span
                  className={`text-[12.5px] lg:text-sm font-semibold ${
                    isActive ? 'text-teal' : 'text-muted-light'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="hidden lg:block flex-1" />
        <div className="hidden lg:flex items-center gap-2.5 pt-4 border-t border-white/[0.08]">
          <div className="w-[34px] h-[34px] rounded-full bg-ink-2 text-teal text-[13px] font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-cream truncate">{name}</div>
            <div className="text-[11px] text-muted-dark truncate">{company}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Выйти"
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M9 5 L4 12 L9 19" stroke="#8A8578" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="#8A8578" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 min-w-0 px-5 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-9 lg:pb-[60px]">{children}</div>
    </div>
  )
}
