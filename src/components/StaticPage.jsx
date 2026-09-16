import { Link } from 'react-router-dom'
import Header from './Header.jsx'
import { Footer } from './Footer.jsx'

// Shared shell for the footer's content pages (about, careers, contacts,
// pricing, refund, terms, privacy) — same breadcrumb + prose container as
// the rest of the site, so these don't feel like a bolted-on afterthought.
export default function StaticPage({ title, lead, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header variant="public" />
      <div className="max-w-[1440px] mx-auto w-full px-5 sm:px-12 pt-6 sm:pt-10">
        <div className="text-[13px] text-muted mb-4">
          <Link to="/" className="hover:text-ink-2 transition-colors">
            Главная
          </Link>{' '}
          / <span className="text-ink-2">{title}</span>
        </div>
      </div>
      <div className="max-w-[760px] w-full mx-auto px-5 sm:px-12 pb-16 sm:pb-24 flex-1">
        <h1 className="text-[28px] sm:text-[34px] font-bold text-ink-2 mb-3">{title}</h1>
        {lead && <p className="text-[15px] sm:text-base text-muted-2 leading-relaxed mb-9">{lead}</p>}
        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <Footer />
    </div>
  )
}
