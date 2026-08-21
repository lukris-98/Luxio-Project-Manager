import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import Select from '../components/Select'
import {
  UserRound, Users, Building2, GraduationCap, Briefcase,
  UserPlus, ArrowRight, ArrowLeft, Check, X, Plus, Landmark
} from 'lucide-react'
import './Setup.css'

// =====================================================================
// Setup.jsx — Onboarding wizard (pengisian data awal).
// =====================================================================
// Alur: langkah 0 = pilih TIPE akun (Individual / Grup / Perusahaan /
// Instansi / Sekolah). Tiap tipe punya alur pengisian data berbeda:
//   - individual  : Profil -> Selesai (tanpa divisi/anggota)
//   - grup        : Info Grup -> Anggota -> Selesai
//   - perusahaan  : Perusahaan -> Divisi -> Anggota -> Selesai
//   - sekolah     : Sekolah -> Kelas -> Anggota -> Selesai
// Pilihan tipe disimpan di store.companyInfo.type, data form lain juga
// disimpan di store (companyInfo / divisions / members).
// =====================================================================

const TYPE_OPTIONS = [
  { id: 'individual', title: 'Individual', desc: 'Tugas pribadi, freelance, atau belajar', icon: UserRound, color: '#10B981' },
  { id: 'grup', title: 'Grup', desc: 'Keluarga, komunitas, atau tim kecil', icon: Users, color: '#8B5CF6' },
  { id: 'perusahaan', title: 'Perusahaan / Instansi', desc: 'Bisnis, agency, atau instansi dengan divisi', icon: Building2, color: '#FF6B35' },
  { id: 'sekolah', title: 'Sekolah', desc: 'Sekolah/kampus dengan kelas & anggota', icon: GraduationCap, color: '#F59E0B' },
]

// Judul langkah per tipe. Indeks: 0=tipe, lalu langkah spesifik tipe.
const STEP_TITLES = {
  individual: ['Tipe', 'Profil', 'Selesai'],
  grup: ['Tipe', 'Info Grup', 'Anggota', 'Selesai'],
  perusahaan: ['Tipe', 'Perusahaan', 'Divisi', 'Anggota', 'Selesai'],
  sekolah: ['Tipe', 'Sekolah', 'Kelas', 'Anggota', 'Selesai'],
}

const industries = ['Technology', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Other']
const companySizes = ['1-10', '11-50', '51-100', '101-500', '500+']
const schoolLevels = ['TK', 'SD', 'SMP', 'SMA', 'SMK', 'Perguruan Tinggi', 'Lembaga Kursus']

// Role anggota yang tersedia per tipe.
const MEMBER_ROLES = {
  grup: ['anggota', 'admin'],
  perusahaan: ['member', 'admin'],
  sekolah: ['siswa', 'guru', 'staff'],
}

const stepIcon = (title) => {
  switch (title) {
    case 'Tipe': return UserRound
    case 'Profil': return UserRound
    case 'Info Grup': return Users
    case 'Perusahaan': return Building2
    case 'Divisi': return Briefcase
    case 'Sekolah': return GraduationCap
    case 'Kelas': return Landmark
    case 'Anggota': return Users
    default: return Check
  }
}

export default function Setup() {
  const {
    setupStep, setSetupStep,
    companyInfo, setCompanyInfo, setUserType,
    divisions, addDivision, removeDivision,
    members, addMember, removeMember,
    completeSetup
  } = useStore()

  const type = companyInfo.type
  const steps = type ? STEP_TITLES[type] : ['Tipe']
  const completeStep = steps.length - 1
  const divisionsStep = type === 'perusahaan' || type === 'sekolah' ? 2 : -1
  const membersStep = type === 'grup' ? 2 : type === 'perusahaan' || type === 'sekolah' ? 3 : -1
  const isSchool = type === 'sekolah'
  const divisionLabel = isSchool ? 'Kelas' : 'Divisi'
  const roles = MEMBER_ROLES[type] || ['member']
  const defaultRole = roles[0]

  const [newDivisionName, setNewDivisionName] = useState('')
  const [newMember, setNewMember] = useState({ name: '', email: '', divisionId: '', role: defaultRole })

  // Keamanan alur: tanpa tipe terpilih, selalu tampilkan langkah 0
  // (pemilihan tipe) — mencegah form melompat ke data perusahaan.
  useEffect(() => {
    if (!type && setupStep > 0) setSetupStep(0)
  }, [type, setupStep])

  // ---------- NAVIGASI LANGSKAH ----------

  // Langkah berikutnya setelah `step` (lewati langkah yang tidak berlaku utk tipe ini).
  const nextAfter = (step) => {
    const candidates = [divisionsStep, membersStep, completeStep].filter((s) => s > step)
    return candidates.length ? Math.min(...candidates) : completeStep
  }
  // Langkah sebelumnya (kembali), melompati langkah yang tak berlaku.
  const prevOf = (step) => {
    const candidates = [1, divisionsStep, membersStep].filter((s) => s < step)
    return candidates.length ? Math.max(...candidates) : 0
  }

  // Validasi "Lanjut" per langkah.
  const canGoNext = (step) => {
    if (step === 1) {
      if (type === 'perusahaan') return companyInfo.name && companyInfo.industry && companyInfo.size
      if (type === 'sekolah') return companyInfo.name && companyInfo.industry
      return !!companyInfo.name
    }
    if (step === divisionsStep) return divisions.length > 0
    if (step === membersStep) return members.length > 0
    return false
  }

  const handleComplete = async () => {
    // Sinkronkan setup ke backend (jika online).
    await completeSetup()
  }

  // ---------- RENDER LANGKAH ----------

  const renderTypeStep = () => (
    <>
      <div className="setup-header">
        <h1>Luxio dipakai untuk apa?</h1>
        <p>Pilih tipe yang paling cocok. Alur pengisian data akan menyesuaikan.</p>
      </div>
      <div className="type-grid">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`type-card ${type === opt.id ? 'selected' : ''}`}
            style={{ '--type-color': opt.color }}
            onClick={() => { setUserType(opt.id); setSetupStep(1) }}
          >
            <span className="type-card-icon"><opt.icon size={24} /></span>
            <span className="type-card-title">{opt.title}</span>
            <span className="type-card-desc">{opt.desc}</span>
          </button>
        ))}
      </div>
    </>
  )

  // Langkah 1: info dasar — isi field berbeda tergantung tipe.
  const renderInfoStep = () => {
    if (type === 'individual') {
      return (
        <div className="setup-form">
          <div className="input-group">
            <label className="input-label">Nama kamu</label>
            <input
              type="text"
              className="input"
              placeholder="Nama panggilan / nama lengkap"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Profesi / Bidang</label>
            <input
              type="text"
              className="input"
              placeholder="cth: Freelancer, Mahasiswa, Developer"
              value={companyInfo.industry || ''}
              onChange={(e) => setCompanyInfo({ industry: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tujuan utama</label>
            <Select
              placeholder="Pilih tujuan..."
              value={companyInfo.size || ''}
              onChange={(v) => setCompanyInfo({ size: v })}
              options={[
                { value: 'Manajemen tugas pribadi', label: 'Manajemen tugas pribadi' },
                { value: 'Freelance / klien', label: 'Freelance / klien' },
                { value: 'Belajar / sekolah', label: 'Belajar / sekolah' },
                { value: 'Rencana & target hidup', label: 'Rencana & target hidup' },
                { value: 'Lainnya', label: 'Lainnya' },
              ]}
            />
          </div>
        </div>
      )
    }

    if (type === 'grup') {
      return (
        <div className="setup-form">
          <div className="input-group">
            <label className="input-label">Nama Grup</label>
            <input
              type="text"
              className="input"
              placeholder="cth: Keluarga Besar, Komunitas X"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Jenis Grup</label>
            <Select
              placeholder="Pilih jenis..."
              value={companyInfo.industry || ''}
              onChange={(v) => setCompanyInfo({ industry: v })}
              options={[
                { value: 'Keluarga', label: 'Keluarga' },
                { value: 'Komunitas', label: 'Komunitas' },
                { value: 'Tim / Organisasi kecil', label: 'Tim / Organisasi kecil' },
                { value: 'Organisasi non-profit', label: 'Organisasi non-profit' },
              ]}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Perkiraan Jumlah Anggota</label>
            <Select
              placeholder="Pilih..."
              value={companyInfo.size || ''}
              onChange={(v) => setCompanyInfo({ size: v })}
              options={companySizes.map((s) => ({ value: s, label: `${s} orang` }))}
            />
          </div>
        </div>
      )
    }

    if (type === 'sekolah') {
      return (
        <div className="setup-form">
          <div className="input-group">
            <label className="input-label">Nama Sekolah</label>
            <input
              type="text"
              className="input"
              placeholder="cth: SMA Negeri 1 Bandung"
              value={companyInfo.name}
              onChange={(e) => setCompanyInfo({ name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Jenjang</label>
            <Select
              placeholder="Pilih jenjang..."
              value={companyInfo.industry || ''}
              onChange={(v) => setCompanyInfo({ industry: v })}
              options={schoolLevels.map((lv) => ({ value: lv, label: lv }))}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Tipe Sekolah</label>
            <Select
              placeholder="Pilih tipe..."
              value={companyInfo.size || ''}
              onChange={(v) => setCompanyInfo({ size: v })}
              options={[
                { value: 'Negeri', label: 'Negeri' },
                { value: 'Swasta', label: 'Swasta' },
              ]}
            />
          </div>
        </div>
      )
    }

    // perusahaan / instansi
    return (
      <div className="setup-form">
        <div className="input-group">
          <label className="input-label">Nama Perusahaan / Instansi</label>
          <input
            type="text"
            className="input"
            placeholder="cth: PT Maju Bersama"
            value={companyInfo.name}
            onChange={(e) => setCompanyInfo({ name: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Industri</label>
          <Select
            placeholder="Pilih industri..."
            value={companyInfo.industry}
            onChange={(v) => setCompanyInfo({ industry: v })}
            options={industries.map((ind) => ({ value: ind, label: ind }))}
          />
        </div>
        <div className="input-group">
          <label className="input-label">Ukuran Perusahaan</label>
          <Select
            placeholder="Pilih ukuran..."
            value={companyInfo.size}
            onChange={(v) => setCompanyInfo({ size: v })}
            options={companySizes.map((s) => ({ value: s, label: `${s} orang` }))}
          />
        </div>
        <div className="input-group">
          <label className="input-label">NIB / Nomor Legal (opsional)</label>
          <input
            type="text"
            className="input"
            placeholder="cth: 8120001234567"
            value={companyInfo.nib || ''}
            onChange={(e) => setCompanyInfo({ nib: e.target.value })}
          />
        </div>
      </div>
    )
  }

  const renderDivisionsStep = () => (
    <>
      <div className="setup-header">
        <h1>{divisionLabel}</h1>
        <p>Apa saja {divisionLabel.toLowerCase()} di {type === 'sekolah' ? 'sekolah' : 'perusahaan'} ini?</p>
      </div>
      <div className="divisions-list">
        {divisions.map((div) => (
          <div key={div.id} className="division-item">
            {isSchool ? <GraduationCap size={18} /> : <Building2 size={18} />}
            <span>{div.name}</span>
            <button className="remove-btn" onClick={() => removeDivision(div.id)}>
              <X size={16} />
            </button>
          </div>
        ))}

        <div className="add-division">
          <input
            type="text"
            className="input"
            placeholder={`Nama ${divisionLabel.toLowerCase()}...`}
            value={newDivisionName}
            onChange={(e) => setNewDivisionName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && newDivisionName && addDivision({ name: newDivisionName }) && setNewDivisionName('')}
          />
          <button
            className="btn btn-secondary"
            onClick={() => newDivisionName && addDivision({ name: newDivisionName }) && setNewDivisionName('')}
            disabled={!newDivisionName}
          >
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>
    </>
  )

  const renderMembersStep = () => (
    <>
      <div className="setup-header">
        <h1>Anggota Tim</h1>
        <p>Tambah anggota {type === 'grup' ? 'grup' : type === 'sekolah' ? 'sekolah' : 'tim'} dan assign ke {divisionLabel.toLowerCase()} (opsional untuk grup)</p>
      </div>
      <div className="members-list">
        {members.map((member) => (
          <div key={member.id} className="member-item">
            <div className="member-avatar">
              {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="member-info">
              <span className="member-name">{member.name}</span>
              <span className="member-email">{member.email}</span>
            </div>
            <span className="badge badge-muted">{member.role}</span>
            <span className="badge badge-muted">
              {divisions.find((d) => d.id === member.divisionId)?.name || '-'}
            </span>
            <button className="remove-btn" onClick={() => removeMember(member.id)}>
              <X size={16} />
            </button>
          </div>
        ))}

        <div className="add-member-form">
          <input
            type="text"
            className="input"
            placeholder="Nama lengkap"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          />
          {type !== 'grup' && (
            <Select
              placeholder={`Pilih ${divisionLabel.toLowerCase()}...`}
              value={newMember.divisionId}
              onChange={(v) => setNewMember({ ...newMember, divisionId: v })}
              options={divisions.map((div) => ({ value: div.id, label: div.name }))}
            />
          )}
          <Select
            placeholder="Pilih role..."
            allowReset={false}
            value={newMember.role}
            onChange={(v) => setNewMember({ ...newMember, role: v })}
            options={roles.map((r) => ({ value: r, label: r }))}
          />
          <button
            className="btn btn-secondary"
            onClick={() =>
              newMember.name && newMember.email &&
              (type === 'grup' || newMember.divisionId) &&
              addMember(newMember) &&
              setNewMember({ name: '', email: '', divisionId: '', role: defaultRole })
            }
            disabled={!newMember.name || !newMember.email || (type !== 'grup' && !newMember.divisionId)}
          >
            <Plus size={18} /> Tambah
          </button>
        </div>
      </div>
    </>
  )

  const renderCompleteStep = () => (
    <>
      <div className="complete-icon">
        <Check size={32} />
      </div>
      <h1>Siap!</h1>
      <p>Semua sudah disetup. Sekarang kamu bisa mulai menggunakan Luxio.</p>

      <div className="summary">
        <div className="summary-item">
          {type === 'individual' ? <UserRound size={18} /> : <Building2 size={18} />}
          <span>{companyInfo.name || (type === 'individual' ? 'Personal' : 'Workspace')}</span>
        </div>
        {type !== 'individual' && (
          <div className="summary-item">
            <Users size={18} />
            <span>{divisions.length} {divisionLabel.toLowerCase()}</span>
          </div>
        )}
        {type !== 'individual' && (
          <div className="summary-item">
            <UserPlus size={18} />
            <span>{members.length} anggota</span>
          </div>
        )}
      </div>
    </>
  )

  // ---------- MAIN RENDER ----------

  return (
    <div className="setup-page bg-pattern">
      <div className="setup-container">
        {/* Progress */}
        <div className="setup-progress">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`progress-step ${idx <= setupStep ? 'active' : ''} ${idx < setupStep ? 'completed' : ''}`}
            >
              <div className="step-icon">
                {idx < setupStep ? <Check size={16} /> : (() => { const Icon = stepIcon(step); return <Icon size={16} /> })()}
              </div>
              <span className="step-title">{step}</span>
              {idx < steps.length - 1 && <div className="step-line"></div>}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${type || 'none'}-${setupStep}`}
            className="setup-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {setupStep === 0 && renderTypeStep()}

            {type && setupStep === 1 && (
              <>
                <div className="setup-header">
                  <h1>
                    {type === 'individual' && 'Profil Kamu'}
                    {type === 'grup' && 'Info Grup'}
                    {type === 'perusahaan' && 'Info Perusahaan'}
                    {type === 'sekolah' && 'Info Sekolah'}
                  </h1>
                  <p>Data ini akan dipakai di seluruh aplikasi.</p>
                </div>
                {renderInfoStep()}
              </>
            )}

            {type && setupStep === divisionsStep && renderDivisionsStep()}
            {type && setupStep === membersStep && renderMembersStep()}

            {type && setupStep === completeStep && renderCompleteStep()}

            {/* Actions */}
            {setupStep > 0 && (
              <div className="setup-actions">
                {setupStep < completeStep && (
                  <>
                    <button className="btn btn-ghost" onClick={() => setSetupStep(prevOf(setupStep))}>
                      <ArrowLeft size={18} /> Kembali
                    </button>
                    <button
                      className="btn btn-primary btn-lg"
                      disabled={!canGoNext(setupStep)}
                      onClick={() => setSetupStep(nextAfter(setupStep))}
                    >
                      Lanjut <ArrowRight size={18} />
                    </button>
                  </>
                )}
                {setupStep === completeStep && (
                  <button className="btn btn-primary btn-lg" onClick={handleComplete}>
                    Buka Dashboard <ArrowRight size={18} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
