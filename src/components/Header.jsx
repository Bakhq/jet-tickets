import { useState } from 'react'
import { Link } from 'react-router-dom'
import JetLogo from './JetLogo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function initialsOf(profile, email) {
  if (profile?.full_name) {
    return profile.full_name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('')
  }
  return (email || '?')[0].toUpperCase()
}

const NAV_ITEMS = [
  { label: 'Мероприятия', to: '/catalog', key: 'catalog' },
  { label: 'Города', to: '/catalog', key: 'cities' },
  { label: 'Для организаторов', to: '/organizer', key: 'organizers' },
]

function NavLinks({ active }) {
  return (
    <nav className="hidden lg:flex items-center gap-9 text-[15px]">
      {NAV_ITEMS.map(({ label, to, key }) => (
        <Link
          key={key}
          to={to}
          className={`hover:text-ink-2 transition-colors ${
            active === key ? 'font-semibold text-ink' : 'font-medium text-[#4A473F]'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

// variant: 'public' (full nav) | 'account' (no nav links). Either way, the
// identity slot on the right (Войти vs. avatar) follows the real auth state.
export default function Header({ variant = 'public', active }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { session, profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || 'Аккаунт'

  return (
    <header className="bg-white border-b border-border relative">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-16 sm:h-[84px] px-5 sm:px-12">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <JetLogo size={22} textClass="text-lg sm:text-2xl" />
        </Link>

        {variant === 'public' && <NavLinks active={active} />}

        <div className="flex items-center gap-3 sm:gap-5">
          {session ? (
            <>
              <Link
                to="/catalog"
                className="hidden sm:inline-flex bg-teal text-ink font-semibold text-sm px-[18px] py-[10px] rounded-[10px] hover:opacity-85 transition-opacity"
              >
                Купить билет
              </Link>
              <Link to="/account" className="flex items-center gap-2">
                <span className="w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-full bg-teal-band text-teal text-sm font-bold flex items-center justify-center">
                  {initialsOf(profile, session.user?.email)}
                </span>
                <span className="hidden sm:inline text-sm font-semibold text-ink-2">{firstName}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden lg:inline text-[15px] font-medium text-[#4A473F] hover:text-ink-2 transition-colors"
              >
                Войти
              </Link>
              <Link
                to="/catalog"
                className="bg-teal text-ink font-semibold text-sm sm:text-[15px] px-4 py-[9px] sm:px-[22px] sm:py-[11px] rounded-[10px] hover:opacity-85 transition-opacity"
              >
                Купить билет
              </Link>
              <button
                className="lg:hidden flex flex-col gap-[3px] w-5 shrink-0"
                aria-label="Меню"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="h-[1.8px] bg-ink-2 rounded" />
                <span className="h-[1.8px] bg-ink-2 rounded" />
                <span className="h-[1.8px] bg-ink-2 rounded" />
              </button>
            </>
          )}
        </div>
      </div>

      {variant === 'public' && menuOpen && (
        <div className="lg:hidden absolute inset-x-0 top-full bg-white border-b border-border shadow-lg z-20 px-5 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, to, key }) => (
            <Link
              key={key}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`py-2 text-[15px] ${
                active === key ? 'font-semibold text-ink' : 'font-medium text-[#4A473F]'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            to={session ? '/account' : '/auth'}
            onClick={() => setMenuOpen(false)}
            className="py-2 text-[15px] font-medium text-[#4A473F]"
          >
            {session ? 'Личный кабинет' : 'Войти'}
          </Link>
        </div>
      )}
    </header>
  )
}
