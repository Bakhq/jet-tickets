import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SimpleHeader from '../components/SimpleHeader.jsx'
import { MinimalFooter } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { getEvent } from '../lib/api.js'

// Same client-side plain-text e-ticket approach as the "Скачать" button on
// the account page — no PDF/ticketing backend exists yet, so this builds a
// real, working download instead of leaving the button inert.
function buildTicketText({ event, selections, orderNumber, buyerEmail, total }) {
  const lines = [
    'JETŪNA — ЭЛЕКТРОННЫЙ БИЛЕТ',
    '',
    `Мероприятие: ${event.title}`,
    `Дата: ${event.date}, ${event.time}`,
    `Место: ${event.venue}`,
  ]
  selections.forEach((s) => lines.push(`Билет: ${s.tierName} × ${s.qty}`))
  lines.push(`Итого оплачено: ${total.toLocaleString('ru-RU')} ₽`)
  lines.push(`Номер заказа: ${orderNumber}`)
  lines.push(`Email: ${buyerEmail}`)
  return lines.join('\n')
}

function downloadTicketFile(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function OrderConfirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)

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

  const { selections, total, orderNumber, buyerEmail } = state

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
              onClick={() =>
                downloadTicketFile(
                  buildTicketText({ event, selections, orderNumber, buyerEmail, total }),
                  `jetuna-ticket-${orderNumber}.txt`
                )
              }
              className="flex-1 text-center bg-teal text-ink font-semibold text-[13.5px] sm:text-sm py-3 sm:py-[13px] rounded-[10px] hover:opacity-85 transition-opacity"
            >
              Скачать билет
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

      <div className="text-center pb-8 sm:pb-16">
        <Link to="/" className="text-[13.5px] sm:text-sm font-semibold text-teal-deep">
          ← Вернуться на главную
        </Link>
      </div>

      <MinimalFooter />
    </div>
  )
}
