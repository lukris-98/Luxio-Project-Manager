import { useStore } from '../store/useStore'
import { CheckCircle2, Clock, KanbanSquare, ListTodo, Sparkles } from 'lucide-react'
import './TargetStats.css'

// =====================================================================
// TargetStats.jsx — Statistik progress target (gaya Material 3 / Google).
// Di paling atas: "statistik bar" (ring persen + bar segmented selesai/
// belum). Di bawahnya: kartu hitung kanban & to-do list yg sudah/belum.
// =====================================================================

const RING_R = 42
const RING_CIRC = 2 * Math.PI * RING_R

export default function TargetStats({ project }) {
  const { tasks, kanbanBoards } = useStore()

  // Semua board kanban milik target ini (target bisa punya >1 board).
  const boards = kanbanBoards.filter((b) => b.projectId === project.id)

  const stages = project.stages || []
  const stageCount = stages.length
  const stageDone = stages.filter((s) => s.status === 'completed').length
  const stagePending = stageCount - stageDone

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

  const progress = project.status === 'completed' ? 100 : (project.progress || 0)
  const achieved = project.status === 'completed'

  const ringOffset = RING_CIRC - (RING_CIRC * progress) / 100

  return (
    <div className="stats-section">
      {/* ===== STATISTIK BAR (paling atas) ===== */}
      <div className={`stats-hero ${achieved ? 'achieved' : ''}`}>
        <div className="stats-ring-wrap">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r={RING_R}
              fill="none" stroke="var(--bg-elevated)" strokeWidth="11"
            />
            <circle
              cx="60" cy="60" r={RING_R}
              fill="none"
              stroke={achieved ? 'url(#ringGold)' : 'url(#ringGrad)'}
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 60 60)"
            />
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
              <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#FDE68A" />
              </linearGradient>
            </defs>
          </svg>
          <div className="stats-ring-label">
            <strong>{progress}%</strong>
            <span>{achieved ? 'Tercapai' : 'Progress'}</span>
          </div>
        </div>

        <div className="stats-hero-right">
          <div className="stats-bar">
            <div
              className={`stats-bar-done ${achieved ? 'gold' : ''}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="stats-bar-legend">
            <span className="legend-done">
              <CheckCircle2 size={14} /> {doneTotal} selesai
            </span>
            <span className="legend-pending">
              <Clock size={14} /> {pendingTotal} belum
            </span>
          </div>
          <p className="stats-hero-caption">
            {achieved
              ? 'Semua tahap kanban & to-do list selesai — target tercapai!'
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
