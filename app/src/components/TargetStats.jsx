import { useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { CheckCircle2, Clock, KanbanSquare, ListTodo, Flame, CalendarClock } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import './TargetStats.css'

// =====================================================================
// TargetStats.jsx — Statistik progress target.
// Paling atas: PIE CHART distribusi item + panel info kanan (persen
// progress, timer durasi project, strike api beranimasi, legend).
// Di bawahnya: kartu hitung kanban & to-do.
// =====================================================================

const PIE_COLORS = ['#00D9A5', '#FFB830', '#8B8BA7']

// Hitung strike: jumlah hari berturut-turut (dari hari ini mundur) yang
// memiliki kenaikan progress >= 1% dibanding hari sebelumnya.
function streakOf(history = {}, currentPct = 0) {
  const days = Object.keys(history).sort()
  if (days.length === 0) return currentPct > 0 ? 1 : 0
  let streak = 0
  let prev = -1
  // Jalan dari hari paling lama; setiap kenaikan >= 1% menambah strike.
  for (const d of days) {
    const pct = history[d]
    if (prev === -1) {
      streak = pct > 0 ? 1 : 0
    } else if (pct >= prev + 1) {
      streak += 1
    } else if (pct < prev) {
      streak = pct > 0 ? 1 : 0
    }
    prev = pct
  }
  // Hari ini mungkin belum tercatat — anggap hari ini tetap menyambung
  // bila persen saat ini >= catatan terakhir + 1.
  const last = history[days[days.length - 1]]
  if (currentPct >= last + 1) streak += 1
  return streak
}

export default function TargetStats({ project }) {
  const { tasks, kanbanBoards, projectProgressHistory, addProgressHistory } = useStore()

  // Semua board kanban milik target ini (target bisa punya >1 board).
  const boards = kanbanBoards.filter((b) => b.projectId === project.id)

  const stages = project.stages || []
  const stageCount = stages.length
  const stageDone = stages.filter((s) => s.status === 'completed').length

  // To-do list: checklist tiap tahap (kanban) + task (todo target).
  let listDone = 0
  let listTotal = 0
  stages.forEach((s) =>
    s.checklist.forEach((c) => {
      listTotal++
      if (c.completed) listDone++
    })
  )
  const projTasks = tasks.filter((t) => t.projectId === project.id)
  projTasks.forEach((t) => {
    listTotal++
    if (t.status === 'completed') listDone++
  })

  // Kanban: tahap selesai, plus task di kolom "Done" dari semua board target.
  let kanbanDone = stageDone
  let kanbanTotal = stageCount
  boards.forEach((board) => {
    const allTasks = board.columns.reduce((n, c) => n + c.tasks.length, 0)
    kanbanTotal += allTasks
    kanbanDone += board.columns.find((c) => c.name === 'Done')?.tasks.length || 0
  })
  const kanbanPending = kanbanTotal - kanbanDone
  const listPending = listTotal - listDone

  const doneTotal = kanbanDone + listDone
  const pendingTotal = kanbanPending + listPending
  const overallTotal = doneTotal + pendingTotal
  const overallPct = overallTotal > 0 ? Math.round((doneTotal / overallTotal) * 100) : 0

  // Pie chart: selesai / belum selesai / tanpa item
  const pieData = [
    { name: 'Selesai', value: doneTotal },
    { name: 'Belum Selesai', value: pendingTotal },
  ].filter((d) => d.value > 0)
  if (pieData.length === 0) {
    pieData.push({ name: 'Belum Dimulai', value: 1 })
  }

  // ===== Timer: sudah berapa lama project ini belum selesai =====
  const elapsed = useMemo(() => {
    if (project.status === 'completed') return null
    const start = project.createdAt ? new Date(project.createdAt) : null
    if (!start) return null
    const ms = Date.now() - start.getTime()
    const days = Math.floor(ms / 864e5)
    const hours = Math.floor((ms % 864e5) / 36e5)
    if (days >= 1) return `${days} hari ${hours} jam`
    return `${hours} jam`
  }, [project])

  // ===== Strike api: jumlah hari berturut-turut progress naik >= 1% =====
  const streak = useMemo(
    () => streakOf(projectProgressHistory?.[project.id], overallPct),
    [projectProgressHistory, project.id, overallPct]
  )

  // Catat progress hari ini ke riwayat (untuk hitung strike di masa depan).
  useEffect(() => {
    if (overallTotal > 0) addProgressHistory(project.id, overallPct)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, overallPct])

  return (
    <div className="stats-section">
      {/* ===== PIE CHART + PANEL INFO (paling atas) ===== */}
      <div className="stats-hero">
        <div className="stats-pie-wrap">
          <ResponsiveContainer width={240} height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-hero-right">
          {/* Persen progress — dipindah dari tengah donat ke sini */}
          <div className="stats-progress-big">
            <strong>{overallPct}%</strong>
            <span>project selesai</span>
          </div>

          <div className="stats-info-rows">
            {elapsed && (
              <div className="stats-info-row">
                <CalendarClock size={15} />
                <span>Belum selesai selama <strong>{elapsed}</strong></span>
              </div>
            )}
            <div className="stats-info-row strike">
              <Flame size={16} className="flame-anim" />
              <span><strong>{streak}x Strike</strong> — progress naik {streak} hari berturut-turut</span>
            </div>
          </div>

          <div className="stats-hero-numbers">
            <div className="stats-hero-number">
              <CheckCircle2 size={16} className="legend-done" />
              <strong>{doneTotal}</strong>
              <span>Selesai</span>
            </div>
            <div className="stats-hero-number">
              <Clock size={16} className="legend-pending" />
              <strong>{pendingTotal}</strong>
              <span>Belum Selesai</span>
            </div>
          </div>

          <div className="stats-pie-legend">
            {pieData.map((entry, idx) => (
              <span key={entry.name} className="stats-pie-legend-item">
                <span className="dot" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
          <p className="stats-hero-caption">
            {project.status === 'completed'
              ? 'Semua tahap kanban & to-do list selesai — project tercapai!'
              : 'Pekerjaan yang sudah selesai dari seluruh tahap & to-do list.'}
          </p>
        </div>
      </div>

      {/* ===== COUNT KANBAN & TO-DO LIST ===== */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-card-icon kanban">
            <KanbanSquare size={20} />
          </div>
          <div className="stats-card-body">
            <span className="stats-card-label">Kanban / Tahap</span>
            {kanbanTotal > 0 ? (
              <>
                <strong className="stats-card-value">
                  {kanbanDone}<span>/{kanbanTotal} selesai</span>
                </strong>
                <span className="stats-card-sub">
                  {kanbanPending} belum selesai
                </span>
              </>
            ) : (
              <>
                <strong className="stats-card-value">0</strong>
                <span className="stats-card-sub">Tidak ada kanban</span>
              </>
            )}
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-card-icon todo">
            <ListTodo size={20} />
          </div>
          <div className="stats-card-body">
            <span className="stats-card-label">To-do List</span>
            {listTotal > 0 ? (
              <>
                <strong className="stats-card-value">
                  {listDone}<span>/{listTotal} selesai</span>
                </strong>
                <span className="stats-card-sub">
                  {listPending} belum selesai
                </span>
              </>
            ) : (
              <>
                <strong className="stats-card-value">0</strong>
                <span className="stats-card-sub">Tidak ada to-do list</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
