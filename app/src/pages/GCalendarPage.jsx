import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays, RefreshCw, Plus, Trash2, ExternalLink, Users, Video,
  AlertTriangle, Loader2, LogOut, Repeat, Clock, X, Zap, CheckCircle2,
} from 'lucide-react'
import useGoogleAuth from '../hooks/useGoogleAuth'
import GoogleLoginGate from '../components/GoogleLoginGate'
import {
  CALENDAR_PAGE_SCOPES, listCalendars, listEvents, createEvent, deleteEvent,
  quickAddEvent, queryFreeBusy, buildWeeklyRule,
} from '../services/gcalendarApi'
import './GooglePages.css'

// =====================================================================
// GCalendarPage — Google Calendar API v3.
// =====================================================================
// Halaman ini SENGAJA terpisah dari pages/Calendar.jsx (kalender internal
// Luxio yang datanya lokal). Di sini semua data datang dari akun Google
// user lewat OAuth.
//
// Dokumentasi: koleksi dokumentasi api/google api/calendar-docs/
// =====================================================================

const PERM_LIST = [
  'Melihat daftar kalender Google kamu',
  'Membaca acara pada rentang tanggal yang kamu buka',
  'Membuat, mengubah, dan menghapus acara atas perintah kamu',
  'Mengecek jadwal sibuk (free/busy) untuk mencari slot kosong',
]

const RANGES = [
  { id: '7', label: '7 hari' },
  { id: '30', label: '30 hari' },
  { id: '90', label: '90 hari' },
]

const WEEKDAYS = [
  { id: 'MO', label: 'Sen' }, { id: 'TU', label: 'Sel' }, { id: 'WE', label: 'Rab' },
  { id: 'TH', label: 'Kam' }, { id: 'FR', label: 'Jum' }, { id: 'SA', label: 'Sab' },
  { id: 'SU', label: 'Min' },
]

const fmtDateTime = (iso, allDay) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return allDay
      ? d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
      : d.toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const dayKey = (iso) => {
  try { return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }) }
  catch { return '—' }
}

// Nilai untuk <input type="datetime-local"> (tanpa zona, waktu lokal).
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function GCalendarPage() {
  const auth = useGoogleAuth(CALENDAR_PAGE_SCOPES)

  const [calendars, setCalendars] = useState([])
  const [activeCal, setActiveCal] = useState('primary')
  const [events, setEvents] = useState([])
  const [range, setRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quickText, setQuickText] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busySlots, setBusySlots] = useState(null)

  const [form, setForm] = useState(() => {
    const start = new Date()
    start.setMinutes(0, 0, 0)
    start.setHours(start.getHours() + 1)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)
    return {
      summary: '', description: '', location: '',
      start: toLocalInput(start), end: toLocalInput(end),
      allDay: false, withMeet: false, attendees: '',
      repeatWeekly: false, days: ['MO'], count: 8, sendUpdates: 'none',
    }
  })

  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const activeCalObj = useMemo(
    () => calendars.find((c) => c.id === activeCal) || null,
    [calendars, activeCal],
  )

  const loadCalendars = useCallback(async () => {
    try {
      const list = await listCalendars()
      setCalendars(list)
      const primary = list.find((c) => c.primary)
      if (primary) setActiveCal(primary.id)
    } catch (e) {
      setError(e.message || 'Gagal memuat daftar kalender.')
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + Number(range))
      const res = await listEvents(activeCal, {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        maxResults: 100,
      })
      setEvents(res.events)
    } catch (e) {
      setError(e.message || 'Gagal memuat acara.')
    } finally {
      setLoading(false)
    }
  }, [activeCal, range])

  useEffect(() => {
    if (auth.ready) loadCalendars()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.ready])

  useEffect(() => {
    if (auth.ready) loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.ready, activeCal, range])

  const onQuickAdd = async (e) => {
    e.preventDefault()
    if (!quickText.trim()) return
    try {
      const ev = await quickAddEvent(activeCal, quickText.trim())
      showToast(`Acara "${ev.summary}" dibuat.`)
      setQuickText('')
      loadEvents()
    } catch (err) { setError(err.message || 'quickAdd gagal. Coba tulis lebih spesifik, mis. "Rapat tim Senin 10:00".') }
  }

  const onCreate = async () => {
    if (!form.summary.trim()) { setError('Judul acara wajib diisi.'); return }
    setError('')
    try {
      const payload = {
        summary: form.summary.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        allDay: form.allDay,
        // Acara all-day memakai YYYY-MM-DD dan end bersifat eksklusif.
        start: form.allDay ? form.start.slice(0, 10) : new Date(form.start).toISOString(),
        end: form.allDay
          ? new Date(new Date(form.end.slice(0, 10)).getTime() + 86400000).toISOString().slice(0, 10)
          : new Date(form.end).toISOString(),
        attendees: form.attendees.split(',').map((s) => s.trim()).filter(Boolean),
        recurrence: form.repeatWeekly ? buildWeeklyRule(form.days, Number(form.count) || 0) : [],
        luxioRef: `luxio-${Date.now()}`,
      }
      const ev = await createEvent(activeCal, payload, {
        sendUpdates: form.sendUpdates,
        withMeet: form.withMeet,
      })
      showToast(`Acara "${ev.summary}" dibuat${ev.meetLink ? ' dengan tautan Meet' : ''}.`)
      setShowForm(false)
      loadEvents()
    } catch (err) { setError(err.message || 'Gagal membuat acara.') }
  }

  const onDelete = async (ev) => {
    if (!window.confirm(`Hapus acara "${ev.summary}"?`)) return
    try {
      await deleteEvent(activeCal, ev.id, { sendUpdates: 'none' })
      setEvents((prev) => prev.filter((x) => x.id !== ev.id))
      showToast('Acara dihapus.')
    } catch (err) { setError(err.message || 'Gagal menghapus acara.') }
  }

  const onCheckBusy = async () => {
    try {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 7)
      const res = await queryFreeBusy({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        ids: [activeCal],
      })
      setBusySlots(res[activeCal]?.busy || [])
      showToast('Jadwal sibuk 7 hari ke depan dimuat.')
    } catch (err) { setError(err.message || 'freeBusy gagal.') }
  }

  // Kelompokkan acara per hari untuk tampilan agenda.
  const grouped = useMemo(() => {
    const map = new Map()
    events.forEach((ev) => {
      const k = dayKey(ev.start)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(ev)
    })
    return [...map.entries()]
  }, [events])

  const stats = useMemo(() => ({
    total: events.length,
    recurring: events.filter((e) => e.isRecurring).length,
    withGuests: events.filter((e) => e.attendees.length > 0).length,
    withMeet: events.filter((e) => e.meetLink).length,
  }), [events])

  // ---------- Gate ----------
  if (!auth.configured || !auth.ready) {
    return (
      <div className="gcal-page">
        <GoogleLoginGate
          icon={CalendarDays}
          color="#4285F4"
          title="Hubungkan Google Calendar"
          desc="Lihat dan buat acara Google Calendar langsung dari Luxio, termasuk rapat berulang dan tautan Google Meet."
          perms={PERM_LIST}
          note="Luxio memakai scope calendar.readonly + calendar.events. Aplikasi tidak bisa mengubah pengaturan akun Google kamu."
          error={!auth.configured
            ? 'VITE_GOOGLE_CLIENT_ID belum diatur, jadi login Google belum bisa dipakai.'
            : auth.error}
          busy={auth.busy}
          onLogin={auth.login}
        />
      </div>
    )
  }

  return (
    <div className="gcal-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>
            <CalendarDays size={20} style={{ color: '#4285F4', verticalAlign: '-3px' }} /> Google Calendar
          </h1>
          <p>{auth.email ? `Masuk sebagai ${auth.email}` : 'Kelola acara Google Calendar'}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={loadEvents} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'gp-spin' : ''} /> Muat ulang
          </button>
          <button className="btn btn-secondary" onClick={onCheckBusy}>
            <Clock size={14} /> Cek sibuk
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={activeCalObj ? !activeCalObj.canWrite : false}
            title={activeCalObj && !activeCalObj.canWrite ? 'Kalender ini hanya bisa dibaca' : undefined}
          >
            <Plus size={14} /> Acara
          </button>
          <button className="btn btn-ghost" onClick={auth.logout} title="Cabut akses Calendar">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="gp-error">
          <AlertTriangle size={15} /> <span>{error}</span>
        </div>
      )}

      <div className="gp-stats">
        <div className="gp-stat">
          <div className="gp-stat-label">Acara</div>
          <div className="gp-stat-value">{stats.total}</div>
          <div className="gp-stat-sub">{range} hari ke depan</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><Repeat size={11} /> Berulang</div>
          <div className="gp-stat-value">{stats.recurring}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><Users size={11} /> Dengan peserta</div>
          <div className="gp-stat-value">{stats.withGuests}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><Video size={11} /> Punya Meet</div>
          <div className="gp-stat-value">{stats.withMeet}</div>
        </div>
      </div>

      <div className="gp-toolbar">
        <select
          className="input"
          value={activeCal}
          onChange={(e) => setActiveCal(e.target.value)}
          aria-label="Pilih kalender"
          style={{ maxWidth: 260 }}
        >
          {calendars.length === 0 && <option value="primary">Kalender utama</option>}
          {calendars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.summary}{c.primary ? ' (utama)' : ''}{c.canWrite ? '' : ' — baca saja'}
            </option>
          ))}
        </select>
        {RANGES.map((r) => (
          <button
            key={r.id}
            className={`gp-tab ${range === r.id ? 'active' : ''}`}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <form className="gp-toolbar" onSubmit={onQuickAdd}>
        <div className="gp-search">
          <Zap size={14} />
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder='Tambah cepat, mis. "Rapat tim Senin 10:00"'
            aria-label="Tambah acara cepat"
          />
        </div>
        <button
          className="btn btn-secondary"
          type="submit"
          disabled={!quickText.trim() || (activeCalObj ? !activeCalObj.canWrite : false)}
        >
          Tambah
        </button>
      </form>

      {busySlots && (
        <div className="gp-panel">
          <div className="gp-panel-head">
            <h3><Clock size={15} /> Jadwal sibuk 7 hari ke depan</h3>
            <button className="btn btn-ghost" onClick={() => setBusySlots(null)}><X size={14} /></button>
          </div>
          <div className="gp-panel-body flush">
            {busySlots.length === 0 ? (
              <div className="gp-empty"><CheckCircle2 size={24} /> Tidak ada jadwal sibuk. Semua slot kosong.</div>
            ) : (
              busySlots.map((s, i) => (
                <div key={i} className="gp-row">
                  <div className="gp-row-icon"><Clock size={16} /></div>
                  <div className="gp-row-main">
                    <div className="gp-row-title">{fmtDateTime(s.start)}</div>
                    <div className="gp-row-sub">sampai {fmtDateTime(s.end)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {loading && events.length === 0 ? (
        <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Memuat acara...</div>
      ) : grouped.length === 0 ? (
        <div className="gp-empty">
          <CalendarDays size={26} />
          Tidak ada acara pada {range} hari ke depan.
        </div>
      ) : (
        grouped.map(([day, list]) => (
          <div className="gp-panel" key={day}>
            <div className="gp-panel-head">
              <h3>{day}</h3>
              <span className="gp-chip">{list.length} acara</span>
            </div>
            <div className="gp-panel-body flush">
              {list.map((ev) => (
                <div key={ev.id} className="gp-row">
                  <div
                    className="gp-row-icon"
                    style={{ background: activeCalObj?.color || 'var(--bg-tertiary)' }}
                  >
                    <CalendarDays size={16} />
                  </div>
                  <div className="gp-row-main">
                    <div className="gp-row-title">
                      {ev.summary}
                      {ev.isRecurring && <Repeat size={11} style={{ marginLeft: 6, opacity: 0.7 }} />}
                    </div>
                    <div className="gp-row-sub">
                      {ev.allDay ? 'Sepanjang hari' : fmtDateTime(ev.start)}
                      {ev.location ? ` · ${ev.location}` : ''}
                      {ev.attendees.length ? ` · ${ev.attendees.length} peserta` : ''}
                    </div>
                  </div>
                  <div className="gp-row-actions">
                    {ev.meetLink && (
                      <a
                        className="btn btn-ghost"
                        href={ev.meetLink}
                        target="_blank"
                        rel="noopener"
                        title="Gabung Google Meet"
                        style={{ padding: '5px 7px' }}
                      >
                        <Video size={14} />
                      </a>
                    )}
                    {ev.htmlLink && (
                      <a
                        className="btn btn-ghost"
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener"
                        title="Buka di Google Calendar"
                        style={{ padding: '5px 7px' }}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {activeCalObj?.canWrite !== false && (
                      <button className="danger" onClick={() => onDelete(ev)} title="Hapus acara">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="gp-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="gp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gp-modal-header">
              <h2><Plus size={16} /> Acara baru</h2>
              <button className="gp-modal-close" onClick={() => setShowForm(false)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            <div className="gp-modal-body">
              <label className="input-label" htmlFor="ev-title">Judul</label>
              <input
                id="ev-title"
                className="input"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Rapat mingguan tim"
              />

              <label className="input-label" htmlFor="ev-desc" style={{ marginTop: 12 }}>Deskripsi</label>
              <input
                id="ev-desc"
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Agenda singkat (opsional)"
              />

              <label className="input-label" htmlFor="ev-loc" style={{ marginTop: 12 }}>Lokasi</label>
              <input
                id="ev-loc"
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ruang rapat / online (opsional)"
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                />
                Sepanjang hari
              </label>

              <label className="input-label" htmlFor="ev-start" style={{ marginTop: 12 }}>Mulai</label>
              <input
                id="ev-start"
                className="input"
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.start.slice(0, 10) : form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />

              <label className="input-label" htmlFor="ev-end" style={{ marginTop: 12 }}>Selesai</label>
              <input
                id="ev-end"
                className="input"
                type={form.allDay ? 'date' : 'datetime-local'}
                value={form.allDay ? form.end.slice(0, 10) : form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />

              <label className="input-label" htmlFor="ev-guests" style={{ marginTop: 12 }}>
                Peserta (email, pisahkan koma)
              </label>
              <input
                id="ev-guests"
                className="input"
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
                placeholder="andi@contoh.com, budi@contoh.com"
              />

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={form.withMeet}
                  onChange={(e) => setForm({ ...form, withMeet: e.target.checked })}
                />
                Buat tautan Google Meet
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={form.repeatWeekly}
                  onChange={(e) => setForm({ ...form, repeatWeekly: e.target.checked })}
                />
                Ulangi setiap minggu
              </label>

              {form.repeatWeekly && (
                <>
                  <div className="input-label" style={{ marginTop: 12 }}>Hari pengulangan</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`gp-tab ${form.days.includes(d.id) ? 'active' : ''}`}
                        onClick={() => setForm({
                          ...form,
                          days: form.days.includes(d.id)
                            ? form.days.filter((x) => x !== d.id)
                            : [...form.days, d.id],
                        })}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <label className="input-label" htmlFor="ev-count" style={{ marginTop: 12 }}>
                    Jumlah pengulangan
                  </label>
                  <input
                    id="ev-count"
                    className="input"
                    type="number"
                    min="1"
                    max="365"
                    value={form.count}
                    onChange={(e) => setForm({ ...form, count: e.target.value })}
                  />
                </>
              )}

              <label className="input-label" htmlFor="ev-notify" style={{ marginTop: 12 }}>
                Kirim undangan email
              </label>
              <select
                id="ev-notify"
                className="input"
                value={form.sendUpdates}
                onChange={(e) => setForm({ ...form, sendUpdates: e.target.value })}
              >
                <option value="none">Jangan kirim</option>
                <option value="externalOnly">Hanya peserta di luar organisasi</option>
                <option value="all">Kirim ke semua peserta</option>
              </select>
            </div>
            <div className="gp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={onCreate} disabled={!form.summary.trim()}>
                <Plus size={14} /> Buat acara
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="gp-toast">{toast}</div>}
    </div>
  )
}
