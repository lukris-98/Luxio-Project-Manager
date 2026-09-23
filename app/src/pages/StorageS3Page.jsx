// =====================================================================
// StorageS3Page.jsx — File Manager Neon Object Storage (S3-compatible).
// =====================================================================
// Kelola file yang tersimpan di bucket `luxio` prefix `luxio/`, dengan
// pengalaman ala Google Drive:
//   - ANTRIAN TRANSFER: upload & download masuk antrian (3 paralel),
//     ada progress bar per item, pause/resume/cancel, retry otomatis,
//     dan panel antrian yang bisa dibuka/tutup.
//   - FILTERING HANDAL: pencarian teks (nama), filter kategori (folder),
//     filter user, filter tipe file, filter ukuran, filter tanggal,
//     sorting multi-kolom, tampilan grid/daftar.
// Semua operasi lewat backend (`/api/owner/s3/*`) supaya kredensial
// S3 tidak pernah terexpose ke browser.
// =====================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FolderOpen, UploadCloud, Download, Trash2, RefreshCw, Loader2,
  FileText, File, Image as ImageIcon, Table, Presentation, Shield,
  CheckCircle2, AlertCircle, Search, X, Pause, Play, ListChecks,
  Grid2x2, List, ArrowUpDown, Music, Video, Code2,
  Ban, RotateCcw, ChevronDown, FileArchive, Eye, Filter,
  FolderPlus, Folder as FolderIcon, ChevronRight, SquareCheck,
} from 'lucide-react'
import { api } from '../services/api'
import { useStore } from '../store/useStore'
import * as queue from '../services/s3TransferQueue'
import './StorageS3Page.css'

const fmtBytes = (n) => {
  if (!n && n !== 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

const TYPE_GROUPS = {
  image: { label: 'Gambar', extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'], icon: ImageIcon },
  pdf: { label: 'PDF', extensions: ['.pdf'], icon: FileText },
  word: { label: 'Dokumen', extensions: ['.doc', '.docx', '.txt', '.md', '.rtf'], icon: FileText },
  excel: { label: 'Spreadsheet', extensions: ['.xls', '.xlsx', '.csv'], icon: Table },
  ppt: { label: 'Presentasi', extensions: ['.ppt', '.pptx'], icon: Presentation },
  audio: { label: 'Audio', extensions: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'], icon: Music },
  video: { label: 'Video', extensions: ['.mp4', '.webm', '.mkv', '.mov', '.avi'], icon: Video },
  archive: { label: 'Arsip', extensions: ['.zip', '.rar', '.7z', '.tar', '.gz'], icon: FileArchive },
  code: { label: 'Kode', extensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.json', '.html', '.css', '.sh'], icon: Code2 },
  other: { label: 'Lainnya', extensions: [], icon: File },
}

function typeGroupOf(key) {
  const k = (key || '').toLowerCase()
  for (const [group, def] of Object.entries(TYPE_GROUPS)) {
    if (def.extensions.some((ext) => k.endsWith(ext))) return group
  }
  return 'other'
}

function TypeIcon({ typeGroup, size = 18 }) {
  const Icon = TYPE_GROUPS[typeGroup]?.icon || File
  return <Icon size={size} />
}

// Ekstensi yang bisa dipratinjau sebagai teks biasa.
const TEXT_EXTS = ['.txt', '.md', '.csv', '.json', '.log', '.xml', '.yml', '.yaml',
  '.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.html', '.css', '.sh']

// Tentukan jenis pratinjau dari nama file: image | pdf | video | audio | text | null.
function previewKindOf(key) {
  const tg = typeGroupOf(key)
  const k = (key || '').toLowerCase()
  if (tg === 'image') return 'image'
  if (tg === 'pdf') return 'pdf'
  if (tg === 'video') return 'video'
  if (tg === 'audio') return 'audio'
  if (tg === 'code' || TEXT_EXTS.some((e) => k.endsWith(e))) return 'text'
  return null
}

// Label ekstensi untuk badge kartu grid, mis. "MP3", "PDF", "DOCX".
function extBadgeOf(key) {
  const name = key.split('/').pop()
  const idx = name.lastIndexOf('.')
  if (idx <= 0 || idx === name.length - 1) return ''
  return name.slice(idx + 1).toUpperCase()
}

// ---- Thumbnail gambar untuk mode grid ----
// Gambar diambil penuh lalu di-downscale via canvas ke ukuran sedang
// (maks 480px, JPEG 72%) — bukan kualitas penuh — supaya ringan ditampilkan.
const thumbCache = new Map() // key -> dataURL

function makeThumb(blob, maxDim = 480, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch {
        URL.revokeObjectURL(url)
        resolve('')
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve('') }
    img.src = url
  })
}

function GridThumb({ file }) {
  const tg = typeGroupOf(file.key)
  const [src, setSrc] = useState(() => thumbCache.get(file.key) || '')
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)

  async function load() {
    if (thumbCache.has(file.key)) { setSrc(thumbCache.get(file.key)); return }
    try {
      const blob = await api.s3Download(file.key)
      const data = await makeThumb(blob)
      if (data) { thumbCache.set(file.key, data); setSrc(data) }
      else setFailed(true)
    } catch { setFailed(true) }
  }

  useEffect(() => {
    if (tg !== 'image' || src || failed) return undefined
    const el = ref.current
    // Lazy load: ambil thumbnail hanya saat kartu mendekati viewport.
    if (!el || typeof IntersectionObserver === 'undefined') { load(); return undefined }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { load(); io.disconnect() }
      })
    }, { rootMargin: '250px' })
    io.observe(el)
    return () => io.disconnect()
  }, [tg, src, failed])

  if (tg !== 'image') {
    return <div className="s3grid-thumb is-empty"><TypeIcon typeGroup={tg} size={34} /></div>
  }
  if (src) {
    return <div className="s3grid-thumb"><img src={src} alt={file.key} loading="lazy" /></div>
  }
  return (
    <div className={`s3grid-thumb is-empty ${failed ? 'is-failed' : ''}`} ref={ref}>
      {failed ? <TypeIcon typeGroup={tg} size={34} /> : <Loader2 size={20} className="spin" />}
    </div>
  )
}

const SIZE_RANGES = [
  { id: 'all', label: 'Semua ukuran', test: () => true },
  { id: 'small', label: '< 1 MB', test: (n) => n < 1024 * 1024 },
  { id: 'medium', label: '1 – 10 MB', test: (n) => n >= 1024 * 1024 && n < 10 * 1024 * 1024 },
  { id: 'large', label: '10 – 100 MB', test: (n) => n >= 10 * 1024 * 1024 && n < 100 * 1024 * 1024 },
  { id: 'huge', label: '≥ 100 MB', test: (n) => n >= 100 * 1024 * 1024 },
]

const DATE_RANGES = [
  { id: 'all', label: 'Kapan pun', test: () => true },
  { id: 'today', label: 'Hari ini', test: (t) => t >= new Date().setHours(0, 0, 0, 0) },
  { id: 'week', label: '7 hari terakhir', test: (t) => t >= Date.now() - 7 * 864e5 },
  { id: 'month', label: '30 hari terakhir', test: (t) => t >= Date.now() - 30 * 864e5 },
  { id: 'older', label: 'Lebih lama', test: (t) => t < Date.now() - 30 * 864e5 },
]

const SORTS = [
  { id: 'name', label: 'Nama' },
  { id: 'size', label: 'Ukuran' },
  { id: 'date', label: 'Tanggal' },
]

const STATUS_LABEL = {
  queued: 'Menunggu',
  paused: 'Dijeda',
  uploading: 'Mengunggah',
  downloading: 'Mengunduh',
  done: 'Selesai',
  error: 'Gagal',
  canceled: 'Dibatalkan',
}

// ---- Sub-komponen: satu baris item antrian ----
function QueueRow({ item }) {
  const active = ['uploading', 'downloading'].includes(item.status)
  const pending = ['queued', 'paused'].includes(item.status)
  return (
    <div className={`s3q-row is-${item.status}`}>
      <div className="s3q-ico">
        {active && <Loader2 size={15} className="spin" />}
        {item.status === 'queued' && <ArrowUpDown size={15} />}
        {item.status === 'paused' && <Pause size={15} />}
        {item.status === 'done' && <CheckCircle2 size={15} />}
        {item.status === 'error' && <AlertCircle size={15} />}
        {item.status === 'canceled' && <Ban size={15} />}
      </div>
      <div className="s3q-body">
        <div className="s3q-top">
          <span className="s3q-name" title={item.name}>{item.name}</span>
          <span className="s3q-kind">{item.kind === 'upload' ? 'Unggah' : 'Unduh'}</span>
          <span className="s3q-pct">{item.progress}%</span>
        </div>
        <div className="s3q-bar"><div className="s3q-fill" style={{ width: `${item.progress}%` }} /></div>
        <div className="s3q-meta">
          {fmtBytes(item.size)} · {STATUS_LABEL[item.status] || item.status}
          {item.retry > 0 && ` · percobaan ke-${item.retry + 1}`}
          {item.error && <span className="s3q-err" title={item.error}> — {item.error}</span>}
        </div>
      </div>
      <div className="s3q-acts">
        {pending && (
          <button className="btn btn-icon" title={item.status === 'paused' ? 'Lanjutkan' : 'Jeda'}
            onClick={() => (item.status === 'paused' ? queue.resumeItem(item.id) : queue.pauseItem(item.id))}>
            {item.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
        {['error', 'canceled', 'paused'].includes(item.status) && item.kind === 'upload' && item.file && (
          <button className="btn btn-icon" title="Coba lagi" onClick={() => queue.retryItem(item.id)}>
            <RotateCcw size={14} />
          </button>
        )}
        {!['done', 'canceled'].includes(item.status) && (
          <button className="btn btn-icon danger" title="Batalkan" onClick={() => queue.cancelItem(item.id)}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ---- Sub-komponen: dropdown filter (popup sederhana) ----
function FilterDropdown({ label, active, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  return (
    <div className="s3f-dd" ref={ref}>
      <button className={`s3f-btn ${active ? 'is-active' : ''}`} onClick={() => setOpen((v) => !v)}>
        {label} <ChevronDown size={13} />
      </button>
      {open && <div className="s3f-pop">{children}</div>}
    </div>
  )
}

export default function StorageS3Page() {
  const { currentUser } = useStore()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState(null)

  // ---- Filter state ----
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [view, setView] = useState('grid')

  // ---- Folder virtual (prefix) + seleksi + drag & drop ----
  const [folder, setFolder] = useState('') // '' = root luxio/, selain itu 'a/b' tanpa slash awal/akhir
  const [selected, setSelected] = useState(() => new Set())
  const [dragKeys, setDragKeys] = useState(null) // Set key yang di-drag
  const [dropTarget, setDropTarget] = useState('') // prefix folder target highlight
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [moving, setMoving] = useState(false)

  // ---- Antrian transfer ----
  const [queueItems, setQueueItems] = useState([])
  const [queuePaused, setQueuePaused] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const multiRef = useRef(null)

  // ---- Preview (tombol mata) ----
  const [preview, setPreview] = useState(null) // { name, key, kind, size, url?, text? }
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')

  // ---- Toggle baris filter (tombol Filter) ----
  const [filtersOpen, setFiltersOpen] = useState(true)

  useEffect(() => queue.subscribe(setQueueItems) , [])
  useEffect(() => { setQueuePaused(queue.isPaused()) }, [queueItems])

  const activeCount = queueItems.filter((it) => ['queued', 'uploading', 'downloading', 'paused'].includes(it.status)).length
  const doneCount = queueItems.filter((it) => it.status === 'done').length

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.s3List('luxio/')
      setFiles(res.items || [])
    } catch (e) {
      setError(String(e.message || e).replace(/^Error: ?/, ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ---- Struktur folder virtual dari prefix key ----
  // Semua key di bawah 'luxio/'. Segmen tambahan = path folder.
  const folderPath = folder ? `luxio/${folder}/` : 'luxio/'

  const foldersHere = useMemo(() => {
    const set = new Set()
    const base = folder ? `${folder}/` : ''
    files.forEach((f) => {
      const rest = f.key.slice('luxio/'.length)
      if (!rest || !rest.includes('/')) return
      const dirPath = rest.slice(0, rest.lastIndexOf('/'))
      if (!dirPath.startsWith(base)) return
      const remainder = dirPath.slice(base.length)
      const first = remainder.split('/')[0]
      if (first) set.add(first)
    })
    return Array.from(set).sort()
  }, [files, folder])

  const filesHere = useMemo(() => files.filter((f) => {
    const rest = f.key.slice('luxio/'.length)
    const slash = rest.lastIndexOf('/')
    const dirPath = slash >= 0 ? rest.slice(0, slash) : ''
    return dirPath === (folder || '')
  }), [files, folder])

  const clearSelection = () => setSelected(new Set())
  const toggleSelect = (key) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  const selectAllHere = () => {
    const all = [
      ...filesHere.map((f) => f.key),
      ...foldersHere.map((n) => `folder:${n}`),
    ]
    const every = all.length > 0 && all.every((id) => selected.has(id))
    setSelected(every ? new Set() : new Set(all))
  }
  const allSelectedHere = [
    ...filesHere.map((f) => f.key),
    ...foldersHere.map((n) => `folder:${n}`),
  ].length > 0 && [
    ...filesHere.map((f) => f.key),
    ...foldersHere.map((n) => `folder:${n}`),
  ].every((id) => selected.has(id))

  useEffect(() => {
    api.s3Status()
      .then(setStatus)
      .catch(() => setStatus({ configured: false, ok: false }))
  }, [])

  // ---- Opsi filter dinamis dari data (kategori folder + user) ----
  const categories = useMemo(() => {
    const set = new Set()
    files.forEach((f) => {
      const rest = f.key.replace(/^luxio\//, '')
      const cat = rest.split('/')[0]
      if (cat) set.add(cat)
    })
    return Array.from(set).sort()
  }, [files])

  const users = useMemo(() => {
    const set = new Set()
    files.forEach((f) => {
      const parts = f.key.replace(/^luxio\//, '').split('/')
      if (parts.length >= 2 && parts[1]) set.add(parts[1])
    })
    return Array.from(set).sort()
  }, [files])

  // ---- Filtering & sorting (pipe bertahap, dalam folder aktif) ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sizeDef = SIZE_RANGES.find((r) => r.id === sizeFilter) || SIZE_RANGES[0]
    const dateDef = DATE_RANGES.find((r) => r.id === dateFilter) || DATE_RANGES[0]
    let out = filesHere.filter((f) => {
      const name = f.key.split('/').pop().toLowerCase()
      if (q && !name.includes(q) && !f.key.toLowerCase().includes(q)) return false
      if (category !== 'all') {
        const cat = f.key.replace(/^luxio\//, '').split('/')[0]
        if (cat !== category) return false
      }
      if (userFilter !== 'all') {
        const parts = f.key.replace(/^luxio\//, '').split('/')
        if ((parts[1] || '') !== userFilter) return false
      }
      if (typeFilter !== 'all' && typeGroupOf(f.key) !== typeFilter) return false
      if (!sizeDef.test(f.size || 0)) return false
      const t = f.last_modified ? new Date(f.last_modified).getTime() : 0
      if (!dateDef.test(t)) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    out = out.slice().sort((a, b) => {
      if (sortKey === 'name') {
        const an = a.key.split('/').pop().toLowerCase()
        const bn = b.key.split('/').pop().toLowerCase()
        return an.localeCompare(bn, 'id') * dir
      }
      if (sortKey === 'size') return ((a.size || 0) - (b.size || 0)) * dir
      const at = a.last_modified ? new Date(a.last_modified).getTime() : 0
      const bt = b.last_modified ? new Date(b.last_modified).getTime() : 0
      return (at - bt) * dir
    })
    return out
  }, [filesHere, search, category, userFilter, typeFilter, sizeFilter, dateFilter, sortKey, sortDir])

  const totalSize = useMemo(() => filtered.reduce((acc, f) => acc + (f.size || 0), 0), [filtered])
  const filtersActive = search || category !== 'all' || userFilter !== 'all' || typeFilter !== 'all'
    || sizeFilter !== 'all' || dateFilter !== 'all'
  const activeFilterCount = [
    search,
    category !== 'all',
    userFilter !== 'all',
    typeFilter !== 'all',
    sizeFilter !== 'all',
    dateFilter !== 'all',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
    setUserFilter('all')
    setTypeFilter('all')
    setSizeFilter('all')
    setDateFilter('all')
    setSortKey('date')
    setSortDir('desc')
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc') }
  }

  // ---- Upload: multi-file, masuk antrian (bukan blocking) ----
  const handleUpload = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    picked.forEach((file) => queue.enqueueUpload(file))
    setQueueOpen(true)
    setNotice('')
    setError('')
  }

  const handleDownload = (f) => {
    queue.enqueueDownload({ key: f.key, name: f.key.split('/').pop(), size: f.size })
    setQueueOpen(true)
    setError('')
  }

  // ---- Preview: ambil file lewat backend, tampilkan di modal ----
  const openPreview = async (f) => {
    const kind = previewKindOf(f.key)
    const name = f.key.split('/').pop()
    setPreviewError('')
    setPreviewLoading(true)
    setPreview({ name, key: f.key, kind, size: f.size })
    if (!kind) { setPreviewLoading(false); return }
    try {
      const blob = await api.s3Download(f.key)
      if (kind === 'text') {
        const text = await blob.text()
        setPreview((p) => (p && p.key === f.key ? { ...p, text } : p))
      } else {
        const url = URL.createObjectURL(blob)
        setPreview((p) => (p && p.key === f.key ? { ...p, url } : p))
      }
    } catch (err) {
      setPreviewError(String(err.message || err).replace(/^Error: ?/, ''))
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreview((p) => {
      if (p?.url) URL.revokeObjectURL(p.url)
      return null
    })
    setPreviewError('')
    setPreviewLoading(false)
  }

  useEffect(() => {
    if (!preview) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closePreview() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview])

  // ---- Download semua hasil filter (batasi 20 biar tidak banjir antrian) ----
  const handleDownloadFiltered = () => {
    filtered.slice(0, 20).forEach((f) => queue.enqueueDownload({ key: f.key, name: f.key.split('/').pop(), size: f.size }))
    setQueueOpen(true)
  }

  // ---- Buat folder baru (marker S3 key berakhiran '/') ----
  const handleCreateFolder = async () => {
    const name = window.prompt('Nama folder baru:')
    if (!name) return
    const clean = name.trim().replace(/[/\\]/g, '-').replace(/\s+/g, ' ')
    if (!clean) return
    setError(''); setNotice('')
    setCreatingFolder(true)
    try {
      await api.s3CreateFolder(folder ? `${folder}/${clean}` : clean)
      setNotice(`Folder "${clean}" dibuat.`)
      await load()
    } catch (err) {
      setError(String(err.message || err).replace(/^Error: ?/, ''))
    } finally {
      setCreatingFolder(false)
      // Marker folder kadang tidak muncul di listing (karena listing hanya
      // punya file). Folder tetap tampil karena dibangun dari path file.
    }
  }

  // ---- Pindah file/folder ke folder tujuan (drag & drop) ----
  const handleMove = async (keys, targetFolder) => {
    if (!keys || keys.length === 0) return
    setMoving(true)
    setError(''); setNotice('')
    let okCount = 0
    let failCount = 0
    const movedKeys = []
    for (const raw of keys) {
      try {
        let src, dest
        if (raw.startsWith('folder:')) {
          const name = raw.slice('folder:'.length)
          if (targetFolder === (folder || '')) continue
          src = folder ? `luxio/${folder}/${name}/` : `luxio/${name}/`
          dest = targetFolder ? `luxio/${targetFolder}/${name}/` : `luxio/${name}/`
          if (targetFolder && (targetFolder === name || targetFolder.startsWith(`${name}/`))) {
            failCount += 1; continue // tidak boleh pindah folder ke dalam dirinya
          }
        } else {
          const name = raw.split('/').pop()
          src = raw
          dest = targetFolder ? `luxio/${targetFolder}/${name}` : `luxio/${name}`
          if (src === dest) continue
        }
        await api.s3Move(src, dest)
        if (raw.startsWith('folder:')) {
          // Update key semua file di dalam folder yang pindah.
          const prefixOld = src.slice('luxio/'.length)
          const prefixNew = dest.slice('luxio/'.length)
          setFiles((prev) => prev.map((x) => (x.key.startsWith(`luxio/${prefixOld}`) ? { ...x, key: `luxio/${prefixNew}${x.key.slice(`luxio/${prefixOld}`.length)}` } : x)))
        } else {
          movedKeys.push({ from: src, to: dest })
        }
        okCount += 1
      } catch {
        failCount += 1
      }
    }
    // Terapkan perubahan key file yang dipindah.
    if (movedKeys.length > 0) {
      setFiles((prev) => prev.map((x) => {
        const hit = movedKeys.find((m) => m.from === x.key)
        return hit ? { ...x, key: hit.to } : x
      }))
    }
    setSelected(new Set())
    setNotice(`Dipindah: ${okCount} item${failCount > 0 ? `, gagal: ${failCount}` : ''}.`)
    await load()
    setMoving(false)
  }

  // ---- Drag & drop ----
  const onItemDragStart = (e, id) => {
    e.stopPropagation()
    let keys
    if (selected.has(id)) keys = Array.from(selected)
    else {
      keys = [id]
      setSelected((prev) => new Set(prev).add(id))
    }
    setDragKeys(keys)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', keys.join(','))
  }
  const onItemDragEnd = () => { setDragKeys(null); setDropTarget('') }
  const onFolderDragOver = (e, name) => {
    if (!dragKeys) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget(name)
  }
  const onFolderDrop = (e, name) => {
    if (!dragKeys) return
    e.preventDefault()
    e.stopPropagation()
    setDropTarget('')
    const keys = dragKeys.filter((k) => k !== `folder:${name}`)
    setDragKeys(null)
    if (keys.length === 0) return
    handleMove(keys, folder ? `${folder}/${name}` : name)
  }
  const onBreadcrumbDragOver = (e, target) => {
    if (!dragKeys) return
    e.preventDefault()
    setDropTarget(target)
  }
  const onBreadcrumbDrop = (e, target) => {
    if (!dragKeys) return
    e.preventDefault()
    setDropTarget('')
    const keys = dragKeys
    setDragKeys(null)
    if (keys.length === 0) return
    handleMove(keys, target)
  }

  // ---- Hapus item (file dan/atau folder beserta isinya) ----
  const deleteItems = async (items) => {
    const fileKeys = items.filter((x) => !x.startsWith('folder:'))
    const folderNames = items.filter((x) => x.startsWith('folder:')).map((x) => x.slice('folder:'.length))
    setError(''); setNotice('')
    let okCount = 0
    let failCount = 0
    for (const key of fileKeys) {
      try { await api.s3Delete(key); okCount += 1 } catch { failCount += 1 }
    }
    const removed = new Set(fileKeys)
    for (const name of folderNames) {
      const base = folder ? `${folder}/${name}` : name
      const inside = files.filter((f) => f.key.startsWith(`luxio/${base}/`))
      for (const f of inside) {
        removed.add(f.key)
        try { await api.s3Delete(f.key); okCount += 1 } catch { failCount += 1 }
      }
    }
    setFiles((prev) => prev.filter((f) => !removed.has(f.key)))
    setNotice(`Dihapus: ${okCount} item${failCount > 0 ? `, gagal: ${failCount}` : ''}.`)
    await load()
  }

  const handleMultiDelete = async () => {
    if (selected.size === 0) return
    const items = Array.from(selected)
    const fileKeys = items.filter((x) => !x.startsWith('folder:'))
    const folderNames = items.filter((x) => x.startsWith('folder:')).map((x) => x.slice('folder:'.length))
    const label = [
      fileKeys.length > 0 ? `${fileKeys.length} file` : '',
      folderNames.length > 0 ? `${folderNames.length} folder (beserta isinya)` : '',
    ].filter(Boolean).join(' + ')
    if (!window.confirm(`Hapus ${label} dari penyimpanan S3?`)) return
    await deleteItems(items)
    clearSelection()
  }

  // ---- Hapus satu folder beserta isinya (tombol di baris/kartu folder) ----
  const handleMultiDeleteFolder = async (name) => {
    if (!window.confirm(`Hapus folder "${name}" beserta seluruh isinya?`)) return
    await deleteItems([`folder:${name}`])
  }

  // ---- Multi download hanya file terpilih (folder dilewati) ----
  const handleMultiDownload = () => {
    const items = Array.from(selected).filter((x) => !x.startsWith('folder:'))
    const map = new Map(filesHere.map((f) => [f.key, f]))
    items.forEach((key) => {
      const f = map.get(key)
      if (f) queue.enqueueDownload({ key: f.key, name: f.key.split('/').pop(), size: f.size })
    })
    setQueueOpen(true)
  }

  const handleDelete = async (f) => {
    if (!window.confirm(`Hapus file "${f.key}" dari penyimpanan S3?`)) return
    setError('')
    setNotice('')
    try {
      await api.s3Delete(f.key)
      setFiles((prev) => prev.filter((x) => x.key !== f.key))
      setNotice('File dihapus.')
    } catch (err) {
      setError(String(err.message || err).replace(/^Error: ?/, ''))
    }
  }

  const toggleAllPause = () => {
    if (queuePaused) { queue.resumeAll(); setQueuePaused(false) }
    else { queue.pauseAll(); setQueuePaused(true) }
  }

  const sortIconFor = (key) => (
    <ArrowUpDown size={12} className={sortKey === key ? 's3sort-active' : 's3sort'} />
  )

  return (
    <div className="s3page">
      <div className="s3page-head">
        <div className="s3page-title">
          <FolderOpen size={20} />
          <div>
            <h3>Penyimpanan S3 (Neon Object Storage)</h3>
            <p>File disimpan di bucket <code>luxio</code> → folder <code>luxio/</code></p>
          </div>
        </div>
        <div className="s3page-actions">
          <input ref={multiRef} type="file" hidden multiple onChange={handleUpload} />
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat Ulang
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleCreateFolder} disabled={creatingFolder}>
            {creatingFolder ? <Loader2 size={14} className="spin" /> : <FolderPlus size={14} />} Folder Baru
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => multiRef.current?.click()}>
            <UploadCloud size={14} /> Upload File
          </button>
        </div>
      </div>

      {status && !status.configured && (
        <div className="s3page-warn">
          <AlertCircle size={15} />
          <span>S3 belum dikonfigurasi di env server (AWS_ENDPOINT_URL_S3 / key).</span>
        </div>
      )}

      {error && <div className="s3page-error"><AlertCircle size={15} /><span>{error}</span></div>}
      {notice && !error && <div className="s3page-notice"><CheckCircle2 size={15} /><span>{notice}</span></div>}

      {/* ---- Toolbar filter ---- */}
      <div className="s3page-toolbar">
        <div className="s3page-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama file..."
          />
          {search && (
            <button className="s3page-search-clear" title="Bersihkan" onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          className={`s3f-btn s3f-filterbtn ${filtersOpen || activeFilterCount > 0 ? 'is-active' : ''}`}
          onClick={() => setFiltersOpen((v) => !v)}
          title={filtersOpen ? 'Sembunyikan filter' : 'Tampilkan filter'}
        >
          <Filter size={14} /> Filter
          {activeFilterCount > 0 && <span className="s3f-count">{activeFilterCount}</span>}
        </button>

        {filtersOpen && (
        <div className="s3f-group">
          <FilterDropdown label={`Tipe: ${typeFilter === 'all' ? 'Semua' : TYPE_GROUPS[typeFilter]?.label || typeFilter}`} active={typeFilter !== 'all'}>
            <button className={typeFilter === 'all' ? 'is-on' : ''} onClick={() => setTypeFilter('all')}>Semua tipe</button>
            {Object.entries(TYPE_GROUPS).map(([id, def]) => (
              <button key={id} className={typeFilter === id ? 'is-on' : ''} onClick={() => setTypeFilter(id)}>
                <TypeIcon typeGroup={id} size={13} /> {def.label}
              </button>
            ))}
          </FilterDropdown>

          <FilterDropdown label={`Kategori: ${category === 'all' ? 'Semua' : category}`} active={category !== 'all'}>
            <button className={category === 'all' ? 'is-on' : ''} onClick={() => setCategory('all')}>Semua kategori</button>
            {categories.map((c) => (
              <button key={c} className={category === c ? 'is-on' : ''} onClick={() => setCategory(c)}>
                <FolderOpen size={13} /> {c}
              </button>
            ))}
          </FilterDropdown>

          {users.length > 1 && (
            <FilterDropdown label={`Pengguna: ${userFilter === 'all' ? 'Semua' : userFilter.slice(0, 8)}`} active={userFilter !== 'all'}>
              <button className={userFilter === 'all' ? 'is-on' : ''} onClick={() => setUserFilter('all')}>Semua pengguna</button>
              {users.map((u) => (
                <button key={u} className={userFilter === u ? 'is-on' : ''} onClick={() => setUserFilter(u)}>{u}</button>
              ))}
            </FilterDropdown>
          )}

          <FilterDropdown label={`Ukuran: ${SIZE_RANGES.find((r) => r.id === sizeFilter)?.label || 'Semua'}`} active={sizeFilter !== 'all'}>
            {SIZE_RANGES.map((r) => (
              <button key={r.id} className={sizeFilter === r.id ? 'is-on' : ''} onClick={() => setSizeFilter(r.id)}>{r.label}</button>
            ))}
          </FilterDropdown>

          <FilterDropdown label={`Tanggal: ${DATE_RANGES.find((r) => r.id === dateFilter)?.label || 'Kapan pun'}`} active={dateFilter !== 'all'}>
            {DATE_RANGES.map((r) => (
              <button key={r.id} className={dateFilter === r.id ? 'is-on' : ''} onClick={() => setDateFilter(r.id)}>{r.label}</button>
            ))}
          </FilterDropdown>

          <FilterDropdown label={`Urut: ${SORTS.find((s) => s.id === sortKey)?.label || 'Tanggal'} (${sortDir === 'asc' ? 'A→Z / kecil→besar' : 'Z→A / besar→kecil'})`} active={false}>
            {SORTS.map((s) => (
              <button key={s.id} className={sortKey === s.id ? 'is-on' : ''} onClick={() => toggleSort(s.id)}>
                {s.label}
              </button>
            ))}
            <div className="s3f-sep" />
            <button className={sortDir === 'asc' ? 'is-on' : ''} onClick={() => setSortDir('asc')}>Naik (asc)</button>
            <button className={sortDir === 'desc' ? 'is-on' : ''} onClick={() => setSortDir('desc')}>Turun (desc)</button>
          </FilterDropdown>

          {filtersActive && (
            <button className="s3f-btn s3f-clear" onClick={resetFilters} title="Reset semua filter">
              <X size={13} /> Reset
            </button>
          )}
        </div>
        )}

        <div className="s3page-viewtoggle">
          <button className={view === 'list' ? 'is-on' : ''} title="Tampilan daftar" onClick={() => setView('list')}><List size={15} /></button>
          <button className={view === 'grid' ? 'is-on' : ''} title="Tampilan grid" onClick={() => setView('grid')}><Grid2x2 size={15} /></button>
        </div>
      </div>

      {/* ---- Breadcrumb folder ---- */}
      <div className="s3page-crumbs" onDragOver={(e) => onBreadcrumbDragOver(e, folder || '')} onDrop={(e) => onBreadcrumbDrop(e, folder || '')}>
        <button className="s3crumb" data-active={folder === ''} onDragOver={(e) => onBreadcrumbDragOver(e, '')} onDrop={(e) => onBreadcrumbDrop(e, '')} onClick={() => { setFolder(''); clearSelection() }}>
          <FolderIcon size={13} /> luxio
        </button>
        {folder.split('/').filter(Boolean).map((seg, i, arr) => {
          const target = arr.slice(0, i + 1).join('/')
          return (
            <span className="s3crumb-wrap" key={target}>
              <ChevronRight size={12} className="s3crumb-sep" />
              <button
                className="s3crumb"
                data-active={target === folder}
                onDragOver={(e) => onBreadcrumbDragOver(e, target)}
                onDrop={(e) => onBreadcrumbDrop(e, target)}
                onClick={() => { setFolder(target); clearSelection() }}
              >
                {seg}
              </button>
            </span>
          )
        })}
        {folder && (
          <span className="s3crumb-wrap">
            <ChevronRight size={12} className="s3crumb-sep" />
            <button className="s3crumb s3crumb-up" onClick={() => { const up = folder.split('/').slice(0, -1).join('/'); setFolder(up); clearSelection() }} title="Naik satu folder">
              <ArrowUpDown size={12} /> Naik
            </button>
          </span>
        )}
      </div>

      {/* ---- Bar seleksi ---- */}
      {selected.size > 0 && (
        <div className="s3page-selbar">
          <span><SquareCheck size={14} /> {selected.size} item dipilih</span>
          <button className="s3f-btn" onClick={handleMultiDownload} title="Unduh semua file terpilih (folder dilewati)">
            <Download size={13} /> Unduh
          </button>
          <button className="s3f-btn s3f-clear" onClick={handleMultiDelete} title="Hapus semua item terpilih">
            <Trash2 size={13} /> Hapus
          </button>
          <button className="s3f-btn" onClick={clearSelection}>Batal</button>
        </div>
      )}

      {/* ---- Ringkasan hasil ---- */}
      <div className="s3page-summary">
        <span className="s3page-count">
          {foldersHere.length} folder · {filtered.length} dari {filesHere.length} file · total {fmtBytes(totalSize)}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          {filesHere.length + foldersHere.length > 0 && (
            <button className="s3f-btn" onClick={selectAllHere} title="Pilih semua item di folder ini">
              <SquareCheck size={13} /> Pilih semua
            </button>
          )}
          {filtered.length > 0 && (
            <button className="s3f-btn" onClick={handleDownloadFiltered} title="Antrikan unduhan untuk hasil filter (maks 20)">
              <Download size={13} /> Unduh semua hasil filter
            </button>
          )}
        </span>
      </div>

      {/* ---- Daftar / grid file ---- */}
      <div className={`s3page-table ${view === 'grid' ? 'is-grid' : ''}`}>
        {view === 'list' && (
          <div className="s3page-table-head">
            <span className="s3check-col">
              <input
                type="checkbox"
                checked={allSelectedHere}
                onChange={selectAllHere}
                title="Pilih semua"
              />
            </span>
            <span className="s3sort-head" onClick={() => toggleSort('name')}>Nama {sortIconFor('name')}</span>
            <span className="s3sort-head" onClick={() => toggleSort('size')}>Ukuran {sortIconFor('size')}</span>
            <span className="s3sort-head" onClick={() => toggleSort('date')}>Diubah {sortIconFor('date')}</span>
            <span className="s3page-actions-col">Aksi</span>
          </div>
        )}

        {loading && (
          <div className="s3page-empty"><Loader2 size={22} className="spin" /> Memuat data...</div>
        )}

        {!loading && filtered.length === 0 && foldersHere.length === 0 && (
          <div className="s3page-empty">
            <FolderOpen size={24} />
            <span>{filtersActive ? 'Tidak ada file yang cocok dengan filter.' : 'Belum ada file di folder ini. Upload file atau buat folder baru.'}</span>
          </div>
        )}

        {!loading && view === 'list' && foldersHere.map((name) => {
          const id = `folder:${name}`
          const isDrag = dragKeys?.includes(id)
          return (
            <div
              className={`s3page-row is-folder ${selected.has(id) ? 'is-selected' : ''} ${isDrag ? 'is-dragging' : ''}`}
              key={id}
              draggable
              onDragStart={(e) => onItemDragStart(e, id)}
              onDragEnd={onItemDragEnd}
              onDragOver={(e) => onFolderDragOver(e, name)}
              onDrop={(e) => onFolderDrop(e, name)}
              onClick={(e) => { if (e.target.closest('input,button')) return; toggleSelect(id) }}
              onDoubleClick={() => { setFolder(folder ? `${folder}/${name}` : name); clearSelection() }}>
              <span className="s3check-col">
                <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)} onClick={(e) => e.stopPropagation()} />
              </span>
              <span className="s3page-name">
                <FolderIcon size={18} className="s3folder-ico" />
                <span>{name}</span>
              </span>
              <span>—</span>
              <span>—</span>
              <span className="s3page-actions-col">
                <button className="btn btn-icon danger" title="Hapus folder beserta isinya" onClick={() => handleMultiDeleteFolder(name)}>
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          )
        })}

        {!loading && view === 'list' && filtered.map((f) => {
          const tg = typeGroupOf(f.key)
          const isDrag = dragKeys?.includes(f.key)
          return (
            <div
              className={`s3page-row ${selected.has(f.key) ? 'is-selected' : ''} ${isDrag ? 'is-dragging' : ''}`}
              key={f.key}
              draggable
              onDragStart={(e) => onItemDragStart(e, f.key)}
              onDragEnd={onItemDragEnd}
              onClick={(e) => { if (e.target.closest('input,button')) return; toggleSelect(f.key) }}
              onDoubleClick={() => openPreview(f)}>
              <span className="s3check-col">
                <input type="checkbox" checked={selected.has(f.key)} onChange={() => toggleSelect(f.key)} onClick={(e) => e.stopPropagation()} />
              </span>
              <span className="s3page-name">
                <TypeIcon typeGroup={tg} />
                <span title={f.key}>{f.key.split('/').pop()}</span>
              </span>
              <span>{fmtBytes(f.size)}</span>
              <span>{fmtDate(f.last_modified)}</span>
              <span className="s3page-actions-col">
                <button className="btn btn-icon" title="Pratinjau" onClick={() => openPreview(f)}>
                  <Eye size={15} />
                </button>
                <button className="btn btn-icon" title="Unduh (masuk antrian)" onClick={() => handleDownload(f)}>
                  <Download size={15} />
                </button>
                <button className="btn btn-icon danger" title="Hapus" onClick={() => handleDelete(f)}>
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          )
        })}

        {!loading && view === 'grid' && (
          <div className="s3grid">
            {foldersHere.map((name) => {
              const id = `folder:${name}`
              return (
                <div
                  className={`s3grid-item is-folder ${selected.has(id) ? 'is-selected' : ''} ${dropTarget === name ? 'is-drop' : ''}`}
                  key={id}
                  draggable
                  onDragStart={(e) => onItemDragStart(e, id)}
                  onDragEnd={onItemDragEnd}
                  onDragOver={(e) => onFolderDragOver(e, name)}
                  onDrop={(e) => onFolderDrop(e, name)}
                  onClick={(e) => { if (e.target.closest('input,button')) return; toggleSelect(id) }}
                  onDoubleClick={() => { setFolder(folder ? `${folder}/${name}` : name); clearSelection() }}>
                  <div className="s3grid-thumbwrap">
                    <div className="s3grid-thumb is-empty"><FolderIcon size={38} className="s3folder-ico" /></div>
                  </div>
                  <div className="s3grid-name">{name}</div>
                  <div className="s3grid-meta">Folder</div>
                  <div className="s3grid-acts">
                    <button className="btn btn-icon danger" title="Hapus folder beserta isinya" onClick={() => handleMultiDeleteFolder(name)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
            {filtered.map((f) => {
              const ext = extBadgeOf(f.key)
              const isDrag = dragKeys?.includes(f.key)
              return (
                <div
                  className={`s3grid-item ${selected.has(f.key) ? 'is-selected' : ''} ${isDrag ? 'is-dragging' : ''}`}
                  key={f.key}
                  title={f.key}
                  draggable
                  onDragStart={(e) => onItemDragStart(e, f.key)}
                  onDragEnd={onItemDragEnd}
                  onClick={(e) => { if (e.target.closest('input,button')) return; toggleSelect(f.key) }}
                  onDoubleClick={() => openPreview(f)}>
                  <div className="s3grid-thumbwrap">
                    <GridThumb file={f} />
                    {ext && <span className="s3grid-ext">{ext}</span>}
                  </div>
                  <div className="s3grid-name">{f.key.split('/').pop()}</div>
                  <div className="s3grid-meta">{fmtBytes(f.size)} · {fmtDate(f.last_modified)}</div>
                  <div className="s3grid-acts">
                    <button className="btn btn-icon" title="Pratinjau" onClick={() => openPreview(f)}><Eye size={14} /></button>
                    <button className="btn btn-icon" title="Unduh" onClick={() => handleDownload(f)}><Download size={14} /></button>
                    <button className="btn btn-icon danger" title="Hapus" onClick={() => handleDelete(f)}><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ---- Modal pratinjau (tombol mata) ---- */}
      {preview && (
        <div className="s3pv-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closePreview() }}>
          <div className="s3pv">
            <div className="s3pv-head">
              <span className="s3pv-name" title={preview.key}>{preview.name}</span>
              <span className="s3pv-meta">{fmtBytes(preview.size)}</span>
              <div className="s3pv-acts">
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload({ key: preview.key, size: preview.size })}>
                  <Download size={14} /> Unduh
                </button>
                <button className="s3pv-close" title="Tutup (Esc)" onClick={closePreview}><X size={16} /></button>
              </div>
            </div>
            <div className="s3pv-body">
              {previewLoading && (
                <div className="s3pv-loading"><Loader2 size={26} className="spin" /> Memuat pratinjau...</div>
              )}
              {!previewLoading && previewError && (
                <div className="s3pv-none"><AlertCircle size={26} /><p>{previewError}</p></div>
              )}
              {!previewLoading && !previewError && preview.kind === 'image' && (
                <img src={preview.url} alt={preview.name} />
              )}
              {!previewLoading && !previewError && preview.kind === 'pdf' && (
                <iframe src={preview.url} title={preview.name} />
              )}
              {!previewLoading && !previewError && preview.kind === 'video' && (
                <video src={preview.url} controls autoPlay />
              )}
              {!previewLoading && !previewError && preview.kind === 'audio' && (
                <audio src={preview.url} controls autoPlay />
              )}
              {!previewLoading && !previewError && preview.kind === 'text' && (
                <pre className="s3pv-text">{preview.text}</pre>
              )}
              {!previewLoading && !previewError && !preview.kind && (
                <div className="s3pv-none">
                  <TypeIcon typeGroup={typeGroupOf(preview.key)} size={34} />
                  <p>Pratinjau tidak tersedia untuk tipe file ini.<br />Gunakan tombol Unduh untuk membukanya.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Panel antrian transfer (ala Google Drive) ---- */}
      <div className={`s3q ${queueOpen ? 'is-open' : ''}`}>
        <button className="s3q-fab" onClick={() => setQueueOpen((v) => !v)} title="Antrian transfer">
          <ListChecks size={17} />
          <span>Antrian</span>
          {activeCount > 0 && <span className="s3q-badge">{activeCount}</span>}
          {doneCount > 0 && activeCount === 0 && <span className="s3q-badge is-done">{doneCount}</span>}
        </button>

        {queueOpen && (
          <div className="s3q-panel">
            <div className="s3q-head">
              <strong>Antrian Transfer</strong>
              <div className="s3q-head-acts">
                <button className="btn btn-icon" title={queuePaused ? 'Lanjutkan semua' : 'Jeda semua'} onClick={toggleAllPause}>
                  {queuePaused ? <Play size={15} /> : <Pause size={15} />}
                </button>
                <button className="btn btn-icon" title="Bersihkan selesai/gagal" onClick={queue.clearFinished}>
                  <Trash2 size={15} />
                </button>
                <button className="btn btn-icon" title="Tutup" onClick={() => setQueueOpen(false)}>
                  <X size={15} />
                </button>
              </div>
            </div>
            <div className="s3q-list">
              {queueItems.length === 0 && (
                <div className="s3q-empty">Belum ada transfer. Upload file atau klik unduh untuk melihat progres di sini.</div>
              )}
              {queueItems.slice().reverse().map((it) => <QueueRow key={it.id} item={it} />)}
            </div>
          </div>
        )}
      </div>

      <div className="s3page-foot">
        <Shield size={14} /> Kredensial S3 dijaga sepenuhnya di server — tidak pernah dikirim ke browser.
      </div>
    </div>
  )
}
