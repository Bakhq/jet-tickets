import { Link } from 'react-router-dom'
import StaticPage from '../components/StaticPage.jsx'

export default function Careers() {
  return (
    <StaticPage title="Вакансии" lead="Мы небольшая команда, и открытые позиции публикуем здесь по мере роста.">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center">
        <div className="text-base font-semibold text-ink-2 mb-2">Открытых вакансий пока нет</div>
        <p className="text-muted-2 max-w-[420px] mx-auto">
          Сейчас мы не набираем новых людей в команду. Как только появятся открытые позиции, мы
          опубликуем их на этой странице.
        </p>
      </div>
      <p className="text-muted-2">
        Если вы хотите предложить сотрудничество или у вас есть вопрос не по вакансии — напишите
        нам на странице{' '}
        <Link to="/contacts" className="text-teal-deep font-medium hover:underline">
          «Контакты»
        </Link>
        .
      </p>
    </StaticPage>
  )
}
