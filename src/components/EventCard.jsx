import { Link } from 'react-router-dom'
import JetMark from './JetMark.jsx'

export default function EventCard({ event }) {
  const [from, to] = event.gradient
  return (
    <Link
      to={`/events/${event.id}`}
      className="group block bg-white border border-border rounded-2xl overflow-hidden hover:shadow-[0_12px_28px_rgba(11,10,13,0.08)] transition-shadow"
    >
      <div className="relative">
        {event.lowStock && (
          <div className="absolute top-3 right-3 z-10 text-[10px] font-semibold tracking-wide uppercase text-amber-text bg-amber-bg px-[9px] py-1 rounded-md">
            Мало билетов
          </div>
        )}
        <div
          className="h-[130px] sm:h-[150px] flex items-center justify-center"
          style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        >
          <JetMark size={44} />
        </div>
      </div>
      <div className="p-4 sm:p-[18px]">
        <div className="inline-block text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase text-teal-deep bg-teal/[0.12] px-2.5 py-1 rounded-md mb-2">
          {event.category}
        </div>
        <div className="text-[16px] sm:text-[17px] font-semibold text-ink-2 mb-1.5 group-hover:text-teal-deep transition-colors">
          {event.title}
        </div>
        <div className="text-xs sm:text-[13px] text-muted mb-3.5">
          {event.date} · {event.city}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-[15px] font-bold text-ink-2">
            от {event.priceFrom.toLocaleString('ru-RU')} ₽
          </span>
          <span className="bg-teal text-ink text-xs sm:text-[13px] font-semibold px-4 py-2 rounded-lg">
            Купить
          </span>
        </div>
      </div>
    </Link>
  )
}
