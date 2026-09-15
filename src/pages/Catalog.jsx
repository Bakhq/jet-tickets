import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import EventCard from '../components/EventCard.jsx'
import { listEvents } from '../lib/api.js'

// Each sort option has its own stable id (used for the actual comparator)
// separate from its Russian label (used for display) — passing the label
// itself as the <select>'s value used to make the id-based comparisons in
// `filtered` below never match, so switching to "дешевле/дороже" silently
// did nothing. See FilterSelect.
const SORTS = [
  { id: 'date', label: 'по дате' },
  { id: 'price-asc', label: 'сначала дешевле' },
  { id: 'price-desc', label: 'сначала дороже' },
]

const DATE_FILTERS = ['Любая', 'Сегодня', 'Эти выходные', 'Этот месяц']

function toIso(d) {
  return d.toISOString().slice(0, 10)
}

// Sunday-based week; if today is already Sat/Sun, "this weekend" means the
// current one, not next week's.
function weekendRange(today) {
  const day = today.getDay()
  const satOffset = (6 - day + 7) % 7
  const sat = new Date(today)
  sat.setDate(today.getDate() + satOffset)
  const sun = new Date(sat)
  sun.setDate(sat.getDate() + 1)
  return [toIso(sat), toIso(sun)]
}

function matchesDateFilter(rawDate, filter, today) {
  if (filter === 'Любая' || !rawDate) return true
  const todayIso = toIso(today)
  if (filter === 'Сегодня') return rawDate === todayIso
  if (filter === 'Эти выходные') {
    const [sat, sun] = weekendRange(today)
    return rawDate >= sat && rawDate <= sun
  }
  if (filter === 'Этот месяц') {
    return rawDate.slice(0, 7) === todayIso.slice(0, 7)
  }
  return true
}

function FilterSelect({ value, onChange, options, prefix }) {
  // `options` is either an array of plain strings (value === label, e.g. the
  // city/category/date filters) or {value, label} pairs (the sort filter,
  // where the label shown to the visitor must differ from the id compared
  // against in code).
  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <label className="border border-border-2 bg-white rounded-[10px] px-3.5 sm:px-[18px] py-2.5 text-sm font-semibold text-ink-2 flex items-center gap-2 shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none appearance-none pr-1"
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {prefix ? `${prefix}: ${o.label}` : o.label}
          </option>
        ))}
      </select>
      <span className="text-muted text-xs">▾</span>
    </label>
  )
}

export default function Catalog() {
  // The home page's search widget (and the category chips below it) hand
  // their picks through router state — seed the filters from that on first
  // render so landing here from "Найти" actually reflects what was searched.
  const { state } = useLocation()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [city, setCity] = useState(state?.city || 'Все города')
  const [category, setCategory] = useState(state?.category && state.category !== 'Любая' ? state.category : 'Все категории')
  const [dateFilter, setDateFilter] = useState(state?.date || 'Любая')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('date')

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

  const cities = useMemo(() => ['Все города', ...new Set(events.map((e) => e.city))], [events])
  const categories = useMemo(() => ['Все категории', ...new Set(events.map((e) => e.category))], [events])

  const filtered = useMemo(() => {
    const today = new Date()
    let list = events.filter((e) => {
      if (city !== 'Все города' && e.city !== city) return false
      if (category !== 'Все категории' && e.category !== category) return false
      if (query.trim() && !e.title.toLowerCase().includes(query.trim().toLowerCase())) return false
      if (!matchesDateFilter(e.rawDate, dateFilter, today)) return false
      return true
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceFrom - b.priceFrom)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceFrom - a.priceFrom)
    return list
  }, [events, city, category, query, sort, dateFilter])

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" active="catalog" />

      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 pt-6 sm:pt-10">
        <div className="text-xs sm:text-[13px] text-muted mb-3 sm:mb-4">
          <Link to="/">Главная</Link> / <span className="text-ink-2">Мероприятия</span>
        </div>
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div className="text-[26px] sm:text-4xl font-bold tracking-tight text-ink-2">
            Мероприятия
          </div>
          <div className="text-[13px] sm:text-sm text-muted">
            {filtered.length} {filtered.length === 1 ? 'событие' : 'событий'} найдено
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 py-5 sm:py-7">
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar sm:flex-wrap pb-1">
          <FilterSelect value={city} onChange={setCity} options={cities} prefix="Город" />
          <FilterSelect value={category} onChange={setCategory} options={categories} prefix="Категория" />
          <FilterSelect value={dateFilter} onChange={setDateFilter} options={DATE_FILTERS} prefix="Дата" />
          <div className="hidden sm:block flex-1" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск po названию…"
            className="border border-border-2 bg-white rounded-[10px] px-4 py-2.5 text-sm text-ink-2 placeholder:text-muted min-w-[180px] sm:min-w-[220px] outline-none focus:border-teal"
          />
          <FilterSelect
            value={sort}
            onChange={setSort}
            options={SORTS.map((s) => ({ value: s.id, label: s.label }))}
            prefix="Сортировка"
          />
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 pb-8">
        {loading ? (
          <div className="text-center py-16 text-muted">Загружаем события…</div>
        ) : loadError ? (
          <div className="text-center py-16 text-muted">
            Не удалось загрузить события. Проверьте подключение к Supabase — см. SETUP.md.
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted">
            По вашему запросу ничего не найдено. Попробуйте изменить фильтры.
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
