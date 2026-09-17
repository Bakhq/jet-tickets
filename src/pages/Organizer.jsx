import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OrganizerShell from '../components/OrganizerShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listOrganizerEvents, listRefundRequests, respondToRefund } from '../lib/api.js'

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

// One pending refund request, with the buyer's own words (if any) and an
// approve/reject pair that calls the respond_to_refund RPC. Approving is the
// organizer's confirmation that money has actually been returned to the
// buyer by hand — payments are still processed by MockPaymentProvider, which
// has no automatic refund() yet, so nothing here moves money on its own.
function RefundRequestRow({ request, onResolved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleRespond = async (approve) => {
    setBusy(true)
    setError('')
    try {
      const result = await respondToRefund(request.id, approve)
      if (result?.status !== 'ok') {
        setError('Не удалось обработать запрос. Обновите страницу и попробуйте ещё раз.')
        return
      }
      onResolved()
    } catch (err) {
      setError(err.message || 'Не удалось обработать запрос.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-5 sm:px-6 py-4 border-b border-[#F0EEE6] last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink-2">{request.eventTitle}</div>
          <div className="text-[13px] text-muted-2 mt-0.5">
            {request.buyerName} · {request.tier} × {request.qty} · Заказ №{request.orderNumber} ·{' '}
            {request.total?.toLocaleString('ru-RU')} ₽
          </div>
          {request.reason && (
            <div className="text-[13px] text-muted mt-1.5 italic">«{request.reason}»</div>
          )}
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleRespond(false)}
            disabled={busy}
            className="border border-border-2 rounded-[9px] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] font-semibold text-ink-2 hover:bg-[#F0EEE6] transition-colors disabled:opacity-60"
          >
            Отклонить
          </button>
          <button
            type="button"
            onClick={() => handleRespond(true)}
            disabled={busy}
            className="bg-ink text-cream rounded-[9px] px-3.5 py-2.5 text-[12.5px] sm:text-[13px] font-semibold hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {busy ? 'Обрабатываем…' : 'Подтвердить возврат'}
          </button>
        </div>
      </div>
      {error && <div className="text-[13px] font-semibold text-danger mt-2.5">{error}</div>}
    </div>
  )
}

export default function Organizer() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refundRequests, setRefundRequests] = useState([])

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

  const loadRefundRequests = () => {
    if (!user) return
    listRefundRequests(user.id)
      .then((data) => setRefundRequests(data))
      .catch(() => setRefundRequests([]))
  }

  useEffect(() => {
    loadRefundRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {refundRequests.length > 0 && (
        <div className="bg-white border border-amber-text/30 rounded-2xl overflow-hidden mb-6 sm:mb-7">
          <div className="px-5 sm:px-6 py-4 border-b border-border flex items-center gap-2.5">
            <span className="text-[15px] font-semibold text-ink-2">Запросы на возврат</span>
            <span className="text-[11px] font-semibold text-amber-text bg-amber-bg px-[9px] py-1 rounded-md">
              {refundRequests.length}
            </span>
          </div>
          {refundRequests.map((r) => (
            <RefundRequestRow key={r.id} request={r} onResolved={loadRefundRequests} />
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted py-8 text-center">Загружаем данные…</div>
      ) : (
        <>
          {/* STAT CARDS — real numbers only. There used to be a "growth vs
              last period" percentage and a "view conversion" figure here;
              both were fixed placeholder numbers with no data behind them
              (no page-view tracking exists yet), so they're gone rather than
              left showing a fake trend. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-7">
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Билетов продано</div>
              <div className="text-xl sm:text-2xl font-bold text-ink-2">{totalSold.toLocaleString('ru-RU')}</div>
            </div>
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Выручка</div>
              <div className="text-xl sm:text-2xl font-bold text-ink-2">
                {totalRevenue.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="bg-white border border-border rounded-[13px] sm:rounded-2xl p-3.5 sm:p-5">
              <div className="text-[11.5px] sm:text-[13px] text-muted mb-2 sm:mb-2.5">Активных событий</div>
              <div className="text-xl sm:text-2xl font-bold text-ink-2">{activeCount}</div>
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
                        to={`/organizer/events/${ev.eventId}/edit`}
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
                          to={`/organizer/events/${ev.eventId}/edit`}
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
