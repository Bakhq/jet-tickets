import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import EventCard from '../components/EventCard.jsx'
import { listEvents } from '../lib/api.js'

const SORTS = [
  { id: 'date', label: 'по дате' },
  { id: 'price-asc', label: 'сначала дешевле' },
  { id: 'price-desc', label: 'сначала дороже' },
]

function FilterSelect({ value, onChange, options, prefix }) {
  return (
    <label className="border border-border-2 bg-white rounded-[10px] px-3.5 sm:px-[18px] py-2.5 text-sm font-semibold text-ink-2 flex items-center gap-2 shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent outline-none appearance-none pr-1"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {prefix ? `${prefix}: ${o}` : o}
          </option>
        ))}
      </select>
      <span className="text-muted text-xs">▾</span>
    </label>
  )
}

export default function Catalog() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [city, setCity] = useState('Все города')
  const [category, setCategory] = useState('Все категории')
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
    let list = events.filter((e) => {
      if (city !== 'Все города' && e.city !== city) return false
      if (category !== 'Все категории' && e.category !== category) return false
      if (query.trim() && !e.title.toLowerCase().includes(query.trim().toLowerCase())) return false
      return true
    })
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.priceFrom - b.priceFrom)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.priceFrom - a.priceFrom)
    return list
  }, [events, city, category, query, sort])

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
          <div className="hidden sm:block flex-1" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию…"
            className="border border-border-2 bg-white rounded-[10px] px-4 py-2.5 text-sm text-ink-2 placeholder:text-muted min-w-[180px] sm:min-w-[220px] outline-none focus:border-teal"
          />
          <FilterSelect
            value={sort}
            onChange={setSort}
            options={SORTS.map((s) => s.label)}
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
