import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useStore, useEffectiveRole } from '../store/useStore'
import Select from './Select'
import DeadlinePicker from './DeadlinePicker'
import ContributorStack from './ContributorStack'
import ConfettiBurst from './ConfettiBurst'
import { Plus, GripVertical, CalendarClock, Check, ChevronLeft, ChevronRight, Lock, CheckCheck, Eye } from 'lucide-react'
import TaskDetailModal from './TaskDetailModal'
import { deadlineText } from '../utils/deadline'
import '../pages/Kanban.css'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
]

const emptyTask = { title: '', priority: 'medium', deadlineType: 'deadline', deadline: '', deadlineLabel: '' }

// Board kanban reusable — dipakai di halaman Kanban dan di detail target.
// Dua jenis board:
//   - 'static'  : item TIDAK bisa dipindah antar kolom. Tiap item punya
//                 checkbox; kolom berikutnya terkunci sampai SEMUA item di
//                 kolom aktif dicentang lalu klik "Selesaikan Tahap".
//   - 'dynamic' : item bebas dipindah antar kolom — drag & drop ATAU tombol
//                 geser kanan (maju) / kiri (mundur).
// Kembang api muncul tiap kali kolom statis selesai atau item dinamis digeser.
export default function TargetBoard({ board }) {
  const { currentUser, members, addKanbanTask, moveKanbanTask, toggleBoardCollaborator } = useStore()
  const role = useEffectiveRole()
  const [showNewTask, setShowNewTask] = useState(null)
  const [newTask, setNewTask] = useState(emptyTask)
  const [checked, setChecked] = useState({}) // { [taskId]: true } — centang statis
  const [confetti, setConfetti] = useState(false)
  const [detailTask, setDetailTask] = useState(null)
  const confettiTimer = useRef(null)

  const boardType = board.boardType === 'static' ? 'static' : 'dynamic'
  const isStatic = boardType === 'static'
  const canCreateTask = role === 'owner' || role === 'super_admin' || role === 'admin'

  const fireConfetti = () => {
    setConfetti(false)
    // Pastikan state berganti agar animasi bisa dipicu ulang.
    requestAnimationFrame(() => setConfetti(true))
    clearTimeout(confettiTimer.current)
    confettiTimer.current = setTimeout(() => setConfetti(false), 3500)
  }
  useEffect(() => () => clearTimeout(confettiTimer.current), [])

  // Kontributor sebuah task: assignee (ketua) + kolaborator board.
  const contributorsOf = (task) => {
    const list = []
    const assignee = task.assignedTo ? members.find((m) => m.id === task.assignedTo) : null
    if (assignee) list.push(assignee)
    ;(board.collaboratorIds || []).forEach((id) => {
      if (list.some((m) => m.id === id)) return
      const m = members.find((x) => x.id === id)
      if (m) list.push(m)
    })
    if (list.length === 0 && currentUser) list.push(currentUser)
    return list
  }

  const contributionOf = (memberId) => {
    const cols = contributorsOf({ assignedTo: memberId })
    if (cols.length === 0) return 0
    const idx = cols.findIndex((m) => m.id === memberId)
    if (idx === 0) return cols.length === 1 ? 100 : Math.round(60 / cols.length + 20)
    return Math.round(40 / Math.max(1, cols.length - 1))
  }

  // Progress todolist dalam sebuah task (hanya jika task punya todolist).
  const taskProgress = (task) => {
    const todos = Array.isArray(task.todos) ? task.todos : []
    if (todos.length === 0) return null
    const done = todos.filter((t) => t.completed).length
    return Math.round((done / todos.length) * 100)
  }

  const columns = board.columns
  const colIndex = (id) => columns.findIndex((c) => c.id === id)

  // ---- STATIC: kolom aktif = kolom pertama yang belum selesai ----
  const activeColIdx = (() => {
    if (!isStatic) return -1
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const allDone = col.tasks.length > 0 && col.tasks.every((t) => checked[t.id])
      if (!allDone) return i
    }
    return columns.length // semua selesai
  })()

  const handleAddTask = (columnId) => {
    if (newTask.title.trim()) {
      addKanbanTask(board.id, columnId, {
        title: newTask.title.trim(),
        priority: newTask.priority,
        deadlineType: newTask.deadlineType,
        deadline: newTask.deadline,
        deadlineLabel: newTask.deadlineLabel,
        assignedTo: currentUser?.id,
      })
      setNewTask(emptyTask)
      setShowNewTask(null)
    }
  }

  const handleDragStart = (e, taskId, fromColumnId) => {
    if (isStatic) return
    e.dataTransfer.setData('taskId', String(taskId))
    e.dataTransfer.setData('fromColumnId', String(fromColumnId))
  }

  const handleDrop = (e, toColumnId) => {
    if (isStatic) return
    e.preventDefault()
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10)
    const fromColumnId = parseInt(e.dataTransfer.getData('fromColumnId'), 10)
    if (taskId && fromColumnId !== toColumnId) {
      moveKanbanTask(board.id, fromColumnId, toColumnId, taskId)
      fireConfetti()
    }
  }

  // Tombol geser kanan/kiri (hanya board dinamis).
  const shiftTask = (task, dir) => {
    const fromIdx = colIndex(task.__colId)
    const toIdx = fromIdx + dir
    if (toIdx < 0 || toIdx >= columns.length) return
    moveKanbanTask(board.id, task.__colId, columns[toIdx].id, task.id)
    fireConfetti()
  }

  const renderProgressRing = (task) => {
    const pct = taskProgress(task)
    if (pct === null) return null
    const R = 10
    const C = 2 * Math.PI * R
    return (
      <div className="task-progress-ring" title={`${pct}% selesai`}>
        <svg width="26" height="26" viewBox="0 0 26 26">
          <circle cx="13" cy="13" r={R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
          <circle
            cx="13" cy="13" r={R} fill="none" stroke="var(--accent)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={C - (C * pct) / 100}
            transform="rotate(-90 13 13)"
          />
        </svg>
        <span>{pct}%</span>
      </div>
    )
  }

  return (
    <>
      <ConfettiBurst active={confetti} />
      {detailTask && createPortal(
        <TaskDetailModal
          board={board}
          task={detailTask}
          onClose={() => setDetailTask(null)}
        />,
        document.body
      )}
      <div className="kanban-board">
        {columns.map((column, colIdx) => {
          const locked = isStatic && colIdx > activeColIdx
          const isActive = isStatic && colIdx === activeColIdx
          const allChecked = column.tasks.length > 0 && column.tasks.every((t) => checked[t.id])
          const isDoneCol = isStatic && colIdx < activeColIdx
          return (
            <div
              key={column.id}
              className={`kanban-column ${locked ? 'col-locked' : ''}`}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragOver={(e) => { if (!isStatic) e.preventDefault() }}
            >
              <div className="column-header">
                <h3>{column.name}</h3>
                <span className="task-count">{column.tasks.length}</span>
              </div>

              {locked && (
                <div className="col-locked-note">
                  <Lock size={12} /> Selesaikan kolom sebelumnya dulu
                </div>
              )}
              {isDoneCol && (
                <div className="col-done-note">
                  <CheckCheck size={12} /> Kolom selesai
                </div>
              )}

              <div className="column-tasks">
                {column.tasks.map((task) => {
                  const taskWithCol = { ...task, __colId: column.id }
                  const fromIdx = colIdx
                  return (
                    <div
                      key={task.id}
                      className={`kanban-task ${isStatic ? 'task-static' : ''}`}
                      draggable={!isStatic}
                      onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                    >
                      {!isStatic && <GripVertical size={14} className="drag-handle" />}

                      {isStatic && (
                        <button
                          className={`kanban-check ${checked[task.id] ? 'on' : ''}`}
                          onClick={() => setChecked((c) => ({ ...c, [task.id]: !c[task.id] }))}
                          title="Tandai selesai"
                        >
                          {checked[task.id] && <Check size={12} />}
                        </button>
                      )}

                      <div className="kanban-task-main">
                        <span className={`task-title ${isStatic && checked[task.id] ? 'done' : ''}`}>
                          {task.title}
                        </span>

                        {renderProgressRing(task)}

                        {(task.priority || task.deadline || task.deadlineType) && (
                          <div className="task-meta">
                            {task.priority && (
                              <span className={`task-priority ${task.priority}`}>
                                {task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Sedang'}
                              </span>
                            )}
                            {deadlineText(task) && (
                              <span className="task-deadline">
                                <CalendarClock size={11} /> {deadlineText(task)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Icon mata — buka popup detail pekerjaan */}
                      <button
                        className="task-eye-btn"
                        title="Lihat detail pekerjaan"
                        onClick={(e) => { e.stopPropagation(); setDetailTask(task) }}
                      >
                        <Eye size={13} />
                      </button>

                      {/* Tombol geser kiri/kanan — hanya board dinamis */}
                      {!isStatic && (
                        <div className="task-shift">
                          <button
                            className="shift-btn"
                            disabled={fromIdx === 0}
                            title="Kembali ke kolom sebelumnya"
                            onClick={() => shiftTask(taskWithCol, -1)}
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <button
                            className="shift-btn"
                            disabled={fromIdx === columns.length - 1}
                            title="Pindah ke kolom berikutnya"
                            onClick={() => shiftTask(taskWithCol, 1)}
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      )}

                      {!isStatic && (
                        <ContributorStack
                          contributors={contributorsOf(task)}
                          contributionOf={contributionOf}
                          onRemove={(memberId) => toggleBoardCollaborator(board.id, memberId)}
                          label="Contributors"
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {isActive && (
                <button
                  className="btn btn-primary btn-sm complete-col-btn"
                  disabled={!allChecked}
                  title={allChecked ? 'Buka kolom berikutnya' : 'Centang semua item dulu'}
                  onClick={() => { fireConfetti() }}
                >
                  <CheckCheck size={14} /> Selesaikan Tahap
                </button>
              )}

              {!locked && canCreateTask && (
                <>
                  <button className="add-task-btn" onClick={() => setShowNewTask(column.id)}>
                    <Plus size={14} />
                    Tambah task
                  </button>

                  {showNewTask === column.id && (
                    <div className="new-task-form">
                      <div className="input-group">
                        <label className="input-label">Nama Task</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Nama task..."
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          autoFocus
                        />
                      </div>

                      <div className="new-task-grid">
                        <div className="input-group">
                          <label className="input-label">Prioritas</label>
                          <Select
                            allowReset={false}
                            value={newTask.priority}
                            onChange={(v) => setNewTask({ ...newTask, priority: v })}
                            options={PRIORITY_OPTIONS}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Deadline</label>
                          <DeadlinePicker
                            value={newTask}
                            onChange={(v) => setNewTask((t) => ({ ...t, ...v }))}
                          />
                        </div>
                      </div>

                      <div className="new-task-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleAddTask(column.id)}>
                          Tambah
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowNewTask(null)}>
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
