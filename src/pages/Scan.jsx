import { useCallback, useEffect, useRef, useState } from 'react'
import OrganizerShell from '../components/OrganizerShell.jsx'
import { checkInTicket } from '../lib/api.js'

// A ticket's QR just encodes the order's own uuid (see OrderConfirmation.jsx
// / Account.jsx) — nothing else to parse out of the scanned text.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// How each possible check_in_ticket() outcome is presented at the door.
const RESULT_STYLES = {
  ok: {
    title: 'Вход разрешён',
    tone: 'text-teal-deep',
    bg: 'bg-teal/[0.12]',
    icon: '✓',
  },
  already_checked_in: {
    title: 'Билет уже использован',
    tone: 'text-amber-text',
    bg: 'bg-amber-bg',
    icon: '!',
  },
  not_paid: {
    title: 'Заказ не оплачен',
    tone: 'text-danger',
    bg: 'bg-danger/10',
    icon: '✕',
  },
  not_found: {
    title: 'Билет не найден',
    tone: 'text-danger',
    bg: 'bg-danger/10',
    icon: '✕',
  },
  forbidden: {
    title: 'Это билет не на ваше событие',
    tone: 'text-danger',
    bg: 'bg-danger/10',
    icon: '✕',
  },
  error: {
    title: 'Не удалось проверить билет',
    tone: 'text-danger',
    bg: 'bg-danger/10',
    icon: '✕',
  },
}

function ResultCard({ result, onNext }) {
  const style = RESULT_STYLES[result.status] || RESULT_STYLES.error
  return (
    <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 text-center max-w-[420px] w-full">
      <div
        className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold ${style.bg} ${style.tone}`}
      >
        {style.icon}
      </div>
      <div className={`text-lg sm:text-xl font-bold mb-1 ${style.tone}`}>{style.title}</div>

      {(result.event_title || result.buyer_name || result.order_number) && (
        <div className="mt-4 pt-4 border-t border-border text-left text-sm space-y-1.5">
          {result.event_title && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Событие</span>
              <span className="font-semibold text-ink-2 text-right">{result.event_title}</span>
            </div>
          )}
          {result.buyer_name && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Покупатель</span>
              <span className="font-semibold text-ink-2 text-right">{result.buyer_name}</span>
            </div>
          )}
          {result.order_number && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Заказ</span>
              <span className="font-semibold text-ink-2 text-right">№{result.order_number}</span>
            </div>
          )}
          {result.tier_summary && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Билеты</span>
              <span className="font-semibold text-ink-2 text-right">{result.tier_summary}</span>
            </div>
          )}
          {result.status === 'already_checked_in' && result.checked_in_at && (
            <div className="flex justify-between gap-3">
              <span className="text-muted">Отмечен в</span>
              <span className="font-semibold text-ink-2 text-right">
                {new Date(result.checked_in_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-6 w-full bg-ink text-cream font-semibold text-sm py-3 rounded-[10px] hover:opacity-85 transition-opacity"
      >
        Сканировать следующий
      </button>
    </div>
  )
}

export default function Scan() {
  const videoRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))
  const rafRef = useRef(null)
  const streamRef = useRef(null)
  const pausedRef = useRef(false)

  const [cameraError, setCameraError] = useState(null)
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [manualError, setManualError] = useState(null)

  const runCheckIn = useCallback(async (orderId) => {
    pausedRef.current = true
    setChecking(true)
    try {
      const data = await checkInTicket(orderId)
      setResult(data)
    } catch {
      setResult({ status: 'error' })
    } finally {
      setChecking(false)
    }
  }, [])

  const tick = useCallback(() => {
    const video = videoRef.current
    if (!video || pausedRef.current) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }
    if (video.readyState === video.HAVE_ENOUGH_DATA && window.jsQR) {
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = window.jsQR(imageData.data, imageData.width, imageData.height)
      if (code?.data && UUID_RE.test(code.data.trim())) {
        runCheckIn(code.data.trim())
        rafRef.current = requestAnimationFrame(tick)
        return
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [runCheckIn])

  useEffect(() => {
    let cancelled = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (err) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotAllowedError'
              ? 'Нет доступа к камере — разрешите доступ в настройках браузера.'
              : 'Не удалось запустить камеру. Можно ввести код вручную ниже.'
          )
        }
      }
    }
    start()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [tick])

  const handleNext = () => {
    setResult(null)
    setManualCode('')
    setManualError(null)
    pausedRef.current = false
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (!UUID_RE.test(code)) {
      setManualError('Похоже, это не похоже на код билета')
      return
    }
    setManualError(null)
    runCheckIn(code)
  }

  return (
    <OrganizerShell active="scan">
      <div className="mb-6 sm:mb-8">
        <div className="text-xl sm:text-[28px] font-bold tracking-tight text-ink-2 mb-1">Сканировать билеты</div>
        <div className="text-[13px] sm:text-sm text-muted">
          Наведите камеру на QR-код билета гостя — вход отмечается автоматически
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        {result ? (
          <ResultCard result={result} onNext={handleNext} />
        ) : (
          <div className="w-full max-w-[420px]">
            <div className="relative bg-ink rounded-2xl overflow-hidden aspect-square">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              <div className="absolute inset-6 border-2 border-teal/70 rounded-xl pointer-events-none" />
              {checking && (
                <div className="absolute inset-0 bg-ink/50 flex items-center justify-center">
                  <span className="text-cream text-sm font-semibold">Проверяем…</span>
                </div>
              )}
              {cameraError && (
                <div className="absolute inset-0 bg-ink flex items-center justify-center px-6 text-center">
                  <span className="text-muted-light text-sm">{cameraError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && (
          <form onSubmit={handleManualSubmit} className="w-full max-w-[420px] bg-white border border-border rounded-2xl p-5">
            <div className="text-[13px] sm:text-sm font-semibold text-ink-2 mb-3">Или введите код билета вручную</div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Номер заказа из ссылки билета"
                className="flex-1 border border-border-2 rounded-[10px] px-3.5 py-2.5 text-[13.5px] sm:text-sm text-ink-2 placeholder:text-muted-light focus:outline-none focus:border-teal"
              />
              <button
                type="submit"
                disabled={checking}
                className="bg-teal text-ink font-semibold text-[13.5px] sm:text-sm px-4 py-2.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-50"
              >
                Проверить
              </button>
            </div>
            {manualError && <div className="text-[12.5px] text-danger font-semibold mt-2.5">{manualError}</div>}
          </form>
        )}
      </div>
    </OrganizerShell>
  )
}
