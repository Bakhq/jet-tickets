import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import { MinimalFooter } from '../components/Footer.jsx'
import { listPendingOrdersAdmin, confirmManualPayment } from '../lib/api.js'

// Why a confirm result can come back other than 'ok', per confirm_manual_payment():
const CONFIRM_ERROR_TEXT = {
  forbidden: 'Недостаточно прав для подтверждения оплаты.',
  not_found: 'Заказ не найден — возможно, его уже обработали в другой вкладке.',
  not_pending: 'Этот заказ уже не ожидает подтверждения — обновите список.',
}

function OrderRow({ order, onConfirmed }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  const handleConfirm = async () => {
    setConfirming(true)
    setError(null)
    try {
      const result = await confirmManualPayment(order.id)
      if (result !== 'ok') {
        setError(CONFIRM_ERROR_TEXT[result] || 'Не удалось подтвердить оплату.')
        return
      }
      onConfirmed(order.id)
    } catch (err) {
      setError(err.message || 'Не удалось подтвердить оплату.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-1">
          <span className="text-[15px] font-semibold text-ink-2">{order.eventTitle}</span>
          <span className="text-[13px] text-muted-2">· Заказ №{order.orderNumber}</span>
        </div>
        <div className="text-[13px] text-muted mb-1">
          {order.buyerName || 'Без имени'} · {order.buyerEmail}
          {order.buyerPhone ? ` · ${order.buyerPhone}` : ''}
        </div>
        <div className="text-[13px] text-muted-2">
          {order.tier} · {order.qty} шт. · {order.createdAt ? new Date(order.createdAt).toLocaleString('ru-RU') : ''}
        </div>
        {error && <div className="text-[12.5px] font-semibold text-danger mt-2">{error}</div>}
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-lg font-bold text-ink-2 tabular-nums">{order.total?.toLocaleString('ru-RU')} ₽</div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="bg-teal text-ink font-semibold text-sm px-4 py-2.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60 whitespace-nowrap"
        >
          {confirming ? 'Подтверждаем…' : 'Оплата пришла'}
        </button>
      </div>
    </div>
  )
}

// Site-admin page for confirming manual SBP/bank-transfer payments (see the
// "manual (QR/bank-transfer) payments" section of src/lib/api.js). Buyers
// transfer outside the platform and put their order number in the comment;
// this is where that transfer gets matched up and the order flips to paid,
// across every organizer's events — gated on profiles.is_admin, not the
// organizer role (see RequireAdmin in App.jsx).
export default function Admin() {
  const [orders, setOrders] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoadError(null)
    listPendingOrdersAdmin()
      .then(setOrders)
      .catch((err) => setLoadError(err.message || 'Не удалось загрузить список.'))
  }

  useEffect(() => {
    load()
  }, [])

  const handleConfirmed = (orderId) => {
    setOrders((prev) => (prev || []).filter((o) => o.id !== orderId))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="account" />

      <div className="max-w-[880px] mx-auto w-full px-5 sm:px-8 py-8 sm:py-12 flex-1">
        <div className="mb-6 sm:mb-8">
          <div className="text-2xl sm:text-[28px] font-bold tracking-tight text-ink-2 mb-1.5">
            Ожидают подтверждения оплаты
          </div>
          <div className="text-[13px] sm:text-sm text-muted">
            Сверьте номер заказа из комментария к переводу со списком ниже и нажмите «Оплата пришла».
          </div>
        </div>

        {loadError && (
          <div className="text-[13px] font-semibold text-danger bg-danger/10 border border-danger/25 rounded-xl px-3.5 py-3 mb-5">
            {loadError}
          </div>
        )}

        {orders === null ? (
          <div className="text-sm text-muted py-8 text-center">Загружаем…</div>
        ) : orders.length === 0 ? (
          <div className="text-sm text-muted py-8 text-center">Нет заказов, ожидающих подтверждения.</div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} onConfirmed={handleConfirmed} />
            ))}
          </div>
        )}
      </div>

      <MinimalFooter />
    </div>
  )
}
