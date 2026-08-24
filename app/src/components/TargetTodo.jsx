import { useState } from 'react'
import { useStore } from '../store/useStore'
import Select from './Select'
import DeadlinePicker from './DeadlinePicker'
import DeleteConfirmModal from './DeleteConfirmModal'
import { Plus, Trash2, Check, CalendarClock, X } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import '../pages/TodoList.css'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
]

const emptyTodo = {
  title: '',
  description: '',
  priority: 'medium',
  deadlineType: 'deadline',
  deadline: '',
  deadlineLabel: '',
}

// To-do list reusable — dipakai di halaman Todo List (projectId kosong =
// task global), di detail target (projectId diisi => hanya task milik target),
// atau per tema di halaman Todo (theme diisi => hanya task milik tema).
// Bila `tasks` diisi (dari filter halaman), daftar task memakai itu.
export default function TargetTodo({ projectId, theme, tasks: tasksProp }) {
  const { tasks, addTask, toggleTaskStatus, deleteTask, currentUser } = useStore()
  const [newTodo, setNewTodo] = useState(emptyTodo)
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all') // all, pending, completed

  const projectTasks = Array.isArray(tasksProp)
    ? tasksProp
    : tasks.filter((t) => {
        if (projectId) return t.projectId === projectId
        if (theme != null) return (t.theme || '') === theme
        return true
      })

  const setField = (key, value) => setNewTodo((t) => ({ ...t, [key]: value }))

  const handleAddTodo = () => {
    if (newTodo.title.trim()) {
      addTask({
        title: newTodo.title.trim(),
        description: newTodo.description.trim(),
        priority: newTodo.priority,
        deadlineType: newTodo.deadlineType,
        deadline: newTodo.deadline,
        deadlineLabel: newTodo.deadlineLabel,
        assignedTo: currentUser?.id,
        ...(projectId ? { projectId } : {}),
        ...(theme != null ? { theme } : {}),
      })
      setNewTodo(emptyTodo)
    }
  }

  const filteredTasks = projectTasks.filter((task) => {
    if (filter === 'pending') return task.status !== 'completed'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  const pendingCount = projectTasks.filter((t) => t.status !== 'completed').length
  const completedCount = projectTasks.filter((t) => t.status === 'completed').length

  return (
    <>
      {/* Tombol tambah — form hanya muncul saat diklik */}
      {!showForm ? (
        <div className="add-todo-bar">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Tambah To-do
          </button>
        </div>
      ) : (
        <div className="add-todo-form">
          <div className="input-group">
            <label className="input-label">Apa yang perlu dilakukan?</label>
            <input
              type="text"
              className="input"
              placeholder="cth: Kirim proposal ke klien"
              value={newTodo.title}
              onChange={(e) => setField('title', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Deskripsi (opsional)</label>
            <textarea
              className="input"
              rows={2}
              placeholder="Detail tugas..."
              value={newTodo.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </div>

          <div className="add-todo-grid">
            <div className="input-group">
              <label className="input-label">Prioritas</label>
              <Select
                allowReset={false}
                value={newTodo.priority}
                onChange={(v) => setField('priority', v)}
                options={PRIORITY_OPTIONS}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Deadline</label>
              <DeadlinePicker
                value={newTodo}
                onChange={(v) => setNewTodo((t) => ({ ...t, ...v }))}
              />
            </div>
          </div>

          <div className="add-todo-actions">
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              <X size={16} /> Batal
            </button>
            <button className="btn btn-primary" onClick={handleAddTodo}>
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>
      )}

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Semua ({projectTasks.length})
        </button>
        <button
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({pendingCount})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Selesai ({completedCount})
        </button>
      </div>

      <div className="todo-list">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div key={task.id} className={`todo-item ${task.status}`}>
              <button
                className="todo-checkbox"
                onClick={() => toggleTaskStatus(task.id)}
              >
                {task.status === 'completed' && <Check size={14} />}
              </button>

              <div className="todo-main">
                <span className={`todo-title ${task.status === 'completed' ? 'completed' : ''}`}>
                  {task.title}
                </span>
                {task.description && (
                  <span className="todo-desc">{task.description}</span>
                )}
                {(task.priority || task.deadline || task.deadlineType) && (
                  <div className="todo-meta">
                    {task.priority && (
                      <span className={`todo-priority ${task.priority}`}>
                        {task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Sedang'}
                      </span>
                    )}
                    {deadlineText(task) && (
                      <span className="todo-deadline">
                        <CalendarClock size={11} /> {deadlineText(task)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                className="todo-delete"
                onClick={() => setDeleteTaskTarget(task)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>Belum ada tugas</h3>
            <p>Klik "Tambah To-do" untuk membuat tugas pertama</p>
          </div>
        )}
      </div>

      {projectTasks.length > 0 && (
        <div className="todo-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(completedCount / projectTasks.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            {completedCount} dari {projectTasks.length} selesai
          </span>
        </div>
      )}

      {/* Konfirmasi hapus task */}
      {deleteTaskTarget && (
        <DeleteConfirmModal
          title="Hapus To-do"
          itemName={deleteTaskTarget.title}
          message="Tugas ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
          onConfirm={() => {
            deleteTask(deleteTaskTarget.id)
            setDeleteTaskTarget(null)
          }}
          onClose={() => setDeleteTaskTarget(null)}
        />
      )}
    </>
  )
}
