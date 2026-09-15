// Builds a designed, single-page PDF e-ticket (cover photo + event info + QR
// code) and triggers a download — used by the "Скачать" buttons on the
// account page and the order confirmation page. jsPDF is loaded as a plain
// global via a <script> tag in index.html (same CDN-script pattern as jsQR
// for the scanner), since this repo has no local npm install/build step in
// this editing workflow.

// ---------------------------------------------------------------- jsPDF loading ----------------------------------------------------------------

function waitForJsPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF)
  return new Promise((resolve, reject) => {
    let tries = 0
    const iv = setInterval(() => {
      tries += 1
      if (window.jspdf?.jsPDF) {
        clearInterval(iv)
        resolve(window.jspdf.jsPDF)
      } else if (tries > 100) {
        clearInterval(iv)
        reject(new Error('jsPDF failed to load'))
      }
    }, 50)
  })
}

// ---------------------------------------------------------------- Cyrillic font ----------------------------------------------------------------

// jsPDF's built-in fonts (helvetica/times/courier) only cover WinAnsi/Latin,
// so Russian text renders as garbage without an embedded Unicode font. PT
// Sans is fetched once (as real, static — not variable — TTFs, which jsPDF's
// simple font parser handles reliably) from the google/fonts GitHub mirror
// and cached for the rest of the session; if the fetch fails for any reason,
// callers fall back to Helvetica rather than failing the whole download.
const PT_SANS_REGULAR_URL =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Regular.ttf'
const PT_SANS_BOLD_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PT_Sans-Web-Bold.ttf'

let fontsPromise = null

function arrayBufferToBase64(buf) {
  let binary = ''
  const bytes = new Uint8Array(buf)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

async function fetchFontBase64(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('font fetch failed: ' + res.status)
  return arrayBufferToBase64(await res.arrayBuffer())
}

function loadCyrillicFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([fetchFontBase64(PT_SANS_REGULAR_URL), fetchFontBase64(PT_SANS_BOLD_URL)]).then(
      ([regular, bold]) => ({ regular, bold })
    )
  }
  return fontsPromise
}

// ---------------------------------------------------------------- image helpers ----------------------------------------------------------------

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image failed to load'))
    img.src = src
  })
}

// Fetches an image and returns a PNG data URL pre-cropped to the given
// target box (object-fit: cover), rendered at 2x for print sharpness. Works
// for JPEG/PNG/WEBP sources alike since the crop happens on a canvas rather
// than relying on jsPDF's own (format-limited) image support.
async function fetchCroppedImageDataUrl(url, outW, outH, scale = 2) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('image fetch failed: ' + res.status)
  const blob = await res.blob()
  const dataUrl = await readBlobAsDataUrl(blob)
  const img = await loadImageEl(dataUrl)

  const targetRatio = outW / outH
  const srcRatio = img.naturalWidth / img.naturalHeight
  let sx = 0
  let sy = 0
  let sw = img.naturalWidth
  let sh = img.naturalHeight
  if (srcRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio
    sx = (img.naturalWidth - sw) / 2
  } else {
    sh = img.naturalWidth / targetRatio
    sy = (img.naturalHeight - sh) / 2
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(outW * scale)
  canvas.height = Math.round(outH * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return { r: 14, g: 46, b: 43 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

// ---------------------------------------------------------------- ticket PDF ----------------------------------------------------------------

// ticket: {
//   id            — order uuid, encoded in the QR (falls back to orderNumber)
//   eventTitle, dateLine, venue,
//   tierLine      — e.g. "Партер × 2" or "Партер × 2, Балкон × 1"
//   orderNumber, buyerName, totalLabel, status,
//   coverImageUrl, gradient — [from, to] hex, used when there's no cover photo
// }
export async function downloadTicketPdf(ticket) {
  const [JsPDF, fonts] = await Promise.all([
    waitForJsPDF(),
    loadCyrillicFonts().catch(() => null), // fall back to Helvetica rather than fail the download
  ])

  const W = 380
  const H = 680
  const margin = 26
  const contentW = W - margin * 2
  const doc = new JsPDF({ unit: 'pt', format: [W, H] })

  const fontFamily = fonts ? 'PTSans' : 'helvetica'
  if (fonts) {
    doc.addFileToVFS('PTSans-Regular.ttf', fonts.regular)
    doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal')
    doc.addFileToVFS('PTSans-Bold.ttf', fonts.bold)
    doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold')
  }

  // Header band
  doc.setFillColor(11, 10, 13)
  doc.rect(0, 0, W, 72, 'F')
  doc.setTextColor(20, 207, 190)
  doc.setFont(fontFamily, 'bold')
  doc.setFontSize(20)
  doc.text('Jetūna', margin, 40)
  doc.setTextColor(183, 178, 165)
  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(9)
  doc.text('ЭЛЕКТРОННЫЙ БИЛЕТ', margin, 56)

  let y = 72

  // Cover photo, or a flat gradient-colored band when the event has none.
  const imgH = 150
  try {
    if (!ticket.coverImageUrl) throw new Error('no cover')
    const dataUrl = await fetchCroppedImageDataUrl(ticket.coverImageUrl, contentW, imgH)
    doc.addImage(dataUrl, 'PNG', margin, y + 16, contentW, imgH)
  } catch {
    const [c1] = ticket.gradient || ['#0E2E2B', '#0B0A0D']
    const rgb = hexToRgb(c1)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.roundedRect(margin, y + 16, contentW, imgH, 10, 10, 'F')
  }
  y += 16 + imgH + 24

  // Title + date/venue
  doc.setTextColor(26, 24, 21)
  doc.setFont(fontFamily, 'bold')
  doc.setFontSize(16)
  const titleLines = doc.splitTextToSize(ticket.eventTitle || '', contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 19 + 6

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(114, 110, 99)
  if (ticket.dateLine) {
    doc.text(ticket.dateLine, margin, y)
    y += 15
  }
  if (ticket.venue) {
    doc.text(ticket.venue, margin, y)
    y += 20
  }

  doc.setDrawColor(224, 220, 208)
  doc.line(margin, y, W - margin, y)
  y += 22

  const row = (label, value) => {
    if (!value) return
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor(114, 110, 99)
    doc.text(label, margin, y)
    doc.setFont(fontFamily, 'bold')
    doc.setTextColor(26, 24, 21)
    const valueLines = doc.splitTextToSize(String(value), contentW * 0.55)
    doc.text(valueLines, W - margin, y, { align: 'right' })
    y += Math.max(19, valueLines.length * 14 + 5)
  }

  row('Билет', ticket.tierLine)
  row('Номер заказа', ticket.orderNumber)
  row('Покупатель', ticket.buyerName)
  row('Оплачено', ticket.totalLabel)
  row('Статус', ticket.status || 'Оплачено')

  y += 6
  doc.setLineDashPattern([3, 3], 0)
  doc.line(margin, y, W - margin, y)
  doc.setLineDashPattern([], 0)
  y += 26

  // QR code — same order uuid the scanner at the door checks in via the
  // check_in_ticket RPC (see Scan.jsx).
  const qrSize = 150
  const qrX = (W - qrSize) / 2
  try {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      ticket.id || ticket.orderNumber || ''
    )}`
    const qrDataUrl = await fetchCroppedImageDataUrl(qrUrl, qrSize, qrSize)
    doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize)
  } catch {
    doc.setDrawColor(224, 220, 208)
    doc.roundedRect(qrX, y, qrSize, qrSize, 8, 8)
    doc.setFont(fontFamily, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(114, 110, 99)
    doc.text('QR недоступен', W / 2, y + qrSize / 2, { align: 'center' })
  }
  y += qrSize + 18

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(114, 110, 99)
  doc.text('Покажите этот QR-код на входе — его отсканирует организатор', W / 2, y, {
    align: 'center',
    maxWidth: contentW,
  })

  doc.setFontSize(9)
  doc.setTextColor(183, 178, 165)
  doc.text('jetona.ru', W / 2, H - 20, { align: 'center' })

  doc.save(`jetuna-ticket-${ticket.orderNumber || 'ticket'}.pdf`)
}
