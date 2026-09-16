import { Link } from 'react-router-dom'
import StaticPage from '../components/StaticPage.jsx'

const ROWS = [
  ['Размещение события', 'Бесплатно'],
  ['Комиссия с проданного билета', '5%'],
  ['Ежемесячная плата', 'Нет'],
  ['Вывод выручки', 'На реквизиты организатора после события'],
]

export default function Pricing() {
  return (
    <StaticPage
      title="Тарифы для организаторов"
      lead="Без абонентской платы: мы зарабатываем только с проданных билетов."
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {ROWS.map(([label, value], i) => (
          <div
            key={label}
            className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-border' : ''}`}
          >
            <span className="text-muted-2">{label}</span>
            <span className="font-semibold text-ink-2 text-right">{value}</span>
          </div>
        ))}
      </div>
      <p className="text-muted-2">
        Комиссия уже включена в цену билета, которую видит покупатель — никаких скрытых сборов
        сверху. Итоговые словия для конкретного события мы всегда подтверждаем при регистрации
        организатора, до публикации первого события.
      </p>
      <div>
        <Link
          to="/organizer"
          className="inline-flex bg-teal text-ink font-semibold text-sm px-5 py-3 rounded-[10px] hover:opacity-85 transition-opacity"
        >
          Разместить событие
        </Link>
      </div>
    </StaticPage>
  )
}
