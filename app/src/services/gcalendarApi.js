// =====================================================================
// gcalendarApi.js — Klien Google Calendar API v3 via googleAuth.js
// =====================================================================
// Nama file diawali "g" agar tidak tertukar dengan halaman Kalender
// internal Luxio (pages/Calendar.jsx) yang memakai data lokal.
//
// Scope: calendar.readonly (daftar kalender) + calendar.events (CRUD acara).
// Dokumentasi lengkap: koleksi dokumentasi api/google api/calendar-docs/
// =====================================================================

import { googleFetch, GOOGLE_SCOPES } from './googleAuth'

const BASE = 'https://www.googleapis.com/calendar/v3'

// Scope set tunggal untuk halaman + semua fungsi di file ini (satu popup).
export const CALENDAR_PAGE_SCOPES = [...GOOGLE_SCOPES.CALENDAR, ...GOOGLE_SCOPES.PROFILE]

// Penanda milik Luxio pada acara yang dibuat dari aplikasi ini. Disimpan di
// extendedProperties.private agar bisa dicocokkan kembali saat sinkronisasi
// dua arah tanpa menyimpan id Google di sisi kita.
export const LUXIO_PROP_KEY = 'luxioRef'

// ---------- Daftar kalender ----------

export const listCalendars = async () => {
  const data = await googleFetch(
    `${BASE}/users/me/calendarList?fields=items(id,summary,description,primary,backgroundColor,foregroundColor,accessRole,timeZone,selected)`,
    { scopes: CALENDAR_PAGE_SCOPES },
  )
  return (data.items || []).map((c) => ({
    id: c.id,
    summary: c.summary || c.id,
    description: c.description || '',
    primary: Boolean(c.primary),
    color: c.backgroundColor || '',
    textColor: c.foregroundColor || '',
    accessRole: c.accessRole || 'reader',
    timeZone: c.timeZone || '',
    selected: c.selected !== false,
    // writer/owner boleh membuat & mengubah acara; reader tidak.
    canWrite: c.accessRole === 'owner' || c.accessRole === 'writer',
  }))
}

// ---------- Acara ----------

const EVENT_FIELDS = [
  'id', 'status', 'summary', 'description', 'location', 'htmlLink',
  'start', 'end', 'recurrence', 'recurringEventId', 'attendees',
  'organizer', 'creator', 'reminders', 'colorId', 'hangoutLink',
  'conferenceData', 'extendedProperties', 'created', 'updated',
].join(',')

const mapEvent = (e, calendarId = '') => {
  const allDay = Boolean(e.start?.date)
  return {
    id: e.id,
    calendarId,
    status: e.status || 'confirmed',
    summary: e.summary || '(tanpa judul)',
    description: e.description || '',
    location: e.location || '',
    htmlLink: e.htmlLink || '',
    allDay,
    // Untuk acara all-day, Google memakai `date` (YYYY-MM-DD) dan `end.date`
    // bersifat eksklusif (hari setelah hari terakhir).
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    timeZone: e.start?.timeZone || '',
    recurrence: e.recurrence || [],
    recurringEventId: e.recurringEventId || '',
    isRecurring: Boolean(e.recurrence?.length || e.recurringEventId),
    attendees: (e.attendees || []).map((a) => ({
      email: a.email || '',
      name: a.displayName || '',
      optional: Boolean(a.optional),
      organizer: Boolean(a.organizer),
      responseStatus: a.responseStatus || 'needsAction',
    })),
    organizer: e.organizer?.email || '',
    creator: e.creator?.email || '',
    reminders: e.reminders || { useDefault: true },
    colorId: e.colorId || '',
    meetLink: e.hangoutLink || e.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri || '',
    luxioRef: e.extendedProperties?.private?.[LUXIO_PROP_KEY] || '',
    created: e.created || '',
    updated: e.updated || '',
  }
}

/**
 * Daftar acara pada rentang waktu tertentu.
 * timeMin/timeMax = string RFC3339 (mis. new Date().toISOString()).
 */
export const listEvents = async (calendarId = 'primary', {
  timeMin = '', timeMax = '', q = '', maxResults = 50, pageToken = '', showDeleted = false,
} = {}) => {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    // singleEvents=true memecah acara berulang menjadi instance konkret,
    // wajib bila ingin mengurutkan berdasarkan waktu mulai.
    singleEvents: 'true',
    orderBy: 'startTime',
    showDeleted: String(showDeleted),
    fields: `nextPageToken,nextSyncToken,items(${EVENT_FIELDS})`,
  })
  if (timeMin) params.set('timeMin', timeMin)
  if (timeMax) params.set('timeMax', timeMax)
  if (q) params.set('q', q)
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { scopes: CALENDAR_PAGE_SCOPES },
  )
  return {
    events: (data.items || []).map((e) => mapEvent(e, calendarId)),
    nextPageToken: data.nextPageToken || '',
    nextSyncToken: data.nextSyncToken || '',
  }
}

export const getEvent = async (calendarId, eventId) => {
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?fields=${encodeURIComponent(EVENT_FIELDS)}`,
    { scopes: CALENDAR_PAGE_SCOPES },
  )
  return mapEvent(data, calendarId)
}

/**
 * Susun body acara dari bentuk sederhana.
 * allDay=true → pakai `date`; end wajib hari SETELAH hari terakhir.
 */
export const buildEventBody = ({
  summary, description = '', location = '', start, end, allDay = false,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  recurrence = [], attendees = [], reminders = null, luxioRef = '', colorId = '',
}) => ({
  summary,
  ...(description ? { description } : {}),
  ...(location ? { location } : {}),
  start: allDay ? { date: start } : { dateTime: start, timeZone },
  end: allDay ? { date: end } : { dateTime: end, timeZone },
  ...(recurrence.length ? { recurrence } : {}),
  ...(attendees.length ? { attendees: attendees.map((email) => ({ email })) } : {}),
  ...(reminders ? { reminders } : {}),
  ...(colorId ? { colorId } : {}),
  ...(luxioRef ? { extendedProperties: { private: { [LUXIO_PROP_KEY]: luxioRef } } } : {}),
})

/**
 * Buat acara. sendUpdates: 'all' | 'externalOnly' | 'none'.
 * withMeet=true menambahkan tautan Google Meet (butuh conferenceDataVersion=1).
 */
export const createEvent = async (calendarId, payload, { sendUpdates = 'none', withMeet = false } = {}) => {
  const params = new URLSearchParams({ sendUpdates, fields: EVENT_FIELDS })
  const body = buildEventBody(payload)
  if (withMeet) {
    params.set('conferenceDataVersion', '1')
    body.conferenceData = {
      createRequest: {
        requestId: `luxio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    { method: 'POST', scopes: CALENDAR_PAGE_SCOPES, body },
  )
  return mapEvent(data, calendarId)
}

/** PATCH = kirim hanya field yang berubah (lebih aman dari update/PUT). */
export const patchEvent = async (calendarId, eventId, payload, { sendUpdates = 'none' } = {}) => {
  const params = new URLSearchParams({ sendUpdates, fields: EVENT_FIELDS })
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?${params.toString()}`,
    { method: 'PATCH', scopes: CALENDAR_PAGE_SCOPES, body: buildEventBody(payload) },
  )
  return mapEvent(data, calendarId)
}

export const deleteEvent = (calendarId, eventId, { sendUpdates = 'none' } = {}) =>
  googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=${sendUpdates}`,
    { method: 'DELETE', scopes: CALENDAR_PAGE_SCOPES },
  )

/** quickAdd: buat acara dari teks bebas, mis. "Rapat tim Senin 10 pagi". */
export const quickAddEvent = async (calendarId, text) => {
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/quickAdd?text=${encodeURIComponent(text)}&fields=${encodeURIComponent(EVENT_FIELDS)}`,
    { method: 'POST', scopes: CALENDAR_PAGE_SCOPES },
  )
  return mapEvent(data, calendarId)
}

/** Instance konkret dari satu acara berulang. */
export const listInstances = async (calendarId, eventId, { timeMin = '', timeMax = '', maxResults = 50 } = {}) => {
  const params = new URLSearchParams({ maxResults: String(maxResults), fields: `items(${EVENT_FIELDS})` })
  if (timeMin) params.set('timeMin', timeMin)
  if (timeMax) params.set('timeMax', timeMax)
  const data = await googleFetch(
    `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}/instances?${params.toString()}`,
    { scopes: CALENDAR_PAGE_SCOPES },
  )
  return (data.items || []).map((e) => mapEvent(e, calendarId))
}

// ---------- Ketersediaan ----------

/** Cek jadwal sibuk beberapa kalender/orang sekaligus. */
export const queryFreeBusy = async ({ timeMin, timeMax, ids = ['primary'] }) => {
  const data = await googleFetch(`${BASE}/freeBusy`, {
    method: 'POST',
    scopes: CALENDAR_PAGE_SCOPES,
    body: { timeMin, timeMax, items: ids.map((id) => ({ id })) },
  })
  const out = {}
  Object.entries(data.calendars || {}).forEach(([id, v]) => {
    out[id] = { busy: v.busy || [], errors: v.errors || [] }
  })
  return out
}

// ---------- Util ----------

/** RRULE mingguan, mis. buildWeeklyRule(['MO','WE'], 10) untuk 10 kali. */
export const buildWeeklyRule = (days = ['MO'], count = 0, until = '') => {
  const parts = [`FREQ=WEEKLY`, `BYDAY=${days.join(',')}`]
  if (count > 0) parts.push(`COUNT=${count}`)
  // UNTIL wajib format UTC basic: 20260930T235959Z
  if (until) parts.push(`UNTIL=${until}`)
  return [`RRULE:${parts.join(';')}`]
}

/** Awal & akhir hari lokal dalam format RFC3339 untuk timeMin/timeMax. */
export const dayRange = (date = new Date(), days = 1) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + days)
  return { timeMin: start.toISOString(), timeMax: end.toISOString() }
}
