import { useState, useMemo, useRef } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import AnimatedDropdown from '../components/AnimatedDropdown'
import TemplateGallery from '../components/TemplateGallery'
import { api } from '../services/api'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts'
import {
  Plus, CheckSquare, Clock, AlertCircle, Calendar, Play, CheckCircle2,
  MoreVertical, ListTodo, ChevronDown, FileStack, X, Trash2, Upload,
  Download, Check, Folder, FileText, Pencil
} from 'lucide-react'
import { formatDate } from '../utils/date'
import './TodoList.css'

const PRIORITY_COLORS = ['#E94560', '#FFB830', '#00D9A5', '#8B8BA7']

export default function TodoList() {
  const {
    tasks, projects, addTask, updateTask, deleteTask, labelFilter,
    currentUser, todoGroups, addTodoGroup, deleteTodoGroup, renameTodoGroup,
    addTodoGroupItem, toggleTodoGroupItem, removeTodoGroupItem,
    addTodoGroupFile, removeTodoGroupFile,
  } = useStore()
  const role = useEffectiveRole()
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [expandedGroup, setExpandedGroup] = useState(null)
  const [newItemText, setNewItemText] = useState('')
  const [editingGroup, setEditingGroup] = useState(null)
  const [editName, setEditName] = useState('')
  const [uploadingGroup, setUploadingGroup] = useState(null)
  const fileInputRef = useRef(null)

  const canCreate = role === 'owner' || role === 'super_admin' || role === 'admin' || role === 'user'

  const uid = currentUser?.id != null ? String(currentUser.id) : null
  const groups = uid ? (todoGroups[uid] || []) : []

  // Legacy tasks filtered by label
  const visibleTasks = useMemo(() => {
    if (labelFilter === null) return tasks
    return tasks.filter(t => {
      const l = (t.theme || '').trim()
      return labelFilter === '' ? !l : l === labelFilter
    })
  }, [tasks, labelFilter])

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    updateTask(task.id, { status: newStatus })
  }

  // Stats from legacy tasks
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

  // Group stats
  const groupStats = useMemo(() => {
    let totalItems = 0, completedItems = 0, totalFiles = 0
    groups.forEach(g => {
      totalItems += g.items.length
      completedItems += g.items.filter(i => i.completed).length
      totalFiles += g.files.length
    })
    return { totalGroups: groups.length, totalItems, completedItems, totalFiles }
  }, [groups])

  const priorityChartData = useMemo(() => {
    const high = visibleTasks.filter(t => t.priority === 'high').length
    const medium = visibleTasks.filter(t => t.priority === 'medium').length
    const low = visibleTasks.filter(t => t.priority === 'low').length
    const none = visibleTasks.filter(t => !t.priority || t.priority === 'normal').length
    return [
      { name: 'Tinggi', value: high }, { name: 'Sedang', value: medium },
      { name: 'Rendah', value: low }, { name: 'Tidak ada', value: none },
    ].filter(d => d.value > 0)
  }, [visibleTasks])

  const filteredTasks = useMemo(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    if (activeFilter === 'Hari Ini') {
      return visibleTasks.filter(t => t.deadline && new Date(t.deadline).toDateString() === todayStr)
    } else if (activeFilter === 'Minggu Ini') {
      return visibleTasks.filter(t => {
        if (!t.deadline) return false
        const diff = Math.ceil((new Date(t.deadline).getTime() - today.getTime()) / 864e5)
        return diff >= 0 && diff <= 7
      })
    } else if (activeFilter === 'Overdue' || activeFilter === 'Failed') {
      return visibleTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < today)
    }
    return visibleTasks
  }, [visibleTasks, activeFilter])

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      addTodoGroup(newGroupName.trim())
      setNewGroupName('')
      setShowAddGroup(false)
    }
  }

  const handleAddItem = (groupId) => {
    if (newItemText.trim()) {
      addTodoGroupItem(groupId, newItemText.trim())
      setNewItemText('')
    }
  }

  const handleFileUpload = async (e, groupId) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingGroup(groupId)
    let s3Url = ''
    let b2Url = ''
    try {
      // 1) Simpan permanen ke Neon S3 folder luxio/todo-files (diutamakan).
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', 'todo')
      const s3res = await api.s3Upload(formData)
      s3Url = s3res.downloadUrl || s3res.url || ''
      // 2) Tetap kirim ke B2 (kompatibilitas lama) bila kredensial ada.
      try {
        const b2fd = new FormData()
        b2fd.append('file', file)
        const b2res = await api.b2Upload(b2fd)
        b2Url = b2res.url || ''
      } catch (_) { /* B2 opsional */ }
      addTodoGroupFile(groupId, {
        name: file.name,
        size: file.size,
        url: s3Url || b2Url,
        s3Key: (s3res && s3res.key) || '',
        uploadedAt: Date.now(),
      })
    } catch (err) {
      // Fallback: simpan metadata lokal saja (tanpa URL).
      addTodoGroupFile(groupId, {
        name: file.name,
        size: file.size,
        url: b2Url || '',
        s3Key: '',
        uploadedAt: Date.now(),
      })
    } finally {
      setUploadingGroup(null)
      if (e.target) e.target.value = ''
    }
  }

  const fmtSize = (b) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

  return (
    <motion.div className="todo-page-new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div className="todo-header-new">
        <div className="todo-header-left">
          <h1>Todo</h1>
          <p>Kelola dan selesaikan semua tugasmu.</p>
        </div>
        <div className="todo-header-right">
          {canCreate && (
            <div className="create-btn-wrap">
              <button className="btn btn-primary" onClick={() => setCreateDropdownOpen((v) => !v)}>
                <Plus size={16} /> Tambah <ChevronDown size={14} />
              </button>
              <AnimatedDropdown show={createDropdownOpen}>
                <div className="create-dropdown-menu">
                  <button onClick={() => { setCreateDropdownOpen(false); setShowAddGroup(true) }}>
                    <Folder size={14} /> Grup Todo
                  </button>
                  <button onClick={() => { setCreateDropdownOpen(false); setShowTemplateGallery(true) }}>
                    <FileStack size={14} /> Dari Template
                  </button>
                </div>
              </AnimatedDropdown>
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div className="todo-kpi-grid">
        <div className="todo-kpi-card total">
          <div className="kpi-icon"><Folder size={20} /></div>
          <div className="kpi-info"><span className="label">Grup</span><strong>{groupStats.totalGroups}</strong><small>total grup</small></div>
        </div>
        <div className="todo-kpi-card selesai">
          <div className="kpi-icon"><CheckCircle2 size={20} /></div>
          <div className="kpi-info"><span className="label">Selesai</span><strong>{groupStats.completedItems}</strong><small>{groupStats.totalItems > 0 ? Math.round((groupStats.completedItems / groupStats.totalItems) * 100) : 0}% item</small></div>
        </div>
        <div className="todo-kpi-card proses">
          <div className="kpi-icon"><ListTodo size={20} /></div>
          <div className="kpi-info"><span className="label">Total Item</span><strong>{groupStats.totalItems}</strong><small>di semua grup</small></div>
        </div>
        <div className="todo-kpi-card belum">
          <div className="kpi-icon"><FileText size={20} /></div>
          <div className="kpi-info"><span className="label">File</span><strong>{groupStats.totalFiles}</strong><small>terupload</small></div>
        </div>
      </div>

      {/* Todo Groups */}
      <div className="todo-groups-section">
        <div className="panel-header">
          <h2>Grup Todo</h2>
          <span className="target-list-count">{groups.length} grup</span>
        </div>

        {groups.length === 0 ? (
          <div className="target-list-empty">
            <Folder size={40} />
            <p>Belum ada grup todo.</p>
            <small>Buat grup untuk mengelompokkan tugas, misal "Pekerjaan Rumah".</small>
            {canCreate && (
              <button className="btn btn-primary" onClick={() => setShowAddGroup(true)}>
                <Plus size={14} /> Buat Grup
              </button>
            )}
          </div>
        ) : (
          <div className="todo-groups-list">
            {groups.map((group) => {
              const isExpanded = expandedGroup === group.id
              const done = group.items.filter(i => i.completed).length
              const total = group.items.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div key={group.id} className={`todo-group-card ${isExpanded ? 'expanded' : ''}`}>
                  {/* Group header */}
                  <div className="todo-group-header" onClick={() => setExpandedGroup(isExpanded ? null : group.id)}>
                    <div className="todo-group-info">
                      <Folder size={16} />
                      {editingGroup === group.id ? (
                        <input
                          className="input todo-group-rename"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => { renameTodoGroup(group.id, editName.trim() || group.name); setEditingGroup(null) }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { renameTodoGroup(group.id, editName.trim() || group.name); setEditingGroup(null) } }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      ) : (
                        <strong>{group.name}</strong>
                      )}
                      <span className="todo-group-count">{done}/{total} selesai</span>
                      {group.files.length > 0 && <span className="todo-group-file-count">{group.files.length} file</span>}
                    </div>
                    <div className="todo-group-actions" onClick={(e) => e.stopPropagation()}>
                      <div className="todo-group-progress-mini">
                        <div className="todo-group-progress-bar" style={{ width: `${pct}%` }} />
                      </div>
                      <button className="icon-btn-sm" title="Ganti nama" onClick={() => { setEditingGroup(group.id); setEditName(group.name) }}>
                        <Pencil size={13} />
                      </button>
                      <button className="icon-btn-sm danger" title="Hapus grup" onClick={() => deleteTodoGroup(group.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: items + files */}
                  {isExpanded && (
                    <div className="todo-group-body">
                      {/* Items */}
                      <div className="todo-group-items">
                        {group.items.map((item) => (
                          <div key={item.id} className={`todo-group-item ${item.completed ? 'completed' : ''}`}>
                            <button
                              className={`kanban-check ${item.completed ? 'on' : ''}`}
                              onClick={() => toggleTodoGroupItem(group.id, item.id)}
                            >
                              {item.completed && <Check size={12} />}
                            </button>
                            <span className="todo-group-item-text">{item.text}</span>
                            <button className="icon-btn-sm danger" onClick={() => removeTodoGroupItem(group.id, item.id)}>
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        {/* Add item */}
                        <div className="todo-group-add-item">
                          <input
                            className="input"
                            placeholder="Tambah item..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(group.id) }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => handleAddItem(group.id)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Files */}
                      <div className="todo-group-files">
                        <div className="todo-group-files-header">
                          <span><FileText size={13} /> File ({group.files.length})</span>
                          <label className={`btn btn-secondary btn-sm ${uploadingGroup === group.id ? 'disabled' : ''}`}>
                            <Upload size={13} /> {uploadingGroup === group.id ? 'Upload...' : 'Upload File'}
                            <input
                              type="file"
                              hidden
                              onChange={(e) => handleFileUpload(e, group.id)}
                              disabled={uploadingGroup === group.id}
                            />
                          </label>
                        </div>
                        {group.files.length > 0 && (
                          <div className="todo-group-file-list">
                            {group.files.map((f) => (
                              <div key={f.id} className="todo-group-file-row">
                                <FileText size={14} />
                                <span className="todo-group-file-name">{f.name}</span>
                                <span className="todo-group-file-size">{fmtSize(f.size)}</span>
                                {f.url && (
                                  <a className="icon-btn-sm" href={f.url} target="_blank" rel="noopener" title="Unduh">
                                    <Download size={13} />
                                  </a>
                                )}
                                <button className="icon-btn-sm danger" onClick={() => removeTodoGroupFile(group.id, f.id)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Legacy tasks list */}
      <div className="todo-list-section">
        <div className="panel-header">
          <h2>Daftar Tugas</h2>
          <span className="target-list-count">{filteredTasks.length} tugas</span>
        </div>
        <div className="todo-filters-bar">
          {['Semua', 'Hari Ini', 'Minggu Ini', 'Overdue', 'Failed'].map((filter) => (
            <button key={filter} className={`filter-tab-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>
              {filter}
            </button>
          ))}
        </div>
        <div className="todo-groups-container">
          {filteredTasks.length === 0 ? (
            <div className="target-list-empty"><ListTodo size={40} /><p>Tidak ada tugas.</p></div>
          ) : (
            filteredTasks.map((task) => {
              const project = projects.find(p => p.id === task.projectId)
              return (
                <div key={task.id} className={`todo-task-row ${task.status === 'completed' ? 'completed' : ''}`}>
                  <input type="checkbox" checked={task.status === 'completed'} onChange={() => handleToggleComplete(task)} />
                  <div className="task-body">
                    <span className="task-title">{task.title}</span>
                    <div className="task-tags-row">
                      <span className="badge project-badge">{project ? project.name : 'Personal'}</span>
                      <span className={`badge priority-badge ${task.priority || 'medium'}`}>
                        {task.priority === 'high' ? 'Tinggi' : task.priority === 'low' ? 'Rendah' : 'Sedang'}
                      </span>
                    </div>
                  </div>
                  <span className="task-deadline-text">{task.deadline ? formatDate(task.deadline) : ''}</span>
                  <span className={`task-status-pill ${task.status || 'pending'} ${task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date() ? 'failed' : ''}`}>
                    {task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date() ? 'Gagal' : task.status === 'completed' ? 'Selesai' : task.status === 'in_progress' ? 'Proses' : 'Belum Mulai'}
                  </span>
                  <div className="actions-cell">
                    <button className="action-dots-btn" onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}><MoreVertical size={14} /></button>
                    <AnimatedDropdown show={activeMenuId === task.id}>
                      <div className="todo-dropdown-menu">
                        <button onClick={() => { handleToggleComplete(task); setActiveMenuId(null) }}>Selesai</button>
                        <button onClick={() => { deleteTask(task.id); setActiveMenuId(null) }} className="danger">Hapus</button>
                      </div>
                    </AnimatedDropdown>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="modal-overlay" onClick={() => setShowAddGroup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Grup Todo Baru</h2>
              <button className="close-btn" onClick={() => setShowAddGroup(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Nama Grup</label>
                <input type="text" className="input" placeholder="cth: Pekerjaan Rumah" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} autoFocus />
                <p className="field-hint">Buat grup untuk mengelompokkan tugas, misal "Pekerjaan Rumah", "Project Website", dll.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddGroup(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreateGroup}>Buat Grup</button>
            </div>
          </div>
        </div>
      )}

      {showTemplateGallery && (
        <TemplateGallery type="todos" onClose={() => setShowTemplateGallery(false)}
          onUse={(data) => {
            if (data && Array.isArray(data.items)) {
              data.items.forEach((item) => {
                if (item.title && item.title.trim()) {
                  addTask({ title: item.title.trim(), priority: item.priority || 'medium', status: 'pending' })
                }
              })
            }
          }}
          currentData={{ items: visibleTasks.map((t) => ({ title: t.title, priority: t.priority })) }}
          currentName="Template Todo"
        />
      )}
    </motion.div>
  )
}
