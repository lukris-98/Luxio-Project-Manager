import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { MapPin, Camera, Upload, X, AlertTriangle, CheckCircle2, Clock, Loader2, LogIn, LogOut, Video } from 'lucide-react'
import { api } from '../services/api'
import './AttendancePage.css'

// =====================================================================
// AttendancePage.jsx — Absen masuk & pulang kerja (kamera live + GPS).
// =====================================================================
// - GPS: navigator.geolocation.getCurrentPosition untuk lat/lng.
// - Peta: iframe Google Maps embed (draggable) di titik lokasi GPS.
// - Bukti foto: live camera (getUserMedia) dengan snapshot ke canvas,
//   atau upload dari galeri (input file capture="user").
// - Dua mode: 'checkin' (Absen Masuk) & 'checkout' (Absen Pulang).
//   Tombol yang sudah dilakukan hari ini otomatis dinonaktifkan.
// - Status otomatis 'present'/'outside' dihitung backend berdasarkan
//   jarak ke lokasi kantor (office_geo) yang diatur admin.
// =====================================================================

const STATUS_LABEL = {
  present: 'Hadir',
  outside: 'Di luar area',
}

const TYPE_LABEL = {
  checkin: 'Masuk',
  checkout: 'Pulang',
}

const toDateKey = (d) => {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
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
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [checkedOutToday, setCheckedOutToday] = useState(false)
  const fileRef = useRef(null)

  // Live camera
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const streamRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const loadHistory = () => {
    setHistoryLoading(true)
    api.getAttendance()
      .then((res) => {
        const list = res.attendance || []
        setHistory(list)
        const today = toDateKey(new Date())
        const ci = list.some((h) => h.type === 'checkin' && toDateKey(h.created_at) === today)
        const co = list.some((h) => h.type === 'checkout' && toDateKey(h.created_at) === today)
        setCheckedInToday(ci)
        setCheckedOutToday(co)
        const latest = [...list]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
        if (latest) {
          setResult({
            type: latest.type,
            status: latest.status,
            photo_url: latest.photo_url,
            created_at: latest.created_at,
          })
        }
      })
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

  // Stop kamera saat komponen dilepas.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Attach stream ke <video> setelah state cameraOpen berubah.
  useEffect(() => {
    if (cameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraOpen])

  const openCamera = async () => {
    setCameraError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Browser tidak mendukung akses kamera. Gunakan "Upload dari Galeri".')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
    } catch (e) {
      setCameraError('Tidak bisa mengakses kamera. Periksa izin kamera atau gunakan "Upload dari Galeri".')
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOpen(false)
    setCameraError('')
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    setPhotoUrl(canvas.toDataURL('image/jpeg', 0.9))
    closeCamera()
  }

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

  const handleSubmit = async (type) => {
    if (!loc) {
      setError('Lokasi GPS belum didapat. Periksa izin lokasi.')
      return
    }
    if (!photoUrl) {
      setError('Foto bukti wajib diambil sebelum absen.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await api.createAttendance({
        type,
        photo_url: photoUrl,
        latitude: loc.latitude,
        longitude: loc.longitude,
        distance_m: 0,
        team_id: currentUser?.team_id ?? undefined,
      })
      setResult({
        type,
        status: res.status,
        photo_url: res.photo_url || photoUrl,
        created_at: res.created_at || new Date().toISOString(),
      })
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
            <h1>Absen Kerja</h1>
            <p>Kamera live + GPS untuk absen masuk & pulang kerja harian</p>
          </div>
        </motion.div>

        <div className="attendance-note">
          <AlertTriangle size={15} />
          <span>
            Foto di area kantor berbeda dengan di luar area kantor — status akan otomatis 'Hadir' atau
            'Di luar area' berdasarkan jarak GPS ke lokasi kantor yang diatur admin. Jangan lupa
            absen masuk di awal hari dan absen pulang di akhir hari.
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
              <h2>Bukti Foto</h2>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="attendance-file-input"
              onChange={handlePhoto}
            />

            <div className="attendance-photo-actions">
              <button className="btn btn-secondary btn-sm" onClick={openCamera}>
                <Video size={14} />
                {photoUrl ? 'Ganti Foto' : 'Ambil dari Kamera'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload size={14} />
                Upload dari Galeri
              </button>
            </div>

            {cameraError && <p className="attendance-camera-error">{cameraError}</p>}

            {cameraOpen && (
              <div className="attendance-camera">
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="attendance-camera-actions">
                  <button className="btn btn-primary btn-sm" onClick={capturePhoto}>
                    <Camera size={14} /> Ambil Foto
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={closeCamera}>
                    <X size={14} /> Tutup
                  </button>
                </div>
              </div>
            )}

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

            <div className="attendance-actions">
              <button
                className={`btn ${checkedInToday ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => handleSubmit('checkin')}
                disabled={submitting || !loc || !photoUrl || checkedInToday}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Mengirim...
                  </>
                ) : checkedInToday ? (
                  <>
                    <CheckCircle2 size={16} /> Sudah Absen Masuk
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Absen Masuk
                  </>
                )}
              </button>

              <button
                className={`btn ${checkedOutToday ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => handleSubmit('checkout')}
                disabled={submitting || !loc || !photoUrl || checkedOutToday}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Mengirim...
                  </>
                ) : checkedOutToday ? (
                  <>
                    <CheckCircle2 size={16} /> Sudah Absen Pulang
                  </>
                ) : (
                  <>
                    <LogOut size={16} /> Absen Pulang
                  </>
                )}
              </button>
            </div>

            {error && <p className="attendance-error">{error}</p>}
          </div>

          {/* Kolom tengah: peta lokasi */}
          <div className="attendance-card">
            <div className="attendance-card-head">
              <MapPin size={18} />
              <h2>Peta Lokasi</h2>
            </div>

            {locLoading ? (
              <div className="attendance-loading">
                <Loader2 size={16} className="spin" />
                <span>Menyiapkan peta...</span>
              </div>
            ) : loc ? (
              <>
                <div className="att-map-wrap">
                  <iframe
                    title="Peta Lokasi GPS"
                    src={`https://maps.google.com/maps?q=${loc.latitude},${loc.longitude}&z=15&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="map-hint">
                  Peta dapat digeser (drag) untuk melihat area sekitar titik lokasi.
                </p>
              </>
            ) : (
              <div className="attendance-empty">
                {locError || 'Peta tidak tersedia tanpa lokasi GPS.'}
              </div>
            )}
          </div>
        </div>

        {/* Kolom hasil terakhir */}
        <div className="attendance-card">
          <div className="attendance-card-head">
            <Clock size={18} />
            <h2>Hasil Terakhir</h2>
          </div>

          {result ? (
            <div className="attendance-result">
              <div className="attendance-result-badges">
                <span className={`result-badge result-type ${result.type}`}>
                  {TYPE_LABEL[result.type] || result.type || 'Absen'}
                </span>
                <span className={`result-badge ${result.status}`}>
                  {STATUS_LABEL[result.status] || result.status}
                </span>
              </div>
              {result.photo_url && (
                <img className="result-photo" src={result.photo_url} alt="Bukti absen" />
              )}
              <p className="result-note">
                Absen {TYPE_LABEL[result.type] || ''} berhasil dicatat. Status dihitung dari jarak GPS ke lokasi kantor.
              </p>
            </div>
          ) : (
            <div className="attendance-empty">Belum ada absen. Ambil foto & klik "Absen Masuk".</div>
          )}
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
                  <span className={`history-type ${h.type === 'checkout' ? 'checkout' : 'checkin'}`}>
                    {h.type === 'checkout' ? <LogOut size={12} /> : <LogIn size={12} />}
                    {TYPE_LABEL[h.type] || 'Absen'}
                  </span>
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
