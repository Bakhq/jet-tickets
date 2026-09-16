import StaticPage from '../components/StaticPage.jsx'

const CHANNELS = [
  {
    title: 'Email',
    desc: 'Вопросы по билетам, оплате и возврату — а также по размещению событий и тарифам для организаторов.',
    value: 'justbakhrom@gmail.com',
    href: 'mailto:justbakhrom@gmail.com',
  },
  {
    title: 'Телефон',
    desc: 'Если удобнее позвонить.',
    value: '+7 901 332-04-04',
    href: 'tel:+79013320404',
  },
  {
    title: 'Telegram',
    desc: 'Быстрые вопросы и статус заказа.',
    value: '@Bakh_Q',
    href: 'https://t.me/Bakh_Q',
  },
  {
    title: 'WhatsApp',
    desc: 'Пишите в любое время.',
    value: '+7 901 332-04-04',
    href: 'https://wa.me/79013320404',
  },
]

export default function Contacts() {
  return (
    <StaticPage title="Контакты" lead="Отвечаем в течение рабочего дня — на почту, в Telegram или WhatsApp.">
      <div className="grid sm:grid-cols-2 gap-4">
        {CHANNELS.map((c) => (
          <div key={c.title} className="bg-card border border-border rounded-2xl p-5">
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
