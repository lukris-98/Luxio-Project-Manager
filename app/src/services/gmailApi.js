// =====================================================================
// gmailApi.js — Klien Gmail API v3 (REST) via token OAuth googleAuth.js.
// =====================================================================
// Mencakup tugas yang biasa dilakukan di Gmail:
//  - Baca daftar email per folder (inbox, terkirim, draft, sampah, dll)
//    dan pencarian (operator Gmail: from:, is:unread, dsb).
//  - Baca isi email lengkap (header, body HTML/plain, lampiran).
//  - Kirim / balas / teruskan email (termasuk draft & jadwal manual).
//  - Aksi pesan: baca/belum-baca, bintang, arsip, sampah/pulihkan,
//    hapus permanen, ubah label.
//  - Kelola label & draft.
// =====================================================================

import { googleFetch, GOOGLE_SCOPES } from './googleAuth'

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const SCOPES = () => [...GOOGLE_SCOPES.GMAIL]

// ---------- Label & folder ----------

export const listLabels = () =>
  googleFetch(`${BASE}/labels`, { scopes: SCOPES() }).then((d) => d.labels || [])

// Peta folder UI -> query Gmail.
export const FOLDERS = [
  { id: 'inbox', name: 'Kotak Masuk', q: 'in:inbox -in:chats' },
  { id: 'starred', name: 'Berbintang', q: 'is:starred' },
  { id: 'sent', name: 'Terkirim', q: 'in:sent' },
  { id: 'drafts', name: 'Draft', q: 'in:drafts' },
  { id: 'important', name: 'Penting', q: 'is:important' },
  { id: 'snoozed', name: 'Ditunda', q: 'in:snoozed' },
  { id: 'spam', name: 'Spam', q: 'in:spam' },
  { id: 'trash', name: 'Sampah', q: 'in:trash' },
  { id: 'all', name: 'Semua Email', q: 'in:anywhere' },
]

// ---------- Daftar pesan ----------

/**
 * Ambil daftar email. setiap item berisi id, threadId, snippet,
 * header penting (from/to/subject/date) dan flag (unread, starred, attachment).
 */
export const listMessages = async ({ folder = 'inbox', query = '', max = 25, pageToken = '' } = {}) => {
  const folderDef = FOLDERS.find((f) => f.id === folder) || FOLDERS[0]
  const q = [folderDef.q, query].filter(Boolean).join(' ')
  const params = new URLSearchParams({ maxResults: String(max), q })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/messages?${params.toString()}`, { scopes: SCOPES() })
  const msgs = await Promise.all((data.messages || []).map((m) => getMessage(m.id, 'metadata')))
  return { messages: msgs, nextPageToken: data.nextPageToken || '' }
}

const parseHeader = (headers, name) =>
  headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

const parseAddresses = (value = '') =>
  value.split(',').map((v) => v.trim()).filter(Boolean).map((raw) => {
    const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/)
    if (m) return { name: m[1].trim() || m[2], email: m[2].trim(), raw }
    return { name: raw, email: raw, raw }
  })

const walkParts = (parts, out) => {
  for (const p of parts || []) {
    if (p.mimeType === 'multipart/alternative' || p.mimeType === 'multipart/related' || p.mimeType === 'multipart/mixed') {
      walkParts(p.parts, out)
    } else if (p.mimeType === 'text/plain' && !out.text) {
      out.text = decodeB64(p.body?.data)
    } else if (p.mimeType === 'text/html' && !out.html) {
      out.html = decodeB64(p.body?.data)
    } else if (p.filename) {
      out.attachments.push({
        id: p.body?.attachmentId,
        filename: p.filename,
        mimeType: p.mimeType,
        size: p.body?.size || 0,
      })
    }
  }
}

const decodeB64 = (data) => {
  if (!data) return ''
  try {
    const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch { return '' }
}

/**
 * Ambil detail pesan. format 'metadata' cepat (daftar); 'full' berisi body.
 */
export const getMessage = async (id, format = 'full') => {
  const data = await googleFetch(`${BASE}/messages/${id}?format=${format}`, { scopes: SCOPES() })
  const headers = data.payload?.headers || []
  const body = { text: '', html: '', attachments: [] }
  if (format === 'full') {
    const payload = data.payload
    if (payload?.mimeType?.startsWith('multipart/')) {
      walkParts(payload.parts, body)
    } else if (payload?.mimeType === 'text/html') {
      body.html = decodeB64(payload.body?.data)
    } else if (payload?.mimeType === 'text/plain') {
      body.text = decodeB64(payload.body?.data)
    }
  }
  return {
    id: data.id,
    threadId: data.threadId,
    snippet: data.snippet || '',
    internalDate: Number(data.internalDate || 0),
    labelIds: data.labelIds || [],
    from: parseAddresses(parseHeader(headers, 'From'))[0] || { name: '', email: '' },
    to: parseAddresses(parseHeader(headers, 'To')),
    cc: parseAddresses(parseHeader(headers, 'Cc')),
    subject: parseHeader(headers, 'Subject') || '(tanpa subjek)',
    date: parseHeader(headers, 'Date'),
    messageIdHeader: parseHeader(headers, 'Message-ID'),
    unread: (data.labelIds || []).includes('UNREAD'),
    starred: (data.labelIds || []).includes('STARRED'),
    hasAttachment: (data.labelIds || []).includes('HAS_ATTACHMENT') || body.attachments.length > 0,
    body,
  }
}

// ---------- Thread (percakapan) ----------

export const getThread = async (id) => {
  const data = await googleFetch(`${BASE}/threads/${id}`, { scopes: SCOPES() })
  const messages = await Promise.all((data.messages || []).map((m) => getMessage(m.id, 'full')))
  return { id: data.id, messages }
}

// ---------- Aksi pesan ----------

export const modifyMessage = (id, { addLabelIds = [], removeLabelIds = [] } = {}) =>
  googleFetch(`${BASE}/messages/${id}/modify`, {
    method: 'POST',
    scopes: SCOPES(),
    body: { addLabelIds, removeLabelIds },
  })

export const markAsRead = (id) => modifyMessage(id, { removeLabelIds: ['UNREAD'] })
export const markAsUnread = (id) => modifyMessage(id, { addLabelIds: ['UNREAD'] })
export const starMessage = (id) => modifyMessage(id, { addLabelIds: ['STARRED'] })
export const unstarMessage = (id) => modifyMessage(id, { removeLabelIds: ['STARRED'] })
export const archiveMessage = (id) => modifyMessage(id, { removeLabelIds: ['INBOX'] })
export const unarchiveMessage = (id) => modifyMessage(id, { addLabelIds: ['INBOX'] })
export const trashMessage = (id) =>
  googleFetch(`${BASE}/messages/${id}/trash`, { method: 'POST', scopes: SCOPES() })
export const untrashMessage = (id) =>
  googleFetch(`${BASE}/messages/${id}/untrash`, { method: 'POST', scopes: SCOPES() })
export const deleteMessageForever = (id) =>
  googleFetch(`${BASE}/messages/${id}`, { method: 'DELETE', scopes: SCOPES() })

// ---------- Kirim / draft ----------

const buildMime = ({ to, cc = '', subject = '', body = '', inReplyTo = '', references = '' }) => {
  const lines = [
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${subject}`,
    ...(inReplyTo ? [`In-Reply-To: ${inReplyTo}`, `References: ${references || inReplyTo}`] : []),
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    body,
  ]
  const raw = lines.join('\r\n')
  return btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const sendMessage = async ({ to, cc, subject, body, inReplyTo, references, threadId }) => {
  const raw = buildMime({ to, cc, subject, body, inReplyTo, references })
  return googleFetch(`${BASE}/messages/send`, {
    method: 'POST',
    scopes: SCOPES(),
    body: { raw, ...(threadId ? { threadId } : {}) },
  })
}

export const saveDraft = async ({ to, cc, subject, body, threadId }) => {
  const raw = buildMime({ to, cc, subject, body })
  return googleFetch(`${BASE}/drafts`, {
    method: 'POST',
    scopes: SCOPES(),
    body: { message: { raw, ...(threadId ? { threadId } : {}) } },
  })
}

export const listDrafts = async () => {
  const data = await googleFetch(`${BASE}/drafts?maxResults=25`, { scopes: SCOPES() })
  const drafts = await Promise.all(
    (data.drafts || []).map(async (d) => ({ id: d.id, message: await getMessage(d.message.id, 'metadata') }))
  )
  return drafts
}

export const deleteDraft = (id) =>
  googleFetch(`${BASE}/drafts/${id}`, { method: 'DELETE', scopes: SCOPES() })

// ---------- Lampiran ----------

export const getAttachment = async (messageId, attachmentId) => {
  const data = await googleFetch(`${BASE}/messages/${messageId}/attachments/${attachmentId}`, { scopes: SCOPES() })
  return decodeB64(data.data)
}

// ---------- Label CRUD ----------

export const createLabel = (name) =>
  googleFetch(`${BASE}/labels`, { method: 'POST', scopes: SCOPES(), body: { name, labelListVisibility: 'labelShow', messageListVisibility: 'show' } })

export const deleteLabel = (id) =>
  googleFetch(`${BASE}/labels/${id}`, { method: 'DELETE', scopes: SCOPES() })
