// =====================================================================
// BloggerPage.jsx — Halaman Blogger (OAuth Google, kelola blog).
// =====================================================================
// Login: tombol "Login dengan Blogger" (popup OAuth GIS, scope blogger).
// Setelah login: pilih blog, kelola post (buat/edit/hapus, publish/ke
// draft), lihat halaman statis, moderasi komentar (setujui/spam/hapus),
// dan buka blog di tab baru.
// =====================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  isGoogleConfigured, requestGoogleToken, clearGoogleTokens,
  GOOGLE_SCOPES, fetchGoogleUserInfo,
} from '../services/googleAuth'
import {
  listBlogs, listPosts, getPost, createPost, updatePost, publishPost,
  revertPost, deletePost, listPages, listComments,
  approveComment, markCommentSpam, deleteComment, deleteCommentContent,
} from '../services/bloggerApi'
import {
  Rss, RefreshCw, Search, Plus, Pencil, Trash2, Send, Undo2, ExternalLink,
  LogIn, LogOut, FileText, MessageSquare, AlertTriangle, Globe, Loader2,
  Check, Ban, X, Eye, Tags,
} from 'lucide-react'
import './BloggerPage.css'

const STATUS_TABS = [
  { id: 'live', name: 'Terbit' },
  { id: 'draft', name: 'Draft' },
  { id: 'scheduled', name: 'Terjadwal' },
  { id: 'all', name: 'Semua' },
]

export default function BloggerPage() {
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef(null)
  const showToast = (msg) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2500)
  }

  const [auth, setAuth] = useState({ state: 'idle', email: '' })
  const [authError, setAuthError] = useState('')
  const [blogs, setBlogs] = useState([])
  const [activeBlog, setActiveBlog] = useState(null)
  const [tab, setTab] = useState('posts') // posts | pages | comments
  const [status, setStatus] = useState('live')
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState([])
  const [pages, setPages] = useState([])
  const [comments, setComments] = useState([])
  const [nextPageToken, setNextPageToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null) // { id?, title, content, labels, isDraft }

  const login = useCallback(async () => {
    setAuth({ state: 'busy', email: '' })
    setAuthError('')
    try {
      const entry = await requestGoogleToken({ scopes: [...GOOGLE_SCOPES.BLOGGER, ...GOOGLE_SCOPES.PROFILE] })
      const info = await fetchGoogleUserInfo([...GOOGLE_SCOPES.BLOGGER, ...GOOGLE_SCOPES.PROFILE]).catch(() => null)
      setAuth({ state: 'ok', email: info?.email || entry.email || '' })
      showToast(info?.email ? `Blogger terhubung: ${info.email}` : 'Blogger terhubung.')
    } catch (e) {
      setAuthError(e.code === 'NOT_CONFIGURED'
        ? 'Integrasi Google belum aktif di sesi browser ini. Lakukan hard refresh (Ctrl+Shift+R) untuk memuat konfigurasi terbaru.'
        : (e.message || 'Login gagal.'))
      setAuth({ state: 'error', email: '' })
    }
  }, [showToast])

  const logout = async () => {
    clearGoogleTokens()
    setAuth({ state: 'idle', email: '' })
    setBlogs([]); setActiveBlog(null); setPosts([]); setPages([]); setComments([])
  }

  useEffect(() => {
    const cached = sessionStorage.getItem('luxio_google_tokens')
    if (cached && isGoogleConfigured()) login()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Muat daftar blog setelah login.
  useEffect(() => {
    if (auth.state !== 'ok') return
    let cancelled = false
    (async () => {
      setLoading(true); setError('')
      try {
        const list = await listBlogs()
        if (cancelled) return
        setBlogs(list)
        setActiveBlog((cur) => cur || list[0] || null)
        if (!list.length) setError('Tidak ada blog pada akun ini. Buat blog dulu di blogger.com.')
      } catch (e) {
        if (!cancelled) setError(e.message || 'Gagal memuat daftar blog.')
      } finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [auth.state])

  const loadPosts = useCallback(async ({ append = false, token = '' } = {}) => {
    if (!activeBlog) return
    setLoading(true); setError('')
    try {
      const data = await listPosts(activeBlog.id, { status, max: 25, pageToken: token })
      const q = search.trim().toLowerCase()
      const filtered = q
        ? data.posts.filter((p) => p.title.toLowerCase().includes(q) || p.labels.some((l) => l.toLowerCase().includes(q)))
        : data.posts
      setPosts((prev) => (append ? [...prev, ...filtered] : filtered))
      setNextPageToken(data.nextPageToken)
    } catch (e) {
      setError(e.message || 'Gagal memuat post.')
    } finally { setLoading(false) }
  }, [activeBlog, status, search])

  const loadPages = useCallback(async () => {
    if (!activeBlog) return
    setLoading(true); setError('')
    try { setPages(await listPages(activeBlog.id)) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [activeBlog])

  const loadComments = useCallback(async () => {
    if (!activeBlog) return
    setLoading(true); setError('')
    try {
      const data = await listComments(activeBlog.id, { max: 50 })
      setComments(data.comments)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [activeBlog])

  useEffect(() => {
    if (auth.state !== 'ok' || !activeBlog) return
    if (tab === 'posts') loadPosts()
    else if (tab === 'pages') loadPages()
    else if (tab === 'comments') loadComments()
  }, [auth.state, activeBlog, tab, status, loadPosts, loadPages, loadComments])

  const refreshCounts = async () => {
    try {
      const list = await listBlogs()
      setBlogs(list)
      setActiveBlog((cur) => list.find((b) => b.id === cur?.id) || cur)
    } catch { /* abaikan */ }
  }

  // ---------- Aksi post ----------
  const handleSave = async (override = {}) => {
    const data = { ...editor, ...override }
    if (!data) return
    setLoading(true)
    try {
      const labels = (data.labels || '').split(',').map((s) => s.trim()).filter(Boolean)
      if (data.id) {
        await updatePost(activeBlog.id, data.id, { title: data.title, content: data.content, labels })
        showToast('Post diperbarui.')
      } else {
        await createPost(activeBlog.id, { title: data.title, content: data.content, labels, isDraft: data.isDraft })
        showToast(data.isDraft ? 'Draft post tersimpan.' : 'Post diterbitkan.')
      }
      setEditor(null)
      await loadPosts()
      await refreshCounts()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handlePublish = async (p) => {
    setLoading(true)
    try { await publishPost(activeBlog.id, p.id); showToast('Post diterbitkan.'); await loadPosts(); await refreshCounts() }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleRevert = async (p) => {
    setLoading(true)
    try { await revertPost(activeBlog.id, p.id); showToast('Post dikembalikan ke draft.'); await loadPosts(); await refreshCounts() }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleDeletePost = async (p) => {
    if (!window.confirm(`Hapus post "${p.title}"? Tindakan ini permanen.`)) return
    setLoading(true)
    try { await deletePost(activeBlog.id, p.id); showToast('Post dihapus.'); await loadPosts(); await refreshCounts() }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // ---------- Moderasi komentar ----------
  const commentAction = (fn, msg) => async (c) => {
    try { await fn(activeBlog.id, c.postId, c.id); showToast(msg); await loadComments(); await refreshCounts() }
    catch (e) { setError(e.message) }
  }

  if (!isGoogleConfigured() || auth.state !== 'ok') {
    return (
      <div className="blogger-page">
        <LoginGate
          error={!isGoogleConfigured()
            ? 'Integrasi Google belum aktif di sesi browser ini. Lakukan hard refresh (Ctrl+Shift+R) untuk memuat konfigurasi terbaru, lalu klik tombol di bawah untuk menghubungkan Blogger.'
            : authError}
          onLogin={login}
          busy={auth.state === 'busy'}
        />
      </div>
    )
  }

  return (
    <div className="blogger-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1><Rss size={20} style={{ color: '#FF8000', verticalAlign: '-3px' }} /> Blogger</h1>
          <p>{auth.email ? `Masuk sebagai ${auth.email}` : 'Kelola blog kamu'}{activeBlog ? ` — ${activeBlog.name}` : ''}</p>
        </div>
        <div className="page-header-right">
          {activeBlog && (
            <button className="btn btn-secondary" onClick={() => window.open(activeBlog.url, '_blank')}>
              <ExternalLink size={14} /> Buka Blog
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => { tab === 'posts' ? loadPosts() : tab === 'pages' ? loadPages() : loadComments() }} disabled={loading || !activeBlog}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat ulang
          </button>
          <button className="btn btn-primary" onClick={() => setEditor({ title: '', content: '', labels: '', isDraft: false })} disabled={!activeBlog}>
            <Plus size={14} /> Post Baru
          </button>
          <button className="btn btn-ghost" onClick={logout} title="Keluar"><LogOut size={14} /></button>
        </div>
      </div>

      {blogs.length > 1 && (
        <div className="blogger-blogs">
          {blogs.map((b) => (
            <button
              key={b.id}
              className={`blogger-blog-chip ${activeBlog?.id === b.id ? 'active' : ''}`}
              onClick={() => { setActiveBlog(b); setPosts([]) }}
            >
              <Globe size={13} /> {b.name}
              <small>{b.posts} post</small>
            </button>
          ))}
        </div>
      )}

      <div className="blogger-toolbar">
        <div className="blogger-tabs">
          <button className={`blogger-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}><FileText size={14} /> Post</button>
          <button className={`blogger-tab ${tab === 'pages' ? 'active' : ''}`} onClick={() => setTab('pages')}><Eye size={14} /> Halaman</button>
          <button className={`blogger-tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}><MessageSquare size={14} /> Komentar</button>
        </div>
        {tab === 'posts' && (
          <>
            <div className="blogger-status">
              {STATUS_TABS.map((s) => (
                <button key={s.id} className={`blogger-status-btn ${status === s.id ? 'active' : ''}`} onClick={() => setStatus(s.id)}>
                  {s.name}
                </button>
              ))}
            </div>
            <form className="blogger-search" onSubmit={(e) => { e.preventDefault(); loadPosts() }}>
              <Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari post…" />
            </form>
          </>
        )}
      </div>

      {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}

      {/* ---- POST ---- */}
      {tab === 'posts' && (
        <div className="blogger-posts">
          {loading && !posts.length && <div className="gmail-empty"><Loader2 size={22} className="spin" /> Memuat post…</div>}
          {!loading && !posts.length && !error && (
            <div className="gmail-empty"><FileText size={26} /> Belum ada post pada filter ini.</div>
          )}
          {posts.map((p) => (
            <div key={p.id} className="blogger-post-card">
              <div className="blogger-post-main">
                <div className="blogger-post-title-row">
                  <h3>{p.title}</h3>
                  <span className={`blogger-badge ${p.status?.toLowerCase()}`}>{p.status === 'LIVE' ? 'TERBIT' : p.status === 'DRAFT' ? 'DRAFT' : p.status}</span>
                </div>
                {p.labels.length > 0 && (
                  <div className="blogger-post-labels">
                    <Tags size={12} /> {p.labels.join(', ')}
                  </div>
                )}
                <div className="blogger-post-meta">
                  <span>{p.published ? new Date(p.published).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  <span>·</span>
                  <span>{p.comments} komentar</span>
                  {p.url && (
                    <a href={p.url} target="_blank" rel="noreferrer" className="blogger-post-link"><ExternalLink size={11} /> lihat</a>
                  )}
                </div>
              </div>
              <div className="blogger-post-actions">
                <button title="Edit" onClick={() => setEditor({ id: p.id, title: p.title, content: p.content, labels: p.labels.join(', '), isDraft: p.status === 'DRAFT' })}><Pencil size={15} /></button>
                {p.status === 'DRAFT' && <button title="Terbitkan" onClick={() => handlePublish(p)}><Send size={15} /></button>}
                {p.status === 'LIVE' && <button title="Jadikan draft" onClick={() => handleRevert(p)}><Undo2 size={15} /></button>}
                <button title="Hapus" className="danger" onClick={() => handleDeletePost(p)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          {nextPageToken && (
            <button className="btn btn-secondary blogger-more" disabled={loading} onClick={() => loadPosts({ append: true, token: nextPageToken })}>
              {loading ? 'Memuat…' : 'Muat lebih banyak'}
            </button>
          )}
        </div>
      )}

      {/* ---- PAGES ---- */}
      {tab === 'pages' && (
        <div className="blogger-posts">
          {loading && !pages.length && <div className="gmail-empty"><Loader2 size={22} className="spin" /> Memuat halaman…</div>}
          {!loading && !pages.length && !error && <div className="gmail-empty"><Eye size={26} /> Belum ada halaman statis.</div>}
          {pages.map((pg) => (
            <div key={pg.id} className="blogger-post-card">
              <div className="blogger-post-main">
                <div className="blogger-post-title-row">
                  <h3>{pg.title}</h3>
                  <span className={`blogger-badge ${pg.status?.toLowerCase()}`}>{pg.status}</span>
                </div>
                <div className="blogger-post-meta">
                  {pg.published && <span>{new Date(pg.published).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {pg.url && <a href={pg.url} target="_blank" rel="noreferrer" className="blogger-post-link"><ExternalLink size={11} /> lihat</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- COMMENTS ---- */}
      {tab === 'comments' && (
        <div className="blogger-posts">
          {loading && !comments.length && <div className="gmail-empty"><Loader2 size={22} className="spin" /> Memuat komentar…</div>}
          {!loading && !comments.length && !error && <div className="gmail-empty"><MessageSquare size={26} /> Belum ada komentar.</div>}
          {comments.map((c) => (
            <div key={c.id} className="blogger-comment-card">
              <div className="blogger-comment-head">
                <strong>{c.author}</strong>
                <span>{new Date(c.published).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {c.status !== 'LIVE' && <span className={`blogger-badge ${c.status?.toLowerCase()}`}>{c.status}</span>}
              </div>
              <div className="blogger-comment-body" dangerouslySetInnerHTML={{ __html: c.content }} />
              <div className="blogger-post-actions">
                {c.status !== 'LIVE' && (
                  <button title="Setujui" onClick={commentAction(approveComment, 'Komentar disetujui.')(c)}><Check size={15} /></button>
                )}
                <button title="Tandai spam" onClick={commentAction(markCommentSpam, 'Komentar ditandai spam.')(c)}><Ban size={15} /></button>
                <button title="Hapus isi" onClick={commentAction(deleteCommentContent, 'Isi komentar dihapus.')(c)}><X size={15} /></button>
                <button title="Hapus" className="danger" onClick={() => { if (window.confirm('Hapus komentar ini?')) commentAction(deleteComment, 'Komentar dihapus.')(c) }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Editor post (modal) ---- */}
      {editor && (
        <div className="modal-overlay" onClick={() => setEditor(null)}>
          <div className="modal blogger-editor" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editor.id ? 'Edit Post' : editor.isDraft ? 'Draft Post Baru' : 'Post Baru'}</h2>
              <button className="close-btn" onClick={() => setEditor(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Judul</label>
                <input className="input" value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} autoFocus />
              </div>
              <div className="input-group">
                <label className="input-label">Label (pisahkan dengan koma)</label>
                <input className="input" value={editor.labels} onChange={(e) => setEditor({ ...editor, labels: e.target.value })} placeholder="teknologi, tutorial" />
              </div>
              <div className="input-group">
                <label className="input-label">Konten (HTML)</label>
                <textarea className="input blogger-editor-content" rows={14} value={editor.content} onChange={(e) => setEditor({ ...editor, content: e.target.value })} placeholder="<p>Tulis konten di sini…</p>" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditor(null)}>Batal</button>
              {!editor.id && (
                <button className="btn btn-secondary" disabled={!editor.title.trim() || loading} onClick={() => handleSave({ isDraft: true })}>
                  Simpan Draft
                </button>
              )}
              <button className="btn btn-primary" disabled={!editor.title.trim() || loading} onClick={() => handleSave()}>
                <Send size={15} /> {editor.id ? 'Simpan Perubahan' : 'Terbitkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="gmail-toast">{toastMsg}</div>}
    </div>
  )
}

/* ---------- Gate login ---------- */

function LoginGate({ error, onLogin, busy }) {
  return (
    <div className="gmail-login-gate">
      <div className="gmail-login-card">
        <div className="gmail-login-logo blogger"><Rss size={34} /></div>
        <h2>Blogger untuk Luxio</h2>
        <p>
          Hubungkan akun Google untuk menulis, menerbitkan, dan memoderasi
          komentar blog kamu langsung dari Luxio.
        </p>
        <ul className="gmail-login-perms">
          <li><FileText size={14} /> Buat &amp; edit post/halaman</li>
          <li><Send size={14} /> Terbitkan atau jadikan draft</li>
          <li><MessageSquare size={14} /> Moderasi komentar</li>
        </ul>
        {error && <div className="gmail-error"><AlertTriangle size={15} /> {error}</div>}
        <button className="btn btn-primary gmail-login-btn" onClick={onLogin} disabled={busy}>
          {busy ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
          {busy ? 'Menunggu Google…' : 'Login dengan Blogger'}
        </button>
        <small className="gmail-login-note">
          Autentikasi resmi via Google (OAuth 2.0). Token disimpan hanya di browser kamu.
        </small>
      </div>
    </div>
  )
}
