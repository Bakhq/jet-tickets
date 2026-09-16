import StaticPage from '../components/StaticPage.jsx'

const CHANNELS = [
  {
    title: 'Поддержка покупателей',
    desc: 'Вопросы по билетам, оплате и возврату.',
    value: 'support@jetona.ru',
    href: 'mailto:support@jetona.ru',
  },
  {
    title: 'Организаторам',
    desc: 'Размещение события, тарифы, интеграции.',
    value: 'organizers@jetona.ru',
    href: 'mailto:organizers@jetona.ru',
  },
]

export default function Contacts() {
  return (
    <StaticPage title="Контакты" lead="Отвечаем на почту в течение рабочего дня.">
      <div className="grid sm:grid-cols-2 gap-4">
        {CHANNELS.map((c) => (
          <div key={c.value} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-sm font-semibold text-ink-2 mb-1">{c.title}</div>
            <p className="text-[13px] text-muted mb-3">{c.desc}</p>
            <a href={c.href} className="text-teal-deep font-medium hover:underline break-all">
              {c.value}
            </a>
          </div>
        ))}
      </div>
      <p className="text-muted-2">
        Если у вас проблема с конкретным заказом, укажите в письме номер заказа (например,
        №JET-51004) — так мы разберёмся быстрее.
      </p>
    </StaticPage>
  )
}
