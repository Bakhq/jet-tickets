import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import OrganizerShell from '../components/OrganizerShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createEvent, generateEventSlug, getEvent, updateEvent } from '../lib/api.js'
import { supabase } from '../lib/supabaseClient.js'

// Mirrors the event-covers bucket's own restrictions (see Storage settings)
// so a rejected file gets a clear message here instead of a raw upload error.
const MAX_COVER_BYTES = 5 * 1024 * 1024
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']

let nextTierId = 4

const initialTiers = [
  { id: 1, name: 'Партер', price: '2500', qty: '600' },
  { id: 2, name: 'Стоя / фан-зона', price: '1500', qty: '1000' },
  { id: 3, name: 'VIP-балкон', price: '4200', qty: '120' },
]

function Field({ label, name, placeholder, value, onChange, defaultValue }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        defaultValue={onChange ? undefined : defaultValue}
        className="w-full border border-border-2 bg-white rounded-[10px] px-4 py-[13px] text-sm text-ink-2 placeholder:text-muted outline-none focus:border-teal"
      />
    </label>
  )
}

function Select({ label, name, options, value, onChange, defaultValue }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        defaultValue={onChange ? undefined : defaultValue}
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

// The reverse of parseRuDate, used to prefill the date field when editing an
// existing event (whose date is stored as ISO in the database).
function isoToRuDate(iso) {
  if (!iso) return ''
  const [y, mo, d] = iso.split('-')
  if (!y || !mo || !d) return ''
  return `${d}.${mo}.${y}`
}

function parseTime(text) {
  const m = /^(\d{1,2}):(\d{2})$/.exec((text || '').trim())
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export default function EventCreate() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: eventId } = useParams()
  const isEdit = Boolean(eventId)

  const [tiers, setTiers] = useState(initialTiers)
  const [removedTierIds, setRemovedTierIds] = useState([])
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverIsRemote, setCoverIsRemote] = useState(false)
  const [coverError, setCoverError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef(null)

  // Prefill state (edit mode only) — kept separate from the plain
  // uncontrolled <input defaultValue> fields the create form used, since
  // those only apply on first mount and this data may still be loading then.
  const [loadingEvent, setLoadingEvent] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [slug, setSlug] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Концерт')
  const [ageRating, setAgeRating] = useState('12+')
  const [description, setDescription] = useState('')
  const [dateText, setDateText] = useState('')
  const [timeText, setTimeText] = useState('')
  const [city, setCity] = useState('')
  const [venue, setVenue] = useState('')

  useEffect(() => {
    if (!isEdit || !user) return
    let active = true
    getEvent(eventId)
      .then((ev) => {
        if (!active) return
        if (!ev || ev.organizerId !== user.id) {
          setLoadError('Событие не найдено или недоступно для редактирования.')
          return
        }
        setSlug(ev.id)
        setTitle(ev.title || '')
        setCategory(ev.category || 'Концерт')
        setAgeRating(ev.ageRating || '12+')
        setDescription(ev.description || '')
        setDateText(isoToRuDate(ev.rawDate))
        setTimeText(ev.time || '')
        setCity(ev.city || '')
        setVenue(ev.venue || '')
        if (ev.coverImageUrl) {
          setCoverPreview(ev.coverImageUrl)
          setCoverIsRemote(true)
        }
        setTiers(
          ev.tiers.length
            ? ev.tiers.map((t) => ({ id: t.id, name: t.name, price: String(t.price), qty: String(t.capacity), sold: t.sold || 0 }))
            : initialTiers
        )
      })
      .catch(() => active && setLoadError('Не удалось загрузить событие.'))
      .finally(() => active && setLoadingEvent(false))
    return () => {
      active = false
    }
  }, [isEdit, eventId, user])

  const updateTier = (id, field, value) =>
    setTiers((list) => list.map((t) => (t.id === id ? { ...t, [field]: value } : t)))

  const removeTier = (id) => {
    setTiers((list) => {
      const target = list.find((t) => t.id === id)
      if (!target) return list
      // Real DB tiers carry a string (uuid) id; tiers added client-side this
      // session (whether on the create form or newly added while editing)
      // use a small numeric temp id and were never saved, so there's
      // nothing to queue for deletion.
      if (typeof target.id === 'string') {
        if (target.sold > 0) {
          // Has real sales against it — refuse; deleting it would orphan
          // those orders' order_items. (The remove button is already
          // disabled for this case — this is just the safety net.)
          return list
        }
        setRemovedTierIds((r) => [...r, target.id])
      }
      return list.filter((t) => t.id !== id)
    })
  }

  const addTier = () =>
    setTiers((list) => [...list, { id: nextTierId++, name: '', price: '', qty: '' }])

  const acceptCoverFile = (file) => {
    if (!file) return
    setCoverError('')
    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setCoverError('Поддерживаются только JPG, PNG и WEBP.')
      return
    }
    if (file.size > MAX_COVER_BYTES) {
      setCoverError('Файл больше 5 МБ — выберите изображение меньшего размера.')
      return
    }
    setCoverFile(file)
    setCoverPreview((prev) => {
      if (prev && !coverIsRemote) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setCoverIsRemote(false)
  }

  const removeCover = () => {
    setCoverPreview((prev) => {
      if (prev && !coverIsRemote) URL.revokeObjectURL(prev)
      return null
    })
    setCoverFile(null)
    setCoverIsRemote(false)
    setCoverError('')
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  const buildAndSave = async (formEl, publish) => {
    setError('')

    const form = new FormData(formEl)
    const formTitle = (isEdit ? title : form.get('title')?.toString())?.trim()
    const formCategory = isEdit ? category : form.get('category')?.toString()
    const formAgeRating = isEdit ? ageRating : form.get('ageRating')?.toString()
    const formDescription = (isEdit ? description : form.get('description')?.toString())?.trim()
    const dateRaw = isEdit ? dateText : form.get('date')?.toString()
    const timeRaw = isEdit ? timeText : form.get('time')?.toString()
    const formCity = (isEdit ? city : form.get('city')?.toString())?.trim()
    const formVenue = (isEdit ? venue : form.get('venue')?.toString())?.trim()

    if (!formTitle || !formCity || !formVenue) {
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
      // The slug doubles as the storage path for the cover, so it has to
      // exist before the upload — reuse the event's own slug when editing,
      // otherwise mint a fresh one (createEvent then reuses this exact
      // slug instead of minting its own).
      const eventSlug = slug || generateEventSlug()
      let coverImageUrl = coverIsRemote ? undefined : null

      if (coverFile) {
        setUploadingCover(true)
        const ext = (coverFile.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${user.id}/${eventSlug}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('event-covers')
          .upload(path, coverFile, { cacheControl: '3600', upsert: true, contentType: coverFile.type })
        setUploadingCover(false)
        if (uploadErr) {
          setError('Не удалось загрузить обложку: ' + (uploadErr.message || 'ошибка загрузки'))
          setSubmitting(false)
          return
        }
        const { data: pub } = supabase.storage.from('event-covers').getPublicUrl(path)
        coverImageUrl = pub?.publicUrl || null
      } else if (!coverIsRemote && !coverPreview) {
        // Cover was explicitly removed (or never set) — clear it in edit
        // mode; in create mode this is just the default "no cover" value.
        coverImageUrl = null
      }

      if (isEdit) {
        // Only tiers loaded from the database carry a real (string/uuid) id;
        // ones added in this session while editing use the same numeric
        // temp-id scheme as the create form and must be inserted, not
        // updated.
        const tiersForSave = tiers
          .filter((t) => t.name && t.price)
          .map((t) => ({
            id: typeof t.id === 'string' ? t.id : null,
            name: t.name,
            price: Number(String(t.price).replace(/\D/g, '')) || 0,
            capacity: Number(String(t.qty).replace(/\D/g, '')) || 0,
          }))
        await updateEvent(eventId, {
          title: formTitle,
          category: formCategory,
          ageRating: formAgeRating,
          description: formDescription,
          eventDate,
          eventTime,
          city: formCity,
          venue: formVenue,
          address: null,
          publish,
          coverImageUrl,
          tiers: tiersForSave,
          removedTierIds,
        })
      } else {
        await createEvent({
          organizerId: user.id,
          title: formTitle,
          category: formCategory,
          ageRating: formAgeRating,
          description: formDescription,
          eventDate,
          eventTime,
          city: formCity,
          venue: formVenue,
          address: null,
          tiers: tiers.map((t) => ({
            name: t.name,
            price: Number(String(t.price).replace(/\D/g, '')) || 0,
            capacity: Number(String(t.qty).replace(/\D/g, '')) || 0,
          })),
          publish,
          slug: eventSlug,
          coverImageUrl: coverImageUrl || null,
        })
      }
      setSaved(publish ? 'published' : 'draft')
      setTimeout(() => navigate('/organizer'), 1200)
    } catch (err) {
      setError(err.message || 'Не удалось сохранить событие.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isEdit && loadingEvent) {
    return (
      <OrganizerShell active="events">
        <div className="text-sm text-muted py-8 text-center">Загружаем событие…</div>
      </OrganizerShell>
    )
  }

  if (isEdit && loadError) {
    return (
      <OrganizerShell active="events">
        <div className="bg-danger/10 border border-danger/25 text-danger text-sm font-semibold rounded-xl px-4 py-3.5">
          {loadError}
        </div>
      </OrganizerShell>
    )
  }

  return (
    <OrganizerShell active="events">
      <div className="flex items-center gap-2 text-[13px] text-muted mb-3.5 sm:mb-4">
        <Link to="/organizer">Мои события</Link>
        <span>/</span>
        <span className="text-ink-2 font-semibold">{isEdit ? title || 'Редактирование' : 'Новое событие'}</span>
      </div>

      <div className="text-xl sm:text-[28px] font-bold tracking-tight text-ink-2 mb-6 sm:mb-7">
        {isEdit ? 'Редактировать событие' : 'Создать событие'}
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
            <Field
              label="Название события"
              name="title"
              placeholder="Например: Джаз в парке: зима"
              value={isEdit ? title : undefined}
              onChange={isEdit ? (e) => setTitle(e.target.value) : undefined}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Select
              label="Категория"
              name="category"
              defaultValue="Концерт"
              options={['Концерт', 'Фестиваль', 'Театр', 'Спорт', 'Стендап', 'Детям']}
              value={isEdit ? category : undefined}
              onChange={isEdit ? (e) => setCategory(e.target.value) : undefined}
            />
            <Select
              label="Возрастное ограничение"
              name="ageRating"
              defaultValue="12+"
              options={['0+', '6+', '12+', '16+', '18+']}
              value={isEdit ? ageRating : undefined}
              onChange={isEdit ? (e) => setAgeRating(e.target.value) : undefined}
            />
          </div>
          <label className="block">
            <span className="block text-[12.5px] sm:text-[13px] font-semibold text-[#4A473F] mb-2">
              Описание
            </span>
            <textarea
              name="description"
              rows={3}
              placeholder="Расскажите гостям, что их ждёт на событии — программу, атмосферу, хедлайнеров."
              value={isEdit ? description : undefined}
              onChange={isEdit ? (e) => setDescription(e.target.value) : undefined}
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
            <Field
              label="Дата"
              name="date"
              placeholder="дд.мм.гггг"
              value={isEdit ? dateText : undefined}
              onChange={isEdit ? (e) => setDateText(e.target.value) : undefined}
            />
            <Field
              label="Время начала"
              name="time"
              placeholder="чч:мм"
              value={isEdit ? timeText : undefined}
              onChange={isEdit ? (e) => setTimeText(e.target.value) : undefined}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Город"
              name="city"
              placeholder="Например: Москва"
              value={isEdit ? city : undefined}
              onChange={isEdit ? (e) => setCity(e.target.value) : undefined}
            />
            <Field
              label="Площадка / адрес"
              name="venue"
              placeholder="Название площадки, улица, дом"
              value={isEdit ? venue : undefined}
              onChange={isEdit ? (e) => setVenue(e.target.value) : undefined}
            />
          </div>
        </div>

        {/* COVER */}
        <div className="bg-white border border-border rounded-2xl p-5 sm:p-7 mb-5">
          <div className="text-[15px] sm:text-base font-bold text-ink-2 mb-4 sm:mb-5">
            Обложка события
          </div>

          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border-2">
              <img src={coverPreview} alt="Превью обложки" className="w-full h-[160px] sm:h-[200px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 pointer-events-none" />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-[12px] font-semibold text-ink bg-cream/95 px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                  Заменить
                </button>
                <button
                  type="button"
                  onClick={removeCover}
                  className="text-[12px] font-semibold text-cream bg-ink/80 px-3 py-1.5 rounded-lg hover:opacity-90"
                >
                  Удалить
                </button>
              </div>
              {uploadingCover && (
                <div className="absolute inset-0 bg-ink/60 flex items-center justify-center text-cream text-[13px] font-semibold">
                  Загружаем…
                </div>
              )}
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                acceptCoverFile(e.dataTransfer.files?.[0])
              }}
              className="border-[1.5px] border-dashed border-border-2 rounded-xl px-6 py-7 sm:py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-teal transition-colors"
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => acceptCoverFile(e.target.files?.[0])}
              />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M12 4 V16 M6 10 L12 4 L18 10" stroke="#B7B2A5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 18 H20" stroke="#B7B2A5" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <div className="text-[12.5px] sm:text-[13px] text-muted text-center">
                Перетащите изображение или <span className="text-teal-deep font-semibold">выберите файл</span>
              </div>
              <div className="text-[10.5px] sm:text-[11px] text-muted-light">
                JPG, PNG, WEBP до 5 МБ — рекомендуем 1600×900. Без обложки используется фирменный градиент.
              </div>
            </label>
          )}
          {coverError && <div className="text-[12.5px] text-danger font-semibold mt-2.5">{coverError}</div>}
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
            <div>Название</div
            <div>Цена</div>
            <div>Количество</div>
            <div />
          </div>

          <div className="flex flex-col gap-3">
            {tiers.map((t) => {
              const locked = isEdit && typeof t.id === 'string' && t.sold > 0
              return (
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
                      placeholder="Кол-Bо"
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(t.id)}
                      disabled={locked}
                      aria-label={locked ? 'Уже есть проданные билеты — нельзя удалить' : 'Удалить тариф'}
                      title={locked ? 'Уже есть проданные билеты по этому тариф — удалить нельзя' : undefined}
                      className="w-8 h-8 border border-border-2 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
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
                  {locked && (
                    <div className="col-span-2 sm:col-span-4 text-[11.5px] text-muted-light -mt-1.5">
                      Уже продано: {t.sold} — название и цену ещё можно поправить, а удалить тариф нельзя.
                    </div>
                  )}
                </div>
              )
            })}
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
            {isEdit ? 'Снять с публикации (черновик)' : 'Сохранить черновик'}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-teal text-ink font-semibold text-sm px-5 py-3.5 rounded-[10px] hover:opacity-85 transition-opacity disabled:opacity-60"
          >
            {isEdit ? 'Сохранить изменения' : 'Опубликовать событие'}
          </button>
        </div>
      </form>
    </OrganizerShell>
  )
}
