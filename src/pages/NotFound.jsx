import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header variant="public" />
      <div className="flex-1 flex items-center justify-center px-5 py-20 sm:py-28">
        <div className="text-center max-w-[420px]">
          <div className="text-[13px] font-semibold tracking-widest uppercase text-teal-deep mb-3">
            Ошибка 404
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-bold text-ink-2 mb-3">
            Такой страницы нет
          </h1>
          <p className="text-muted-2 mb-8">
            Возможно, ссылка устарела или в адресе опечатка. Загляните в афишу мероприятий или
            вернитесь на главную.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="border border-border-2 text-ink-2 font-semibold text-sm px-5 py-3 rounded-[10px] hover:bg-white transition-colors"
            >
              На главную
            </Link>
            <Link
              to="/catalog"
              className="bg-teal text-ink font-semibold text-sm px-5 py-3 rounded-[10px] hover:opacity-85 transition-opacity"
            >
              Смотреть мероприятия
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
