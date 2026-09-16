import { Link } from 'react-router-dom'
import StaticPage from '../components/StaticPage.jsx'

export default function About() {
  return (
    <StaticPage
      title="О нас"
      lead="Jetūna — сервис для покупки и продажи билетов на концерты, фестивали, стендап и другие живые события."
    >
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Что мы делаем</h2>
        <p className="text-muted-2">
          Мы делаем так, чтобы найти и купить билет на событие занимало пару минут: без звонков
          организатору, без очереди в кассу и без риска нарваться на перекупщика. Билет с
          QR-кодом приходит сразу после оплаты и всегда действителен — его проверяют на входе
          сканером, а не «на глаз».
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Для организаторов</h2>
        <p className="text-muted-2">
          Организаторам мы даём инструмент, чтобы выложить событие, настроить тарифы билетов и
          получать статистику продаж в реальном времени — без отдельной кассовой системы и
          таблиц в Excel.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-ink-2 mb-2">Где мы сейчас</h2>
        <p className="text-muted-2">
          Jetūna — молодой проект: мы всё ещё дорабатываем сервис и постепенно подключаем новые
          города и способы оплаты. Если что-то работает не так, как ожидалось — напишите нам,
          страница{' '}
          <Link to="/contacts" className="text-teal-deep font-medium hover:underline">
            «Контакты»
          </Link>{' '}
          всегда открыта.
        </p>
      </section>
    </StaticPage>
  )
}
