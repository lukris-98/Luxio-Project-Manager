import { useStore, useEffectiveRole } from '../store/useStore'
import Layout from '../components/Layout'
import InviteUsers from '../components/InviteUsers'
import TargetBoard from '../components/TargetBoard'
import TargetTodo from '../components/TargetTodo'
import TargetKanban from '../components/TargetKanban'
import TargetStats from '../components/TargetStats'
import ConfettiBurst from '../components/ConfettiBurst'
import { deadlineText } from '../utils/deadline'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, CalendarClock, User, Check, Lock, Target, KanbanSquare, ListTodo, GitBranch, Trash2, X, FolderOpen } from 'lucide-react'
import './ProjectDetail.css'

const VIEW_BADGE = {
  kanban: { label: 'Kanban', icon: KanbanSquare },
  todo: { label: 'To-do List', icon: ListTodo },
  workflow: { label: 'Workflow', icon: GitBranch },
}

// Dashboard progress & analitik satu target. Target bisa berisi lebih dari
// satu board kanban DAN beberapa to-do list sekaligus (bukan multi-tab).
export default function ProjectDetail() {
  const { projects, kanbanBoards, tasks, members, selectedProjectId, deleteProject, toggleChecklist, completeStage, setCurrentPage, toggleProjectCollaborator } = useStore()
  const role = useEffectiveRole()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confetti, setConfetti] = useState(false)
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

  if (!project) {
    return (
      <Layout>
        <div className="project-detail-empty">
          <Target size={48} />
          <h2>Belum ada target</h2>
          <p>Buat target dulu untuk melihat detail</p>
          <button className="btn btn-primary" onClick={() => setCurrentPage('projects')}>
            Kembali ke Target
          </button>
        </div>
      </Layout>
    )
  }

  const viewBadge = VIEW_BADGE[project.viewType]
  const ViewIcon = viewBadge?.icon || Target
  // Semua board kanban milik target ini (bisa lebih dari satu).
  const boards = kanbanBoards.filter((b) => b.projectId === project.id)
  const assignee = members.find((m) => m.id === project.assigneeId)
  const collaborators = (project.collaboratorIds || [])
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean)
  const todoCount = tasks.filter((t) => t.projectId === project.id).length

  return (
    <Layout>
      <ConfettiBurst active={confetti} />

      <motion.div
        className="project-detail"
        initial={{ opacity: 0 }}
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

        {/* Dashboard & analitik target */}
        <div className="manage-head">
          <h2>Dashboard & Analitik</h2>
          <p>Target ini berisi {boards.length} board kanban dan {todoCount} to-do list.</p>
        </div>

        {/* ===== Kanban boards (bisa lebih dari satu) ===== */}
        {boards.length > 0 && (
          <div className="detail-board-section">
            <div className="detail-sub-head">
              <KanbanSquare size={16} />
              <h3>Board Kanban</h3>
              <span className="detail-sub-count">{boards.length}</span>
            </div>
            {boards.map((board) => (
              <div key={board.id} className="detail-view detail-board">
                <div className="detail-board-title">{board.name}</div>
                <TargetBoard board={board} />
              </div>
            ))}
          </div>
        )}

        {/* ===== Kanban alur (legacy target kanban) ===== */}
        {project.viewType === 'kanban' && project.stages.length > 0 && (
          <div className="detail-board-section">
            <div className="detail-sub-head">
              <KanbanSquare size={16} />
              <h3>Alur Kanban</h3>
            </div>
            <div className="detail-view">
              <TargetKanban project={project} />
            </div>
          </div>
        )}

        {/* ===== To-do list target ===== */}
        <div className="detail-board-section">
          <div className="detail-sub-head">
            <ListTodo size={16} />
            <h3>To-do List</h3>
            <span className="detail-sub-count">{todoCount}</span>
          </div>
          <div className="detail-view detail-todo">
            <TargetTodo projectId={project.id} />
          </div>
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
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Hapus Target</h2>
                <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p className="delete-warning">
                  Yakin ingin menghapus target <strong>"{project.name}"</strong>?
                  Semua tahap kanban & to-do list di dalamnya akan ikut terhapus.
                  Tindakan ini tidak bisa dibatalkan.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Batal
                </button>
                <button className="btn btn-danger" onClick={handleDelete}>
                  <Trash2 size={16} /> Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
