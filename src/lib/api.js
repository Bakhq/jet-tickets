// Data layer — every page talks to Supabase through the functions here
// instead of touching supabase-js directly. Keeping the mapping between
// Postgres rows and the shapes the UI expects in one place made it possible
// to swap the old mockData.js catalogue for a real database without
// rewriting how each page renders.

import { supabase } from './supabaseClient.js'

export const SERVICE_FEE_RATE = 0.05

// Kept in sync with the category options in EventCreate.jsx (singular forms,
// since that's what actually gets written to events.category) — this used to
// be a separate plural list ("Концерты", "Фестивали") that never matched a
// real event's category, silently breaking any filter/link built from it.
export const CATEGORIES = ['Концерт', 'Фестиваль', 'Театр', 'Спорт', 'Стендап', 'Детям']

// Gradient pairs used as the event's cover art whenever the organizer
// doesn't upload their own image (see EventCreate.jsx). Picked to match the
// palette the rest of the site already uses.
export const CATEGORY_GRADIENTS = {
  Концерт: ['#0E2E2B', '#0B0A0D'],
  Фестиваль: ['#0E2E2B', '#0B0A0D'],
  Театр: ['#1A2A2E', '#0B0A0D'],
  Спорт: ['#0E2E2B', '#0B0A0D'],
  Стендап: ['#2E1620', '#0B0A0D'],
  Детям: ['#2E1620', '#17151A'],
}
const DEFAULT_GRADIENT = ['#0E2E2B', '#0B0A0D']

// Used both when inserting a new event row and to name the file an uploaded
// cover gets in Storage (organizer creates the slug before either request
// so the two can share it — see EventCreate.jsx).
export function generateEventSlug() {
  return `evt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

// ---------------------------------------------------------------- formatting ----------------------------------------------------------------

export function formatEventDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

// Short form used on the organizer dashboard ("14 июня", no year).
export function formatShortDate(isoDate) {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T00:00:00`)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(d)
}

export function formatEventTime(time) {
  return (time || '').slice(0, 5)
}

// ---------------------------------------------------------------- events ----------------------------------------------------------------

const EVENT_SELECT = '*, ticket_tiers(*)'

function shapeTier(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    capacity: row.capacity,
    sold: row.sold,
  }
}

function shapeEvent(row) {
  const tiers = [...(row.ticket_tiers || [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(shapeTier)
  const totalCapacity = tiers.reduce((s, t) => s + (t.capacity || 0), 0)
  const totalSold = tiers.reduce((s, t) => s + (t.sold || 0), 0)

  return {
    // `id` stays the human slug so existing routes/links (/events/jazz-fest)
    // and the checkout flow's cart state keep working unchanged; `dbId` is
    // the real uuid, needed only when writing rows (orders.event_id, etc).
    id: row.slug,
    dbId: row.id,
    organizerId: row.organizer_id,
    title: row.title,
    category: row.category,
    date: formatEventDate(row.event_date),
    rawDate: row.event_date,
    time: formatEventTime(row.event_time),
    city: row.city,
    venue: row.venue,
    address: row.address,
    ageRating: row.age_rating,
    description: row.description,
    notes: row.notes || [],
    gradient: [row.gradient_from, row.gradient_to],
    coverImageUrl: row.cover_image_url || null,
    status: row.status,
    priceFrom: tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0,
    lowStock: totalCapacity > 0 && totalSold / totalCapacity >= 0.85,
    tiers,
  }
}

export async function listEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'active')
    .order('event_date', { ascending: true })
  if (error) throw error
  return (data || []).map(shapeEvent)
}

// Accepts either the public slug (e.g. "jazz-fest") or the real uuid.
export async function getEvent(idOrSlug) {
  if (!idOrSlug) return null
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)
  const query = supabase.from('events').select(EVENT_SELECT)
  const { data, error } = isUuid
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle()
  if (error) throw error
  return data ? shapeEvent(data) : null
}

// ---------------------------------------------------------------- orders / checkout ----------------------------------------------------------------

// selections: [{ tierId, tierName, price, qty }]
export async function createOrder({ event, selections, buyer, userId }) {
  const subtotal = selections.reduce((sum, s) => sum + s.price * s.qty, 0)
  const fee = Math.round(subtotal * SERVICE_FEE_RATE)
  const total = subtotal + fee

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId || null,
      event_id: event.dbId,
      buyer_name: buyer.name,
      buyer_email: buyer.email,
      buyer_phone: buyer.phone || null,
      subtotal,
      fee,
      total,
      status: 'pending',
    })
    .select()
    .single()
  if (orderErr) throw orderErr

  const items = selections.map((s) => ({
    order_id: order.id,
    tier_id: s.tierId,
    tier_name: s.tierName,
    price: s.price,
    qty: s.qty,
  }))
  const { error: itemsErr } = await supabase.from('order_items').insert(items)
  if (itemsErr) throw itemsErr

  return { orderId: order.id, orderNumber: order.order_number, subtotal, fee, total }
}

// Called right after the (mock, sandboxed) payment step reports success.
// See supabase/schema.sql's mark_order_paid() for why this is a single
// atomic RPC, and SETUP.md for how a real deployment should call it from a
// payment-provider webhook instead of straight from the browser.
export async function markOrderPaid(orderId, paymentRef) {
  const { error } = await supabase.rpc('mark_order_paid', {
    p_order_id: orderId,
    p_payment_ref: paymentRef,
  })
  if (error) throw error
}

// Called from the organizer-facing scanner page (Scan.jsx) after decoding a
// ticket's QR code — the code IS the order's uuid, so there's nothing to look
// up client-side first. The RPC itself checks that the order is paid, not
// already used, and belongs to an event owned by the scanning organizer, and
// returns one of: ok | already_checked_in | not_paid | not_found | forbidden.
export async function checkInTicket(orderId) {
  const { data, error } = await supabase.rpc('check_in_ticket', {
    p_order_id: orderId,
  })
  if (error) throw error
  return data
}

// Buyer-initiated refund request for their own paid order. The RPC checks
// ownership (orders.user_id = auth.uid()) and that the order is currently
// 'paid' before flipping it to 'refund_requested' — see
// request_refund() in the Supabase project. No money actually moves here:
// payments are still processed by MockPaymentProvider (src/lib/payments.js),
// which has no refund() method yet, so the organizer reconciles the actual
// refund manually and then approves the request (see respondToRefund below).
// Returns one of: ok | not_paid | not_found | forbidden.
export async function requestRefund(orderId, reason) {
  const { data, error } = await supabase.rpc('request_refund', {
    p_order_id: orderId,
    p_reason: reason || null,
  })
  if (error) throw error
  return data
}

// Organizer-side approval/rejection of a pending refund request, called from
// the "Запросы на возврат" section of Organizer.jsx. The RPC checks that the
// caller organizes the order's event before doing anything. Approving marks
// the order 'refunded' and frees the seat back up (decrements
// ticket_tiers.sold); rejecting reverts the order back to 'paid'. Returns
// one of: ok (with result: 'refunded' | 'rejected') | not_requested |
// not_found | forbidden.
export async function respondToRefund(orderId, approve) {
  const { data, error } = await supabase.rpc('respond_to_refund', {
    p_order_id: orderId,
    p_approve: approve,
  })
  if (error) throw error
  return data
}

// Pending refund requests across all of an organizer's events, for the
// "Запросы на возврат" section of the dashboard.
export async function listRefundRequests(organizerId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, events!inner(title, organizer_id), order_items(*)')
    .eq('events.organizer_id', organizerId)
    .eq('status', 'refund_requested')
    .order('refund_requested_at', { ascending: true })
  if (error) throw error

  return (data || []).map((o) => {
    const qty = (o.order_items || []).reduce((sum, i) => sum + i.qty, 0)
    const tierLabel = (o.order_items || []).map((i) => i.tier_name).join(', ') || '—'
    return {
      id: o.id,
      orderNumber: o.order_number,
      eventTitle: o.events?.title || 'Событие',
      buyerName: o.buyer_name,
      buyerEmail: o.buyer_email,
      buyerPhone: o.buyer_phone,
      tier: tierLabel,
      qty,
      total: o.total,
      reason: o.refund_reason,
      requestedAt: o.refund_requested_at,
    }
  })
}

// ---------------------------------------------------------------- account / tickets ----------------------------------------------------------------

export async function getProfile(userId) {
  if (!userId) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Splits a buyer's paid/refund-requested/refunded orders into upcoming vs
// past based on the event date. `rawStatus` (the actual orders.status value)
// rides alongside the display `status` string so Account.jsx can decide
// whether to show the "Запросить возврат" button without a second query.
const TICKET_STATUS_LABEL = {
  refund_requested: 'Возврат запрошен',
  refunded: 'Возврат оформлен',
}

export async function listUserTickets(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, events(title, event_date, event_time, venue, city, gradient_from, gradient_to, cover_image_url), order_items(*)'
    )
    .eq('user_id', userId)
    .in('status', ['paid', 'refund_requested', 'refunded'])
    .order('created_at', { ascending: false })
  if (error) throw error

  const todayIso = new Date().toISOString().slice(0, 10)
  const upcoming = []
  const past = []

  for (const o of data || []) {
    const ev = o.events
    const qty = (o.order_items || []).reduce((sum, i) => sum + i.qty, 0)
    const tierLabel = (o.order_items || []).map((i) => i.tier_name).join(', ') || '—'
    const isUpcoming = ev ? ev.event_date >= todayIso : true
    const shaped = {
      id: o.id,
      orderNumber: o.order_number,
      eventTitle: ev?.title || 'Событие',
      date: ev ? `${formatEventDate(ev.event_date)}, ${formatEventTime(ev.event_time)}` : '',
      venue: ev ? `${ev.venue}, ${ev.city}` : '',
      tier: tierLabel,
      qty,
      status: TICKET_STATUS_LABEL[o.status] || (isUpcoming ? 'Оплачено' : 'Завершено'),
      rawStatus: o.status,
      canRequestRefund: o.status === 'paid' && isUpcoming,
      gradient: ev ? [ev.gradient_from, ev.gradient_to] : DEFAULT_GRADIENT,
      coverImageUrl: ev?.cover_image_url || null,
      buyerName: o.buyer_name || null,
      total: o.total || null,
    }
    ;(isUpcoming ? upcoming : past).push(shaped)
  }

  return { upcoming, past }
}

// ---------------------------------------------------------------- organizer ----------------------------------------------------------------

export async function listOrganizerEvents(organizerId) {
  const { data, error } = await supabase
    .from('organizer_event_summary')
    .select('*')
    .eq('organizer_id', organizerId)
  if (error) throw error

  return (data || [])
    .map((row) => {
      const isDraft = row.status === 'draft'
      const lowStock = !isDraft && row.capacity > 0 && row.sold / row.capacity >= 0.85
      return {
        eventId: row.event_id,
        title: row.title,
        date: isDraft ? null : formatShortDate(row.event_date),
        rawDate: row.event_date,
        sold: isDraft ? null : row.sold,
        capacity: isDraft ? null : row.capacity,
        revenue: isDraft ? null : row.revenue,
        status: isDraft ? 'draft' : lowStock ? 'low' : 'active',
      }
    })
    .sort((a, b) => (a.rawDate || '9999').localeCompare(b.rawDate || '9999'))
}

export async function createEvent({
  organizerId,
  title,
  category,
  ageRating,
  description,
  eventDate,
  eventTime,
  city,
  venue,
  address,
  tiers,
  publish,
  slug,
  coverImageUrl,
}) {
  // Callers that already uploaded a cover image need the slug up front (it's
  // the storage path), so they generate and pass it in; anyone else gets one
  // minted here same as before.
  const eventSlug = slug || generateEventSlug()
  const gradient = CATEGORY_GRADIENTS[category] || DEFAULT_GRADIENT

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      slug: eventSlug,
      organizer_id: organizerId,
      title,
      category,
      event_date: eventDate,
      event_time: eventTime,
      city,
      venue,
      address: address || null,
      age_rating: ageRating,
      description: description || null,
      gradient_from: gradient[0],
      gradient_to: gradient[1],
      cover_image_url: coverImageUrl || null,
      status: publish ? 'active' : 'draft',
    })
    .select()
    .single()
  if (error) throw error

  if (tiers?.length) {
    const rows = tiers
      .filter((t) => t.name && t.price)
      .map((t, i) => ({
        event_id: event.id,
        name: t.name,
        price: t.price,
        capacity: t.capacity || 0,
        sort_order: i,
      }))
    if (rows.length) {
      const { error: tierErr } = await supabase.from('ticket_tiers').insert(rows)
      if (tierErr) throw tierErr
    }
  }

  return event
}

export async function updateEventStatus(eventId, status) {
  const { error } = await supabase.from('events').update({ status }).eq('id', eventId)
  if (error) throw error
}

// Saves edits to an already-created event (see EventCreate.jsx's edit mode).
// Ticket tiers need care: a tier that already has sales carries its `sold`
// count on the same row, so existing tiers are always UPDATEd in place
// (name/price/capacity only) rather than replaced — deleting and
// re-inserting them would reset that count to zero and orphan any
// order_items pointing at the old tier id. Only tiers the organizer removes
// in this edit (passed as `removedTierIds`) are actually deleted, and only
// the caller is expected to have kept the ones with `sold > 0` out of that
// list (EventCreate.jsx hides the remove button for those).
//
// Requires an RLS UPDATE policy on `events`/`ticket_tiers` scoped to the
// event's own organizer_id — see SETUP.md for the SQL if this throws a
// permissions error on a project created before event editing existed.
export async function updateEvent(
  eventId,
  { title, category, ageRating, description, eventDate, eventTime, city, venue, address, publish, coverImageUrl, tiers, removedTierIds }
) {
  const patch = {
    title,
    category,
    age_rating: ageRating,
    description: description || null,
    event_date: eventDate,
    event_time: eventTime,
    city,
    venue,
    address: address || null,
    status: publish ? 'active' : 'draft',
  }
  if (coverImageUrl !== undefined) patch.cover_image_url = coverImageUrl

  const { error } = await supabase.from('events').update(patch).eq('id', eventId)
  if (error) throw error

  for (let i = 0; i < (tiers || []).length; i++) {
    const t = tiers[i]
    if (t.id) {
      const { error: uErr } = await supabase
        .from('ticket_tiers')
        .update({ name: t.name, price: t.price, capacity: t.capacity, sort_order: i })
        .eq('id', t.id)
      if (uErr) throw uErr
    } else {
      const { error: iErr } = await supabase
        .from('ticket_tiers')
        .insert({ event_id: eventId, name: t.name, price: t.price, capacity: t.capacity, sort_order: i })
      if (iErr) throw iErr
    }
  }

  if (removedTierIds?.length) {
    const { error: dErr } = await supabase.from('ticket_tiers').delete().in('id', removedTierIds)
    if (dErr) throw dErr
  }
}
