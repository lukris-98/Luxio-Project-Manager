// =====================================================================
// BangMotion.jsx — Tool motion graphics ala Bang Motion, tampilan chatbot
// (persis halaman Agent AI) di dalam Luxio.
// =====================================================================
// • Chat: bubble user (prompt) ↔ assistant (card preview iframe + aksi).
// • History chat per user (localStorage) — bisa dibuka kembali & lanjut.
// • Composer: textarea + tombol ⋯ yang membuka popover KE ATAS berisi
//   [Gaya visual] [Durasi] [Aspek] + kotak teks "Arah tambahan".
// • Model AI dari provider terdaftar (Pengaturan → AI Provider).
// • HTML hasil → otomatis upload ke Backblaze B2 (bucket luxio-motion),
//   metadata prompt → tersimpan ke Neon (tabel bang_motion_prompts).
// • Tombol "Unduh Video (MP4)": backend render via chromium+ffmpeg
//   (puppeteer), upload MP4 ke B2, lalu diunduh.
// • Tombol "Gunakan (template)" pada hasil lama → variasi baru.
// =====================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Clapperboard, Trash2, ExternalLink, Loader2,
  AlertTriangle, Copy, Film, Wand2, HardDrive, LayoutTemplate,
  MoreHorizontal, Send, Plus, MessageSquare, Download,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { callAIChat } from '../utils/aiConfig'
import {
  BANG_MOTION_SYSTEM_PROMPT, buildMotionUserPrompt, extractHtml,
  saveMotionToB2, loadGallery, saveToGallery, removeFromGallery, fetchMotionHtml,
} from '../services/bangMotionApi'
import { b2EnsureAppSession, downloadFileViaProxy, B2_APP_CREDENTIALS } from '../services/b2Api'
import { api } from '../services/api'
import './BangMotion.css'

// Kredensial aplikasi untuk render MP4 di backend (fallback config DB).
const B2_APP_CREDS = B2_APP_CREDENTIALS

const STYLE_OPTIONS = [
  { value: 'auto', label: 'Auto — ikut tema terbaik' },
  { value: 'opener/promo (GSAP + Three.js world)', label: 'Opener / Promo (dunia 3D)' },
  { value: 'cartoon collage', label: 'Cartoon Collage' },
  { value: 'visual journalism', label: 'Visual Journalism' },
  { value: 'white catalog', label: 'White Catalog' },
  { value: 'vintage sketch', label: 'Vintage Sketch' },
  { value: 'continuous action (vector world)', label: 'Continuous Action (vektor)' },
]
const DURATIONS = [10, 15, 20, 30, 45, 60]
const RATIOS = ['16:9', '9:16', '1:1']

// ---------- Riwayat chat (localStorage per user) ----------
const chatsKeyFor = (uid) => `luxio_bm_chats_${uid ?? 'x'}`

const loadChats = (uid) => {
  try { return JSON.parse(localStorage.getItem(chatsKeyFor(uid)) || '[]') } catch { return [] }
}
const persistChats = (uid, chats) => {
  try { localStorage.setItem(chatsKeyFor(uid), JSON.stringify(chats.slice(0, 40))) } catch { /* penuh */ }
}
const newSession = () => ({
  id: `c-${Date.now()}`,
  title: 'Chat baru',
  createdAt: Date.now(),
  messages: [],
})

export default function BangMotion() {
  const { currentUser, setCurrentPage, setToast } = useStore()
  const uid = currentUser?.id ?? 'x'

  // ---------- Provider AI ----------
  const [providers, setProviders] = useState(null)
  const [providerId, setProviderId] = useState('')
  useEffect(() => {
    let on = true
    api.getAIProviders()
      .then((res) => {
        if (!on) return
        const list = (res.providers || []).filter((p) => p.enabled !== false)
        setProviders(list)
        const act = list.find((p) => p.is_active) || list[0]
        if (act) setProviderId(act.id)
      })
      .catch(() => { if (on) setProviders([]) })
    return () => { on = false }
  }, [])

  // ---------- Sessions ----------
  // html TIDAK dipersist (hemat localStorage) — diambil dari B2 saat dibutuhkan.
  const [chats, setChats] = useState(() => loadChats(uid))
  const [activeId, setActiveId] = useState(() => loadChats(uid)[0]?.id || null)
  useEffect(() => {
    const slim = chats.map((c) => ({
      ...c,
      messages: c.messages.map((m) => (m.item ? { ...m, item: { ...m.item, html: undefined } } : m)),
    }))
    persistChats(uid, slim)
  }, [chats, uid])

  const active = useMemo(
    () => chats.find((c) => c.id === activeId) || null,
    [chats, activeId],
  )

  const setActiveMessages = useCallback((updater) => {
    setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, ...updater(c) } : c)))
  }, [activeId])

  const startNewChat = () => {
    const s = newSession()
    setChats((prev) => [s, ...prev])
    setActiveId(s.id)
  }

  // ---------- Composer ----------
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('auto')
  const [duration, setDuration] = useState(20)
  const [ratio, setRatio] = useState('16:9')
  const [extras, setExtras] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  // ---------- Status ----------
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [renderingId, setRenderingId] = useState('')
  const [template, setTemplate] = useState(null)
  const [templateLoading, setTemplateLoading] = useState(false)
  const scrollRef = useRef(null)
  const resultSrcs = useRef({}) // itemId → blob URL (sesi aktif)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [active?.messages?.length, generating, status])

  const noProvider = providers !== null && providers.length === 0

  // ---------- Kirim prompt ----------
  const handleSend = async (e) => {
    e?.preventDefault?.()
    const provider = (providers || []).find((p) => p.id === providerId)
    if (!provider) {
      setError('Daftarkan provider AI dulu di Pengaturan → AI Provider.')
      return
    }
    const text = prompt.trim()
    if (!text) { setError('Tulis prompt dulu.'); return }

    // Buat sesi bila belum ada.
    let sid = activeId
    if (!sid || !chats.some((c) => c.id === sid)) {
      const s = newSession()
      setChats((prev) => [s, ...prev])
      setActiveId(s.id)
      sid = s.id
    }

    const userMsg = {
      id: `m-${Date.now()}`, role: 'user', text,
      style, duration, ratio, extras: extras.trim(), createdAt: Date.now(),
    }
    setChats((prev) => prev.map((c) => (c.id === sid
      ? { ...c, title: c.messages.length === 0 ? text.slice(0, 48) : c.title, messages: [...c.messages, userMsg] }
      : c)))
    setPrompt('')
    setGenerating(true); setError('')

    // Bubble "sedang membuat…" + streaming status.
    const asstId = `a-${Date.now()}`
    setChats((prev) => prev.map((c) => (c.id === sid
      ? { ...c, messages: [...c.messages, { id: asstId, role: 'assistant', item: null, status: 'Model AI sedang merancang & menulis motion graphics…' }] }
      : c)))

    try {
      const cfg = {
        api_type: provider.api_type || 'openai-compatible',
        base_url: provider.base_url, api_key: provider.api_key, model: provider.model,
      }
      let userContent = buildMotionUserPrompt({ prompt: text, style, duration, ratio, extras: extras.trim() })
      userContent += `\n- Variation seed: ${(Math.random() + 1).toString(36).slice(2, 8)} — make noticeably different choices than typical.`
      if (template) {
        userContent += `\n\nTEMPLATE BASIS (buat VARIASI BARU yang jauh berbeda — ganti palet, font, komposisi, urutan adegan, transisi; jangan menyalin mentah):\n${(template.html || '').slice(0, 60000)}`
      }
      const raw = await callAIChat(cfg, [
        { role: 'system', content: BANG_MOTION_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ], { maxTokens: 16000, temperature: 0.9 })
      const html = extractHtml(raw)
      if (!html || !/<html/i.test(html)) throw new Error('Model tidak menghasilkan HTML valid. Coba lagi / pakai model yang lebih kuat.')

      // Status → simpan ke B2.
      setChats((prev) => prev.map((c) => (c.id === sid
        ? { ...c, messages: c.messages.map((m) => (m.id === asstId ? { ...m, status: 'Menyimpan HTML ke Backblaze B2…' } : m)) }
        : c)))
      const item = {
        id: `bm-${Date.now()}`,
        title: text.slice(0, 80),
        prompt: text, style, duration, ratio, extras: extras.trim(),
        provider: provider.display_name || provider.provider_id,
        createdAt: Date.now(),
      }
      let b2Note = ''
      try {
        await b2EnsureAppSession()
        const saved = await saveMotionToB2(html, item)
        Object.assign(item, saved, { url: saved.url })
        resultSrcs.current[item.id] = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      } catch (b2err) {
        b2Note = b2err.message
      }
      saveToGallery(item)

      // Metadata prompt → Neon (best-effort).
      api.saveBangMotionPrompt({
        title: item.title, prompt: text, style, duration, ratio, extras: extras.trim(),
        provider: item.provider, b2_file_name: item.fileName || '', b2_file_id: item.fileId || '',
        b2_url: item.url || '', size_bytes: item.size || 0,
      }).catch(() => {})

      setChats((prev) => prev.map((c) => (c.id === sid
        ? { ...c, messages: c.messages.map((m) => (m.id === asstId ? { ...m, item: { ...item, html }, b2Note } : m)) }
        : c)))
      setToast?.({ title: 'Motion selesai', body: b2Note ? 'Tersimpan lokal (B2 gagal)' : 'Tersimpan ke Backblaze B2', type: 'create' })
    } catch (err) {
      setChats((prev) => prev.map((c) => (c.id === sid
        ? { ...c, messages: c.messages.map((m) => (m.id === asstId ? { ...m, status: '', error: err.message } : m)) }
        : c)))
      setError(err.message)
    } finally {
      setGenerating(false); setStatus('')
    }
  }

  // ---------- Unduh MP4 ----------
  const handleRenderMp4 = async (msgItem) => {
    if (!msgItem?.html && !msgItem?.url) return
    setRenderingId(msgItem.id); setError('')
    try {
      const html = await fetchMotionHtml(msgItem)
      const htmlB64 = b64Encode(new TextEncoder().encode(html))
      const res = await api.renderBangMotion({
        htmlBase64: htmlB64,
        durationSec: msgItem.duration || 20,
        fps: 24, width: 1920, height: 1080,
        title: msgItem.title || 'bang-motion',
        b2: B2_APP_CREDS,
      })
      const videoUrl = res.url || ''
      // Unduh via proxy (blob) supaya nama file rapi.
      try {
        await b2EnsureAppSession()
        const bucket = 'luxio-motion'
        const blob = await downloadFileViaProxy(bucket, res.fileName)
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${(msgItem.title || 'bang-motion').slice(0, 30).replace(/\W+/g, '-')}.mp4`
        a.click()
        URL.revokeObjectURL(a.href)
      } catch { /* fallback: buka URL */ }
      setChats((prev) => prev.map((c) => ({
        ...c,
        messages: c.messages.map((m) => (m.item?.id === msgItem.id
          ? { ...m, item: { ...m.item, videoUrl, videoName: res.fileName, videoId: res.fileId } }
          : m)),
      })))
      setToast?.({ title: 'Video MP4 siap', body: 'Tersimpan ke Backblaze B2 & terunduh.', type: 'create' })
    } catch (err) {
      setError(`Render MP4 gagal: ${err.message}`)
    } finally {
      setRenderingId('')
    }
  }

  const useTemplate = async (item) => {
    setTemplateLoading(true)
    try {
      const html = await fetchMotionHtml(item)
      setTemplate({ id: item.id, title: item.title, html })
      setPrompt(item.prompt || '')
      setStyle(item.style || 'auto')
      setDuration(item.duration || 20)
      setRatio(item.ratio || '16:9')
      setExtras(item.extras || '')
      setToast?.({ title: 'Template dipasang', body: 'Ubah prompt-nya — hasil baru akan berbeda.', type: 'info' })
    } catch (err) {
      setError(`Gagal memuat template: ${err.message}`)
    } finally { setTemplateLoading(false) }
  }

  const delChat = (id) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id)
      persistChats(uid, next)
      if (activeId === id) setActiveId(next[0]?.id || null)
      return next
    })
  }

  const copyHtml = async (item) => {
    try {
      const html = await fetchMotionHtml(item)
      await navigator.clipboard.writeText(html)
      setToast?.({ title: 'HTML disalin', type: 'info' })
    } catch (err) { setError(err.message) }
  }

  const srcFor = (item) => resultSrcs.current[item.id] || item.url || ''

  return (
    <div className="bm-chat">
      {/* ---------- Sidebar riwayat ---------- */}
      <aside className="bm-history">
        <div className="bm-history-head">
          <Clapperboard size={17} />
          <strong>Bang Motion</strong>
          <button className="storage-mini-btn" title="Chat baru" onClick={startNewChat}><Plus size={14} /></button>
        </div>
        {!chats.length && <div className="bm-history-empty">Belum ada chat.</div>}
        <div className="bm-history-list">
          {chats.map((c) => (
            <div key={c.id} className={`bm-history-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
              <MessageSquare size={13} />
              <span>{c.title || 'Chat baru'}</span>
              <small>{new Date(c.createdAt).toLocaleDateString('id-ID')}</small>
              <button className="bm-history-del" title="Hapus" onClick={(e) => { e.stopPropagation(); delChat(c.id) }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
        <div className="bm-history-foot">
          {providers !== null && providers.length > 0 && (
            <select className="input" value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name || p.provider_id} · {p.model}</option>
              ))}
            </select>
          )}
          {noProvider && (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCurrentPage('settings')}>
              <Wand2 size={14} /> Daftarkan Provider AI
            </button>
          )}
        </div>
      </aside>

      {/* ---------- Area chat ---------- */}
      <section className="bm-main">
        <div className="bm-chat-head">
          <Film size={16} />
          <strong>{active?.title || 'Bang Motion'}</strong>
          <small>motion graphics → HTML → B2 · prompt → Neon</small>
        </div>

        <div className="bm-messages" ref={scrollRef}>
          {!active || active.messages.length === 0 ? (
            <div className="bm-hello">
              <Clapperboard size={40} />
              <p>Halo! Tulis prompt di bawah — misal <strong>"opener 20 detik untuk aplikasi catatan Nota"</strong>. Hasil diputar di sini, tersimpan ke B2, dan prompt tercatat di Neon.</p>
            </div>
          ) : active.messages.map((m) => (
            m.role === 'user' ? (
              <div key={m.id} className="bm-bubble user">
                <div className="bm-bubble-text">{m.text}</div>
                <div className="bm-bubble-meta">{m.duration}s · {m.ratio} · {m.style}</div>
              </div>
            ) : (
              <div key={m.id} className="bm-bubble assistant">
                {m.status && <div className="bm-status"><Loader2 size={14} className="spin" /> {m.status}</div>}
                {m.error && <div className="gmail-error"><AlertTriangle size={14} /> {m.error}</div>}
                {m.item && (
                  <div className="bm-result-card">
                    <iframe
                      className="bm-frame"
                      title={m.item.title || 'motion'}
                      src={srcFor(m.item) || undefined}
                      sandbox="allow-scripts" allow="autoplay"
                      style={{ aspectRatio: m.item.ratio === '9:16' ? '9/16' : m.item.ratio === '1:1' ? '1/1' : '16/9' }}
                    />
                    <div className="bm-result-meta">
                      <strong>{m.item.title}</strong>
                      <small>{m.item.provider} · {new Date(m.item.createdAt).toLocaleString('id-ID')}{m.b2Note ? ` · ⚠ B2: ${m.b2Note}` : ''}</small>
                      <div className="bm-result-actions">
                        <button className="bm-use-btn" onClick={() => handleRenderMp4(m.item)} disabled={renderingId === m.item.id}>
                          {renderingId === m.item.id ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                          Unduh Video (MP4)
                        </button>
                        {m.item.videoUrl && (
                          <a className="storage-mini-btn" title="Buka MP4 di B2" href={m.item.videoUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>
                        )}
                        <button className="storage-mini-btn" title="Salin HTML" onClick={() => copyHtml(m.item)}><Copy size={13} /></button>
                        <a className="storage-mini-btn" title="Buka HTML di tab baru" href={srcFor(m.item)} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a>
                        <button className="bm-use-btn" onClick={() => useTemplate(m.item)} disabled={templateLoading}>
                          {templateLoading ? <Loader2 size={13} className="spin" /> : <LayoutTemplate size={13} />} Gunakan (template)
                        </button>
                      </div>
                      {m.item.videoUrl && (
                        <small className="bm-video-note">MP4 tersimpan: {m.item.videoName} <a href={m.item.videoUrl} target="_blank" rel="noreferrer">B2</a></small>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          ))}
        </div>

        {/* ---------- Composer ---------- */}
        <form className="bm-composer" onSubmit={handleSend}>
          {menuOpen && (
            <div className="bm-pop">
              <div className="bm-pop-row">
                <label>Gaya visual</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}>
                  {STYLE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="bm-pop-row">
                <label>Durasi</label>
                <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} detik</option>)}
                </select>
              </div>
              <div className="bm-pop-row">
                <label>Aspek</label>
                <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
                  {RATIOS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="bm-pop-row col">
                <label>Arah tambahan (opsional)</label>
                <input value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="mis. warna dominan merah, font Bebas Neue, ada statistik angka" />
              </div>
            </div>
          )}
          {error && <div className="gmail-error bm-composer-error"><AlertTriangle size={14} /> {error}</div>}
          <div className="bm-composer-bar">
            <button
              type="button" className={`bm-dots ${menuOpen ? 'open' : ''}`}
              title="Pengaturan motion" onClick={() => setMenuOpen((o) => !o)}
            >
              <MoreHorizontal size={18} />
            </button>
            <textarea
              className="bm-input" rows={1}
              placeholder="Tulis prompt motion graphics… (Enter kirim)"
              value={prompt}
              onChange={(e) => { setPrompt(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
            />
            <button type="submit" className="bm-send" disabled={generating} title="Kirim">
              {generating ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
            </button>
          </div>
          {template && (
            <div className="bm-template-chip">
              <LayoutTemplate size={13} />
              Template: <strong>{template.title || 'hasil lama'}</strong>
              <button type="button" className="bm-chip-x" onClick={() => setTemplate(null)}>×</button>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

// Base64 helper (Uint8Array → base64, aman file besar via chunk).
function b64Encode(bytes) {
  let bin = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}
