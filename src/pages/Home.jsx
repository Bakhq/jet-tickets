import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import EventCard from '../components/EventCard.jsx'
import { CATEGORIES, listEvents } from '../lib/api.js'

const STEPS = [
  {
    title: 'Выберите событие',
    text: 'Найдите концерт или шоу в своём городе по дате или категории.',
  },
  {
    title: 'Оплатите онлайн',
    text: 'Картой, через СБП или Mir — оплата защищена.',
  },
  {
    title: 'Получите e-билет',
    text: 'Билет с QR-кодом придёт на почту сразу после оплаты.',
  },
]

const BENEFITS = [
  {
    title: 'Мгновенный e-билет',
    text: 'Билет приходит на телефон сразу после оплаты.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="6" y="2" width="12" height="20" rx="2.5" stroke="#0E9E92" strokeWidth="1.6" />
        <line x1="9" y1="18" x2="15" y2="18" stroke="#0E9E92" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Безопасная оплата',
    text: 'Возврат средств при отмене события.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2 L20 5.5 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V5.5 Z"
          stroke="#0E9E92"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: 'Проверенные площадки',
    text: 'Работаем напрямую с организаторами.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#0E9E92" strokeWidth="1.6" />
        <path d="M8 12.5 L10.5 15 L16 9" stroke="#0E9E92" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Поддержка 24/7',
    text: 'Ответим в любое время суток.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#0E9E92" strokeWidth="1.6" />
        <path d="M12 7 V12 L15.5 14" stroke="#0E9E92" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function SearchWidget() {
  const [city, setCity] = useState('Москва')
  const [category, setCategory] = useState('Любая')
  const [date, setDate] = useState('Любая')

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="bg-ink-2 border border-white/[0.08] rounded-2xl p-1.5 sm:p-2 sm:flex sm:items-stretch"
    >
      {[
        { label: 'Город', value: city, set: setCity, options: ['Москва', 'Санкт-Петербург', 'Казань', 'Екатеринбург', 'Новосибирск'] },
        {
          label: 'Категория',
          value: category,
          set: setCategory,
          options: ['Любая', 'Концерты', 'Фестивали', 'Театр', 'Спорт', 'Стендап', 'Детям'],
        },
        { label: 'Дата', value: date, set: setDate, options: ['Любая', 'Сегодня', 'Эти выходные', 'Этот месяц'] },
      ].map(({ label, value, set, options }, i) => (
        <label
          key={label}
          className={`flex-1 block px-3.5 py-3 sm:px-4 ${
            i > 0 ? 'border-t sm:border-t-0 sm:border-l border-white/[0.08]' : ''
          }`}
        >
          <span className="block text-[11px] font-semibold tracking-wide uppercase text-muted-dark mb-1">
            {label}
          </span>
          <select
            value={value}
            onChange={(e) => set(e.target.value)}
            className="bg-transparent text-cream text-[15px] w-full outline-none [color-scheme:dark]"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="p-1.5 sm:p-0 sm:pl-2">
        <Link
          to="/catalog"
          className="block text-center bg-teal text-ink font-semibold text-[15px] py-3.5 sm:py-3 sm:px-7 rounded-xl hover:opacity-85 transition-opacity"
        >
          Найти
        </Link>
      </div>
    </form>
  )
}

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    listEvents()
      .then((data) => active && setEvents(data))
      .catch(() => active && setLoadError(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const featured = events.slice(0, 4)

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" />

      {/* HERO */}
      <div className="relative bg-ink overflow-hidden">
        <div
          className="absolute -top-40 -right-24 w-[520px] h-[520px] pointer-events-none"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,207,190,0.22), rgba(20,207,190,0) 70%)',
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-5 sm:px-12 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-teal mb-3.5">
              Билеты на лучшие события
            </div>
            <h1 className="text-[34px] sm:text-[56px] font-bold tracking-tight leading-[1.08] text-cream mb-4 sm:mb-5">
              Живые эмоции — на один клик ближе
            </h1>
            <p className="text-[15px] sm:text-lg leading-relaxed text-muted-light mb-7 sm:mb-9 max-w-md">
              Концерты, фестивали и шоу в вашем городе. Билет — сразу на телефон.
            </p>
          </div>
          <SearchWidget />
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="bg-white border-b border-border py-10 sm:py-16 px-5 sm:px-12">
        <div className="max-w-[1000px] mx-auto text-center mb-8 sm:mb-12">
          <div className="text-xs font-semibold tracking-[0.14em] uppercase text-teal-deep mb-2.5">
            Как это работает
          </div>
          <div className="text-[22px] sm:text-[32px] font-bold text-ink-2">Три шага до входа</div>
        </div>
        <div className="max-w-[900px] mx-auto grid sm:grid-cols-3 gap-8 sm:gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex sm:flex-col gap-4 sm:gap-4 sm:text-center items-start sm:items-center">
              <div className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-ink text-teal flex items-center justify-center text-[15px] sm:text-lg font-bold">
                {i + 1}
              </div>
              <div>
                <div className="text-base sm:text-lg font-semibold text-ink-2 mb-1">{step.title}</div>
                <div className="text-[13.5px] sm:text-sm leading-relaxed text-muted-2">{step.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 pt-6 sm:pt-8 flex flex-wrap gap-2.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            to="/catalog"
            className="border border-border-2 bg-white rounded-full px-4 sm:px-[18px] py-2.5 text-[13px] font-semibold text-ink-2 hover:border-teal transition-colors"
          >
            {c}
          </Link>
        ))}
      </div>

      {/* FEATURED EVENTS */}
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 py-7 sm:py-8">
        <div className="flex items-baseline justify-between mb-4 sm:mb-[18px]">
          <div className="text-[22px] sm:text-[28px] font-bold tracking-tight text-ink-2">
            Ближайшие события
          </div>
          <Link to="/catalog" className="text-[13px] font-semibold text-teal-deep">
            Все →
          </Link>
        </div>
        {loading ? (
          <div className="text-sm text-muted py-8 text-center">Загружаем события…</div>
        ) : loadError ? (
          <div className="text-sm text-muted py-8 text-center">
            Не удалось загрузить события. Проверьте подключение к Supabase — см. SETUP.md.
          </div>
        ) : featured.length === 0 ? (
          <div className="text-sm text-muted py-8 text-center">Пока нет опубликованных событий.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* BENEFITS */}
      <div className="bg-white border-t border-b border-border py-10 sm:py-16 px-5 sm:px-12">
        <div className="max-w-[1000px] mx-auto text-center mb-8 sm:mb-12">
          <div className="text-xs font-semibold tracking-[0.14em] uppercase text-teal-deep mb-2.5">
            Почему Jetūna
          </div>
          <div className="text-[22px] sm:text-[32px] font-bold text-ink-2">
            Покупать билеты стало проще
          </div>
        </div>
        <div className="max-w-[1000px] mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-7 sm:gap-8">
          {BENEFITS.map((b) => (
            <div key={b.title}>
              <div className="mb-3">{b.icon}</div>
              <div className="text-base font-semibold text-ink-2 mb-1.5">{b.title}</div>
              <div className="text-[13.5px] leading-relaxed text-muted-2">{b.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ORGANIZER CTA */}
      <div className="bg-teal-band px-5 sm:px-12 py-10 sm:py-16 text-center">
        <div className="text-[22px] sm:text-[28px] font-bold text-cream mb-2.5">
          Организуете мероприятие?
        </div>
        <div className="text-sm sm:text-[15px] leading-relaxed text-[#A9D9D3] mb-6 max-w-md mx-auto">
          Продавайте билеты через Jetūna: касса, аналитика и быстрые выплаты.
        </div>
        <Link
          to="/organizer"
          className="inline-block bg-teal text-ink font-semibold text-[15px] px-6 py-3.5 rounded-[10px] hover:opacity-85 transition-opacity"
        >
          Стать организатором
        </Link>
      </div>

      <Footer />
    </div>
  )
}
