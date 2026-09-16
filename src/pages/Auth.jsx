import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SimpleHeader from '../components/SimpleHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const SOCIALS = ['Google', 'Яндекс ID', 'VK ID']

export default function Auth() {
  const [tab, setTab] = useState('login')
  const [role, setRole] = useState('buyer')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotSubmitting, setForgotSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, signInWithGoogle, sendPasswordReset } = useAuth()

  const redirectTo = location.state?.from?.pathname || '/account'

  const openForgot = () => {
    setError('')
    setInfo('')
    setForgotSent(false)
    setForgotMode(true)
  }

  const closeForgot = () => {
    setError('')
    setForgotMode(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const email = form.get('email')?.toString().trim()
    const password = form.get('password')?.toString()

    setSubmitting(true)
    try {
      await signIn({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Неверный email или пароль.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const email = form.get('email')?.toString().trim()
    if (!email) {
      setError('Введите email.')
      return
    }

    setForgotSubmitting(true)
    try {
      await sendPasswordReset(email)
      setForgotSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setForgotSubmitting(false)
    }
  }

  // Google is wired to real Supabase OAuth; Яндекс ID/VK ID aren't
  // registered as providers yet (Supabase has no built-in provider for
  // either — they'd need a custom OAuth2 provider setup), so they still
  // just show the placeholder message.
  const handleSocialClick = async (s) => {
    setError('')
    if (s !== 'Google') {
      setInfo(`Вход через ${s} скоро будет доступен.`)
      return
    }
    setInfo('')
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    const form = new FormData(e.target)
    const fullName = form.get('fullName')?.toString().trim()
    const email = form.get('email')?.toString().trim()
    const password = form.get('password')?.toString()
    const companyName = form.get('companyName')?.toString().trim()

    if (!fullName || !email || !password) {
      setError('Заполните все поля.')
      return
    }
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов.')
      return
    }

    setSubmitting(true)
    try {
      await signUp({ email, password, fullName, role, companyName })
      // Supabase requires email confirmation by default in a fresh project —
      // sign-in only succeeds once that's done, so let the visitor know
      // rather than silently redirecting to a page that will bounce them.
      setInfo('Аккаунт создан. Если в проекте включено подтверждение почты — проверьте email, затем войдите.')
      setTab('login')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SimpleHeader center action={{ label: '✕', to: '/' }} />

      <div className="flex items-center justify-center px-5 sm:px-6 py-8 sm:py-16 pb-12 sm:pb-24">
        <div className="w-full max-w-[420px] bg-white border border-border rounded-[18px] sm:rounded-[20px] p-6 sm:p-9 sm:pb-8 shadow-[0_24px_60px_rgba(11,10,13,0.06)]">
          {forgotMode ? (
            <>
              <button
                type="button"
                onClick={closeForgot}
                className="text-xs sm:text-[13px] font-semibold text-muted-2 mb-5 sm:mb-6 hover:text-ink-2 transition-colors"
              >
                ← Назад ко входу
              </button>

              <div className="text-lg sm:text-xl font-bold text-ink-2 mb-1.5">Восстановление пароля</div>
              <div className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">
                Укажите email аккаунта — пришлём ссылку для смены пароля.
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/25 text-danger text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-4">
                  {error}
                </div>
              )}

              {forgotSent ? (
                <div className="bg-teal/[0.12] border border-teal/30 text-teal-deep text-[13px] font-semibold rounded-xl px-3.5 py-3">
                  Если аккаунт с таким email существует, письмо со ссылкой уже отправлено. Проверьте почту (и папку «Спам»).
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <label className="block mb-5">
                    <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      autoFocus
                      className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
                  >
                    {forgotSubmitting ? 'Отправляем…' : 'Отправить ссылку'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="flex gap-6 sm:gap-7 border-b border-border mb-6 sm:mb-7">
                <button
                  onClick={() => {
                    setTab('login')
                    setError('')
                  }}
                  className={`text-sm font-semibold pb-3 sm:pb-3.5 border-b-2 -mb-px transition-colors ${
                    tab === 'login' ? 'text-ink-2 border-teal' : 'text-muted border-transparent'
                  }`}
                >
                  Вход
                </button>
                <button
                  onClick={() => {
                    setTab('register')
                    setError('')
                  }}
                  className={`text-sm font-semibold pb-3 sm:pb-3.5 border-b-2 -mb-px transition-colors ${
                    tab === 'register' ? 'text-ink-2 border-teal' : 'text-muted border-transparent'
                  }`}
                >
                  Регистрация
                </button>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/25 text-danger text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-4">
                  {error}
                </div>
              )}
              {info && !error && (
                <div className="bg-teal/[0.12] border border-teal/30 text-teal-deep text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-4">
                  {info}
                </div>
              )}

              {tab === 'login' ? (
                <>
                  <div className="text-lg sm:text-xl font-bold text-ink-2 mb-1.5">С возвращением</div>
                  <div className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">
                    Войдите, чтобы купить билеты и управлять заказами.
                  </div>

                  <form onSubmit={handleLogin}>
                    <label className="block mb-3.5">
                      <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                      />
                    </label>
                    <label className="block mb-2.5">
                      <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Пароль</span>
                      <input
                        type="password"
                        name="password"
                        required
                        className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                      />
                    </label>
                    <div className="text-right mb-5">
                      <button
                        type="button"
                        onClick={openForgot}
                        className="text-xs sm:text-[13px] text-teal-deep font-semibold hover:underline"
                      >
                        Забыли пароль?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] mb-5 hover:opacity-85 transition-opacity disabled:opacity-60"
                    >
                      {submitting ? 'Входим…' : 'Войти'}
                    </button>
                  </form>

                  <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] sm:text-xs text-muted-light whitespace-nowrap">
                      или войдите через
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 mb-5 sm:mb-6">
                    {SOCIALS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        title={s === 'Google' ? 'Войти через Google' : 'Пока недоступно в демо-версии'}
                        onClick={() => handleSocialClick(s)}
                        className="flex-1 text-center border border-border-2 rounded-[10px] py-2.5 sm:py-[11px] text-[13px] font-semibold text-[#4A473F] hover:border-muted-light transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="text-center text-xs sm:text-[13px] text-muted">
                    Нет аккаунта?{' '}
                    <button onClick={() => setTab('register')} className="font-semibold text-teal-deep">
                      Зарегистрироваться
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg sm:text-xl font-bold text-ink-2 mb-1.5">Создать аккаунт</div>
                  <div className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">
                    Это займёт меньше минуты.
                  </div>

                  <div className="flex gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`flex-1 text-center rounded-[10px] py-2.5 text-[13px] font-semibold border-[1.5px] transition-colors ${
                        role === 'buyer' ? 'border-teal bg-teal/[0.08] text-teal-deep' : 'border-border-2 text-muted'
                      }`}
                    >
                      Покупаю билеты
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organizer')}
                      className={`flex-1 text-center rounded-[10px] py-2.5 text-[13px] font-semibold border-[1.5px] transition-colors ${
                        role === 'organizer' ? 'border-teal bg-teal/[0.08] text-teal-deep' : 'border-border-2 text-muted'
                      }`}
                    >
                      Организую события
                    </button>
                  </div>

                  <form onSubmit={handleRegister}>
                    <label className="block mb-3.5">
                      <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Имя</span>
                      <input
                        name="fullName"
                        required
                        className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                      />
                    </label>
                    {role === 'organizer' && (
                      <label className="block mb-3.5">
                        <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">
                          Компания / продюсерский центр
                        </span>
                        <input
                          name="companyName"
                          placeholder="Необязательно"
                          className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                        />
                      </label>
                    )}
                    <label className="block mb-3.5">
                      <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Email</span>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                      />
                    </label>
                    <label className="block mb-5">
                      <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Пароль</span>
                      <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] mb-5 hover:opacity-85 transition-opacity disabled:opacity-60"
                    >
                      {submitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
                    </button>
                  </form>

                  <div className="text-center text-xs sm:text-[13px] text-muted">
                    Уже есть аккаунт?{' '}
                    <button onClick={() => setTab('login')} className="font-semibold text-teal-deep">
                      Войти
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
