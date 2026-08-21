import { useStore, useEffectiveRole } from '../store/useStore'
import Layout from '../components/Layout'
import TargetBoard from '../components/TargetBoard'
import TargetTodo from '../components/TargetTodo'
import TargetKanban from '../components/TargetKanban'
import TargetStats from '../components/TargetStats'
import ConfettiBurst from '../components/ConfettiBurst'
import { deadlineText } from '../utils/deadline'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, CalendarClock, User, Check, Lock, Target, KanbanSquare, ListTodo, GitBranch, Trash2, X } from 'lucide-react'
import './ProjectDetail.css'

const VIEW_BADGE = {
  kanban: { label: 'Kanban', icon: KanbanSquare },
  todo: { label: 'To-do List', icon: ListTodo },
  workflow: { label: 'Workflow', icon: GitBranch },
}

export default function ProjectDetail() {
  const { projects, kanbanBoards, members, selectedProjectId, deleteProject, toggleChecklist, completeStage, setCurrentPage } = useStore()
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
  const board =
    project.viewType === 'kanban'
      ? kanbanBoards.find((b) => b.projectId === project.id)
      : null
  const assignee = members.find((m) => m.id === project.assigneeId)

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

          <div className="detail-header-content">
            <div className="detail-title">
              <h1>{project.name}</h1>
              {project.type && <span className="badge badge-muted">{project.type}</span>}
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
          </div>
        </div>

        {/* Statistik progress — ring persen, bar selesai/belum, count kanban & to-do */}
        <TargetStats project={project} />

        {/* Kelola target */}
        <div className="manage-head">
          <h2>Kelola Target</h2>
          <p>Centang to-do dan selesaikan tiap tahap untuk melaju</p>
        </div>

        {/* Body sesuai cara kelola target */}
        {project.viewType === 'kanban' && (
          project.stages.length > 0 ? (
            <div className="detail-view">
              <TargetKanban project={project} />
            </div>
          ) : board ? (
            <div className="detail-view">
              <TargetBoard board={board} />
            </div>
          ) : (
            <div className="detail-view-empty">
              <KanbanSquare size={40} />
              <h3>Board kanban belum dibuat</h3>
              <p>Buka halaman Kanban untuk membuat board target ini</p>
            </div>
          )
        )}

        {project.viewType === 'todo' && (
          <div className="detail-view detail-todo">
            <TargetTodo projectId={project.id} />
          </div>
        )}

        {project.viewType === 'workflow' && (
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
