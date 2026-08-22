import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { MapPin, Camera, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { api } from '../services/api'
import './AttendancePage.css'

// =====================================================================
// AttendancePage.jsx — Absen masuk kerja (selfie + GPS).
// =====================================================================
// - GPS: navigator.geolocation.getCurrentPosition untuk lat/lng.
// - Selfie: input file capture="user", dikonversi ke base64 (data URL).
// - Status otomatis 'present'/'outside' dihitung backend berdasarkan
//   jarak ke lokasi kantor (office_geo) yang diatur admin.
// =====================================================================

const STATUS_LABEL = {
  present: 'Hadir',
  outside: 'Di luar area',
}

export default function AttendancePage() {
  const { currentUser } = useStore()

  const [loc, setLoc] = useState(null)
  const [locLoading, setLocLoading] = useState(true)
  const [locError, setLocError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const fileRef = useRef(null)

  const loadHistory = () => {
    setHistoryLoading(true)
    api.getAttendance()
      .then((res) => setHistory(res.attendance || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocLoading(false)
      setLocError('Browser tidak mendukung GPS.')
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          setLocLoading(false)
        },
        () => {
          setLocError('Aktifkan GPS untuk absen')
          setLocLoading(false)
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
      )
    }
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    setError('')
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoUrl(reader.result)
      setPhotoLoading(false)
    }
    reader.onerror = () => {
      setPhotoLoading(false)
      setError('Gagal membaca foto. Coba lagi.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!loc) {
      setError('Lokasi GPS belum didapat. Periksa izin lokasi.')
      return
    }
    if (!photoUrl) {
      setError('Selfie wajib diambil sebelum absen.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.createAttendance({
        photo_url: photoUrl,
        latitude: loc.latitude,
        longitude: loc.longitude,
        distance_m: 0,
      })
      setResult({ status: res.status, photo_url: res.photo_url || photoUrl })
      loadHistory()
    } catch (e) {
      setError('Gagal absen. Pastikan backend online.')
    } finally {
      setSubmitting(false)
    }
  }

  const fmtTime = (t) =>
    t ? new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <Layout>
      <motion.div
        className="attendance-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>Absen Masuk</h1>
            <p>Selfie + GPS untuk absen kerja harian</p>
          </div>
        </motion.div>

        <div className="attendance-note">
          <AlertTriangle size={15} />
          <span>
            Foto di area kantor berbeda dengan di luar area kantor — status akan otomatis 'Hadir' atau
            'Di luar area' berdasarkan jarak GPS ke lokasi kantor yang diatur admin.
          </span>
        </div>

        <div className="attendance-grid">
          {/* Kolom kiri: GPS + selfie + tombol */}
          <div className="attendance-card">
            <div className="attendance-card-head">
              <MapPin size={18} />
              <h2>Lokasi GPS</h2>
            </div>

            {locLoading ? (
              <div className="attendance-loading">
                <Loader2 size={16} className="spin" />
                <span>Mendapatkan lokasi...</span>
              </div>
            ) : loc ? (
              <div className="gps-ok">
                <CheckCircle2 size={16} />
                <div>
                  <span className="gps-label">Lokasi terdeteksi</span>
                  <span className="gps-coords">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="gps-warn">
                <MapPin size={16} />
                <span>{locError || 'Lokasi tidak tersedia.'}</span>
              </div>
            )}

            <div className="attendance-card-head">
              <Camera size={18} />
              <h2>Selfie</h2>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="attendance-file-input"
              onChange={handlePhoto}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
              <Camera size={14} />
              {photoUrl ? 'Ganti Selfie' : 'Ambil Selfie'}
            </button>

            {photoLoading && (
              <div className="attendance-loading">
                <Loader2 size={16} className="spin" />
                <span>Memproses foto...</span>
              </div>
            )}

            {photoUrl && !photoLoading && (
              <div className="selfie-preview">
                <img src={photoUrl} alt="Preview selfie" />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !loc || !photoUrl}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" /> Mengirim...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Absen Masuk
                </>
              )}
            </button>

            {error && <p className="attendance-error">{error}</p>}
          </div>

          {/* Kolom kanan: hasil terakhir */}
          <div className="attendance-card">
            <div className="attendance-card-head">
              <Clock size={18} />
              <h2>Hasil Terakhir</h2>
            </div>

            {result ? (
              <div className="attendance-result">
                <div className={`result-badge ${result.status}`}>
                  {STATUS_LABEL[result.status] || result.status}
                </div>
                {result.photo_url && (
                  <img className="result-photo" src={result.photo_url} alt="Bukti absen" />
                )}
                <p className="result-note">
                  Absen berhasil dicatat. Status dihitung dari jarak GPS ke lokasi kantor.
                </p>
              </div>
            ) : (
              <div className="attendance-empty">Belum ada absen. Ambil selfie & klik "Absen Masuk".</div>
            )}
          </div>
        </div>

        {/* Riwayat */}
        <div className="attendance-card">
          <div className="attendance-card-head">
            <Clock size={18} />
            <h2>Riwayat Absensi</h2>
          </div>

          {historyLoading ? (
            <div className="attendance-loading">
              <Loader2 size={16} className="spin" />
              <span>Memuat riwayat...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="attendance-empty">Belum ada riwayat absensi.</div>
          ) : (
            <div className="attendance-history">
              {history.map((h) => (
                <div key={h.id} className="history-item">
                  {h.photo_url && (
                    <img className="history-photo" src={h.photo_url} alt="Selfie" />
                  )}
                  <div className="history-info">
                    <span className="history-user">{h.user_name || currentUser?.name}</span>
                    <span className="history-time">{fmtTime(h.created_at)}</span>
                    {h.note && <span className="history-note">{h.note}</span>}
                  </div>
                  <span className={`history-status ${h.status}`}>{STATUS_LABEL[h.status] || h.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}
