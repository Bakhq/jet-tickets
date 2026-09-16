import { Link } from 'react-router-dom'
import StaticPage from '../components/StaticPage.jsx'

export default function Refund() {
  return (
    <StaticPage
      title="Возврат билета"
      lead="Общие правила возврата для билетов, купленных на Jetūna. Отдельное событие может иметь свои условия — они всегда указаны на странице события."
    >
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Если событие отменили или перенесли</h2>
        <p className="text-muted-2">
          Возвращаем полную стоимость билета автоматически на способ оплаты, которым вы платили.
          Отдельно обращаться не нужно — уведомление придёт на почту, указанную при покупке.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Если вы передумали идти</h2>
        <p className="text-muted-2">
          Возврат по инициативе покупателя возможен не позднее чем за 24 часа до начала события —
          обратитесь в{' '}
          <Link to="/contacts" className="text-teal-deep font-medium hover:underline">
            поддержку
          </Link>{' '}
          с номером заказа. Ближе к событию возврат зависит от правил конкретного организатора и
          не гарантирован.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Сроки возврата средств</h2>
        <p className="text-muted-2">
          После одобрения возврата деньги обычно поступают обратно в течение нескольких рабочих
          дней — точный срок зависит от банка или платёжной системы.
        </p>
      </section>
    </StaticPage>
  )
}
