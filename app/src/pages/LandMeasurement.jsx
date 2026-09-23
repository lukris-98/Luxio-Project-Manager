import { useCallback, useEffect, useRef, useState } from 'react'
import {
  MapPin, Navigation, PenLine, RotateCcw, Copy, Download,
  Ruler, Maximize2, ChevronRight, AlertTriangle, Loader2,
  Play, Square, X, Check,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import './LandMeasurement.css'

// ============================================================
// Haversine: jarak dua koordinat GPS (lat/lng) dalam meter
// ============================================================
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // radius bumi (m)
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dPhi = ((lat2 - lat1) * Math.PI) / 180
  const dLambda = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ============================================================
// Shoelace formula: luas poligon dari array {x, y}
// ============================================================
function shoelaceArea(pts) {
  const n = pts.length
  if (n < 3) return 0
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += pts[i].x * pts[j].y
    area -= pts[j].x * pts[i].y
  }
  return Math.abs(area) / 2
}

// ============================================================
// Luas GPS: lat/lng → meter via proyeksi lokal
// ============================================================
function gpsPolygonArea(points) {
  if (points.length < 3) return 0
  const origin = points[0]
  const projected = points.map((p) => ({
    x: haversineDistance(origin.lat, origin.lng, origin.lat, p.lng),
    y: haversineDistance(origin.lat, origin.lng, p.lat, origin.lng),
  }))
  // Tandai x/y dengan arah
  const projectedSigned = points.map((p) => ({
    x: (p.lng - origin.lng) >= 0
      ? haversineDistance(origin.lat, origin.lng, origin.lat, p.lng)
      : -haversineDistance(origin.lat, origin.lng, origin.lat, p.lng),
    y: (p.lat - origin.lat) >= 0
      ? haversineDistance(origin.lat, origin.lng, p.lat, origin.lng)
      : -haversineDistance(origin.lat, origin.lng, p.lat, origin.lng),
  }))
  return shoelaceArea(projectedSigned)
}

function gpsPerimeterSides(points) {
  const sides = []
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const d = haversineDistance(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
    sides.push(d)
  }
  return sides
}

function canvasPerimeterSides(points, scale) {
  const sides = []
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const dx = points[j].x - points[i].x
    const dy = points[j].y - points[i].y
    sides.push(Math.sqrt(dx * dx + dy * dy) * scale)
  }
  return sides
}

// ============================================================
// Format angka
// ============================================================
function fmtArea(m2) {
  if (m2 >= 10000) return `${(m2 / 10000).toLocaleString('id-ID', { maximumFractionDigits: 4 })} ha`
  return `${m2.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m\u00B2`
}

function fmtLen(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(3)} km`
  return `${m.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m`
}

// ============================================================
// Panel Hasil
// ============================================================
function ResultPanel({ area, perimeter, sides, onReset, onCopy }) {
  if (!area && area !== 0) return null
  const sideLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return (
    <div className="lm-result-panel">
      <div className="lm-result-head">
        <Ruler size={15} />
        <strong>Hasil Pengukuran</strong>
        <button className="lm-icon-btn" onClick={onReset} title="Reset"><RotateCcw size={13} /></button>
      </div>
      <div className="lm-result-grid">
        <div className="lm-result-item highlight">
          <span className="lm-result-label">Luas</span>
          <span className="lm-result-value">{fmtArea(area)}</span>
          {area >= 10000 && <span className="lm-result-sub">{area.toLocaleString('id-ID', { maximumFractionDigits: 2 })} m\u00B2</span>}
        </div>
        <div className="lm-result-item">
          <span className="lm-result-label">Keliling</span>
          <span className="lm-result-value">{fmtLen(perimeter)}</span>
        </div>
      </div>
      {sides.length > 0 && (
        <div className="lm-sides">
          <div className="lm-sides-title">Panjang Tiap Sisi</div>
          {sides.map((s, i) => (
            <div key={i} className="lm-side-row">
              <span className="lm-side-label">Sisi {sideLabels[i]}\u2192{sideLabels[(i+1)%sides.length]}</span>
              <span className="lm-side-val">{fmtLen(s)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="lm-result-actions">
        <button className="lm-action-btn" onClick={onCopy}><Copy size={13} /> Salin</button>
      </div>
    </div>
  )
}

// ============================================================
// Tab 1: Peta (Leaflet + OpenStreetMap) + GPS Autotrack
// ============================================================
function MapTab({ onResult }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markersRef = useRef([])
  const polygonRef = useRef(null)
  const polylinesRef = useRef([])
  const watchIdRef = useRef(null)
  const [points, setPoints] = useState([])
  const [closed, setClosed] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [leafletReady, setLeafletReady] = useState(!!window.L)
  const [gpsError, setGpsError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToast } = useStore()

  // Load Leaflet CSS + JS via CDN
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return }
    setLoading(true)
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => { setLeafletReady(true); setLoading(false) }
    script.onerror = () => { setLoading(false) }
    document.head.appendChild(script)
    return () => {
      css.remove(); script.remove()
    }
  }, [])

  // Init map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMapRef.current) return
    const L = window.L
    const map = L.map(mapRef.current).setView([-6.2, 106.8], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    leafletMapRef.current = map
    map.on('click', (e) => {
      if (closed) return
      addGpsPoint(e.latlng.lat, e.latlng.lng)
    })
    // Try get user location
    map.locate({ setView: true, maxZoom: 18 })
    return () => {
      map.remove()
      leafletMapRef.current = null
    }
  }, [leafletReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const addGpsPoint = useCallback((lat, lng) => {
    const L = window.L
    const map = leafletMapRef.current
    if (!map || !L) return
    setPoints((prev) => {
      const next = [...prev, { lat, lng }]
      // Tambah marker
      const marker = L.circleMarker([lat, lng], {
        radius: 8, color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 0.9,
      }).addTo(map)
      marker.bindTooltip(`${next.length}`, { permanent: true, className: 'lm-marker-label', direction: 'top' })
      markersRef.current.push(marker)
      // Update polyline
      polylinesRef.current.forEach((pl) => map.removeLayer(pl))
      polylinesRef.current = []
      if (next.length > 1) {
        const pl = L.polyline(next.map((p) => [p.lat, p.lng]), { color: '#FF6B35', weight: 2, dashArray: '6,4' }).addTo(map)
        polylinesRef.current.push(pl)
      }
      return next
    })
  }, [closed])

  const closePolygon = () => {
    const L = window.L
    const map = leafletMapRef.current
    if (!map || !L || points.length < 3) return
    polylinesRef.current.forEach((pl) => map.removeLayer(pl))
    polylinesRef.current = []
    if (polygonRef.current) map.removeLayer(polygonRef.current)
    polygonRef.current = L.polygon(points.map((p) => [p.lat, p.lng]), {
      color: '#FF6B35', fillColor: '#FF6B35', fillOpacity: 0.15, weight: 2,
    }).addTo(map)
    setClosed(true)
    const area = gpsPolygonArea(points)
    const sides = gpsPerimeterSides(points)
    const perimeter = sides.reduce((a, b) => a + b, 0)
    onResult({ area, perimeter, sides })
  }

  const startTracking = () => {
    if (!navigator.geolocation) { setGpsError('Geolocation tidak didukung browser ini.'); return }
    setGpsError('')
    setTracking(true)
    let lastLat = null, lastLng = null
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        if (lastLat === null || haversineDistance(lastLat, lastLng, lat, lng) > 1.5) {
          addGpsPoint(lat, lng)
          lastLat = lat; lastLng = lng
        }
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    setTracking(false)
  }

  const resetAll = () => {
    const L = window.L
    const map = leafletMapRef.current
    if (map && L) {
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []
      polylinesRef.current.forEach((pl) => map.removeLayer(pl))
      polylinesRef.current = []
      if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null }
    }
    stopTracking()
    setPoints([]); setClosed(false)
    onResult(null)
  }

  return (
    <div className="lm-map-tab">
      {loading && (
        <div className="lm-loading"><Loader2 size={18} className="spin" /> Memuat peta…</div>
      )}
      <div className="lm-map-toolbar">
        {!tracking ? (
          <button className="lm-btn-primary" onClick={startTracking} disabled={closed}>
            <Play size={13} /> GPS Autotrack
          </button>
        ) : (
          <button className="lm-btn-danger" onClick={stopTracking}>
            <Square size={13} /> Stop Lacak
          </button>
        )}
        <button
          className="lm-btn-secondary"
          onClick={closePolygon}
          disabled={points.length < 3 || closed}
        >
          <Check size={13} /> Tutup Poligon
        </button>
        <button className="lm-btn-ghost" onClick={resetAll}>
          <RotateCcw size={13} /> Reset
        </button>
        <span className="lm-point-count">{points.length} titik</span>
        {tracking && <span className="lm-gps-badge"><Navigation size={11} className="spin-slow" /> Live</span>}
      </div>
      {gpsError && <div className="lm-error"><AlertTriangle size={13} /> {gpsError}</div>}
      <div ref={mapRef} className="lm-map-container" />
      {!closed && points.length > 0 && (
        <div className="lm-map-hint">
          Klik peta untuk tambah titik · atau <strong>Tutup Poligon</strong> jika sudah ≥3 titik
        </div>
      )}
    </div>
  )
}

// ============================================================
// Tab 2: Canvas Poligon (tanpa GPS)
// ============================================================
function CanvasTab({ onResult }) {
  const canvasRef = useRef(null)
  const [points, setPoints] = useState([])
  const [closed, setClosed] = useState(false)
  const [scale, setScale] = useState(0.1) // 1 pixel = X meter
  const [dragging, setDragging] = useState(null)
  const [hoverClose, setHoverClose] = useState(false)

  const CLOSE_RADIUS = 14

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (points.length === 0) return

    // Fill polygon jika sudah closed
    if (closed && points.length >= 3) {
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      points.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 107, 53, 0.12)'
      ctx.fill()
    }

    // Garis
    ctx.strokeStyle = '#FF6B35'
    ctx.lineWidth = 2
    ctx.setLineDash(closed ? [] : [6, 4])
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach((p) => ctx.lineTo(p.x, p.y))
    if (closed) ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    // Titik-titik
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, i === 0 && !closed ? CLOSE_RADIUS : 6, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 && !closed ? (hoverClose ? '#22c55e' : '#FF6B35') : '#FF6B35'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      // Label
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(i + 1, p.x, p.y)
    })

    // Label panjang sisi
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % (closed ? points.length : Math.max(points.length - 1, 1))
      if (!closed && i === points.length - 1) break
      const a = points[i], b = points[j]
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
      const dx = b.x - a.x, dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy) * scale
      ctx.fillStyle = 'var(--text-primary, #fff)'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(fmtLen(len), mx, my - 10)
    }
  }, [points, closed, scale, hoverClose])

  useEffect(() => { draw() }, [draw])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const distToPoint = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

  const handleCanvasClick = (e) => {
    if (closed) return
    const pos = getPos(e)
    // Cek apakah klik dekat titik pertama (untuk tutup)
    if (points.length >= 3 && distToPoint(pos, points[0]) < CLOSE_RADIUS) {
      setClosed(true)
      const area = shoelaceArea(points.map((p) => ({ x: p.x * scale, y: p.y * scale }))) / (scale * scale) * scale * scale
      const realArea = shoelaceArea(points) * scale * scale
      const sides = canvasPerimeterSides(points, scale)
      const perimeter = sides.reduce((a, b) => a + b, 0)
      onResult({ area: realArea, perimeter, sides })
      return
    }
    // Cek apakah klik di titik lama (drag)
    const hitIdx = points.findIndex((p) => distToPoint(pos, p) < 10)
    if (hitIdx >= 0) return
    setPoints((prev) => [...prev, pos])
  }

  const handleMouseMove = (e) => {
    if (closed) return
    const pos = getPos(e)
    if (dragging !== null) {
      setPoints((prev) => prev.map((p, i) => i === dragging ? pos : p))
      if (closed) recalculate()
      return
    }
    if (points.length >= 3) {
      setHoverClose(distToPoint(pos, points[0]) < CLOSE_RADIUS)
    }
  }

  const handleMouseDown = (e) => {
    const pos = getPos(e)
    const hitIdx = points.findIndex((p) => distToPoint(pos, p) < 12)
    if (hitIdx >= 0) setDragging(hitIdx)
  }

  const handleMouseUp = () => {
    if (dragging !== null) {
      setDragging(null)
      if (closed) recalculate()
    }
  }

  const recalculate = () => {
    const realArea = shoelaceArea(points) * scale * scale
    const sides = canvasPerimeterSides(points, scale)
    const perimeter = sides.reduce((a, b) => a + b, 0)
    onResult({ area: realArea, perimeter, sides })
  }

  const resetAll = () => {
    setPoints([]); setClosed(false); onResult(null)
  }

  const closePoly = () => {
    if (points.length < 3) return
    setClosed(true)
    const realArea = shoelaceArea(points) * scale * scale
    const sides = canvasPerimeterSides(points, scale)
    const perimeter = sides.reduce((a, b) => a + b, 0)
    onResult({ area: realArea, perimeter, sides })
  }

  return (
    <div className="lm-canvas-tab">
      <div className="lm-canvas-toolbar">
        <label className="lm-scale-label">
          Skala: 1 px =
          <input
            type="number"
            className="lm-scale-input"
            value={scale}
            step="0.01"
            min="0.001"
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v > 0) { setScale(v); if (closed) recalculate() }
            }}
          />
          m
        </label>
        <button
          className="lm-btn-secondary"
          onClick={closePoly}
          disabled={points.length < 3 || closed}
        >
          <Check size={13} /> Tutup
        </button>
        <button className="lm-btn-ghost" onClick={resetAll}>
          <RotateCcw size={13} /> Reset
        </button>
        <span className="lm-point-count">{points.length} titik</span>
      </div>
      {!closed && points.length === 0 && (
        <div className="lm-canvas-hint">
          <PenLine size={16} />
          Klik / tap untuk menambah titik sudut — klik titik pertama lagi untuk menutup poligon
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="lm-canvas"
        width={800}
        height={520}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => { handleMouseDown(e); e.preventDefault() }}
        onTouchMove={(e) => { handleMouseMove(e); e.preventDefault() }}
        onTouchEnd={() => handleMouseUp()}
      />
    </div>
  )
}

// ============================================================
// Main component
// ============================================================
export default function LandMeasurement() {
  const [tab, setTab] = useState('map') // 'map' | 'canvas'
  const [result, setResult] = useState(null)

  const copyResult = async () => {
    if (!result) return
    const { area, perimeter, sides } = result
    const sideLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const text = [
      `Luas: ${fmtArea(area)}`,
      `Keliling: ${fmtLen(perimeter)}`,
      ...sides.map((s, i) => `Sisi ${sideLabels[i]}\u2192${sideLabels[(i+1)%sides.length]}: ${fmtLen(s)}`),
    ].join('\n')
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
  }

  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-header-left">
          <Ruler size={20} className="lm-header-icon" />
          <div>
            <h1>Land Measurement</h1>
            <p>Ukur luas tanah, bangunan &amp; poligon via GPS, peta, atau gambar bebas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lm-tabs">
        <button
          className={`lm-tab ${tab === 'map' ? 'active' : ''}`}
          onClick={() => setTab('map')}
        >
          <MapPin size={14} /> Peta + GPS
        </button>
        <button
          className={`lm-tab ${tab === 'canvas' ? 'active' : ''}`}
          onClick={() => setTab('canvas')}
        >
          <PenLine size={14} /> Poligon Canvas
        </button>
      </div>

      {/* Content */}
      <div className="lm-body">
        <div className="lm-main">
          {tab === 'map' && <MapTab onResult={setResult} />}
          {tab === 'canvas' && <CanvasTab onResult={setResult} />}
        </div>

        {/* Result panel */}
        <div className="lm-sidebar">
          {result ? (
            <ResultPanel
              area={result.area}
              perimeter={result.perimeter}
              sides={result.sides}
              onReset={() => setResult(null)}
              onCopy={copyResult}
            />
          ) : (
            <div className="lm-result-empty">
              <Maximize2 size={32} className="lm-result-empty-icon" />
              <p>Gambar poligon di peta atau canvas untuk melihat luas &amp; ukuran.</p>
              <ul>
                <li><strong>Peta + GPS:</strong> Klik peta untuk taruh titik, atau aktifkan GPS Autotrack saat berjalan mengelilingi area.</li>
                <li><strong>Poligon Canvas:</strong> Klik/tap untuk menggambar bebas, lalu set skala (1 px = X meter).</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
