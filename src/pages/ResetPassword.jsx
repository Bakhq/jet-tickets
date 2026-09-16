import { useState } from 'react'
import { Link } from 'react-router-dom'
import SimpleHeader from '../components/SimpleHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

// Reached only via the link Supabase emails from "Забыли пароль?" on the
// Auth page. That link carries a recovery token in the URL hash; Supabase's
// client picks it up automatically (detectSessionInUrl) and turns it into a
// temporary session before this component ever renders, so by the time
// `loading` is false we can tell a valid link from an expired/invalid one
// just by whether `session` exists.
export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов.')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.')
      return
    }

    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
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
          <div className="text-lg sm:text-xl font-bold text-ink-2 mb-1.5">Новый пароль</div>

          {loading ? (
            <div className="text-sm text-muted py-4">Проверяем ссылку…</div>
          ) : !session ? (
            <>
              <div className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">
                Ссылка недействительна или уже использована — запросите восстановление пароля ещё раз.
              </div>
              <Link
                to="/auth"
                className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] hover:opacity-85 transition-opacity"
              >
                Вернуться ко входу
              </Link>
            </>
          ) : done ? (
            <>
              <div className="bg-teal/[0.12] border border-teal/30 text-teal-deep text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-5">
                Пароль изменён.
              </div>
              <Link
                to="/account"
                className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] hover:opacity-85 transition-opacity"
              >
                В личный кабинет
              </Link>
            </>
          ) : (
            <>
              <div className="text-xs sm:text-[13px] text-muted mb-5 sm:mb-6">
                Придумайте новый пароль для входа.
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/25 text-danger text-[13px] font-semibold rounded-xl px-3.5 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <label className="block mb-3.5">
                  <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Новый пароль</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                  />
                </label>
                <label className="block mb-5">
                  <span className="block text-xs sm:text-[13px] font-semibold text-[#4A473F] mb-2">Повторите пароль</span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full border border-border-2 rounded-[10px] px-3.5 sm:px-4 py-3 text-sm text-ink-2 outline-none focus:border-teal"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="block w-full text-center bg-teal text-ink font-bold text-sm sm:text-[15px] py-3.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
                >
                  {submitting ? 'Сохраняем…' : 'Сохранить пароль'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
