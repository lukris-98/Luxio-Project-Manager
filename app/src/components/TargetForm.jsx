import { useState } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Select from './Select'
import ThemeSelect from './ThemeSelect'
import StageEditor from './StageEditor'
import DeadlinePicker from './DeadlinePicker'
import { X, KanbanSquare, ListTodo, Target, Sparkles } from 'lucide-react'
import './TargetForm.css'

// =====================================================================
// TargetForm.jsx — Form "Tambah Target Baru" (sebuah visi).
// =====================================================================
// Kolom yang tampil beda-beda tergantung role user & tipe akun:
//   - super_admin : semua kolom (divisi, assignee, tipe target, cara kelola).
//   - admin       : divisi, assignee, cara kelola (tanpa tipe target).
//   - member      : hanya nama/visi, deskripsi, cara kelola (kanban/to-do),
//                   prioritas & deadline — otomatis diassign ke dirinya.
//   - akun individual : tanpa divisi/anggota — target otomatis diassign
//                   ke pemilik akun (tidak ada dropdown divisi/assignee).
// Cara kelola target: Kanban (board kolom) atau To-do List (daftar centang).
// =====================================================================

const VIEW_TYPES = {
  kanban: { label: 'Kanban', desc: 'Task di kolom, bisa digeser', icon: KanbanSquare },
  todo: { label: 'To-do List', desc: 'Daftar tugas dengan centang', icon: ListTodo },
}

const TYPE_OPTIONS = [
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'project', label: 'Project' },
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Tinggi' },
  { value: 'medium', label: 'Sedang' },
  { value: 'low', label: 'Rendah' },
]

const ROLE_HINTS = {
  super_admin: 'Kontrol penuh: divisi, assignee, tipe target, dan cara kelola.',
  admin: 'Boleh atur divisi, assignee, dan cara kelola target.',
  member: 'Target otomatis diassign ke kamu. Kolom divisi & assignee hanya untuk admin.',
  individual: 'Akun individual: tanpa divisi/anggota, target otomatis diassign ke kamu.',
}

export default function TargetForm({ onClose, onCreated }) {
  const { currentUser, divisions, members, companyInfo, createTarget } = useStore()
  const role = useEffectiveRole()

  const isIndividual = companyInfo?.type === 'individual'
  const isAdmin = (role === 'admin' || role === 'super_admin' || role === 'owner') && !isIndividual
  const isSuper = (role === 'super_admin' || role === 'owner') && !isIndividual

  // Pilihan cara kelola dibatasi per role (workflow tidak dipakai).
  const viewTypeKeys = ['kanban', 'todo']

  const [form, setForm] = useState({
    name: '',
    description: '',
    viewType: 'kanban',
    theme: '',
    divisionId: '',
    assigneeId: '',
    type: 'project',
    priority: 'medium',
    deadlineType: 'deadline',
    deadline: '',
    deadlineLabel: '',
    // Kolaborator (multi-user): daftar member yang ikut mengerjakan target.
    collaboratorIds: [],
    // Alur kanban: daftar tahap, tiap tahap punya daftar to-do.
    stages: [{ id: 1, name: '', todos: [] }],
  })

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
    const id = createTarget({
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
      // Admin/super boleh pilih divisi & assignee; member diassign ke diri sendiri.
      ...(isAdmin ? { assigneeId: form.assigneeId } : { assigneeId: currentUser?.id }),
      ...(isAdmin && form.divisionId
        ? { divisionId: form.divisionId, division: divisions.find((d) => d.id === form.divisionId)?.name || '' }
        : { division: '' }),
      ...(isSuper && form.type ? { type: form.type } : { type: 'project' }),
    })
    onClose()
    if (onCreated) onCreated(id)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal target-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Target Baru</h2>
          <button className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Role notice */}
          <div className="role-hint">
            <Sparkles size={14} />
            <span>{ROLE_HINTS[isIndividual ? 'individual' : role]}</span>
          </div>

          <div className="input-group">
            <label className="input-label">Nama Target / Visi</label>
            <input
              type="text"
              className="input"
              placeholder="cth: Menjadi agency kreatif terbaik 2026"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label">Deskripsi visi</label>
            <textarea
              className="input target-textarea"
              placeholder="Jelaskan visi atau target ini..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Label</label>
            <ThemeSelect
              value={form.theme}
              onChange={(v) => set('theme', v)}
              placeholder="Pilih label atau buat baru..."
            />
            <p className="field-hint">Kelompokkan target dalam satu label, mis. "Project Rumah".</p>
          </div>

          {/* Cara kelola — kartu pilihan */}
          <div className="input-group">
            <label className="input-label">Cara Kelola</label>
            <div className="viewtype-grid">
              {viewTypeKeys.map((key) => {
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

          {/* Kolom khusus admin/super_admin */}
          {isAdmin && (
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label">Divisi</label>
                <Select
                  placeholder="Pilih divisi..."
                  value={form.divisionId}
                  onChange={(v) => set('divisionId', v)}
                  options={divisions.map((d) => ({ value: d.id, label: d.name }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Assign ke</label>
                <Select
                  placeholder="Pilih anggota..."
                  allowReset
                  value={form.assigneeId}
                  onChange={(v) => set('assigneeId', v)}
                  options={members.map((m) => ({ value: m.id, label: m.name }))}
                />
              </div>
            </div>
          )}

          {/* Kolaborator multi-user — siapa saja yang ikut mengerjakan target ini */}
          {isAdmin && members.length > 0 && (
            <div className="input-group">
              <label className="input-label">Kolaborator (multi-user)</label>
              <p className="field-hint">
                Pilih anggota yang ikut mengerjakan target ini. Bisa lebih dari satu.
              </p>
              <div className="collab-picker">
                {members.map((m) => {
                  const checked = form.collaboratorIds.includes(m.id)
                  const isAssignee = m.id === form.assigneeId
                  return (
                    <label key={m.id} className={`collab-chip ${checked ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked || isAssignee}
                        onChange={() => toggleCollaborator(m.id)}
                      />
                      <span className="collab-chip-avatar">
                        {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="collab-chip-name">{m.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Editor alur kanban — kolom = tahap, task = to-do tiap tahap */}
          {form.viewType === 'kanban' && (
            <div className="input-group kanban-flow">
              <label className="input-label">Alur Kanban</label>
              <p className="field-hint">
                Tulis tahap/kolom dan to-do tiap tahap. Tahap berikutnya terbuka setelah
                tahap sebelumnya selesai.
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
                options={PRIORITY_OPTIONS}
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

          {/* Kolom khusus super_admin */}
          {isSuper && (
            <div className="input-group">
              <label className="input-label">Tipe Target</label>
              <Select
                allowReset={false}
                value={form.type}
                onChange={(v) => set('type', v)}
                options={TYPE_OPTIONS}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" disabled={!canSubmit} onClick={handleSubmit}>
            <Target size={16} />
            Buat Target
          </button>
        </div>
      </div>
    </div>
  )
}
