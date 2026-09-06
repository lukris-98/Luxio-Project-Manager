import { useState, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import AnimatedDropdown from '../components/AnimatedDropdown'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import {
  Plus, CheckSquare, Clock, AlertCircle, Calendar, Play, CheckCircle2,
  MoreVertical, FileText, ChevronRight, ListTodo
} from 'lucide-react'
import { formatDate } from '../utils/date'
import './TodoList.css'

const PRIORITY_COLORS = ['#E94560', '#FFB830', '#00D9A5', '#8B8BA7'] // Tinggi, Sedang, Rendah, Tidak ada

export default function TodoList() {
  const { tasks, projects, addTask, updateTask, deleteTask, labelFilter } = useStore()
  const role = useEffectiveRole()
  const [activeFilter, setActiveFilter] = useState('Semua') // Semua, Hari Ini, Minggu Ini, Overdue
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [activeMenuId, setActiveMenuId] = useState(null)

  const canCreate = role === 'owner' || role === 'super_admin' || role === 'admin'

  // Tasks filtered by label (from sidebar dropdown / filter bar)
  const visibleTasks = useMemo(() => {
    if (labelFilter === null) return tasks
    return tasks.filter(t => {
      const l = (t.theme || '').trim()
      return labelFilter === '' ? !l : l === labelFilter
    })
  }, [tasks, labelFilter])

  // Toggle task completion
  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: newStatus })
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const total = visibleTasks.length
    const completed = visibleTasks.filter(t => t.status === 'completed').length
    const inProgress = visibleTasks.filter(t => t.status === 'in_progress').length
    const pending = visibleTasks.filter(t => !t.status || t.status === 'pending').length
    const overdue = visibleTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date()).length

    const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0
    const pctInProgress = total > 0 ? Math.round((inProgress / total) * 100) : 0
    const pctPending = total > 0 ? Math.round((pending / total) * 100) : 0

    return { total, completed, inProgress, pending, overdue, pctCompleted, pctInProgress, pctPending }
  }, [visibleTasks])

  // Donut chart priority data
  const priorityChartData = useMemo(() => {
    const high = visibleTasks.filter(t => t.priority === 'high').length
    const medium = visibleTasks.filter(t => t.priority === 'medium').length
    const low = visibleTasks.filter(t => t.priority === 'low').length
    const none = visibleTasks.filter(t => !t.priority || t.priority === 'normal').length

    return [
      { name: 'Tinggi', value: high },
      { name: 'Sedang', value: medium },
      { name: 'Rendah', value: low },
      { name: 'Tidak ada', value: none }
    ].filter(d => d.value > 0)
  }, [visibleTasks])

  // Group tasks by period
  const groupedTasks = useMemo(() => {
    const today = new Date()
    const todayStr = today.toDateString()

    const groups = {
      'Hari ini': [],
      'Besok': [],
      'Minggu Ini': [],
      'Lainnya': []
    }

    visibleTasks.forEach(task => {
      if (!task.deadline) {
        groups['Lainnya'].push(task)
        return
      }

      const dl = new Date(task.deadline)
      const dlStr = dl.toDateString()

      if (dlStr === todayStr) {
        groups['Hari ini'].push(task)
      } else {
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)
        if (dlStr === tomorrow.toDateString()) {
          groups['Besok'].push(task)
        } else {
          const diffTime = dl.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays > 1 && diffDays <= 7) {
            groups['Minggu Ini'].push(task)
          } else {
            groups['Lainnya'].push(task)
          }
        }
      }
    })

    return groups
  }, [tasks])

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        status: 'pending',
      })
      setNewTaskTitle('')
      setShowAddForm(false)
    }
  }

  return (
    <motion.div
      className="todo-page-new"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="todo-header-new">
        <div className="todo-header-left">
          <h1>Todo</h1>
          <p>Kelola dan selesaikan semua tugasmu.</p>
        </div>
        <div className="todo-header-right">
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> Tambah Todo
            </button>
          )}
        </div>
      </div>

      {/* Sub Header Filters */}
      <div className="todo-filters-bar">
        {['Semua', 'Hari Ini', 'Minggu Ini', 'Overdue'].map((filter) => (
          <button
            key={filter}
            className={`filter-tab-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* KPI summary tiles */}
      <div className="todo-kpi-grid">
        <div className="todo-kpi-card total">
          <div className="kpi-icon"><CheckSquare size={20} /></div>
          <div className="kpi-info">
            <span className="label">Semua Tugas</span>
            <strong>{stats.total}</strong>
            <small>Total tugas</small>
          </div>
        </div>
        <div className="todo-kpi-card selesai">
          <div className="kpi-icon"><CheckCircle2 size={20} /></div>
          <div className="kpi-info">
            <span className="label">Selesai</span>
            <strong>{stats.completed}</strong>
            <small>{stats.pctCompleted}% dari total</small>
          </div>
        </div>
        <div className="todo-kpi-card proses">
          <div className="kpi-icon"><Play size={20} /></div>
          <div className="kpi-info">
            <span className="label">Dalam Proses</span>
            <strong>{stats.inProgress}</strong>
            <small>{stats.pctInProgress}% dari total</small>
          </div>
        </div>
        <div className="todo-kpi-card belum">
          <div className="kpi-icon"><Clock size={20} /></div>
          <div className="kpi-info">
            <span className="label">Belum Dimulai</span>
            <strong>{stats.pending}</strong>
            <small>{stats.pctPending}% dari total</small>
          </div>
        </div>
        <div className="todo-kpi-card overdue">
          <div className="kpi-icon"><AlertCircle size={20} /></div>
          <div className="kpi-info">
            <span className="label">Overdue</span>
            <strong>{stats.overdue}</strong>
            <small className="danger-text">Perlu perhatian</small>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="todo-main-grid-new">
        {/* Left Column: Task lists grouped */}
        <div className="todo-list-section">
          <h3>Daftar Tugas</h3>
          <div className="todo-groups-container">
            {Object.entries(groupedTasks).every(([, t]) => t.length === 0) ? (
              <div className="target-list-empty">
                <ListTodo size={40} />
                <p>Tidak ada tugas untuk periode ini.</p>
              </div>
            ) : (
              Object.entries(groupedTasks).map(([groupName, groupTasks]) => {
                if (groupTasks.length === 0) return null
                return (
                <div key={groupName} className="todo-group-panel">
                  <div className="group-header">
                    <h4>{groupName} • {groupTasks.length}</h4>
                  </div>
                  <div className="group-tasks-list">
                    {groupTasks.map((task) => {
                      const project = projects.find(p => p.id === task.projectId)
                      return (
                        <div key={task.id} className={`todo-task-row ${task.status === 'completed' ? 'completed' : ''}`}>
                          <input
                            type="checkbox"
                            checked={task.status === 'completed'}
                            onChange={() => handleToggleComplete(task)}
                          />
                          <div className="task-body">
                            <span className="task-title">{task.title}</span>
                            <div className="task-tags-row">
                              <span className="badge project-badge">{project ? project.name : 'Personal'}</span>
                              <span className={`badge priority-badge ${task.priority || 'medium'}`}>
                                {task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Sedang'}
                              </span>
                            </div>
                          </div>
                          <span className="task-deadline-text">
                            {task.deadline ? formatDate(task.deadline) : 'Hari ini, 17:00'}
                          </span>
                          <span className={`task-status-pill ${task.status || 'pending'}`}>
                            {task.status === 'completed' ? 'Selesai' : task.status === 'in_progress' ? 'Proses' : 'Belum Mulai'}
                          </span>
                          <div className="actions-cell">
                            <button
                              className="action-dots-btn"
                              onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                            >
                              <MoreVertical size={14} />
                            </button>
                            <AnimatedDropdown show={activeMenuId === task.id}>
                              <div className="todo-dropdown-menu">
                                <button onClick={() => { handleToggleComplete(task); setActiveMenuId(null); }}>Selesai</button>
                                <button onClick={() => { deleteTask(task.id); setActiveMenuId(null); }} className="danger">Hapus</button>
                              </div>
                            </AnimatedDropdown>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
            )}
          </div>
        </div>

        {/* Right Column: Dashboard Stats */}
        <div className="todo-dashboard-sidebar">
          {/* Prioritas Donut Chart */}
          <div className="sidebar-panel priorities-panel">
            <h3>Prioritas</h3>
            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={priorityChartData.length ? priorityChartData : [{ name: 'Sedang', value: 1 }]}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {(priorityChartData.length ? priorityChartData : [{ name: 'Sedang', value: 1 }]).map((entry, idx) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[idx % PRIORITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-label">
                <strong>{stats.total}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="chart-legend-list">
              <div className="legend-row">
                <span className="dot red" />
                <span>Tinggi</span>
                <strong>{visibleTasks.filter(t => t.priority === 'high').length}</strong>
              </div>
              <div className="legend-row">
                <span className="dot orange" />
                <span>Sedang</span>
                <strong>{visibleTasks.filter(t => t.priority === 'medium').length}</strong>
              </div>
              <div className="legend-row">
                <span className="dot green" />
                <span>Rendah</span>
                <strong>{visibleTasks.filter(t => t.priority === 'low').length}</strong>
              </div>
            </div>
          </div>

          {/* Status Breakdown Panel */}
          <div className="sidebar-panel status-breakdown-panel">
            <h3>Status</h3>
            <div className="status-bars-list">
              <div className="status-bar-item">
                <div className="status-bar-info">
                  <span>Selesai</span>
                  <strong>{stats.completed} ({stats.pctCompleted}%)</strong>
                </div>
                <div className="status-progress-track">
                  <div className="status-progress-fill green" style={{ width: `${stats.pctCompleted}%` }} />
                </div>
              </div>
              <div className="status-bar-item">
                <div className="status-bar-info">
                  <span>Dalam Proses</span>
                  <strong>{stats.inProgress} ({stats.pctInProgress}%)</strong>
                </div>
                <div className="status-progress-track">
                  <div className="status-progress-fill blue" style={{ width: `${stats.pctInProgress}%` }} />
                </div>
              </div>
              <div className="status-bar-item">
                <div className="status-bar-info">
                  <span>Belum Dimulai</span>
                  <strong>{stats.pending} ({stats.pctPending}%)</strong>
                </div>
                <div className="status-progress-track">
                  <div className="status-progress-fill gray" style={{ width: `${stats.pctPending}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Tugas Mendatang panel */}
          <div className="sidebar-panel upcoming-deadlines-panel">
            <h3>Tugas Mendatang</h3>
            <div className="upcoming-list">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="upcoming-item">
                  <div className="upcoming-date">
                    <Calendar size={14} />
                    <span>{task.deadline ? formatDate(task.deadline) : '22 Agu 2026'}</span>
                  </div>
                  <p>{task.title}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-full">Lihat Kalender</button>
          </div>
        </div>
      </div>

      {/* Add Task Modal/Form Overlay */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Todo Baru</h2>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Judul Tugas</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ketik tugas baru..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="input-group">
                <label className="input-label">Prioritas</label>
                <select
                  className="input"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="high">Tinggi</option>
                  <option value="medium">Sedang</option>
                  <option value="low">Rendah</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAddTask}>Simpan</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
