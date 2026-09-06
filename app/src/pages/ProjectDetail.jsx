import { useStore, useEffectiveRole } from '../store/useStore'
import InviteUsers from '../components/InviteUsers'
import TargetForm from '../components/TargetForm'
import TargetBoard from '../components/TargetBoard'
import TargetTodo from '../components/TargetTodo'
import TargetStats from '../components/TargetStats'
import ProjectDashboard from '../components/ProjectDashboard'
import ConfettiBurst from '../components/ConfettiBurst'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { deadlineText } from '../utils/deadline'
import { useState, useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, CalendarClock, User, Check, Lock, Target, KanbanSquare, ListTodo, GitBranch, Trash2, X, FolderOpen, Pencil } from 'lucide-react'
import './ProjectDetail.css'

const VIEW_BADGE = {
  kanban: { label: 'Kanban', icon: KanbanSquare },
  todo: { label: 'To-do List', icon: ListTodo },
  workflow: { label: 'Workflow', icon: GitBranch },
}

// Dashboard progress & analitik satu project. Halaman menampung lebih dari
// satu kanban DAN lebih dari satu to-do list sekaligus lewat multi-tab
// (tab bisa discroll horizontal). Urutan: dashboard/chart di atas,
// kanban & to-do list di bawahnya.
export default function ProjectDetail() {
  const { projects, kanbanBoards, tasks, members, selectedProjectId, deleteProject, toggleChecklist, completeStage, setCurrentPage, toggleProjectCollaborator } = useStore()
  const role = useEffectiveRole()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [kanbanTab, setKanbanTab] = useState(0)
  const [todoTab, setTodoTab] = useState(0)
  const prevStatus = useRef(null)

  // Detail target yang dibuka (via openProject / klik kartu target).
  const project = projects.find((p) => p.id === selectedProjectId) || projects[0]

  // Efek party popper sekali saat target baru saja mencapai 100% (sukses).
  useEffect(() => {
    if (!project) return
    if (project.status === 'completed' && prevStatus.current !== 'completed') {
      setConfetti(true)
      const t = setTimeout(() => setConfetti(false), 4000)
      prevStatus.current = 'completed'
      return () => clearTimeout(t)
    }
    prevStatus.current = project.status
  }, [project])

  const canDelete = role === 'owner' || role === 'super_admin' || role === 'admin'

  const handleDelete = () => {
    deleteProject(project.id)
    setShowDeleteConfirm(false)
    setCurrentPage('projects')
  }

  // Semua board kanban milik target ini (bisa lebih dari satu).
  const boards = kanbanBoards.filter((b) => b.projectId === project.id)
  const assignee = members.find((m) => m.id === project.assigneeId)
  const collaborators = (project.collaboratorIds || [])
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean)

  // To-do list project dikelompokkan per "list" (theme/listName) agar bisa
  // ditampilkan sebagai multi-tab; task tanpa grup masuk tab "Semua".
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === project.id),
    [tasks, project.id]
  )
  const todoLists = useMemo(() => {
    const groups = []
    const seen = new Set()
    projectTasks.forEach((t) => {
      const g = t.listName || t.theme || ''
      if (!seen.has(g)) { seen.add(g); groups.push(g) }
    })
    if (groups.length === 0) groups.push('')
    return groups.map((g) => ({
      name: g || 'Semua To-do',
      tasks: projectTasks.filter((t) => (t.listName || t.theme || '') === g),
    }))
  }, [projectTasks])

  // Reset tab aktif bila daftar berubah.
  useEffect(() => { if (kanbanTab >= boards.length) setKanbanTab(0) }, [boards.length, kanbanTab])
  useEffect(() => { if (todoTab >= todoLists.length) setTodoTab(0) }, [todoLists.length, todoTab])

  if (!project) {
    return (
      <>
        <div className="project-detail-empty">
          <Target size={48} />
          <h2>Belum ada target</h2>
          <p>Buat project dulu untuk melihat detail</p>
          <button className="btn btn-primary" onClick={() => setCurrentPage('projects')}>
            Kembali ke Target
          </button>
        </div>
      </>
    )
  }

  const viewBadge = VIEW_BADGE[project.viewType]
  const ViewIcon = viewBadge?.icon || Target
  const activeBoard = boards[kanbanTab]
  const activeTodoList = todoLists[todoTab]

  return (
    <>
      <ConfettiBurst active={confetti} />

      <motion.div
        className="project-detail"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="detail-header">
          <div className="detail-header-bar">
            <button className="btn btn-ghost" onClick={() => setCurrentPage('projects')}>
              <ArrowLeft size={16} />
              Kembali
            </button>
            <div className="detail-header-right">
              {canDelete && (
                <InviteUsers
                  collaborators={project.collaboratorIds || []}
                  onToggle={(id) => toggleProjectCollaborator(project.id, id)}
                />
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEdit(true)}
              >
                <Pencil size={16} />
                Edit
              </button>
              {canDelete && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} />
                  Hapus Target
                </button>
              )}
            </div>
          </div>

          <div className="detail-header-content">
            <div className="detail-title">
              <h1>{project.name}</h1>
              {project.theme && (
                <span className="badge badge-muted">
                  <FolderOpen size={12} /> {project.theme}
                </span>
              )}
              {viewBadge && (
                <span className={`badge viewtype-badge-${project.viewType}`}>
                  <ViewIcon size={12} />
                  {viewBadge.label}
                </span>
              )}
            </div>
            <div className="detail-meta">
              {project.division && <span><Calendar size={14} /> {project.division}</span>}
              {assignee?.name && <span><User size={14} /> {assignee.name}</span>}
              {deadlineText(project) && <span><CalendarClock size={14} /> {deadlineText(project)}</span>}
            </div>
            {/* Kolaborator multi-user */}
            {collaborators.length > 0 && (
              <div className="detail-collab">
                <div className="collab-avatars">
                  {collaborators.slice(0, 4).map((c) => (
                    <span key={c.id} className="collab-avatar" title={c.name}>
                      {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  ))}
                  {collaborators.length > 4 && <span className="collab-avatar more">+{collaborators.length - 4}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistik progress — ring persen, bar selesai/belum, count kanban & to-do */}
        <TargetStats project={project} />

        {/* ===== Dashboard & analitik (pie + line + ringkasan) ===== */}
        <div className="manage-head">
          <h2>Dashboard & Analitik</h2>
          <p>Project ini berisi {boards.length} board kanban dan {todoLists.length} to-do list.</p>
        </div>
        <ProjectDashboard project={project} boards={boards} projectTasks={projectTasks} />

        {/* ===== Multi-tab Kanban boards (scroll horizontal) ===== */}
        {boards.length > 0 && (
          <div className="detail-board-section">
            <div className="detail-sub-head">
              <KanbanSquare size={16} />
              <h3>Board Kanban</h3>
              <span className="detail-sub-count">{boards.length}</span>
            </div>
            {boards.length > 1 && (
              <div className="detail-tabs detail-tabs-scroll">
                {boards.map((board, i) => (
                  <button
                    key={board.id}
                    className={`detail-tab ${kanbanTab === i ? 'active' : ''}`}
                    onClick={() => setKanbanTab(i)}
                  >
                    <KanbanSquare size={13} /> {board.name}
                  </button>
                ))}
              </div>
            )}
            {activeBoard && (
              <div className="detail-view detail-board">
                <div className="detail-board-title">{activeBoard.name}</div>
                <TargetBoard board={activeBoard} />
              </div>
            )}
          </div>
        )}

        {/* ===== Multi-tab To-do list (scroll horizontal) ===== */}
        <div className="detail-board-section">
          <div className="detail-sub-head">
            <ListTodo size={16} />
            <h3>To-do List</h3>
            <span className="detail-sub-count">{todoLists.length}</span>
          </div>
          {todoLists.length > 1 && (
            <div className="detail-tabs detail-tabs-scroll">
              {todoLists.map((list, i) => (
                <button
                  key={list.name + i}
                  className={`detail-tab ${todoTab === i ? 'active' : ''}`}
                  onClick={() => setTodoTab(i)}
                >
                  <ListTodo size={13} /> {list.name} ({list.tasks.length})
                </button>
              ))}
            </div>
          )}
          {activeTodoList && (
            <div className="detail-view detail-todo">
              <div className="detail-todo-list">
                <TargetTodo projectId={project.id} tasks={activeTodoList.tasks} />
              </div>
            </div>
          )}
        </div>

        {/* ===== Workflow (legacy) ===== */}
        {project.viewType === 'workflow' && project.stages.length > 0 && (
          <div className="stages-timeline">
            {project.stages.map((stage, idx) => (
              <div key={stage.id} className={`timeline-stage ${stage.status}`}>
                <div className="stage-connector">
                  <div className="stage-dot">
                    {stage.status === 'completed' && <Check size={12} />}
                    {stage.status === 'in_progress' && <div className="pulse-dot"></div>}
                    {stage.status === 'locked' && <Lock size={10} />}
                  </div>
                  {idx < project.stages.length - 1 && <div className="connector-line"></div>}
                </div>

                <div className="stage-content">
                  <div className="stage-header">
                    <h3>{stage.name}</h3>
                    <span className={`badge badge-${stage.status === 'completed' ? 'success' : stage.status === 'in_progress' ? 'error' : 'muted'}`}>
                      {stage.status === 'completed' ? 'Selesai' : stage.status === 'in_progress' ? 'On Progress' : 'Locked'}
                    </span>
                  </div>

                  {stage.status !== 'locked' && stage.checklist.length > 0 && (
                    <div className="stage-checklist">
                      {stage.checklist.map((item) => (
                        <label key={item.id} className="checklist-item">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklist(project.id, stage.id, item.id)}
                          />
                          <span className={`checklist-text ${item.completed ? 'completed' : ''}`}>
                            {item.text}
                          </span>
                        </label>
                      ))}

                      {stage.status === 'in_progress' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => completeStage(project.id, stage.id)}
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  )}

                  {stage.status === 'locked' && (
                    <div className="stage-locked">
                      <Lock size={12} />
                      <span>Selesaikan stage sebelumnya dulu</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Konfirmasi hapus target */}
        {showDeleteConfirm && (
          <DeleteConfirmModal
            title="Hapus Target"
            itemName={project.name}
            message={`Semua tahap kanban & to-do list di dalamnya akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`}
            onConfirm={handleDelete}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}

        {/* Edit project */}
        {showEdit && (
          <TargetForm
            initial={project}
            onClose={() => setShowEdit(false)}
            onCreated={() => setShowEdit(false)}
          />
        )}
      </motion.div>
    </>
  )
}
