import { useState } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Select from './Select'
import ThemeSelect from './ThemeSelect'
import StageEditor from './StageEditor'
import DeadlinePicker from './DeadlinePicker'
import { X, KanbanSquare, ListTodo, Target, Users, Filter } from 'lucide-react'
import './TargetForm.css'

// =====================================================================
// TargetForm.jsx — Form "Tambah / Edit Project" (CRUD).
// =====================================================================
// Kolom yang tampil:
//   - Nama Project
//   - Deskripsi Project
//   - Contributor: pilih anggota tim (dari divisi manapun) yang ikut
//     mengerjakan project — bisa lebih dari satu.
//   - Cara Kelola: Kanban (kolom/tahap) atau To-do List (daftar centang).
//     Kanban default: To Do → In Progress → Done, nama tahap bebas & bisa
//     > 3 tahap, tiap tahap punya > 1 to-do. Tahap pertama (To Do) punya
//     tombol Start untuk memindahkan ke tahap 2.
// Prop `initial` (project yang sudah ada) => mode EDIT (updateProject);
// tanpa prop => mode BUAT (createTarget).
// =====================================================================

const VIEW_TYPES = {
  kanban: { label: 'Kanban', desc: 'Task di kolom, bisa digeser', icon: KanbanSquare },
  todo: { label: 'To-do List', desc: 'Daftar tugas dengan centang', icon: ListTodo },
}

// Tahap kanban default: To Do → In Progress → Done (nama bebas, bisa ditambah).
const DEFAULT_STAGES = [
  { id: 1, name: 'To Do', todos: [] },
  { id: 2, name: 'In Progress', todos: [] },
  { id: 3, name: 'Done', todos: [] },
]

// Ubah stages store ({name, checklist}) menjadi format editor ({name, todos}).
const stagesToEditor = (stages) =>
  Array.isArray(stages) && stages.length
    ? stages.map((s, i) => ({
        id: s.id ?? i + 1,
        name: s.name || '',
        todos: (s.checklist || []).map((c) => c.text || ''),
      }))
    : DEFAULT_STAGES

export default function TargetForm({ onClose, onCreated, initial }) {
  const { currentUser, divisions, members, companyInfo, createTarget, updateProject } = useStore()
  const role = useEffectiveRole()

  const isEditing = Boolean(initial)
  const isIndividual = companyInfo?.type === 'individual'
  const isAdmin = (role === 'admin' || role === 'super_admin' || role === 'owner') && !isIndividual

  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    viewType: initial?.viewType || 'kanban',
    theme: initial?.theme || '',
    priority: initial?.priority || 'medium',
    deadlineType: initial?.deadlineType || 'deadline',
    deadline: initial?.deadline || '',
    deadlineLabel: initial?.deadlineLabel || '',
    collaboratorIds: initial?.collaboratorIds || [],
    stages: stagesToEditor(initial?.stages),
  })
  const [divisionFilter, setDivisionFilter] = useState('')

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleCollaborator = (memberId) => {
    setForm((f) => ({
      ...f,
      collaboratorIds: f.collaboratorIds.includes(memberId)
        ? f.collaboratorIds.filter((id) => id !== memberId)
        : [...f.collaboratorIds, memberId],
    }))
  }

  const canSubmit = form.name.trim().length > 0

  const handleSubmit = () => {
    if (!canSubmit) return
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      viewType: form.viewType,
      theme: form.theme,
      priority: form.priority,
      deadlineType: form.deadlineType,
      deadline: form.deadline,
      deadlineLabel: form.deadlineLabel,
      createdBy: currentUser?.id,
      collaboratorIds: form.collaboratorIds,
      // Alur kanban dibawa ke store (kolom = tahap, task = to-do).
      ...(form.viewType === 'kanban' ? { stages: form.stages } : {}),
    }
    let id = initial?.id
    if (isEditing && id != null) {
      updateProject(id, payload)
    } else {
      id = createTarget(payload)
    }
    onClose()
    if (onCreated) onCreated(id)
  }

  // Member yang bisa dijadikan contributor (filter divisi opsional).
  const contributorMembers = members.filter((m) =>
    divisionFilter ? m.divisionId === divisionFilter : true
  )
  const divisionOf = (memberId) =>
    divisions.find((d) => d.id === members.find((m) => m.id === memberId)?.divisionId)?.name || 'Tanpa divisi'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal target-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Project' : 'Project Baru'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Nama Project</label>
            <input
              type="text"
              className="input"
              placeholder="cth: Peluncuran Website Perusahaan"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Deskripsi Project</label>
            <textarea
              className="input target-textarea"
              placeholder="Jelaskan tujuan & lingkup project ini..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Folder</label>
            <ThemeSelect
              value={form.theme}
              onChange={(v) => set('theme', v)}
              placeholder="Pilih folder atau buat baru..."
            />
            <p className="field-hint">Kelompokkan project dalam satu folder, mis. "Project Rumah". Satu folder bisa berisi beberapa project.</p>
          </div>

          {/* Contributor — anggota tim dari divisi manapun */}
          <div className="input-group">
            <label className="input-label">
              <Users size={13} /> Contributor
            </label>
            <p className="field-hint">
              Pilih anggota tim yang ikut mengerjakan project ini. Bisa dari divisi manapun.
            </p>
            <div className="contributor-filter">
              <Filter size={14} />
              <Select
                placeholder="Semua divisi"
                allowReset
                value={divisionFilter}
                onChange={(v) => setDivisionFilter(v || '')}
                options={divisions.map((d) => ({ value: d.id, label: d.name }))}
              />
            </div>
            {contributorMembers.length === 0 ? (
              <p className="field-hint">Belum ada anggota untuk divisi ini.</p>
            ) : (
              <div className="collab-picker">
                {contributorMembers.map((m) => {
                  const checked = form.collaboratorIds.includes(m.id)
                  return (
                    <label key={m.id} className={`collab-chip ${checked ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCollaborator(m.id)}
                      />
                      <span className="collab-chip-avatar">
                        {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="collab-chip-name">{m.name}</span>
                      <span className="collab-chip-div">{divisionOf(m.id)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cara kelola — kartu pilihan */}
          <div className="input-group">
            <label className="input-label">Cara Kelola</label>
            <div className="viewtype-grid">
              {Object.keys(VIEW_TYPES).map((key) => {
                const vt = VIEW_TYPES[key]
                const Icon = vt.icon
                return (
                  <button
                    key={key}
                    type="button"
                    className={`viewtype-card ${form.viewType === key ? 'selected' : ''}`}
                    onClick={() => set('viewType', key)}
                  >
                    <Icon size={20} />
                    <span className="viewtype-title">{vt.label}</span>
                    <span className="viewtype-desc">{vt.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Editor alur kanban — kolom = tahap, task = to-do tiap tahap */}
          {form.viewType === 'kanban' && (
            <div className="input-group kanban-flow">
              <label className="input-label">Alur Kanban</label>
              <p className="field-hint">
                Tahap pertama (To Do) punya tombol <strong>Start</strong> untuk memindahkan ke
                tahap 2. Tiap tahap bisa punya lebih dari satu to-do yang harus dicentang untuk
                menyelesaikan tahap.
              </p>

              <StageEditor
                stages={form.stages}
                onChange={(stages) => setForm((f) => ({ ...f, stages }))}
                stageLabel="Tahap"
                addLabel="Tambah Tahap"
              />
            </div>
          )}

          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Prioritas</label>
              <Select
                allowReset={false}
                value={form.priority}
                onChange={(v) => set('priority', v)}
                options={[
                  { value: 'high', label: 'Tinggi' },
                  { value: 'medium', label: 'Sedang' },
                  { value: 'low', label: 'Rendah' },
                ]}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Deadline</label>
              <DeadlinePicker
                value={form}
                onChange={(v) => setForm((f) => ({ ...f, ...v }))}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
            <Target size={16} />
            {isEditing ? 'Simpan Perubahan' : 'Buat Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
