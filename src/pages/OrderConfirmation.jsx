import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SimpleHeader from '../components/SimpleHeader.jsx'
import { MinimalFooter } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { getEvent } from '../lib/api.js'
import { downloadTicketPdf } from '../lib/ticketPdf.js'

export default function OrderConfirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [downloading, setDownloading] = useState(false)

  // If someone lands here without having gone through checkout, send them back
  // rather than fabricate an order that doesn't exist.
  useEffect(() => {
    if (!state) {
      navigate('/checkout', { replace: true })
      return
    }
    let active = true
    getEvent(state.eventId)
      .then((ev) => active && setEvent(ev))
    return () => {
      active = false
    }
  }, [state, navigate])

  if (!state || !event) return null

  const { selections, total, orderId, orderNumber, buyerEmail, buyerName } = state
  // Same api.qrserver.com pattern as the account page's QR modal — the code
  // is the order's own uuid, checked against the database at the door
  // (see Scan.jsx / check_in_ticket RPC), not just a decorative image.
  const qrUrl = orderId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(orderId)}`
    : null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadTicketPdf({
        id: orderId,
        eventTitle: event.title,
        dateLine: `${event.date}, ${event.time}`,
        venue: event.venue,
        tierLine: selections.map((s) => `${s.tierName} × ${s.qty}`).join(', '),
        orderNumber,
        buyerName,
        totalLabel: `${total.toLocaleString('ru-RU')} ₽`,
        status: 'Оплачено',
        coverImageUrl: event.coverImageUrl,
        gradient: event.gradient,
      })
    } catch {
      alert('Не удалось сформировать PDF-билет. Попробуйте ещё раз.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader center />

      <div className="pt-6 sm:pt-8 flex items-center justify-center gap-3 sm:gap-4">
        {['Билеты', 'Данные и оплата', 'Готово'].map((label, i) => (
          <div key={label} className="flex items-center gap-3 sm:gap-4">
            {i > 0 && <div className="w-7 sm:w-12 h-px bg-teal" />}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 sm:w-[26px] sm:h-[26px] rounded-full text-xs sm:text-[13px] font-bold flex items-center justify-center ${
                  i < 2 ? 'bg-teal text-ink' : 'bg-ink text-cream'
                }`}
              >
                ✓
              </div>
              <span
                className={`text-xs sm:text-sm hidden sm:inline ${
                  i === 2 ? 'font-bold text-ink-2' : 'font-semibold text-muted'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center px-6 pt-8 sm:pt-14 pb-6 sm:pb-10 text-center">
        <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-teal/[0.14] flex items-center justify-center mb-5 sm:mb-6">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 13 L10 18 L19 7" stroke="#0E9E92" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[22px] sm:text-[26px] font-bold text-ink-2 mb-2">Заказ оформлен!</div>
        <div className="text-sm text-muted mb-1">Билет отправлен на почту {buyerEmail}</div>
        <div className="text-[12.5px] sm:text-[13px] text-muted-light">Номер заказа: {orderNumber}</div>
      </div>

      <div className="flex justify-center px-5 pb-8 sm:pb-14">
        <div className="w-full max-w-[560px] bg-white border border-border rounded-2xl p-5 sm:p-7">
          <div className="flex gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-border mb-4 sm:mb-5">
            <div
              className="w-[52px] h-[52px] sm:w-16 sm:h-16 rounded-[11px] sm:rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: `linear-gradient(160deg, ${event.gradient[0]}, ${event.gradient[1]})` }}
            >
              <JetMark size={24} />
            </div>
            <div>
              <div className="text-[14.5px] sm:text-base font-bold text-ink-2 mb-1">{event.title}</div>
              <div className="text-xs sm:text-[13px] text-muted">
                {event.date}, {event.time} · {event.venue}
              </div>
            </div>
          </div>

          {selections.map((s) => (
            <div
              key={s.tierId}
              className="flex items-center justify-between text-[13.5px] sm:text-sm text-[#4A473F] mb-2.5 sm:mb-3"
            >
              <span>Билет</span>
              <span className="font-semibold text-ink-2">
                {s.tierName} × {s.qty}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-[13.5px] sm:text-sm text-[#4A473F] mb-4 sm:mb-5">
            <span>Оплачено</span>
            <span className="font-bold text-ink-2">{total.toLocaleString('ru-RU')} ₽</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 text-center bg-teal text-ink font-semibold text-[13.5px] sm:text-sm py-3 sm:py-[13px] rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
            >
              {downloading ? 'Формируем…' : 'Скачать билет (PDF)'}
            </button>
            <Link
              to="/account"
              className="flex-1 text-center border border-border-2 text-ink-2 font-semibold text-[13.5px] sm:text-sm py-3 sm:py-[13px] rounded-[10px]"
            >
              Перейти в личный кабинет
            </Link>
          </div>
        </div>
      </div>

      {qrUrl && (
        <div className="flex justify-center px-5 pb-8 sm:pb-14 -mt-2 sm:-mt-6">
          <div className="w-full max-w-[560px] bg-white border border-border rounded-2xl p-5 sm:p-7 text-center">
            <div className="text-[14.5px] sm:text-base font-bold text-ink-2 mb-1">Билет для входа</div>
            <div className="text-xs sm:text-[13px] text-muted mb-4 sm:mb-5">
              Покажите этот QR-код на входе — его отсканирует организатор
            </div>
            <img
              src={qrUrl}
              alt="QR-код билета"
              width={200}
              height={200}
              className="mx-auto rounded-xl border border-border"
            />
          </div>
        </div>
      )}

      <div className="text-center pb-8 sm:pb-16">
        <Link to="/" className="text-[13.5px] sm:text-sm font-semibold text-teal-deep">
          ← Вернуться на главную
        </Link>
      </div>

      <MinimalFooter />
    </div>
  )
}
