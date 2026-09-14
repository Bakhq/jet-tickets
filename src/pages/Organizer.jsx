import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrganizerShell from '../components/OrganizerShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listOrganizerEvents } from '../lib/api.js'

// Illustrative only — there's no weekly-sales table backing this chart yet;
// it's cosmetic dashboard chrome, same as in the original mock build.
const WEEKLY_CHART = [52, 68, 44, 80, 61, 90, 100, 73]

const STATUS_STYLE = {
  active: { label: 'Активно', text: 'text-teal-deep', bg: 'bg-teal/[0.12]' },
  low: { label: 'Мало мест', text: 'text-amber-text', bg: 'bg-amber-bg' },
  draft: { label: 'Черновик', text: 'text-muted-2', bg: 'bg-[#EDEBE4]' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status]
  return (
    <span className={`text-[11px] font-semibold px-[9px] py-1 rounded-md ${s.text} ${s.bg}`}>
      {s.label}
    </span>
  )
}

export default function Organizer() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    listOrganizerEvents(user.id)
      .then((data) => active && setEvents(data))
      .catch(() => active && setEvents([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  const soldEvents = events.filter((e) => e.status !== 'draft')
  const totalSold = soldEvents.reduce((sum, e) => sum + (e.sold || 0), 0)
  const totalRevenue = soldEvents.reduce((sum, e) => sum + (e.revenue || 0), 0)
  const activeCount = soldEvents.length

  return (
    <OrganizerShell active="dashboard">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6 sm:mb-8">
        <div className="text-xl sm:text-[28px] font-bold tracking-tight text-ink-2">Дашборд</div>
        <Link
          to="/organizer/events/new"
          className="bg-teal text-ink font-semibold text-[12.5px] sm:text-sm px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-[10px] hover:opacity-85 transition-opacity"
        >
          + Создать событие
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted py-8 text-center">Загружаем данные…</div>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-7">
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Билетов продано</div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-xl sm:text-2xl font-bold text-ink-2">{totalSold.toLocaleString('ru-RU')}</div>
                <div className="text-[11px] sm:text-xs font-semibold text-teal-deep">+12%</div>
              </div>
            </div>
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Выручка</div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-xl sm:text-2xl font-bold text-ink-2">
                  {(totalRevenue / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}М ₽
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-teal-deep">+8%</div>
              </div>
            </div>
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Активных событий</div>
              <div className="text-xl sm:text-2xl font-bold text-ink-2">{activeCount}</div>
            </div>
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Конверсия просмотров</div>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <div className="text-xl sm:text-2xl font-bold text-ink-2">6,4%</div>
                <div className="text-[11px] sm:text-xs font-semibold text-danger">−0,3%</div>
              </div>
            </div>
          </div>

          {/* CHART */}
          <div className="bg-white border border-border rounded-2xl p-4 sm:p-6 mb-6 sm:mb-7">
            <div className="text-sm sm:text-[15px] font-semibold text-ink-2 mb-4 sm:mb-5">
              Продажи билетов за 4 недели
            </div>
            <div className="flex items-end gap-2 sm:gap-3.5 h-[100px] sm:h-[140px] px-0.5">
              {WEEKLY_CHART.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${i === 6 ? 'bg-teal' : 'bg-teal-wash'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex gap-2 sm:gap-3.5 px-0.5 mt-2">
              {['Нед 1', 'Пт', 'Нед 2', 'Пт', 'Нед 3', 'Пт', 'Нед 4', 'Пт'].map((label, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-[9.5px] sm:text-[11px] ${
                    i === 6 ? 'text-ink-2 font-semibold' : 'text-muted'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {events.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-8 text-center text-sm text-muted">
              У вас пока нет событий.{' '}
              <Link to="/organizer/events/new" className="text-teal-deep font-semibold">
                Создать первое →
              </Link>
            </div>
          ) : (
            <>
              {/* EVENTS: table on desktop, cards on mobile */}
              <div className="bg-white border border-border rounded-2xl overflow-hidden hidden lg:block">
                <div className="px-6 py-5 border-b border-border text-[15px] font-semibold text-ink-2">
                  Мои события
                </div>
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr] px-6 py-3.5 text-xs font-semibold tracking-wide uppercase text-muted border-b border-border">
                  <div>Событие</div>
                  <div>Дата</div>
                  <div>Продано</div>
                  <div>Выручка</div>
                  <div>Статус</div>
                  <div />
                </div>
                {events.map((ev) => (
                  <div
                    key={ev.eventId}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_0.8fr_0.8fr] items-center px-6 py-4 border-b border-[#F0EEE6] last:border-0 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="text-sm font-semibold text-ink-2">{ev.title}</div>
                    <div className="text-[13px] text-muted-2">{ev.date ?? '—'}</div>
                    <div className="text-[13px] text-muted-2">
                      {ev.sold != null ? `${ev.sold} / ${ev.capacity}` : '—'}
                    </div>
                    <div className="text-[13px] font-semibold text-ink-2">
                      {ev.revenue != null ? `${ev.revenue.toLocaleString('ru-RU')} ₽` : '—'}
                    </div>
                    <div>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div>
                      <Link
                        to={ev.status === 'draft' ? '/organizer/events/new' : '/organizer'}
                        className="text-[13px] font-semibold text-teal-deep"
                      >
                        {ev.status === 'draft' ? 'Продолжить' : 'Управлять'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:hidden">
                <div className="text-[15px] font-semibold text-ink-2 mb-3.5">Мои события</div>
                <div className="flex flex-col gap-3">
                  {events.map((ev) => (
                    <div key={ev.eventId} className="bg-white border border-border rounded-[13px] p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="text-sm font-semibold text-ink-2">{ev.title}</div>
                        <StatusBadge status={ev.status} />
                      </div>
                      <div className="text-xs text-muted-2 mb-2">
                        {ev.date ? `${ev.date} · ${ev.sold} / ${ev.capacity} продано` : 'Дата не назначена'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink-2">
                          {ev.revenue != null ? `${ev.revenue.toLocaleString('ru-RU')} ₽` : '—'}
                        </span>
                        <Link
                          to={ev.status === 'draft' ? '/organizer/events/new' : '/organizer'}
                          className="text-[12.5px] font-semibold text-teal-deep"
                        >
                          {ev.status === 'draft' ? 'Продолжить →' : 'Управлять →'}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </OrganizerShell>
  )
}
