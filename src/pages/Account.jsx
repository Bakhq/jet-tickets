import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listUserTickets } from '../lib/api.js'

const SIDE_ITEMS = [
  {
    key: 'tickets',
    label: 'Мои билеты',
    icon: (active) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="14" rx="2" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" />
        <line x1="4" y1="10" x2="20" y2="10" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Профиль',
    icon: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M4 19 C4 15 7.5 13 12 13 C16.5 13 20 15 20 19" stroke="#726E63" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="8" r="3.5" stroke="#726E63" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: 'payments',
    label: 'Способы оплаты',
    icon: () => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="#726E63" strokeWidth="1.6" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="#726E63" strokeWidth="1.6" />
      </svg>
    ),
  },
]

// Ticket "download" has no PDF generator on the backend yet, so this builds
// a plain-text e-ticket client-side and saves it via a Blob — real, working
// functionality without needing a server-side ticketing service for a first pass.
function buildTicketText(ticket) {
  return [
    'JETŪNA — ЭЛЕКТРОННЫЙ БИЛЕТ',
    '',
    `Мероприятие: ${ticket.eventTitle}`,
    `Дата: ${ticket.date}`,
    `Место: ${ticket.venue}`,
    `Билет: ${ticket.tier} × ${ticket.qty}`,
    `Номер заказа: ${ticket.orderNumber}`,
    `Статус: ${ticket.status}`,
  ].join('\n')
}

function downloadTicketFile(ticket) {
  const blob = new Blob([buildTicketText(ticket)], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jetuna-ticket-${ticket.orderNumber}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false)
  const qrData = encodeURIComponent(`Jetūna · ${ticket.eventTitle} · Заказ №${ticket.orderNumber}`)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${qrData}`

  return (
    <>
      <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 hover:shadow-[0_12px_28px_rgba(11,10,13,0.06)] transition-shadow">
        <div className="flex gap-4">
          <div
            className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: `linear-gradient(160deg, ${ticket.gradient[0]}, ${ticket.gradient[1]})` }}
          >
            <JetMark size={28} />
          </div>
          <div className="flex-1 sm:hidden">
            <div className="text-base font-semibold text-ink-2 mb-1">{ticket.eventTitle}</div>
            <div className="text-[13px] text-muted mb-1.5">
              {ticket.date} · {ticket.venue}
            </div>
            <div className="text-[13px] text-muted-2">
              {ticket.tier} × {ticket.qty} · Заказ №{ticket.orderNumber}
            </div>
          </div>
        </div>
        <div className="hidden sm:block flex-1">
          <div className="text-base font-semibold text-ink-2 mb-1">{ticket.eventTitle}</div>
          <div className="text-[13px] text-muted mb-1.5">
            {ticket.date} · {ticket.venue}
          </div>
          <div className="text-[13px] text-muted-2">
            {ticket.tier} × {ticket.qty} · Заказ №{ticket.orderNumber}
          </div>
        </div>
        <div className="flex items-center justify-between sm:contents">
          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase text-teal-deep bg-teal/[0.12] px-[11px] py-[5px] rounded-md shrink-0">
            {ticket.status}
          </span>
          <div className="flex gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="border border-border-2 rounded-[9px] px-3.5 sm:px-4 py-2.5 text-[12.5px] sm:text-[13px] font-semibold text-ink-2 hover:bg-[#F0EEE6] transition-colors"
            >
              QR-код
            </button>
            <button
              type="button"
              onClick={() => downloadTicketFile(ticket)}
              className="bg-ink text-cream rounded-[9px] px-3.5 sm:px-4 py-2.5 text-[12.5px] sm:text-[13px] font-semibold hover:opacity-85 transition-opacity"
            >
              Скачать
            </button>
          </div>
        </div>
      </div>

      {showQR && (
        <div
          className="fixed inset-0 bg-ink/60 flex items-center justify-center z-50 px-5"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-[320px] w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold text-ink-2 mb-1">{ticket.eventTitle}</div>
            <div className="text-[13px] text-muted mb-4">Заказ №{ticket.orderNumber}</div>
            <img
              src={qrUrl}
              alt="QR-код билета"
              width={240}
              height={240}
              className="mx-auto rounded-xl border border-border"
            />
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="mt-5 w-full border border-border-2 rounded-[10px] py-2.5 text-sm font-semibold text-ink-2 hover:bg-[#F0EEE6] transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Account() {
  const [tab, setTab] = useState('upcoming')
  const [tickets, setTickets] = useState({ upcoming: [], past: [] })
  const [loading, setLoading] = useState(true)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    let active = true
    listUserTickets(user.id)
      .then((data) => active && setTickets(data))
      .catch(() => active && setTickets({ upcoming: [], past: [] }))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user])

  const list = tab === 'upcoming' ? tickets.upcoming : tickets.past
  const initials = (profile?.full_name || user?.email || '?')[0].toUpperCase()
  const fullName = profile?.full_name || user?.email || 'Аккаунт'

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="account" />

      <div className="max-w-[1200px] mx-auto w-full px-5 sm:px-12 py-6 sm:py-10 flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
        {/* SIDEBAR */}
        <div className="w-full lg:w-[220px] shrink-0 flex flex-row lg:flex-col gap-2 lg:gap-0.5 overflow-x-auto no-scrollbar">
          <div className="hidden lg:flex items-center gap-2.5 py-5 px-1">
            <div className="w-11 h-11 rounded-full bg-teal-band text-teal text-base font-bold flex items-center justify-center">
              {initials}
            </div>
            <div>
              <div className="text-[15px] font-semibold text-ink-2">{fullName}</div>
              <div className="text-xs text-muted">{profile?.email || user?.email}</div>
            </div>
          </div>
          {SIDE_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => item.key === 'tickets' && setTab('upcoming')}
              className={`shrink-0 flex items-center gap-2.5 rounded-[10px] px-3.5 py-3 text-sm font-semibold transition-colors ${
                item.key === 'tickets' ? 'bg-teal/10 text-teal-deep' : 'text-[#4A473F] hover:bg-[#F0EEE6]'
              }`}
            >
              {item.icon(item.key === 'tickets')}
              {item.label}
            </button>
          ))}
          <button
            onClick={handleSignOut}
            className="shrink-0 flex items-center gap-2.5 rounded-[10px] px-3.5 py-3 text-sm font-semibold text-muted lg:mt-3"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 5 L4 12 L9 19" stroke="#8A8578" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="4" y1="12" x2="20" y2="12" stroke="#8A8578" strokeWidth="1.6" />
            </svg>
            Выйти
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 w-full">
          <div className="text-2xl sm:text-[30px] font-bold tracking-tight text-ink-2 mb-5 sm:mb-6">
            Мои билеты
          </div>

          <div className="flex gap-5 sm:gap-7 border-b border-border mb-5 sm:mb-7">
            <button
              onClick={() => setTab('upcoming')}
              className={`text-sm font-semibold pb-3 border-b-2 -mb-px transition-colors ${
                tab === 'upcoming' ? 'text-ink-2 border-teal' : 'text-muted border-transparent'
              }`}
            >
              Предстоящие ({tickets.upcoming.length})
            </button>
            <button
              onClick={() => setTab('past')}
              className={`text-sm font-semibold pb-3 border-b-2 -mb-px transition-colors ${
                tab === 'past' ? 'text-ink-2 border-teal' : 'text-muted border-transparent'
              }`}
            >
              Прошедшие ({tickets.past.length})
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-muted py-8 text-center">Загружаем билеты…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-muted py-8 text-center">
              {tab === 'upcoming' ? 'Пока нет предстоящих билетов.' : 'Пока нет прошедших билетов.'}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 sm:gap-4">
              {list.map((ticket) => (
                <TicketCard key={ticket.orderNumber} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
