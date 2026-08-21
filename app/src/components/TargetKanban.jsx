import { useStore } from '../store/useStore'
import { Check, Lock, Sparkles } from 'lucide-react'
import './TargetKanban.css'

// Kanban alur berurutan untuk target — kolom = tahap yang didefinisikan
// saat target dibuat. Tahap hanya bisa dikerjakan setelah tahap sebelumnya
// selesai (klik "Selesaikan Tahap"). Jika semua tahap selesai, target
// dinyatakan tercapai.
export default function TargetKanban({ project }) {
  const { toggleChecklist, completeStage } = useStore()
  const stages = project.stages || []

  const allDone = stages.length > 0 && stages.every((s) => s.status === 'completed')

  return (
    <div className="kanban-flow-wrap">
      {allDone && (
        <div className="kanban-achieved">
          <Sparkles size={18} />
          <span>Target tercapai! Semua tahap kanban berhasil diselesaikan.</span>
        </div>
      )}

      <div className="kanban-flow-board">
        {stages.map((stage) => {
          const isLocked = stage.status === 'locked'
          const isCurrent = stage.status === 'in_progress'
          const isCompleted = stage.status === 'completed'

          return (
            <div key={stage.id} className={`flow-column ${stage.status}`}>
              <div className="flow-column-head">
                <h3>{stage.name}</h3>
                {isLocked && <Lock size={14} />}
                {isCompleted && (
                  <span className="flow-done-badge">
                    <Check size={12} /> Selesai
                  </span>
                )}
              </div>

              <div className="flow-column-body">
                {stage.checklist.length === 0 && (
                  <p className="flow-empty">Tidak ada to-do untuk tahap ini</p>
                )}
                {stage.checklist.map((item) => (
                  <label key={item.id} className={`flow-task ${isLocked ? 'locked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      disabled={isLocked}
                      onChange={() => toggleChecklist(project.id, stage.id, item.id)}
                    />
                    <span className={`flow-task-text ${item.completed ? 'completed' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flow-column-foot">
                {isCurrent && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => completeStage(project.id, stage.id)}
                  >
                    <Check size={14} /> Selesaikan Tahap
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
