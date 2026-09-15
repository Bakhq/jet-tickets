import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SimpleHeader from '../components/SimpleHeader.jsx'
import { MinimalFooter } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { SERVICE_FEE_RATE, createOrder, getEvent, markOrderPaid } from '../lib/api.js'
import { paymentProvider } from '../lib/payments.js'

function StepIndicator() {
  return (
    <div className="pt-6 sm:pt-8 flex items-center justify-center gap-3 sm:gap-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 sm:w-[26px] sm:h-[26px] rounded-full bg-teal text-ink text-xs sm:text-[13px] font-bold flex items-center justify-center">
          ✓
        </div>
        <span className="text-xs sm:text-sm font-semibold text-muted hidden sm:inline">Билеты</span>
      </div>
      <div className="w-7 sm:w-12 h-px bg-border-2" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 sm:w-[26px] sm:h-[26px] rounded-full bg-ink text-cream text-xs sm:text-[13px] font-bold flex items-center justify-center">
          2
        </div>
        <span className="text-xs sm:text-sm font-semibold text-ink-2">Данные и оплата</span>
      </div>
      <div className="w-7 sm:w-12 h-px bg-border-2" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 sm:w-[26px] sm:h-[26px] rounded-full bg-border-2 text-muted text-xs sm:text-[13px] font-bold flex items-center justify-center">
          3
        </div>
        <span className="text-xs sm:text-sm font-semibold text-muted hidden sm:inline">Готово</span>
      </div>
    </div>
  )
}

export default function Checkout() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payMethod, setPayMethod] = useState('card')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const eventId = state?.eventId
  const selections = state?.selections

  // No valid cart in nav state (e.g. someone lands here directly) — there's
  // nothing to check out, so send them back to pick tickets first.
  useEffect(() => {
    if (!eventId || !selections?.length) {
      navigate('/catalog', { replace: true })
      return
    }
    let active = true
    getEvent(eventId)
      .then((ev) => {
        if (!active) return
        if (!ev) {
          navigate('/catalog', { replace: true })
          return
        }
        setEvent(ev)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [eventId, selections, navigate])

  if (loading || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <SimpleHeader note="Безопасное оформление заказа" action={{ label: '✕ Отмена', to: '/' }} />
        <div className="flex-1 flex items-center justify-center text-sm text-muted">Загрузка…</div>
        <MinimalFooter />
      </div>
    )
  }

  const subtotal = selections.reduce((sum, s) => sum + s.price * s.qty, 0)
  const fee = Math.round(subtotal * SERVICE_FEE_RATE)
  const total = subtotal + fee

  const handlePay = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const firstName = form.get('firstName')?.toString().trim()
    const lastName = form.get('lastName')?.toString().trim()
    const email = form.get('email')?.toString().trim()
    const phone = form.get('phone')?.toString().trim()

    if (!firstName || !email) {
      setError('Укажите хотя бы имя и email — билет придёт на эту почту.')
      return
    }

    setSubmitting(true)
    try {
      const buyer = { name: [firstName, lastName].filter(Boolean).join(' '), email, phone }
      const { orderId, orderNumber, subtotal: sub, fee: f, total: t } = await createOrder({
        event,
        selections,
        buyer,
        userId: user?.id,
      })

      const payment = await paymentProvider.charge({ amount: t, method: payMethod, orderNumber })
      await markOrderPaid(orderId, payment.reference)

      navigate('/checkout/confirmation', {
        state: {
          eventId,
          selections,
          subtotal: sub,
          fee: f,
          total: t,
          orderId,
          orderNumber,
          buyerEmail: email,
          buyerName: buyer.name,
        },
      })
    } catch (err) {
      setError(err.message || 'Не удалось оформить заказ. Попробуйте ещё раз.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader note="Безопасное оформление заказа" action={{ label: '✕ Отмена', to: '/' }} />
      <StepIndicator />

      <form
        onSubmit={handlePay}
        className="max-w-[1200px] mx-auto w-full px-5 sm:px-12 py-8 sm:py-10 pb-14 sm:pb-[72px] grid lg:grid-cols-[1.5fr_1fr] gap-8 sm:gap-12 items-start"
      >
        {/* LEFT: FORM */}
        <div>
          <div className="text-lg sm:text-xl font-bold text-ink-2 mb-4 sm:mb-5">Контактные данные</div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 text-danger text-sm font-semibold rounded-xl px-4 py-3.5 mb-4">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Имя</span>
              <input
                name="firstName"
                defaultValue={profile?.full_name?.split(' ')[0] || ''}
                className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
              />
            </label>
            <label className="block">
              <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Фамилия</span>
              <input
                name="lastName"
                defaultValue={profile?.full_name?.split(' ').slice(1).join(' ') || ''}
                className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
              />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <label className="block">
              <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Email</span>
              <input
                type="email"
                name="email"
                defaultValue={profile?.email || user?.email || ''}
                className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
              />
            </label>
            <label className="block">
              <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Телефон</span>
              <input
                name="phone"
                defaultValue={profile?.phone || ''}
                className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
              />
            </label>
          </div>
          <div className="text-xs text-muted mb-8 sm:mb-9">Билеты и чек придут на этот email</div>

          <div className="text-lg sm:text-xl font-bold text-ink-2 mb-4 sm:mb-5">Способ оплаты</div>
          <div className="flex flex-col gap-3 mb-6">
            <label
              className={`border-[1.5px] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                payMethod === 'card' ? 'border-teal bg-teal/[0.06]' : 'border-border-2'
              }`}
            >
              <input
                type="radio"
                name="pay"
                className="hidden"
                checked={payMethod === 'card'}
                onChange={() => setPayMethod('card')}
              />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#0E9E92" strokeWidth="1.6" />
                <line x1="2" y1="9.5" x2="22" y2="9.5" stroke="#0E9E92" strokeWidth="1.6" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-2">Банковская карта</div>
                <div className="text-xs text-muted">Visa, Mastercard, МИР</div>
              </div>
              <div
                className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${
                  payMethod === 'card' ? 'border-teal border-[5px]' : 'border-border-2'
                }`}
              />
            </label>
            <label
              className={`border-[1.5px] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                payMethod === 'sbp' ? 'border-teal bg-teal/[0.06]' : 'border-border-2'
              }`}
            >
              <input
                type="radio"
                name="pay"
                className="hidden"
                checked={payMethod === 'sbp'}
                onChange={() => setPayMethod('sbp')}
              />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L20 7 V17 L12 22 L4 17 V7 Z" stroke="#8A8578" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink-2">СБП</div>
                <div className="text-xs text-muted">Оплата по QR-коду через банк</div>
              </div>
              <div
                className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 ${
                  payMethod === 'sbp' ? 'border-teal border-[5px]' : 'border-border-2'
                }`}
              />
            </label>
          </div>

          {payMethod === 'card' && (
            <div className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr] gap-4">
              <label className="block col-span-2 sm:col-span-1">
                <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">
                  Номер карты
                </span>
                <input
                  defaultValue="•••• •••• •••• 4242"
                  className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
                />
              </label>
              <label className="block">
                <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Срок</span>
                <input
                  defaultValue="12/28"
                  className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
                />
              </label>
              <label className="block">
                <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">CVC</span>
                <input
                  defaultValue="•••"
                  className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
                />
              </label>
            </div>
          )}

          <div className="text-[11.5px] text-muted-light mt-4">
            Тестовый режим: оплата имитируется, реальные средства не списываются.
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY */}
        <div className="lg:sticky lg:top-6 bg-white border border-border rounded-2xl p-6 sm:p-7">
          <div className="text-base font-bold text-ink-2 mb-5">Ваш заказ</div>

          <div className="flex gap-3.5 pb-5 border-b border-border mb-5">
            <div
              className="w-14 h-14 rounded-[10px] shrink-0 flex items-center justify-center"
              style={{ background: `linear-gradient(160deg, ${event.gradient[0]}, ${event.gradient[1]})` }}
            >
              <JetMark size={22} />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-2 mb-0.5">{event.title}</div>
              <div className="text-xs text-muted">
                {event.date}, {event.time} · {event.venue}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mb-5">
            {selections.map((s) => (
              <div
                key={s.tierId}
                className="flex items-center justify-between text-sm text-[#4A473F]"
              >
                <span>
                  {s.tierName} × {s.qty}
                </span>
                <span>{(s.price * s.qty).toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 pt-4 border-t border-border mb-5">
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Билеты</span>
              <span>{subtotal.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Сервисный сбор</span>
              <span>{fee.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border mb-6">
            <span className="text-[15px] font-semibold text-ink-2">Итого</span>
            <span className="text-[22px] font-bold text-ink-2">{total.toLocaleString('ru-RU')} ₽</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="block w-full text-center bg-teal text-ink font-semibold text-[15px] py-[15px] rounded-[10px] mb-4 hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Обрабатываем оплату…' : `Оплатить ${total.toLocaleString('ru-RU')} ₽`}
          </button>

          <div className="flex items-center justify-center gap-2 mb-3">
            {['VISA', 'MASTERCARD', 'МИР', 'СБП'].map((b) => (
              <div key={b} className="border border-border rounded-[5px] px-2 py-1 text-[10px] font-semibold text-muted">
                {b}
              </div>
            ))}
          </div>
          <div className="text-xs leading-relaxed text-muted text-center">
            Платёж защищён шифрованием. Полный возврат при отмене события.
          </div>
        </div>
      </form>

      <MinimalFooter />
    </div>
  )
}
