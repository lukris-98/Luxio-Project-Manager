import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Folder,
  Inbox,
  Plus,
  Target,
  Users,
} from 'lucide-react'
import './Dashboard.css'

const projectColors = ['purple', 'orange', 'pink', 'blue']
const activityColors = ['orange', 'pink', 'blue', 'green']

const PIE_COLORS = ['#6C2EF2', '#25C26E', '#F59E0B', '#0780FA']

const initials = (name = '') =>
  name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'MO'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const priorityLabel = (priority) => {
  if (priority === 'high') return 'Tinggi'
  if (priority === 'medium') return 'Sedang'
  if (priority === 'low') return 'Rendah'
  return 'Normal'
}

const statusLabel = (status) => {
  if (status === 'completed') return 'Selesai'
  if (status === 'in_progress') return 'Dalam Proses'
  return 'Belum Mulai'
}

function MiniCalendar({ tasks }) {
  const now = new Date()
  const [view, setView] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }))
  const [selected, setSelected] = useState(null)
  const today = new Date()
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Map tanggal ('YYYY-MM-DD') -> daftar task dengan deadline di tanggal itu.
  const taskMap = useMemo(() => {
    const map = {}
    ;(tasks || []).forEach((t) => {
      const d = t.deadline || t.dueDate
      if (!d) return
      const key = String(d).slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return map
  }, [tasks])

  const monthName = new Date(view.year, view.month, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const firstDay = new Date(view.year, view.month, 1)
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const offset = firstDay.getDay()
  const days = []

  for (let i = 0; i < offset; i++) days.push(null)
  for (let day = 1; day <= daysInMonth; day++) days.push(day)

  const prevMonth = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))
  const nextMonth = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))

  const selectedTasks = selected ? taskMap[selected] || [] : []

  return (
    <div className="dash-calendar">
      <div className="dash-calendar-head">
        <strong>{monthName}</strong>
        <span>
          <button type="button" aria-label="Bulan sebelumnya" onClick={prevMonth}>‹</button>
          <button type="button" aria-label="Bulan berikutnya" onClick={nextMonth}>›</button>
        </span>
      </div>
      <div className="dash-calendar-week">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="dash-calendar-grid">
        {days.slice(0, 35).map((day, idx) => {
          if (!day) return <span key={`blank-${idx}`} className="dash-day blank" />
          const key = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = taskMap[key] || []
          const hasCompleted = dayTasks.some((t) => t.status === 'completed')
          const hasUnfinished = dayTasks.some((t) => t.status !== 'completed')
          const hasLate = dayTasks.some((t) => t.status !== 'completed' && key < todayKey)
          const isToday = key === todayKey
          return (
            <button
              type="button"
              key={key}
              className={`dash-day${isToday ? ' today' : ''}${selected === key ? ' selected' : ''}`}
              onClick={() => setSelected(selected === key ? null : key)}
              aria-label={`${day} ${monthName}`}
            >
              <span className="dash-day-num">{day}</span>
              {dayTasks.length > 0 && (
                <span className="dash-day-dots">
                  {hasCompleted && <i className="dash-dot dot-done" title="Ada tugas selesai" />}
                  {hasUnfinished && !hasLate && <i className="dash-dot dot-open" title="Ada tugas belum selesai" />}
                  {hasLate && <i className="dash-dot dot-late" title="Ada tugas lewat deadline" />}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {selected && (
        <div className="dash-day-tasks">
          <strong>Tugas {formatDate(selected)}</strong>
          {selectedTasks.length === 0 ? (
            <p className="dash-day-empty">Tidak ada tugas di tanggal ini.</p>
          ) : (
            selectedTasks.map((t) => (
              <div className="dash-day-task" key={t.id}>
                <em className={`dash-day-status dash-day-status-${t.status || 'pending'}`} />
                <span>{t.title || t.theme || 'Tanpa judul'}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const {
    projects,
    tasks,
    members,
    divisions,
    notifications,
    getStats,
    setCurrentPage,
    openProject,
  } = useStore()

  const stats = getStats()
  const activeProjects = stats.activeProjects ?? 0
  const completedTasks = stats.completedTasks ?? 0
  const totalTeam = members?.length || divisions.reduce((sum, div) => sum + (div.memberCount || 0), 0)
  const targetCount = projects.length

  const taskStats = useMemo(() => {
    const count = (status) => tasks.filter((t) => t.status === status).length
    return [
      { name: 'Selesai', value: count('completed') },
      { name: 'Berjalan', value: count('in_progress') },
      { name: 'Menunggu', value: count('pending') },
    ].filter((d) => d.value > 0)
  }, [tasks])

  // Aktivitas minggu ini (Sen–Min): jumlah tugas dengan deadline per hari
  // dan berapa di antaranya yang sudah selesai.
  const weeklyActivity = useMemo(() => {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const dayTasks = tasks.filter((t) => String(t.deadline || t.dueDate || '').slice(0, 10) === key)
      days.push({
        day: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        tugas: dayTasks.length,
        selesai: dayTasks.filter((t) => t.status === 'completed').length,
      })
    }
    return days
  }, [tasks])

  const hasWeeklyActivity = weeklyActivity.some((d) => d.tugas > 0 || d.selesai > 0)

  const projectRows = projects.slice(0, 4)

  const taskRows = useMemo(() => {
    return tasks
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId)
        return {
          ...task,
          projectName: project?.name || task.theme || 'Tanpa Proyek',
        }
      })
      .sort((a, b) => String(a.deadline || '').localeCompare(String(b.deadline || '')))
      .slice(0, 3)
  }, [projects, tasks])

  const activities = useMemo(() => {
    if (notifications.length > 0) {
      return notifications.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        sub: item.body,
        time: new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        initials: initials(item.title),
      }))
    }
    return []
  }, [notifications])

  const statCards = [
    { label: 'Proyek Aktif', value: activeProjects, note: 'Total proyek berjalan', icon: Folder, color: 'purple', trend: 'up' },
    { label: 'Tugas Selesai', value: completedTasks, note: 'Total tugas selesai', icon: CheckCircle2, color: 'green', trend: 'up' },
    { label: 'Tim Aktif', value: totalTeam, note: 'Anggota terdaftar', icon: Users, color: 'blue', trend: 'up' },
    { label: 'Target', value: targetCount, note: 'Target kamu', icon: Target, color: 'pink', trend: 'up' },
  ]

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="dashboard luxio-dashboard" variants={pageVariants} initial="hidden" animate="visible">
      <motion.section className="dash-hero" variants={itemVariants}>
        <div className="dash-hero-copy">
          <h1>Selamat datang di Luxio!</h1>
          <p>Kelola proyek, tugas, dan tim dalam satu tempat.</p>
          <div className="dash-hero-actions">
            <button className="btn btn-primary" onClick={() => setCurrentPage('projects')}>
              <Plus size={16} /> Buat Proyek
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentPage('settings')}>
              Lihat Panduan
            </button>
          </div>
        </div>
        <div className="dash-hero-art" aria-hidden="true">
          <div className="hero-window hero-window-main">
            <span />
            <span />
            <span />
            <div />
            <div />
            <div />
          </div>
          <div className="hero-window hero-window-small">
            <BarChart3 size={34} />
          </div>
          <div className="hero-window hero-window-side">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-ring" />
        </div>
      </motion.section>

      <motion.section className="dash-stats-grid" variants={itemVariants}>
        {statCards.map((stat) => (
          <div className="dash-stat-card" key={stat.label}>
            <div className={`dash-icon dash-icon-${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <span className="dash-stat-label">{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
            <ArrowRight className="dash-stat-arrow" size={16} />
          </div>
        ))}
      </motion.section>

      <motion.section className="dash-charts" variants={itemVariants}>
        <article className="dash-panel dash-chart-line">
          <div className="dash-panel-head">
            <h2>Aktivitas Mingguan</h2>
            <button type="button" onClick={() => setCurrentPage('my-tasks')}>Detail</button>
          </div>
          {!hasWeeklyActivity ? (
            <div className="dash-empty">
              <Inbox size={26} />
              <span>Belum ada aktivitas tugas minggu ini.</span>
              <small>Buat tugas baru untuk mulai melacak aktivitas.</small>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={weeklyActivity} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hover)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: 'none', borderRadius: 3, color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Line type="monotone" dataKey="tugas" name="Tugas" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="selesai" name="Selesai" stroke="var(--accent2)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </article>

        <article className="dash-panel dash-chart-pie">
          <div className="dash-panel-head">
            <h2>Statistik Tugas</h2>
            <button type="button" onClick={() => setCurrentPage('todo-list')}>Detail</button>
          </div>
          {taskStats.length === 0 ? (
            <div className="dash-empty">
              <Inbox size={26} />
              <span>Belum ada tugas.</span>
              <small>Tugas yang dibuat akan tampil di sini.</small>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={taskStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                stroke="none"
              >
                {taskStats.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: 'none', borderRadius: 3, color: 'var(--text-primary)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
          )}
        </article>
      </motion.section>

      <motion.section className="dash-main-grid" variants={itemVariants}>
        <article className="dash-panel dash-progress-panel">
          <div className="dash-panel-head">
            <h2>Progress Proyek</h2>
            <button type="button" onClick={() => setCurrentPage('projects')}>Lihat Semua</button>
          </div>
          <div className="dash-progress-list">
            {projectRows.length === 0 ? (
              <div className="dash-empty">
                <Folder size={26} />
                <span>Belum ada proyek.</span>
                <small>Buat proyek pertama untuk mulai melacak progres.</small>
              </div>
            ) : projectRows.map((project, idx) => {
              const color = projectColors[idx % projectColors.length]
              return (
                <button
                  type="button"
                  className="dash-project-row"
                  key={project.id}
                  onClick={() => project.id && openProject(project.id)}
                >
                  <span className={`dash-icon dash-icon-solid dash-icon-${color}`}>
                    {idx === 0 ? <ClipboardList size={18} /> : idx === 1 ? <Briefcase size={18} /> : idx === 2 ? <Target size={18} /> : <BarChart3 size={18} />}
                  </span>
                  <span className="dash-project-main">
                    <strong>{project.name}</strong>
                    <small>{project.theme || project.division || 'Project'}</small>
                    <span className="dash-progress-track">
                      <span className={`dash-progress-fill dash-fill-${color}`} style={{ width: `${Math.max(0, Math.min(100, project.progress || 0))}%` }} />
                    </span>
                  </span>
                  <span className="dash-project-value">{project.progress || 0}%</span>
                </button>
              )
            })}
          </div>
        </article>

        <article className="dash-panel dash-activity-panel">
          <div className="dash-panel-head">
            <h2>Aktivitas Terbaru</h2>
            <button type="button" onClick={() => setCurrentPage('my-tasks')}>Lihat Semua</button>
          </div>
          <div className="dash-activity-list">
            {activities.length === 0 ? (
              <div className="dash-empty">
                <Inbox size={26} />
                <span>Belum ada aktivitas.</span>
                <small>Aktivitas terbaru akan muncul di sini.</small>
              </div>
            ) : activities.map((activity, idx) => (
              <div className="dash-activity-row" key={activity.id}>
                <span className={`dash-avatar dash-avatar-${activityColors[idx % activityColors.length]}`}>{activity.initials}</span>
                <span className="dash-activity-copy">
                  <strong>{activity.title}</strong>
                  <small>{activity.sub}</small>
                </span>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </article>

        <article className="dash-panel dash-calendar-panel">
          <div className="dash-panel-head">
            <h2>Kalender</h2>
          </div>
          <MiniCalendar tasks={tasks} />
          <button className="dash-calendar-link" type="button" onClick={() => setCurrentPage('calendar')}>
            Lihat Kalender Lengkap
          </button>
        </article>
      </motion.section>

      <motion.section className="dash-panel dash-task-panel" variants={itemVariants}>
        <div className="dash-panel-head">
          <h2>Tugas Mendatang</h2>
          <button type="button" onClick={() => setCurrentPage('todo-list')}>Lihat Semua</button>
        </div>
        <div className="dash-task-table">
          <div className="dash-task-row dash-task-head">
            <span>Tugas</span>
            <span>Proyek</span>
            <span>Prioritas</span>
            <span>Deadline</span>
            <span>Penanggung Jawab</span>
            <span>Status</span>
          </div>
          {taskRows.length === 0 ? (
            <div className="dash-empty">
              <ClipboardList size={26} />
              <span>Belum ada tugas mendatang.</span>
              <small>Tugas dengan deadline terdekat akan tampil di sini.</small>
            </div>
          ) : taskRows.map((task) => {
            const member = members?.find((item) => item.id === task.assignedTo)
            return (
              <div className="dash-task-row" key={task.id}>
                <span className="dash-task-name">
                  <input type="checkbox" checked={task.status === 'completed'} readOnly aria-label={task.title} />
                  {task.title}
                </span>
                <span className="dash-task-project">
                  <Folder size={12} /> {task.projectName}
                </span>
                <span>
                  <em className={`dash-priority dash-priority-${task.priority || 'normal'}`}>{priorityLabel(task.priority)}</em>
                </span>
                <span>{formatDate(task.deadline || task.dueDate)}</span>
                <span>
                  <b className="dash-assignee">{member ? initials(member.name) : '—'}</b>
                </span>
                <span>
                  <em className={`dash-status dash-status-${task.status || 'pending'}`}>{statusLabel(task.status)}</em>
                </span>
              </div>
            )
          })}
        </div>
      </motion.section>
    </motion.div>
  )
}
