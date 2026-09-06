// =====================================================================
// GmailPage.jsx — Halaman Gmail (OAuth Google, baca & kelola email).
// =====================================================================
// Login: tombol "Login dengan Gmail" (popup OAuth GIS). Setelah login,
// pengguna dapat: membaca folder (inbox/terkirim/dll), mencari, membuka
// email & lampiran, membalas, meneruskan, menulis email baru, simpan
// draft, bintang, arsip, tandai spam, hapus, dan tandai sudah dibaca.
// =====================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isGoogleConfigured, requestGoogleToken, clearGoogleTokens,
  GOOGLE_SCOPES, fetchGoogleUserInfo,
} from '../services/googleAuth'
import {
  listMessages, getThread, sendMessage, saveDraft, untrashMessage,
  markAsRead, markAsUnread, starMessage, unstarMessage,
  archiveMessage, trashMessage, deleteMessageForever, getAttachment,
} from '../services/gmailApi'
import {
  Mail, RefreshCw, Search, Star, Archive, Trash2, Reply, Forward,
  Paperclip, Send, X, LogIn, LogOut, Inbox, AlertTriangle,
  CheckCheck, Printer, Eye, EyeOff, Loader2,
} from 'lucide-react'
import './GmailPage.css'

const FOLDER_TABS = [
  { id: 'inbox', name: 'Kotak Masuk' },
  { id: 'starred', name: 'Berbintang' },
  { id: 'sent', name: 'Terkirim' },
  { id: 'drafts', name: 'Draft' },
  { id: 'important', name: 'Penting' },
  { id: 'spam', name: 'Spam' },
  { id: 'trash', name: 'Sampah' },
  { id: 'all', name: 'Semua' },
]

const fmtDate = (internalDate) => {
  if (!internalDate) return ''
  const d = new Date(internalDate)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

const fmtFullDate = (internalDate) =>
  internalDate
    ? new Date(internalDate).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

export default function GmailPage() {
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2500)
  }
  const [auth, setAuth] = useState({ state: 'idle', email: '' }) // idle|busy|error|ok
  const [authError, setAuthError] = useState('')
  const [folder, setFolder] = useState('inbox')
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null) // detail email (thread)
  const [detailLoading, setDetailLoading] = useState(false)
  const [composer, setComposer] = useState(null) // { mode, to, cc, subject, body, threadId, inReplyTo, references }
  const [nextPageToken, setNextPageToken] = useState('')

  const login = useCallback(async () => {
    setAuth({ state: 'busy', email: '' })
    setAuthError('')
    try {
      const entry = await requestGoogleToken({ scopes: [...GOOGLE_SCOPES.GMAIL, ...GOOGLE_SCOPES.PROFILE] })
      const info = await fetchGoogleUserInfo([...GOOGLE_SCOPES.GMAIL, ...GOOGLE_SCOPES.PROFILE]).catch(() => null)
      setAuth({ state: 'ok', email: info?.email || entry.email || '' })
      if (info?.name && showToast) showToast(`Gmail terhubung: ${info.email}`)
    } catch (e) {
      if (e.code === 'NOT_CONFIGURED') {
        setAuthError('Integrasi Google belum aktif di sesi browser ini. Lakukan hard refresh (Ctrl+Shift+R) untuk memuat konfigurasi terbaru.')
      } else {
        setAuthError(e.message || 'Login gagal.')
      }
      setAuth({ state: 'error', email: '' })
    }
  }, [showToast])

  const logout = async () => {
    clearGoogleTokens()
    setAuth({ state: 'idle', email: '' })
    setMessages([])
    setSelected(null)
  }

  // Auto-login bila token cache masih hidup.
  useEffect(() => {
    const cached = sessionStorage.getItem('luxio_google_tokens')
    if (cached && isGoogleConfigured()) login()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadMessages = useCallback(async ({ append = false, token = '' } = {}) => {
    setLoading(true)
    setError('')
    try {
      const data = await listMessages({ folder, query: search.trim(), max: 25, pageToken: token })
      setMessages((prev) => (append ? [...prev, ...data.messages] : data.messages))
      setNextPageToken(data.nextPageToken)
    } catch (e) {
      setError(e.message || 'Gagal memuat email.')
    } finally {
      setLoading(false)
    }
  }, [folder, search])

  useEffect(() => {
    if (auth.state !== 'ok') return
    loadMessages()
  }, [auth.state, loadMessages])

  const openMessage = async (m) => {
    setDetailLoading(true)
    setSelected(null)
    try {
      const thread = await getThread(m.threadId || m.id)
      setSelected(thread)
      if (m.unread) {
        markAsRead(m.id).catch(() => {})
        setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, unread: false } : x)))
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const applyPatch = (id, patch) =>
    setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const runAction = async (id, fn, patch = {}) => {
    try {
      await fn()
      if (Object.keys(patch).length) applyPatch(id, patch)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSend = async (data) => {
    await sendMessage(data)
    setComposer(null)
    showToast('Email terkirim.')
    if (['sent', 'all'].includes(folder)) loadMessages()
  }
  const handleSaveDraft = async (data) => {
    await saveDraft(data)
    setComposer(null)
    showToast('Draft disimpan.')
    if (folder === 'drafts') loadMessages()
  }

  const confirmAnd = (msg, fn, id, patch) => {
    if (window.confirm(msg)) runAction(id, fn, patch)
  }

  if (!isGoogleConfigured()) {
    return (
      <div className="gmail-page">
        <LoginGate
          error="Integrasi Google belum aktif di sesi browser ini. Lakukan hard refresh (Ctrl+Shift+R) untuk memuat konfigurasi terbaru, lalu klik tombol di bawah untuk menghubungkan Gmail."
          onLogin={login}
          busy={auth.state === 'busy'}
        />
      </div>
    )
  }

  if (auth.state !== 'ok') {
    return (
      <div className="gmail-page">
        <LoginGate error={authError} onLogin={login} busy={auth.state === 'busy'} />
      </div>
    )
  }

  return (
    <div className="gmail-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1><Mail size={20} style={{ color: '#EA4335', verticalAlign: '-3px' }} /> Gmail</h1>
          <p>{auth.email ? `Masuk sebagai ${auth.email}` : 'Kelola email Google kamu'}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => loadMessages()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat ulang
          </button>
          <button className="btn btn-primary" onClick={() => setComposer({ mode: 'compose' })}>
            <Send size={14} /> Tulis Email
          </button>
          <button className="btn btn-ghost" onClick={logout} title="Keluar dari Gmail"><LogOut size={14} /></button>
        </div>
      </div>

      <div className="gmail-toolbar">
        <div className="gmail-tabs">
          {FOLDER_TABS.map((f) => (
            <button
              key={f.id}
              className={`gmail-tab ${folder === f.id ? 'active' : ''}`}
              onClick={() => { setFolder(f.id); setSearch('') }}
            >
              {f.name}
            </button>
          ))}
        </div>
        <form className="gmail-search" onSubmit={(e) => { e.preventDefault(); loadMessages() }}>
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email (cth: from:andi is:unread)…"
          />
        </form>
      </div>

      {error && (
        <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>
      )}

      <div className="gmail-layout">
        <div className="gmail-list">
          {loading && !messages.length && (
            <div className="gmail-empty"><Loader2 size={22} className="spin" /> Memuat email…</div>
          )}
          {!loading && !messages.length && !error && (
            <div className="gmail-empty"><Inbox size={26} /> Tidak ada email di folder ini.</div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`gmail-item ${m.unread ? 'unread' : ''}`}
              onClick={() => openMessage(m)}
            >
              <button
                className="gmail-star"
                onClick={(e) => {
                  e.stopPropagation()
                  runAction(m.id, () => (m.starred ? unstarMessage(m.id) : starMessage(m.id)), { starred: !m.starred })
                }}
                title={m.starred ? 'Hapus bintang' : 'Beri bintang'}
              >
                <Star size={15} fill={m.starred ? '#FACC15' : 'none'} color={m.starred ? '#FACC15' : 'currentColor'} />
              </button>
              <div className="gmail-item-main">
                <div className="gmail-item-top">
                  <span className="gmail-item-from">{m.from.name || m.from.email}</span>
                  <span className="gmail-item-date">{fmtDate(m.internalDate)}</span>
                </div>
                <div className="gmail-item-subject">
                  {m.subject}
                  {m.hasAttachment && <Paperclip size={12} style={{ marginLeft: 6, opacity: 0.6 }} />}
                </div>
                <div className="gmail-item-snippet">{m.snippet}</div>
              </div>
              <div className="gmail-item-actions">
                {folder === 'trash' ? (
                  <button title="Pulihkan" onClick={(e) => { e.stopPropagation(); runAction(m.id, () => untrashMessage(m.id)) }}><RefreshCw size={14} /></button>
                ) : (
                  <button title="Arsip" onClick={(e) => { e.stopPropagation(); runAction(m.id, () => archiveMessage(m.id)) }}><Archive size={14} /></button>
                )}
                <button title="Hapus" onClick={(e) => { e.stopPropagation(); runAction(m.id, () => trashMessage(m.id)) }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {nextPageToken && (
            <button
              className="btn btn-secondary gmail-more"
              disabled={loading}
              onClick={() => { loadMessages({ append: true, token: nextPageToken }) }}
            >
              {loading ? 'Memuat…' : 'Muat lebih banyak'}
            </button>
          )}
        </div>

        <div className="gmail-detail">
          {detailLoading && <div className="gmail-empty"><Loader2 size={22} className="spin" /> Membuka…</div>}
          {!detailLoading && !selected && (
            <div className="gmail-empty">
              <Mail size={26} />
              <span>Pilih email untuk dibaca</span>
              <small>Klik salah satu email di daftar untuk melihat isi lengkap, membalas, atau meneruskan.</small>
            </div>
          )}
          {selected && !detailLoading && (
            <ThreadView
              thread={selected}
              onReply={(m) => setComposer({
                mode: 'reply',
                to: m.from.email,
                subject: m.subject.startsWith('Re:') ? m.subject : `Re: ${m.subject}`,
                body: `<br><br><hr><p>Pada ${fmtFullDate(m.internalDate)}, ${m.from.name || m.from.email} menulis:</p><blockquote>${m.body.html || `<pre style="white-space:pre-wrap">${m.body.text}</pre>`}</blockquote>`,
                threadId: m.threadId,
                inReplyTo: m.messageIdHeader,
                references: m.messageIdHeader,
              })}
              onForward={(m) => setComposer({
                mode: 'forward',
                subject: m.subject.startsWith('Fwd:') ? m.subject : `Fwd: ${m.subject}`,
                body: `<p>---------- Pesan diteruskan ----------</p><p>Dari: ${m.from.email}</p><p>Subjek: ${m.subject}</p><p>Tanggal: ${fmtFullDate(m.internalDate)}</p><hr>${m.body.html || `<pre style="white-space:pre-wrap">${m.body.text}</pre>`}`,
              })}
              onArchive={(m) => runAction(m.id, () => archiveMessage(m.id))}
              onTrash={(m) => confirmAnd('Pindahkan ke sampah?', () => trashMessage(m.id), m.id)}
              onDeleteForever={(m) => confirmAnd('Hapus permanen email ini? Tidak bisa dikembalikan.', () => deleteMessageForever(m.id), m.id)}
              onUnread={(m) => runAction(m.id, () => markAsUnread(m.id))}
              onStar={(m) => runAction(m.id, () => (m.starred ? unstarMessage(m.id) : starMessage(m.id)), { starred: !m.starred })}
              onDownloadAttachment={async (msgId, att) => {
                const data = await getAttachment(msgId, att.id)
                const bin = Uint8Array.from(atob(data.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
                const blob = new Blob([bin], { type: att.mimeType })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = att.filename
                a.click()
                URL.revokeObjectURL(a.href)
              }}
              onPrint={() => window.print()}
            />
          )}
        </div>
      </div>

      {composer && (
        <Composer
          initial={composer}
          onCancel={() => setComposer(null)}
          onSend={handleSend}
          onSaveDraft={handleSaveDraft}
        />
      )}

      {toastMsg && <div className="gmail-toast">{toastMsg}</div>}
    </div>
  )
}

/* ---------- Gate login (sebelum OAuth) ---------- */

function LoginGate({ error, onLogin, busy }) {
  return (
    <div className="gmail-login-gate">
      <div className="gmail-login-card">
        <div className="gmail-login-logo"><Mail size={34} /></div>
        <h2>Gmail untuk Luxio</h2>
        <p>
          Hubungkan akun Google untuk membaca, membalas, dan mengelola email
          langsung dari Luxio — tanpa berpindah tab.
        </p>
        <ul className="gmail-login-perms">
          <li><Eye size={14} /> Baca email &amp; lampiran</li>
          <li><Send size={14} /> Kirim, balas &amp; teruskan email</li>
          <li><CheckCheck size={14} /> Arsip, bintang &amp; kelola folder</li>
        </ul>
        {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
        <button className="btn btn-primary gmail-login-btn" onClick={onLogin} disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
          {busy ? 'Menunggu Google…' : 'Login dengan Gmail'}
        </button>
        <small className="gmail-login-note">
          Autentikasi resmi via Google (OAuth 2.0). Token disimpan hanya di browser kamu.
        </small>
      </div>
    </div>
  )
}

/* ---------- Tampilan percakapan ---------- */

function ThreadView({
  thread, onReply, onForward, onArchive, onTrash, onDeleteForever, onUnread, onStar, onDownloadAttachment, onPrint,
}) {
  const [expanded, setExpanded] = useState(() => new Set([thread.messages[thread.messages.length - 1]?.id]))
  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev)
    if (next.has(id)) { if (next.size > 1) next.delete(id) } else next.add(id)
    return next
  })
  const last = thread.messages[thread.messages.length - 1]

  return (
    <div className="gmail-thread">
      <div className="gmail-thread-actions">
        <button title="Balas" onClick={() => onReply(last)}><Reply size={15} /> Balas</button>
        <button title="Teruskan" onClick={() => onForward(last)}><Forward size={15} /> Teruskan</button>
        <button title="Bintang" onClick={() => onStar(last)}><Star size={15} fill={last.starred ? '#FACC15' : 'none'} color={last.starred ? '#FACC15' : 'currentColor'} /></button>
        <button title="Arsip" onClick={() => onArchive(last)}><Archive size={15} /></button>
        <button title="Tandai belum dibaca" onClick={() => onUnread(last)}><EyeOff size={15} /></button>
        <button title="Sampah" onClick={() => onTrash(last)}><Trash2 size={15} /></button>
        <button title="Hapus permanen" onClick={() => onDeleteForever(last)}><AlertTriangle size={15} /></button>
        <button title="Cetak" onClick={onPrint}><Printer size={15} /></button>
      </div>

      <div className="gmail-thread-list">
        {thread.messages.map((m, i) => {
          const open = expanded.has(m.id)
          return (
            <div key={m.id} className={`gmail-msg ${open ? 'open' : ''}`}>
              <div className="gmail-msg-header" onClick={() => toggle(m.id)}>
                <div className="gmail-msg-sender">
                  <strong>{m.from.name || m.from.email}</strong>
                  <span className="gmail-msg-email">&lt;{m.from.email}&gt;</span>
                </div>
                <div className="gmail-msg-meta">
                  {m.to.length > 0 && <span className="gmail-msg-to">ke: {m.to.map((t) => t.email).join(', ')}</span>}
                  <span>{fmtFullDate(m.internalDate)}</span>
                </div>
              </div>
              {open && (
                <>
                  <h3 className="gmail-msg-subject">{m.subject}</h3>
                  {m.body.html ? (
                    <div className="gmail-msg-body" dangerouslySetInnerHTML={{ __html: m.body.html }} />
                  ) : (
                    <pre className="gmail-msg-body gmail-msg-plain">{m.body.text || m.snippet}</pre>
                  )}
                  {m.body.attachments.length > 0 && (
                    <div className="gmail-msg-attachments">
                      {m.body.attachments.map((att) => (
                        <button key={att.id} className="gmail-attachment" onClick={() => onDownloadAttachment(m.id, att)}>
                          <Paperclip size={13} /> {att.filename}
                          <small>{(att.size / 1024).toFixed(0)} KB</small>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {!open && <div className="gmail-msg-collapsed-snippet">{m.snippet}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Composer (tulis/balas/teruskan) ---------- */

function Composer({ initial, onCancel, onSend, onSaveDraft }) {
  const [to, setTo] = useState(initial.to || '')
  const [cc, setCc] = useState(initial.cc || '')
  const [subject, setSubject] = useState(initial.subject || '')
  const [body, setBody] = useState(initial.body || '')
  const [showCc, setShowCc] = useState(Boolean(initial.cc))
  const [sending, setSending] = useState(false)

  const ready = to.trim() && subject.trim() !== '' && body.trim()
  const wrap = (fn) => async () => {
    if (sending) return
    setSending(true)
    try { await fn({ to: to.trim(), cc: cc.trim(), subject: subject.trim(), body, threadId: initial.threadId, inReplyTo: initial.inReplyTo, references: initial.references }) }
    finally { setSending(false) }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal gmail-composer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initial.mode === 'reply' ? 'Balas Email' : initial.mode === 'forward' ? 'Teruskan Email' : 'Email Baru'}</h2>
          <button className="close-btn" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Kepada</label>
            <input className="input" type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="penerima@gmail.com" autoFocus />
          </div>
          {showCc ? (
            <div className="input-group">
              <label className="input-label">Cc</label>
              <input className="input" value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@gmail.com" />
            </div>
          ) : (
            <button className="gmail-cc-toggle" onClick={() => setShowCc(true)}>Tambah Cc</button>
          )}
          <div className="input-group">
            <label className="input-label">Subjek</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Pesan (HTML diizinkan)</label>
            <textarea className="input gmail-compose-body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tulis isi email…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Batal</button>
          <button className="btn btn-secondary" disabled={!ready || sending} onClick={wrap(onSaveDraft)}>Simpan Draft</button>
          <button className="btn btn-primary" disabled={!ready || sending} onClick={wrap(onSend)}>
            <Send size={15} /> {sending ? 'Mengirim…' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  )
}
