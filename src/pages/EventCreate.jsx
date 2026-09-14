import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OrganizerShell from '../components/OrganizerShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createEvent } from '../lib/api.js'

let nextTierId = 4

const initialTiers = [
  { id: 1, name: 'Партер', price: '2500', qty: '600' },
  { id: 2, name: 'Стоя / фан-зона', price: '1500', qty: '1000' },
  { id: 3, name: 'VIP-балкон', price: '4200', qty: '120' },
]

function Field({ label, name, placeholder, defaultValue }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-border-2 bg-white rounded-[10px] px-4 py-[13px] text-sm text-ink-2 placeholder:text-muted outline-none focus:border-teal"
      />
    </label>
  )
}

function Select({ label, name, options, defaultValue }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-border-2 bg-white rounded-[10px] px-4 py-[13px] text-sm text-ink-2 outline-none focus:border-teal appearance-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

// Accepts дд.мм.гггг and returns an ISO yyyy-mm-dd string, or null if the
// text doesn't parse — this form still uses a plain text field rather than
// a native date picker (matches the original design).
function parseRuDate(text) {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((text || '').trim())
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((text || '').trim())
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export default function EventCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tiers, setTiers] = useState(initialTiers)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const updateTier = (id, field, value) =>
    setTiers((list) => list.map((t) => (t.id === id ? { ...t, [field]: value } : t)))

  const removeTier = (id) => setTiers((list) => list.filter((t) => t.id !== id))

  const addTier = () =>
    setTiers((list) => [...list, { id: nextTierId++, name: '', price: '', qty: '' }])

  const buildAndSave = async (formEl, publish) => {
    setError('')

    const form = new FormData(formEl)
    const title = form.get('title')?.toString().trim()
    const category = form.get('category')?.toString()
    const ageRating = form.get('ageRating')?.toString()
    const description = form.get('description')?.toString().trim()
    const dateRaw = form.get('date')?.toString()
    const timeRaw = form.get('time')?.toString()
    const city = form.get('city')?.toString().trim()
    const venue = form.get('venue')?.toString().trim()

    if (!title || !city || !venue) {
      setError('Заполните хотя бы название, город и площадку.')
      return
    }

    const eventDate = parseRuDate(dateRaw) || (publish ? null : '2026-12-31')
    if (publish && !eventDate) {
      setError('Укажите дату в формате дд.мм.гггг.')
      return
    }
    const eventTime = parseTime(timeRaw) || '19:00'

    setSubmitting(true)
    try {
      await createEvent({
        organizerId: user.id,
        title,
        category,
        ageRating,
        description,
        eventDate,
        eventTime,
        city,
        venue,
        address: null,
        tiers: tiers.map((t) => ({
          name: t.name,
          price: Number(String(t.price).replace(/\D/g, '')) || 0,
          capacity: Number(String(t.qty).replace(/\D/g, '')) || 0,
        })),
        publish,
      })
      setSaved(publish ? 'published' : 'draft')
      setTimeout(() => navigate('/organizer'), 1200)
    } catch (err) {
      setError(err.message || 'Не удалось сохранить событие.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <OrganizerShell active="events">
      <div className="flex items-center gap-2 text-[13px] text-muted mb-3.5 sm:mb-4">
        <Link to="/organizer">Мои события</Link>
        <span>/</span>
        <span className="text-ink-2 font-semibold">Новое событие</span>
      </div>

      <div className="text-xl sm:text-[28px] font-bold tracking-tight text-ink-2 mb-6 sm:mb-7">
        Создать событие
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/25 text-danger text-sm font-semibold rounded-xl px-4 py-3.5 mb-6">
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-teal/[0.12] border border-teal/30 text-teal-deep text-sm font-semibold rounded-xl px-4 py-3.5 mb-6">
          {saved === 'draft' ? 'Черновик сохранён.' : 'Событие опубликовано.'} Переходим в дашборд…
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          buildAndSave(e.target, true)
        }}
        className="max-w-[820px]"
      >
        {/* BASICS */}
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 mb-5">
          <div className="text-[15px] sm:text-base font-bold text-ink-2 mb-4 sm:mb-5">
            Основная информация
          </div>
          <div className="mb-4">
            <Field label="Название события" name="title" placeholder="Например: Джаз в парке: зима" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Select
              label="Категория"
              name="category"
              defaultValue="Концерт"
              options={['Концерт', 'Фестиваль', 'Театр', 'Спорт', 'Стендап', 'Детям']}
            />
            <Select label="Возрастное ограничение" name="ageRating" defaultValue="12+" options={['0+', '6+', '12+', '16+', '18+']} />
          </div>
          <label className="block">
            <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">
              Описание
            </span>
            <textarea
              name="description"
              rows={3}
              placeholder="Расскажите гостям, что их ждёт на событии — программу, атмосферу, хедлайнеров."
              className="w-full border border-border-2 bg-white rounded-[10px] px-4 py-[13px] text-sm text-ink-2 placeholder:text-muted outline-none focus:border-teal resize-none"
            />
          </label>
        </div>

        {/* DATE & VENUE */}
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 mb-5">
          <div className="text-[15px] sm:text-base font-bold text-ink-2 mb-4 sm:mb-5">
            Дата и место проведения
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Field label="Дата" name="date" placeholder="дд.мм.гггг" />
            <Field label="Время начала" name="time" placeholder="чч:мм" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Город" name="city" placeholder="Например: Москва" />
            <Field label="Площадка / адрес" name="venue" placeholder="Название площадки, улица, дом" />
          </div>
        </div>

        {/* COVER */}
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 mb-5">
          <div className="text-[15px] sm:text-base font-bold text-ink-2 mb-4 sm:mb-5">
            Обложка события
          </div>
          <label className="border-[1.5px] border-dashed border-border-2 rounded-xl px-6 py-7 sm:py-8 flex flex-col items-center gap-2 cursor-pointer">
            <input type="file" accept="image/*" className="hidden" />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 4 V16 M6 10 L12 4 L18 10" stroke="#B7B2A5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 18 H20" stroke="#B7B2A5" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <div className="text-[12.5px] sm:text-[13px] text-muted text-center">
              Перетащите изображение или <span className="text-teal-deep font-semibold">выберите файл</span>
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-muted-light">
              JPG, PNG — рекомендуем 1600×900. Загрузка изображений скоро появится — пока используется фирменный градиент.
            </div>
          </label>
        </div>

        {/* TICKET TIERS */}
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 mb-6 sm:mb-7">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="text-[15px] sm:text-base font-bold text-ink-2">Билетные тарифы</div>
            <button type="button" onClick={addTier} className="text-[12.5px] sm:text-sm font-semibold text-teal-deep">
              + Добавить тариф
            </button>
          </div>

          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_32px] gap-3 mb-2.5 px-3.5 text-[11px] font-semibold tracking-wide uppercase text-muted">
            <div>Название</div>
            <div>Цена</div>
            <div>Количество</div>
            <div />
          </div>

          <div className="flex flex-col gap-3">
            {tiers.map((t) => (
              <div key={t.id} className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_1fr_32px] gap-3 items-center">
                <input
                  value={t.name}
                  onChange={(e) => updateTier(t.id, 'name', e.target.value)}
                  className="col-span-2 sm:col-span-1 border border-border-2 rounded-[10px] px-3.5 py-2.5 text-[13px] text-ink-2 outline-none focus:border-teal"
                  placeholder="Название"
                />
                <input
                  value={t.price}
                  onChange={(e) => updateTier(t.id, 'price', e.target.value)}
                  className="border border-border-2 rounded-[10px] px-3.5 py-2.5 text-[13px] text-ink-2 outline-none focus:border-teal"
                  placeholder="Цена"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={t.qty}
                    onChange={(e) => updateTier(t.id, 'qty', e.target.value)}
                    className="flex-1 border border-border-2 rounded-[10px] px-3.5 py-2.5 text-[13px] text-ink-2 outline-none focus:border-teal"
                    placeholder="Кол-во"
                  />
                  <button
                    type="button"
                    onClick={() => removeTier(t.id)}
                    aria-label="Удалить тариф"
                    className="w-8 h-8 border border-border-2 rounded-lg flex items-center justify-center shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 6 H19 M9 6 V4 H15 V6 M7 6 L8 20 H16 L17 6"
                        stroke="#8A8578"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => buildAndSave(e.target.form, false)}
            className="border border-border-2 text-ink-2 font-semibold text-sm px-5 py-3.5 rounded-[10px] disabled:opacity-60"
          >
            Сохранить черновик
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-teal text-ink font-semibold text-sm px-5 py-3.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            Опубликовать событие
          </button>
        </div>
      </form>
    </OrganizerShell>
  )
}
