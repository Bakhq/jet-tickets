import { Link } from 'react-router-dom'
import JetMark from './JetMark.jsx'

const BADGES = ['VISA', 'MASTERCARD', 'МИР', 'СБП']

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {BADGES.map((b) => (
        <div
          key={b}
          className="border border-white/[0.14] rounded-[5px] px-[9px] py-[5px] text-[11px] font-semibold tracking-wide text-muted-light"
        >
          {b}
        </div>
      ))}
    </div>
  )
}

const COLUMNS = [
  {
    title: 'Компания',
    links: [
      ['О нас', '/'],
      ['Вакансии', '/'],
      ['Контакты', '/'],
    ],
  },
  {
    title: 'Билеты',
    links: [
      ['Мероприятия', '/catalog'],
      ['Города', '/catalog'],
      ['Возврат билета', '/'],
    ],
  },
  {
    title: 'Организаторам',
    links: [
      ['Разместить событие', '/organizer'],
      ['Тарифы', '/'],
    ],
  },
]

// full footer used on Home, Catalog, EventDetail, Account
export function Footer() {
  return (
    <footer className="bg-ink px-5 sm:px-12 pt-10 sm:pt-16 pb-8">
      <div className="max-w-[1344px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 sm:gap-10 mb-10 sm:mb-12">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 mb-3.5">
              <JetMark size={20} />
              <span className="text-lg font-bold tracking-tight text-cream">Jet</span>
            </Link>
            <div className="text-sm text-muted-dark max-w-[260px] leading-relaxed">
              Билеты на концерты, фестивали и шоу — быстро и без переплат.
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[12px] sm:text-[13px] font-semibold tracking-widest uppercase text-muted-dark mb-3">
                {col.title}
              </div>
              <div className="flex flex-col gap-[9px] sm:gap-2.5">
                {col.links.map(([label, to]) => (
                  <Link
                    key={label}
                    to={to}
                    className="text-sm text-muted-light hover:text-cream transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.08] pt-5 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3.5">
          <div className="text-[13px] text-muted-dark order-3 sm:order-1">
            © 2026 Jet. Все права защищены.
          </div>
          <div className="order-1 sm:order-2">
            <PaymentBadges />
          </div>
          <div className="flex gap-4.5 sm:gap-6 order-2 sm:order-3">
            <Link to="/" className="text-[13px] text-muted-dark hover:text-cream transition-colors">
              Условия использования
            </Link>
            <Link to="/" className="text-[13px] text-muted-dark hover:text-cream transition-colors">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// minimal footer used on Checkout / OrderConfirmation
export function MinimalFooter() {
  return (
    <footer className="border-t border-border px-5 sm:px-12 py-6 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2.5">
      <div className="text-[13px] text-muted">© 2026 Jet. Все права защищены.</div>
      <div className="flex gap-4.5 sm:gap-6">
        <Link to="/" className="text-[13px] text-muted">
          Условия использования
        </Link>
        <Link to="/" className="text-[13px] text-muted">
          Политика конфиденциальности
        </Link>
      </div>
    </footer>
  )
}
