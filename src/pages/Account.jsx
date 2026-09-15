import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import JetMark from '../components/JetMark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listUserTickets, updateProfile } from '../lib/api.js'
import { downloadTicketPdf } from '../lib/ticketPdf.js'

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
    icon: (active) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M4 19 C4 15 7.5 13 12 13 C16.5 13 20 15 20 19" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="8" r="3.5" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: 'payments',
    label: 'Способы оплаты',
    icon: (active) => (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" />
        <line x1="3" y1="10" x2="21" y2="10" stroke={active ? '#0E9E92' : '#726E63'} strokeWidth="1.6" />
      </svg>
    ),
  },
]

function TicketCard({ ticket }) {
  const [showQR, setShowQR] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadTicketPdf({
        id: ticket.id,
        eventTitle: ticket.eventTitle,
        dateLine: ticket.date,
        venue: ticket.venue,
        tierLine: `${ticket.tier} × ${ticket.qty}`,
        orderNumber: ticket.orderNumber,
        buyerName: ticket.buyerName,
        totalLabel: ticket.total ? `${ticket.total.toLocaleString('ru-RU')} ₽` : null,
        status: ticket.status,
        coverImageUrl: ticket.coverImageUrl,
        gradient: ticket.gradient,
      })
    } catch {
      alert('Не удалось сформировать PDF-билет. Попробуйте ещё раз.')
    } finally {
      setDownloading(false)
    }
  }
  // The QR encodes the order's own uuid — already unguessable — so the
  // scanner at the door (Scan.jsx) can look it up and check it in via the
  // check_in_ticket RPC. Falls back to the old decorative text if somehow
  // there's no id (e.g. a ticket shaped before this field existed).
  const qrData = encodeURIComponent(ticket.id || `Jetūna · ${ticket.eventTitle} · Заказ №${ticket.orderNumber}`)
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
              onClick={handleDownload}
              disabled={downloading}
              className="bg-ink text-cream rounded-[9px] px-3.5 sm:px-4 py-2.5 text-[12.5px] sm:text-[13px] font-semibold hover:opacity-85 transition-opacity disabled:opacity-60"
            >
              {downloading ? 'Формируем…' : 'Скачать PDF'}
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

function ProfileSection() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // The form only ever reflects the profile that was loaded when this
  // section first mounted; if it changes under us (e.g. another tab), pick
  // up the fresh values rather than silently overwrite them on next save.
  useEffect(() => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
  }, [profile?.full_name, profile?.phone])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setMessage(null)
    try {
      await updateProfile(user.id, { full_name: fullName.trim() || null, phone: phone.trim() || null })
      setMessage({ type: 'ok', text: 'Изменения сохранены.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Не удалось сохранить изменения.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 max-w-[520px]">
      <div className="text-base sm:text-lg font-bold text-ink-2 mb-5">Личные данные</div>

      {message && (
        <div
          className={`text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-4 ${
            message.type === 'ok'
              ? 'bg-teal/[0.12] border border-teal/30 text-teal-deep'
              : 'bg-danger/10 border border-danger/25 text-danger'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Имя</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Телефон</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000-00-00"
            className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">Email</span>
          <input
            value={profile?.email || user?.email || ''}
            disabled
            className="w-full border border-border-2 rounded-[10px] px-4 py-[13px] text-sm text-muted bg-[#F5F3EF] outline-none"
          />
          <span className="block text-[11.5px] text-muted-light mt-1.5">
            Email нельзя изменить здесь — он привязан к входу в аккаунт.
          </span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="self-start bg-teal text-ink font-semibold text-sm px-5 py-3 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  )
}

function PaymentsSection() {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 max-w-[520px] text-center">
      <div className="w-11 h-11 rounded-full bg-[#F0EEE6] flex items-center justify-center mx-auto mb-4">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="#726E63" strokeWidth="1.6" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="#726E63" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="text-[15px] font-semibold text-ink-2 mb-1.5">Сохранённых способов оплаты пока нет</div>
      <div className="text-[13px] leading-relaxed text-muted">
        Сайт сейчас принимает оплату в тестовом режиме, поэтому сохранять карту не нужно — при
        оформлении заказа достаточно указать способ оплаты один раз. Когда подключится приём
        настоящих платежей, здесь появится возможность сохранить карту для быстрой оплаты.
      </div>
    </div>
  )
}

export default function Account() {
  const [section, setSection] = useState('tickets')
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

  const sectionTitle = { tickets: 'Мои билеты', profile: 'Профиль', payments: 'Способы оплаты' }[section]

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
              onClick={() => {
                setSection(item.key)
                if (item.key === 'tickets') setTab('upcoming')
              }}
              className={`shrink-0 flex items-center gap-2.5 rounded-[10px] px-3.5 py-3 text-sm font-semibold transition-colors ${
                item.key === section ? 'bg-teal/10 text-teal-deep' : 'text-[#4A473F] hover:bg-[#F0EEE6]'
              }`}
            >
              {item.icon(item.key === section)}
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
            {sectionTitle}
          </div>

          {section === 'tickets' && (
            <>
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
            </>
          )}

          {section === 'profile' && <ProfileSection />}
          {section === 'payments' && <PaymentsSection />}
        </div>
      </div>

      <Footer />
    </div>
  )
}
