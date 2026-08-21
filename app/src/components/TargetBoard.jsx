import { useState } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Select from './Select'
import DeadlinePicker from './DeadlinePicker'
import { Plus, GripVertical, CalendarClock } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import '../pages/Kanban.css'

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
]

const emptyTask = { title: '', priority: 'medium', deadlineType: 'deadline', deadline: '', deadlineLabel: '' }

// Board kanban reusable — dipakai di halaman Kanban dan di detail target
// (bila target memilih cara kelola "Kanban"). Kolom & task diambil dari
// board yang sudah tersimpan di store (terhubung ke target via projectId).
export default function TargetBoard({ board }) {
  const { currentUser, addKanbanTask, moveKanbanTask } = useStore()
  const role = useEffectiveRole()
  const [showNewTask, setShowNewTask] = useState(null)
  const [newTask, setNewTask] = useState(emptyTask)

  const canCreateTask = role === 'owner' || role === 'super_admin' || role === 'admin'

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
    e.dataTransfer.setData('taskId', String(taskId))
    e.dataTransfer.setData('fromColumnId', String(fromColumnId))
  }

  const handleDrop = (e, toColumnId) => {
    e.preventDefault()
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10)
    const fromColumnId = parseInt(e.dataTransfer.getData('fromColumnId'), 10)
    if (taskId && fromColumnId !== toColumnId) {
      moveKanbanTask(board.id, fromColumnId, toColumnId, taskId)
    }
  }

  return (
    <div className="kanban-board">
      {board.columns.map((column) => (
        <div
          key={column.id}
          className="kanban-column"
          onDrop={(e) => handleDrop(e, column.id)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="column-header">
            <h3>{column.name}</h3>
            <span className="task-count">{column.tasks.length}</span>
          </div>

          <div className="column-tasks">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="kanban-task"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id, column.id)}
              >
                <GripVertical size={14} className="drag-handle" />
                <div className="kanban-task-main">
                  <span className="task-title">{task.title}</span>
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
              </div>
            ))}
          </div>

          {canCreateTask && (
            <>
              <button
                className="add-task-btn"
                onClick={() => setShowNewTask(column.id)}
              >
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
      ))}
    </div>
  )
}
