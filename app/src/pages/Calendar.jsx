import { useState, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import './Calendar.css'

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const DAY_NAMES  = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const EVENT_COLORS = [
  '#6C2EF2', '#0780FA', '#00D9A5', '#FFB830', '#E94560', '#EC4899'
]

function buildDays(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevLast = new Date(year, month, 0).getDate()
  const days = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevLast - i, cur: false, date: new Date(year, month - 1, prevLast - i) })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, cur: true, date: new Date(year, month, i) })
  }
  const rem = 42 - days.length
  for (let i = 1; i <= rem; i++) {
    days.push({ day: i, cur: false, date: new Date(year, month + 1, i) })
  }
  return days
}

function isToday(date) {
  const t = new Date()
  return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear()
}

function isSameDate(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export default function Calendar() {
  const { tasks, projects } = useStore()
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [view, setView] = useState('Bulan') // Bulan | Minggu | Hari
  const [miniDate, setMiniDate] = useState(new Date())

  const mainDays  = useMemo(() => buildDays(current),  [current])
  const miniDays  = useMemo(() => buildDays(miniDate), [miniDate])

  // Collect all events from tasks + projects
  const allEvents = useMemo(() => {
    const evs = []
    let colorIdx = 0
    projects.forEach((p, pi) => {
      const color = EVENT_COLORS[pi % EVENT_COLORS.length]
      p.stages?.forEach(stage => {
        stage.checklist?.forEach(item => {
          if (p.createdAt) {
            evs.push({
              id: `${p.id}-${item.id || Math.random()}`,
              title: item.text,
              date: new Date(p.createdAt),
              color,
              type: 'project',
              project: p.name,
            })
          }
        })
      })
    })
    tasks.forEach((t, ti) => {
      if (t.dueDate) {
        evs.push({
          id: t.id,
          title: t.title,
          date: new Date(t.dueDate),
          color: EVENT_COLORS[(ti + 2) % EVENT_COLORS.length],
          type: 'task',
          project: t.project || '',
        })
      }
    })
    return evs
  }, [tasks, projects])

  const getEventsForDate = (date) => allEvents.filter(e => isSameDate(e.date, date))

  const selectedEvents = useMemo(() => getEventsForDate(selected), [selected, allEvents])

  // Calendar legend
  const legend = [
    { label: 'Tugas Project', color: '#6C2EF2' },
    { label: 'Deadline', color: '#E94560' },
    { label: 'Selesai', color: '#00D9A5' },
    { label: 'Pribadi', color: '#FFB830' },
  ]

  // My Calendar & Team Calendar placeholders
  const myCalendars = ['Semua Kegiatan', 'Jadwal Pribadi', 'Deadline Proyek', 'Rapat Tim']
  const teamCalendars = ['Tim Teknis', 'Tim Desain', 'Tim Marketing']

  return (
    <motion.div className="cal-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="cal-topbar">
        <div>
          <h1>Kalender</h1>
          <p>Pantau semua tugas, deadline, dan jadwal tim dalam satu tampilan.</p>
        </div>
        <div className="cal-view-tabs">
          {['Bulan', 'Minggu', 'Hari'].map(v => (
            <button key={v} className={`cal-view-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="cal-body">
        {/* ── Sidebar ── */}
        <aside className="cal-sidebar">
          {/* Mini Calendar */}
          <div className="mini-cal">
            <div className="mini-cal-nav">
              <button onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1))}><ChevronLeft size={14} /></button>
              <span>{MONTH_NAMES[miniDate.getMonth()]} {miniDate.getFullYear()}</span>
              <button onClick={() => setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1))}><ChevronRight size={14} /></button>
            </div>
            <div className="mini-grid-head">
              {DAY_NAMES.map(d => <div key={d}>{d[0]}</div>)}
            </div>
            <div className="mini-grid">
              {miniDays.map((d, i) => (
                <button
                  key={i}
                  className={[
                    'mini-day',
                    !d.cur ? 'other' : '',
                    isToday(d.date) ? 'today' : '',
                    isSameDate(d.date, selected) ? 'selected' : '',
                  ].join(' ')}
                  onClick={() => { setSelected(d.date); setCurrent(new Date(d.date.getFullYear(), d.date.getMonth(), 1)) }}
                >
                  {d.day}
                </button>
              ))}
            </div>
          </div>

          {/* My Calendar */}
          <div className="sidebar-cal-section">
            <h4>Kalender Saya</h4>
            {myCalendars.map((c, i) => (
              <label key={c} className="cal-check-item">
                <input type="checkbox" defaultChecked={i < 3} />
                <span className="cal-dot" style={{ background: EVENT_COLORS[i] }} />
                <span>{c}</span>
              </label>
            ))}
          </div>

          {/* Team Calendar */}
          <div className="sidebar-cal-section">
            <h4>Kalender Tim</h4>
            {teamCalendars.map((c, i) => (
              <label key={c} className="cal-check-item">
                <input type="checkbox" defaultChecked />
                <span className="cal-dot" style={{ background: EVENT_COLORS[i + 2] }} />
                <span>{c}</span>
              </label>
            ))}
          </div>

          {/* Legend */}
          <div className="sidebar-cal-section">
            <h4>Keterangan</h4>
            {legend.map(l => (
              <div key={l.label} className="cal-legend-item">
                <span className="cal-legend-dot" style={{ background: l.color }} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main Calendar ── */}
        <div className="cal-main">
          {/* Month nav */}
          <div className="cal-nav">
            <div className="cal-nav-left">
              <button className="cal-nav-btn" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
              <h2 className="cal-month-title">{MONTH_NAMES[current.getMonth()]} {current.getFullYear()}</h2>
              <button className="cal-nav-btn" onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
            </div>
            <button className="cal-today-btn" onClick={() => { const t = new Date(); setCurrent(new Date(t.getFullYear(), t.getMonth(), 1)); setSelected(t); }}>Hari Ini</button>
          </div>

          {/* Day headers */}
          <div className="cal-grid-head">
            {DAY_NAMES.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Grid */}
          <div className="cal-grid">
            {mainDays.map((d, idx) => {
              const events = getEventsForDate(d.date)
              return (
                <div
                  key={idx}
                  className={[
                    'cal-cell',
                    !d.cur ? 'other-month' : '',
                    isToday(d.date) ? 'today' : '',
                    isSameDate(d.date, selected) ? 'selected' : '',
                  ].join(' ')}
                  onClick={() => setSelected(d.date)}
                >
                  <span className="cal-cell-num">{d.day}</span>
                  <div className="cal-cell-events">
                    {events.slice(0, 3).map((ev, ei) => (
                      <div key={ei} className="cal-event-pill" style={{ background: `${ev.color}18`, color: ev.color, borderLeft: `3px solid ${ev.color}` }}>
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 3 && <span className="cal-more">+{events.length - 3} lagi</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected day events panel */}
          {selectedEvents.length > 0 && (
            <div className="cal-day-panel">
              <h4>{selected.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
              <div className="cal-day-events">
                {selectedEvents.map(ev => (
                  <div key={ev.id} className="cal-day-event-item" style={{ borderLeft: `4px solid ${ev.color}` }}>
                    <span className="cal-day-event-title">{ev.title}</span>
                    {ev.project && <span className="cal-day-event-project">{ev.project}</span>}
                    <span className="cal-day-event-type" style={{ color: ev.color }}>{ev.type === 'project' ? 'Project' : 'Tugas'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}