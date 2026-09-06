import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HardDrive, RefreshCw, Upload, FolderPlus, Folder, FileText, Download,
  Trash2, Star, Share2, ExternalLink, Pencil, Search, AlertTriangle,
  Loader2, Info, LogOut, ChevronRight, X,
} from 'lucide-react'
import useGoogleAuth from '../hooks/useGoogleAuth'
import GoogleLoginGate from '../components/GoogleLoginGate'
import {
  DRIVE_PAGE_SCOPES, getStorageInfo, listFiles, createFolder, uploadResumable,
  downloadFile, renameFile, setStarred, trashFile, shareFile, listPermissions,
  removePermission, formatBytes,
} from '../services/driveApi'
import './GooglePages.css'
import './google-native.css'

// =====================================================================
// DrivePage â€” Google Drive API v3.
// =====================================================================
// Scope yang dipakai: drive.file. Artinya halaman ini HANYA melihat file
// yang dibuat atau diunggah lewat Luxio, bukan seluruh isi Drive user.
// Itu keputusan sadar: scope 'drive'/'drive.readonly' berstatus restricted
// dan mewajibkan security assessment (CASA) tahunan berbiaya dari Google.
//
// Dokumentasi: koleksi dokumentasi api/google api/drive-docs/
// =====================================================================

const PERM_LIST = [
  'Membuat folder dan mengunggah file dari Luxio ke Drive kamu',
  'Membaca, mengunduh, dan mengubah nama file yang dibuat lewat Luxio',
  'Membagikan file tersebut ke rekan tim atas perintah kamu',
  'Melihat sisa kuota penyimpanan Drive',
]

const fmtDate = (iso) => {
  if (!iso) return 'â€”'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return 'â€”' }
}

export default function DrivePage() {
  const auth = useGoogleAuth(DRIVE_PAGE_SCOPES)

  const [storage, setStorage] = useState(null)
  const [files, setFiles] = useState([])
  const [nextPageToken, setNextPageToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  // Tumpukan folder: [{ id, name }] â€” elemen terakhir = folder aktif.
  const [crumbs, setCrumbs] = useState([])
  const [uploadPct, setUploadPct] = useState(-1)
  const [shareTarget, setShareTarget] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('reader')
  const [sharePerms, setSharePerms] = useState([])
  const fileInputRef = useRef(null)

  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const currentFolder = crumbs.length ? crumbs[crumbs.length - 1].id : ''

  const load = useCallback(async ({ append = false, token = '' } = {}) => {
    setLoading(true)
    setError('')
    try {
      const res = await listFiles({ folderId: currentFolder, q: query.trim(), pageToken: token })
      setFiles((prev) => (append ? [...prev, ...res.files] : res.files))
      setNextPageToken(res.nextPageToken)
    } catch (e) {
      setError(e.message || 'Gagal memuat daftar file Drive.')
    } finally {
      setLoading(false)
    }
  }, [currentFolder, query])

  const loadStorage = useCallback(async () => {
    try { setStorage(await getStorageInfo()) } catch { /* kuota opsional */ }
  }, [])

  useEffect(() => {
    if (!auth.ready) return
    load()
    loadStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.ready, currentFolder])

  const onSearch = (e) => {
    e.preventDefault()
    load()
  }

  const openFolder = (f) => setCrumbs((c) => [...c, { id: f.id, name: f.name }])
  const gotoCrumb = (idx) => setCrumbs((c) => c.slice(0, idx + 1))

  const onUploadPick = () => fileInputRef.current?.click()

  const onUploadChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadPct(0)
    setError('')
    try {
      await uploadResumable(file, { parentId: currentFolder, onProgress: setUploadPct })
      showToast(`"${file.name}" berhasil diunggah.`)
      await load()
      await loadStorage()
    } catch (err) {
      setError(err.message || 'Unggah gagal.')
    } finally {
      setUploadPct(-1)
    }
  }

  const onNewFolder = async () => {
    const name = window.prompt('Nama folder baru:')
    if (!name?.trim()) return
    try {
      await createFolder(name.trim(), currentFolder)
      showToast(`Folder "${name.trim()}" dibuat.`)
      load()
    } catch (err) { setError(err.message || 'Gagal membuat folder.') }
  }

  const onDownload = async (f) => {
    try {
      showToast(`Mengunduh "${f.name}"...`)
      const blob = await downloadFile(f.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = f.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) { setError(err.message || 'Unduh gagal. File Google Docs perlu diekspor, bukan diunduh langsung.') }
  }

  const onRename = async (f) => {
    const name = window.prompt('Nama baru:', f.name)
    if (!name?.trim() || name === f.name) return
    try {
      const updated = await renameFile(f.id, name.trim())
      setFiles((prev) => prev.map((x) => (x.id === f.id ? updated : x)))
      showToast('Nama diperbarui.')
    } catch (err) { setError(err.message || 'Gagal mengubah nama.') }
  }

  const onToggleStar = async (f) => {
    try {
      const updated = await setStarred(f.id, !f.starred)
      setFiles((prev) => prev.map((x) => (x.id === f.id ? updated : x)))
    } catch (err) { setError(err.message || 'Gagal mengubah tanda bintang.') }
  }

  const onTrash = async (f) => {
    if (!window.confirm(`Pindahkan "${f.name}" ke tempat sampah Drive?`)) return
    try {
      await trashFile(f.id)
      setFiles((prev) => prev.filter((x) => x.id !== f.id))
      showToast('Dipindahkan ke tempat sampah.')
      loadStorage()
    } catch (err) { setError(err.message || 'Gagal memindahkan ke tempat sampah.') }
  }

  const openShare = async (f) => {
    setShareTarget(f)
    setShareEmail('')
    setShareRole('reader')
    setSharePerms([])
    try { setSharePerms(await listPermissions(f.id)) } catch { /* abaikan */ }
  }

  const onShare = async () => {
    if (!shareEmail.trim()) return
    try {
      await shareFile(shareTarget.id, { type: 'user', role: shareRole, emailAddress: shareEmail.trim() })
      showToast(`Dibagikan ke ${shareEmail.trim()}.`)
      setSharePerms(await listPermissions(shareTarget.id))
      setShareEmail('')
    } catch (err) { setError(err.message || 'Gagal membagikan file.') }
  }

  const onRemovePerm = async (permId) => {
    try {
      await removePermission(shareTarget.id, permId)
      setSharePerms((prev) => prev.filter((p) => p.id !== permId))
    } catch (err) { setError(err.message || 'Gagal mencabut izin.') }
  }

  // ---------- Gate ----------
  if (!auth.configured || !auth.ready) {
    return (
      <div className="drive-page">
        <GoogleLoginGate
          icon={HardDrive}
          color="#1A73E8"
          title="Hubungkan Google Drive"
          desc="Simpan lampiran project langsung ke Drive kamu dan bagikan ke tim tanpa keluar dari Luxio."
          perms={PERM_LIST}
          note="Luxio memakai scope drive.file: hanya file yang dibuat atau diunggah lewat Luxio yang bisa diakses. File lain di Drive kamu tetap tidak terlihat oleh aplikasi ini."
          error={!auth.configured
            ? 'VITE_GOOGLE_CLIENT_ID belum diatur, jadi login Google belum bisa dipakai.'
            : auth.error}
          busy={auth.busy}
          onLogin={auth.login}
        />
      </div>
    )
  }

  const usedPct = storage?.limit ? Math.min(100, (storage.usage / storage.limit) * 100) : 0

  return (
    <div className="drive-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>
            <HardDrive size={22} style={{ color: '#1A73E8' }} /> Google Drive
          </h1>
          <p>{auth.email ? `Masuk sebagai ${auth.email}` : 'Kelola file Drive dari Luxio'}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={() => load()} title="Muat ulang" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'gp-spin' : ''} />
          </button>
          <button className="btn btn-secondary" onClick={onNewFolder} title="Folder baru">
            <FolderPlus size={16} />
          </button>
          <button className="btn btn-ghost" onClick={auth.logout} title="Cabut akses Drive">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <button
        className="g-fab"
        onClick={onUploadPick}
        disabled={uploadPct >= 0}
        title="Unggah file ke Drive"
      >
        <Upload size={20} /> Unggah
      </button>

      <input ref={fileInputRef} type="file" onChange={onUploadChange} style={{ display: 'none' }} />

      {error && (
        <div className="gp-error">
          <AlertTriangle size={15} /> <span>{error}</span>
        </div>
      )}

      <div className="gp-notice">
        <Info size={15} />
        <span>
          Daftar di bawah hanya memuat file yang dibuat atau diunggah lewat Luxio (scope
          <strong> drive.file</strong>). Ini disengaja agar aplikasi tidak perlu izin baca
          seluruh Drive yang tergolong <em>restricted scope</em> di Google.
        </span>
      </div>

      {storage && (
        <div className="gp-stats">
          <div className="gp-stat">
            <div className="gp-stat-label">Terpakai</div>
            <div className="gp-stat-value">{formatBytes(storage.usage)}</div>
            <div className="gp-stat-sub">
              dari {storage.limit ? formatBytes(storage.limit) : 'tanpa batas'}
            </div>
            {storage.limit > 0 && (
              <div className="gp-progress">
                <div className="gp-progress-fill" style={{ width: `${usedPct}%` }} />
              </div>
            )}
          </div>
          <div className="gp-stat">
            <div className="gp-stat-label">Di Drive</div>
            <div className="gp-stat-value">{formatBytes(storage.usageInDrive)}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat-label">Di sampah</div>
            <div className="gp-stat-value">{formatBytes(storage.usageInTrash)}</div>
          </div>
          <div className="gp-stat">
            <div className="gp-stat-label">Item terlihat</div>
            <div className="gp-stat-value">{files.length}</div>
            <div className="gp-stat-sub">file & folder milik Luxio</div>
          </div>
        </div>
      )}

      {uploadPct >= 0 && (
        <div className="gp-panel">
          <div className="gp-panel-body">
            <div style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Mengunggah...</span>
              <strong>{uploadPct}%</strong>
            </div>
            <div className="gp-progress">
              <div className="gp-progress-fill" style={{ width: `${uploadPct}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="gp-crumbs">
        <button className={crumbs.length === 0 ? 'current' : ''} onClick={() => setCrumbs([])}>
          Akar Luxio
        </button>
        {crumbs.map((c, i) => (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <ChevronRight size={12} />
            <button className={i === crumbs.length - 1 ? 'current' : ''} onClick={() => gotoCrumb(i)}>
              {c.name}
            </button>
          </span>
        ))}
      </div>

      <form className="gp-toolbar" onSubmit={onSearch}>
        <div className="gp-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama file..."
            aria-label="Cari file Drive"
          />
        </div>
        <button className="btn btn-secondary" type="submit" disabled={loading}>Cari</button>
        {query && (
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => { setQuery(''); setTimeout(load, 0) }}
          >
            Reset
          </button>
        )}
      </form>

      <div className="gp-panel">
        <div className="gp-panel-body flush">
          {loading && files.length === 0 ? (
            <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Memuat file...</div>
          ) : files.length === 0 ? (
            <div className="gp-empty">
              <Folder size={26} />
              Belum ada file di sini. Unggah file pertama lewat tombol Unggah.
            </div>
          ) : (
            files.map((f) => (
              <div key={f.id} className={`gp-row ${f.isFolder ? 'clickable' : ''}`}>
                <div
                  className="gp-row-icon"
                  onClick={f.isFolder ? () => openFolder(f) : undefined}
                >
                  {f.isFolder ? <Folder size={17} /> : <FileText size={17} />}
                </div>
                <div className="gp-row-main" onClick={f.isFolder ? () => openFolder(f) : undefined}>
                  <div className="gp-row-title">
                    {f.name}
                    {f.starred && <Star size={11} style={{ marginLeft: 6, color: '#FBBF24' }} />}
                    {f.shared && <span className="gp-chip" style={{ marginLeft: 6 }}>dibagikan</span>}
                  </div>
                  <div className="gp-row-sub">
                    {f.isFolder ? 'Folder' : formatBytes(f.size)} &middot; diubah {fmtDate(f.modifiedTime)}
                  </div>
                </div>
                <div className="gp-row-actions">
                  {f.webViewLink && (
                    <a
                      className="btn btn-ghost"
                      href={f.webViewLink}
                      target="_blank"
                      rel="noopener"
                      title="Buka di Drive"
                      style={{ padding: '5px 7px' }}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {!f.isFolder && (
                    <button onClick={() => onDownload(f)} title="Unduh"><Download size={14} /></button>
                  )}
                  <button onClick={() => openShare(f)} title="Bagikan"><Share2 size={14} /></button>
                  <button onClick={() => onToggleStar(f)} title="Tanda bintang"><Star size={14} /></button>
                  <button onClick={() => onRename(f)} title="Ubah nama"><Pencil size={14} /></button>
                  <button className="danger" onClick={() => onTrash(f)} title="Tempat sampah">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {nextPageToken && (
        <button
          className="btn btn-secondary"
          onClick={() => load({ append: true, token: nextPageToken })}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="gp-spin" /> : null} Muat lebih banyak
        </button>
      )}

      {shareTarget && (
        <div className="gp-modal-overlay" onClick={() => setShareTarget(null)}>
          <div className="gp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gp-modal-header">
              <h2><Share2 size={16} /> Bagikan "{shareTarget.name}"</h2>
              <button className="gp-modal-close" onClick={() => setShareTarget(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            <div className="gp-modal-body">
              <label className="input-label" htmlFor="share-email">Email penerima</label>
              <input
                id="share-email"
                className="input"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="rekan@contoh.com"
              />
              <label className="input-label" htmlFor="share-role" style={{ marginTop: 12 }}>Hak akses</label>
              <select
                id="share-role"
                className="input"
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
              >
                <option value="reader">Hanya melihat</option>
                <option value="commenter">Boleh berkomentar</option>
                <option value="writer">Boleh mengedit</option>
              </select>

              {sharePerms.length > 0 && (
                <>
                  <div className="input-label" style={{ marginTop: 16 }}>Sudah punya akses</div>
                  {sharePerms.map((p) => (
                    <div key={p.id} className="gp-row" style={{ padding: '8px 0' }}>
                      <div className="gp-row-main">
                        <div className="gp-row-title">{p.emailAddress || p.displayName || p.domain || p.type}</div>
                        <div className="gp-row-sub">{p.role}</div>
                      </div>
                      {p.role !== 'owner' && (
                        <div className="gp-row-actions">
                          <button className="danger" onClick={() => onRemovePerm(p.id)} title="Cabut akses">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="gp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShareTarget(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={onShare} disabled={!shareEmail.trim()}>
                <Share2 size={14} /> Bagikan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="gp-toast">{toast}</div>}
    </div>
  )
}
