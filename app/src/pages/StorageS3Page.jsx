// =====================================================================
// StorageS3Page.jsx — File Manager Neon Object Storage (S3-compatible).
// =====================================================================
// Kelola file yang tersimpan di bucket `luxio` prefix `luxio/`:
//   - list file (dengan ukuran & tanggal)
//   - upload file apapun (pdf, word, excel, ppt, txt, gambar, dll)
//   - unduh file
//   - hapus file
// Semua operasi lewat backend (`/api/owner/s3/*`) supaya kredensial
// S3 tidak pernah terexpose ke browser.
// =====================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FolderOpen, UploadCloud, Download, Trash2, RefreshCw, Loader2,
  FileText, File, Image as ImageIcon, Table, Presentation, Shield,
  CheckCircle2, AlertCircle, Search,
} from 'lucide-react'
import { api } from '../services/api'
import { useStore } from '../store/useStore'
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

function fileIcon(key) {
  const k = key.toLowerCase()
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/.test(k)) return <ImageIcon size={18} />
  if (k.endsWith('.pdf')) return <FileText size={18} />
  if (/\.(xls|xlsx|csv)$/.test(k)) return <Table size={18} />
  if (/\.(ppt|pptx)$/.test(k)) return <Presentation size={18} />
  return <File size={18} />
}

export default function StorageS3Page() {
  const { currentUser } = useStore()
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(null)
  const fileRef = useRef(null)

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

  useEffect(() => {
    api.s3Status()
      .then(setStatus)
      .catch(() => setStatus({ configured: false, ok: false }))
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    setNotice('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', '')
      const res = await api.s3Upload(fd)
      setNotice(`File "${res.file_name || file.name}" tersimpan di ${res.key || 'S3'}.`)
      await load()
    } catch (err) {
      setError(String(err.message || err).replace(/^Error: ?/, ''))
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (key) => {
    try {
      const blob = await api.s3Download(key)
      const name = key.split('/').pop() || 'file'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(String(err.message || err).replace(/^Error: ?/, ''))
    }
  }

  const handleDelete = async (key) => {
    if (!window.confirm(`Hapus file "${key}" dari penyimpanan S3?`)) return
    setError('')
    setNotice('')
    try {
      await api.s3Delete(key)
      setNotice('File dihapus.')
      await load()
    } catch (err) {
      setError(String(err.message || err).replace(/^Error: ?/, ''))
    }
  }

  const filtered = search
    ? files.filter((f) => f.key.toLowerCase().includes(search.toLowerCase()))
    : files

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
          <input ref={fileRef} type="file" hidden onChange={handleUpload} />
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Muat Ulang
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 size={14} className="spin" /> : <UploadCloud size={14} />}
            {uploading ? 'Upload...' : 'Upload File'}
          </button>
        </div>
      </div>

      {status && !status.configured && (
        <div className="s3page-warn">
          <AlertCircle size={15} />
          <span>S3 belum dikonfigurasi di env server (AWS_ENDPOINT_URL_S3 / key).</span>
        </div>
      )}

      {error && (
        <div className="s3page-error"><AlertCircle size={15} /><span>{error}</span></div>
      )}
      {notice && !error && (
        <div className="s3page-notice"><CheckCircle2 size={15} /><span>{notice}</span></div>
      )}

      <div className="s3page-toolbar">
        <div className="s3page-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari file..."
          />
        </div>
        <span className="s3page-count">{filtered.length} file</span>
      </div>

      <div className="s3page-table">
        <div className="s3page-table-head">
          <span>Nama File</span>
          <span>Ukuran</span>
          <span>Diubah</span>
          <span className="s3page-actions-col">Aksi</span>
        </div>
        {loading && (
          <div className="s3page-empty"><Loader2 size={22} className="spin" /> Memuat data...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="s3page-empty">
            <FolderOpen size={24} />
            <span>{search ? 'Tidak ada file cocok.' : 'Belum ada file di folder luxio/. Upload file untuk mulai.'}</span>
          </div>
        )}
        {!loading && filtered.map((f) => (
          <div className="s3page-row" key={f.key}>
            <span className="s3page-name">
              {fileIcon(f.key)}
              <span title={f.key}>{f.key.split('/').pop()}</span>
            </span>
            <span>{fmtBytes(f.size)}</span>
            <span>{fmtDate(f.last_modified)}</span>
            <span className="s3page-actions-col">
              <button className="btn btn-icon" title="Unduh" onClick={() => handleDownload(f.key)}>
                <Download size={15} />
              </button>
              <button className="btn btn-icon danger" title="Hapus" onClick={() => handleDelete(f.key)}>
                <Trash2 size={15} />
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="s3page-foot">
        <Shield size={14} /> Kredensial S3 dijaga sepenuhnya di server — tidak pernah dikirim ke browser.
      </div>
    </div>
  )
}
