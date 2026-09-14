import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { getEvent, listEvents } from '../lib/api.js'

function QtyStepper({ value, onChange }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-lg border border-border-2 flex items-center justify-center text-ink-2 hover:bg-[#F0EEE6] transition-colors"
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <div className="w-3.5 text-center text-sm font-semibold text-ink-2">{value}</div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-lg border border-border-2 flex items-center justify-center text-ink-2 hover:bg-[#F0EEE6] transition-colors"
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  )
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState({})

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    Promise.all([getEvent(id), listEvents()])
      .then(([ev, all]) => {
        if (!active) return
        if (!ev) {
          setNotFound(true)
          return
        }
        setEvent(ev)
        setQty(Object.fromEntries(ev.tiers.map((t, i) => [t.id, i === 0 ? 1 : 0])))
        setSimilar(all.filter((e) => e.id !== ev.id).slice(0, 4))
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  const total = useMemo(
    () => (event ? event.tiers.reduce((sum, t) => sum + (qty[t.id] || 0) * t.price, 0) : 0),
    [event, qty]
  )
  const selectedTiers = event ? event.tiers.filter((t) => (qty[t.id] || 0) > 0) : []

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="public" active="catalog" />
        <div className="flex-1 flex items-center justify-center px-5 py-20 text-center text-muted text-sm">
          Загрузка…
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="public" active="catalog" />
        <div className="flex-1 flex items-center justify-center px-5 py-20 text-center">
          <div>
            <div className="text-2xl font-bold text-ink-2 mb-3">Событие не найдено</div>
            <Link to="/catalog" className="text-teal-deep font-semibold">
              ← Вернуться в каталог
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const goToCheckout = () => {
    if (selectedTiers.length === 0) return
    navigate('/checkout', {
      state: {
        eventId: event.id,
        selections: selectedTiers.map((t) => ({ tierId: t.id, tierName: t.name, price: t.price, qty: qty[t.id] })),
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" active="catalog" />

      {/* HERO */}
      <div className="relative bg-ink overflow-hidden">
        <div
          className="absolute -top-40 -right-24 w-[520px] h-[520px] pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(20,207,190,0.2), rgba(20,207,190,0) 70%)' }}
        />
        <div className="hidden sm:block absolute -top-8 -right-5 opacity-[0.08] pointer-events-none">
          <JetMark size={360} />
        </div>
        <div className="relative max-w-[1440px] mx-auto px-5 sm:px-12 py-7 sm:py-14 pb-8 sm:pb-16">
          <div className="text-xs sm:text-[13px] text-muted-dark mb-3.5 sm:mb-5">
            Главная / Мероприятия / <span className="text-muted-light">{event.category}</span>
          </div>
          <div className="flex items-start justify-between gap-10 flex-wrap">
            <div className="max-w-[760px]">
              <div className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-ink bg-teal px-3 py-[5px] rounded-md mb-3.5 sm:mb-5">
                {event.category}
              </div>
              <h1 className="text-[28px] sm:text-[46px] font-bold tracking-tight leading-[1.1] text-cream mb-4 sm:mb-6">
                {event.title}
              </h1>
              <div className="flex flex-col gap-2 sm:gap-2.5">
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[15px] text-[#D8D4C9]">
                  <span className="text-teal">●</span> {event.date}, {event.time}
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[15px] text-[#D8D4C9]">
                  <span className="text-teal">●</span> {event.venue} — {event.address}
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[15px] text-[#D8D4C9]">
                  <span className="text-teal">●</span> {event.ageRating}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                aria-label="В избранное"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-[10px] border border-white/[0.14] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21 C12 21 4 15.5 4 9.5 C4 6.5 6.2 4.5 9 4.5 C10.5 4.5 11.6 5.2 12 6.2 C12.4 5.2 13.5 4.5 15 4.5 C17.8 4.5 20 6.5 20 9.5 C20 15.5 12 21 12 21 Z"
                    stroke="#F5F3EF"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Поделиться"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-[10px] border border-white/[0.14] flex items-center justify-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="6" cy="12" r="2.4" stroke="#F5F3EF" strokeWidth="1.5" />
                  <circle cx="18" cy="6" r="2.4" stroke="#F5F3EF" strokeWidth="1.5" />
                  <circle cx="18" cy="18" r="2.4" stroke="#F5F3EF" strokeWidth="1.5" />
                  <line x1="8.1" y1="11" x2="15.9" y2="7" stroke="#F5F3EF" strokeWidth="1.5" />
                  <line x1="8.1" y1="13" x2="15.9" y2="17" stroke="#F5F3EF" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 py-8 sm:py-14 grid lg:grid-cols-[1.6fr_1fr] gap-8 sm:gap-12 items-start">
        {/* LEFT */}
        <div>
          <div className="text-lg sm:text-[22px] font-bold text-ink-2 mb-3 sm:mb-4">О событии</div>
          <p className="text-sm sm:text-[15px] leading-[1.7] text-[#4A473F] mb-7 sm:mb-8">
            {event.description}
          </p>

          <div className="text-lg sm:text-[22px] font-bold text-ink-2 mb-3 sm:mb-4">Что нужно знать</div>
          <div className="flex flex-col gap-2.5 sm:gap-3 mb-7 sm:mb-8">
            {event.notes.map((note) => (
              <div key={note} className="text-[13.5px] sm:text-sm leading-relaxed text-[#4A473F]">
                — {note}
              </div>
            ))}
          </div>

          <div className="text-lg sm:text-[22px] font-bold text-ink-2 mb-3 sm:mb-4">Место проведения</div>
          <div className="h-[160px] sm:h-[220px] rounded-2xl bg-[#E8E5DC] flex items-center justify-center mb-2">
            <div className="text-[13px] text-muted">Карта площадки</div>
          </div>
          <div className="text-[13px] sm:text-sm text-muted-2">
            {event.venue} — {event.address}
          </div>
        </div>

        {/* RIGHT: TICKETS */}
        <div className="lg:sticky lg:top-6 bg-white border border-border rounded-2xl p-5 sm:p-7">
          <div className="text-base sm:text-lg font-bold text-ink-2 mb-4 sm:mb-5">Выбор билетов</div>

          <div className="flex flex-col gap-3.5 sm:gap-4 mb-5 sm:mb-6">
            {event.tiers.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between ${
                  i < event.tiers.length - 1 ? 'pb-3.5 sm:pb-4 border-b border-border' : ''
                }`}
              >
                <div>
                  <div className="text-sm sm:text-[15px] font-semibold text-ink-2 mb-0.5">{t.name}</div>
                  <div className="text-xs sm:text-[13px] text-muted">
                    {t.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
                <QtyStepper value={qty[t.id] || 0} onChange={(v) => setQty((q) => ({ ...q, [t.id]: v }))} />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3.5 sm:pt-4 border-t border-border mb-4 sm:mb-5">
            <span className="text-sm sm:text-[15px] font-semibold text-ink-2">Итого</span>
            <span className="text-lg sm:text-xl font-bold text-ink-2">
              {total.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <button
            type="button"
            onClick={goToCheckout}
            disabled={selectedTiers.length === 0}
            className="block w-full text-center bg-teal text-ink font-semibold text-sm sm:text-[15px] py-3.5 rounded-[10px] mb-3 hover:opacity-85 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Перейти к оформлению
          </button>
          <div className="text-[11.5px] sm:text-xs leading-relaxed text-muted text-center">
            Билет в электронном виде придёт на почту сразу после оплаты
          </div>
        </div>
      </div>

      {/* SIMILAR */}
      {similar.length > 0 && (
        <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 pb-10 sm:pb-16">
          <div className="text-xl sm:text-2xl font-bold text-ink-2 mb-5 sm:mb-6">Похожие события</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {similar.map((e) => (
              <Link
                key={e.id}
                to={`/events/${e.id}`}
                className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_12px_28px_rgba(11,10,13,0.08)] transition-shadow"
              >
                <div
                  className="h-[110px] sm:h-[130px] flex items-center justify-center"
                  style={{ background: `linear-gradient(160deg, ${e.gradient[0]}, ${e.gradient[1]})` }}
                >
                  <JetMark size={38} />
                </div>
                <div className="p-3.5 sm:p-4">
                  <div className="text-sm sm:text-[15px] font-semibold text-ink-2 mb-1">{e.title}</div>
                  <div className="text-[11.5px] sm:text-xs text-muted mb-2.5">
                    {e.date} · {e.city}
                  </div>
                  <span className="text-[13px] sm:text-sm font-bold text-ink-2">
                    от {e.priceFrom.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
