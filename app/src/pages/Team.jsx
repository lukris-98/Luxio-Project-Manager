import { useState, useEffect, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import { can as canAuthority, getAuthorityLabel as authLabel } from '../utils/permissions'
import { api } from '../services/api'
import Select from '../components/Select'
import { motion } from 'framer-motion'
import { Users, Building2, Mail, Plus, Trash2, Pencil, Crown, X, Shield, Check, Phone, Briefcase, Calendar, MapPin, BadgeCheck, Send, Lock, Eye, EyeOff, MoreVertical } from 'lucide-react'
import './Team.css'

const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

// Level kewenangan anggota dalam tim (Item 6).
const AUTHORITY_LEVELS = [
  { value: 'owner', label: 'Owner', desc: 'Kontrol penuh: kelola semua, target, member, laporan' },
  { value: 'super_admin', label: 'Super Admin', desc: 'Kelola semua fitur: target, task, member, laporan' },
  { value: 'admin', label: 'Admin', desc: 'Kelola target, task, dan anggota divisi' },
  { value: 'manager', label: 'Manager', desc: 'Buat target & edit task, lihat laporan' },
  { value: 'member', label: 'Member', desc: 'Kerjakan task yang diassign, lihat target' },
  { value: 'viewer', label: 'Viewer', desc: 'Hanya bisa melihat' },
]

const getAuthorityLabel = (a) => AUTHORITY_LEVELS.find((x) => x.value === a)?.label || a || 'member'

export default function Team() {
  const {
    divisions, members, teams, currentUser, companyInfo,
    addDivision, renameDivision, removeDivision,
    addTeam, renameTeam, removeTeam,
    addMemberToTeam, removeMemberFromTeam, createMemberAndAdd, setTeamAdmin,
    updateMember, removeMember,
  } = useStore()

  const role = useEffectiveRole()
  const isDivisiMode = role === 'owner' || role === 'super_admin'
  const canManageTeams = isDivisiMode || role === 'admin'
  const isUser = role === 'user'

  // Level kewenangan user yang login (dari data member bila ada).
  const myAuthority = members.find((m) => m.email?.toLowerCase() === currentUser?.email?.toLowerCase())?.authority
    || (isDivisiMode ? 'super_admin' : role === 'admin' ? 'admin' : role === 'user' ? 'viewer' : 'member')
  const authCanManageMembers = canAuthority(myAuthority, 'manage_members')
  const authCanManageTeam = canAuthority(myAuthority, 'manage_team')
  const authCanCreateTarget = canAuthority(myAuthority, 'create_target')

  const [selectedDivId, setSelectedDivId] = useState(null)
  const [modal, setModal] = useState(null) // { type, ... }
  // Dropdown aksi tiga titik (Item 3): { type: 'division'|'team', id }
  const [openDropdown, setOpenDropdown] = useState(null)

  // Auto-pilih divisi pertama.
  useEffect(() => {
    if (divisions.length === 0) {
      setSelectedDivId(null)
      return
    }
    if (!divisions.some((d) => d.id === selectedDivId)) {
      setSelectedDivId(divisions[0].id)
    }
  }, [divisions, selectedDivId])

  const selectedDivision = divisions.find((d) => d.id === selectedDivId) || null
  const teamsOfSelected = useMemo(
    () => teams.filter((t) => t.divisionId === selectedDivId),
    [teams, selectedDivId]
  )
  // Data lama (belum ada tim): anggota melekat langsung ke divisi.
  const legacyMembersOfSelected = useMemo(
    () => members.filter((m) => m.divisionId === selectedDivId),
    [members, selectedDivId]
  )

  const memberById = (id) => members.find((m) => m.id === id)
  const teamMembers = (team) => (team.memberIds || []).map(memberById).filter(Boolean)

  // Daftarkan anggota ke backend (buat akun login + kirim email sambutan).
  // Best-effort: bila backend offline, anggota tetap tersimpan lokal.
  const registerMemberBackend = async (data) => {
    const currentUser = useStore.getState().currentUser
    const companyId = currentUser?.company_id || companyInfo.company_id
    const team = teams.find((t) => t.id === data.teamId)
    const divisionId = team?.divisionId || selectedDivId
    if (!companyId || !divisionId) return

    try {
      await api.registerMember({
        company_id: companyId,
        division_id: divisionId,
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'member',
        authority: data.authority || 'member',
        position: data.position,
        phone: data.phone,
        gender: data.gender,
        birth_date: data.birthDate,
        address: data.address,
        employment_status: data.employmentStatus,
        join_date: data.joinDate,
        salary: data.salary,
        skills: data.skills,
        education: data.education,
        notes: data.notes,
      })
    } catch (e) {
      console.warn('[Team] Gagal daftarkan anggota ke backend (offline?)', e)
    }
  }

  const sendMemberEmail = async (member, subject, body) => {
    try {
      await api.notifyMember({ email: member.email, subject, body })
      return true
    } catch (e) {
      console.warn('[Team] Gagal kirim email notifikasi', e)
      return false
    }
  }

  // ---------- MODAL HELPERS ----------
  const openAddDiv = () => setModal({ type: 'add-div' })
  const openAddTeam = (divisionId) => setModal({ type: 'add-team', divisionId })
  const openAddMember = (teamId) => setModal({ type: 'add-member', teamId })
  const openAddMemberAnywhere = () => setModal({ type: 'add-member', teamId: null })
  const openSetAdmin = (teamId) => setModal({ type: 'set-admin', teamId })
  const openRename = (kind, id, name) => setModal({ type: 'rename', kind, id, name })
  const openNotify = (memberId) => setModal({ type: 'notify-member', memberId })

  const handleAddDivision = (name) => {
    if (!name.trim()) return
    addDivision({ name })
    setModal(null)
  }

  const handleAddTeam = (name) => {
    if (!name.trim()) return
    addTeam({ divisionId: modal.divisionId, name })
    setModal(null)
  }

  const handleDeleteDivision = (div) => {
    if (window.confirm(`Hapus divisi "${div.name}" beserta semua tim di dalamnya?`)) {
      removeDivision(div.id)
    }
  }

  const handleDeleteTeam = (team) => {
    if (window.confirm(`Hapus tim "${team.name}"?`)) {
      removeTeam(team.id)
    }
  }

  const handleDeleteMember = (member) => {
    if (window.confirm(`Hapus anggota "${member.name}" dari organisasi? Anggota ikut terhapus dari semua tim.`)) {
      removeMember(member.id)
    }
  }

  const subtitle = isDivisiMode
    ? 'Kelola divisi, tim, anggota, dan pindahkan peran admin'
    : role === 'admin'
      ? 'Kelola tim dan anggota perusahaan'
      : 'Daftar anggota tim (hanya lihat)'

  return (
    <>
      <motion.div className="team-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Header */}
        <motion.div className="page-header" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="page-header-left">
            <h1>{isDivisiMode ? 'Divisi' : 'Tim'}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="team-header-actions">
            {isDivisiMode && (
              <button className="btn btn-secondary" onClick={openAddDiv}>
                <Plus size={16} /> Tambah Divisi
              </button>
            )}
            {canManageTeams && selectedDivId && (
              <button className="btn btn-secondary" onClick={() => openAddTeam(selectedDivId)}>
                <Plus size={16} /> Tambah Tim
              </button>
            )}
            {canManageTeams && selectedDivId && (
              <button className="btn btn-primary" onClick={openAddMemberAnywhere}>
                <Plus size={16} /> Tambah Anggota
              </button>
            )}
          </div>
        </motion.div>

        {/* Role notice */}
        {isDivisiMode && (
          <div className="role-notice">
            <Shield size={16} />
            <span>Anda sebagai Super Admin — kelola divisi, tim, anggota, dan pindah peran admin</span>
          </div>
        )}
        {role === 'admin' && (
          <div className="role-notice admin-notice">
            <Shield size={16} />
            <span>Anda sebagai Admin — kelola tim dan anggota</span>
          </div>
        )}
        {isUser && (
          <div className="role-notice user-notice">
            <Shield size={16} />
            <span>Anda sebagai User — hanya bisa melihat daftar anggota tim</span>
          </div>
        )}

        {/* Divisions */}
        <motion.section className="section" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="section-header">
            <Building2 size={18} />
            <h2>Divisi ({divisions.length})</h2>
          </div>

          {isDivisiMode ? (
            <div className="divisions-grid">
              {divisions.map((div) => (
                <div
                  key={div.id}
                  className={`division-card ${selectedDivId === div.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDivId(div.id)}
                >
                  <div className="division-icon">
                    <Building2 size={18} />
                  </div>
                  <div className="division-info">
                    <h3>{div.name}</h3>
                    <p>{div.memberCount} anggota</p>
                  </div>
                  <div className="division-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="more-btn" onClick={() => setOpenDropdown(openDropdown?.type === 'division' && openDropdown?.id === div.id ? null : { type: 'division', id: div.id })}>
                      <MoreVertical size={14} />
                    </button>
                    {openDropdown?.type === 'division' && openDropdown?.id === div.id && (
                      <>
                        <div className="dropdown-backdrop" onClick={() => setOpenDropdown(null)} />
                        <div className="dropdown-menu">
                          <button onClick={() => { setOpenDropdown(null); openRename('division', div.id, div.name) }}>
                            <Pencil size={14} /> Ubah nama
                          </button>
                          <button className="danger" onClick={() => { setOpenDropdown(null); handleDeleteDivision(div) }}>
                            <Trash2 size={14} /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {divisions.length === 0 && (
                <div className="empty-card">
                  <p>Belum ada divisi. Klik "Tambah Divisi" untuk mulai.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="division-tabs">
              {divisions.map((div) => (
                <button
                  key={div.id}
                  className={`division-tab ${selectedDivId === div.id ? 'active' : ''}`}
                  onClick={() => setSelectedDivId(div.id)}
                >
                  {div.name}
                  <span className="division-tab-count">{div.memberCount}</span>
                </button>
              ))}
              {divisions.length === 0 && (
                <div className="empty-card">
                  <p>Belum ada divisi</p>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* Teams in selected division */}
        {selectedDivision && (
          <motion.section className="section" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="section-header">
              <Users size={18} />
              <h2>Tim — {selectedDivision.name}</h2>
            </div>
            <div className="teams-list">
              {teamsOfSelected.map((team) => {
                const tMembers = teamMembers(team)
                return (
                  <div key={team.id} className="team-card">
                    <div className="team-card-head">
                      <div className="team-card-title">
                        <Users size={16} className="team-card-icon" />
                        <h3>{team.name}</h3>
                        {team.adminId && (
                          <span className="badge badge-warning team-admin-badge">
                            <Crown size={10} /> {memberById(team.adminId)?.name || 'Admin'}
                          </span>
                        )}
                      </div>
                      {canManageTeams && (
                        <div className="team-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="more-btn" onClick={() => setOpenDropdown(openDropdown?.type === 'team' && openDropdown?.id === team.id ? null : { type: 'team', id: team.id })}>
                            <MoreVertical size={14} />
                          </button>
                          {openDropdown?.type === 'team' && openDropdown?.id === team.id && (
                            <>
                              <div className="dropdown-backdrop" onClick={() => setOpenDropdown(null)} />
                              <div className="dropdown-menu">
                                {isDivisiMode && (
                                  <button onClick={() => { setOpenDropdown(null); openSetAdmin(team.id) }}>
                                    <Crown size={14} /> Atur admin tim
                                  </button>
                                )}
                                <button onClick={() => { setOpenDropdown(null); openRename('team', team.id, team.name) }}>
                                  <Pencil size={14} /> Ubah nama
                                </button>
                                <button className="danger" onClick={() => { setOpenDropdown(null); handleDeleteTeam(team) }}>
                                  <Trash2 size={14} /> Hapus tim
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="team-card-members">
                      {tMembers.length === 0 && <p className="team-empty">Belum ada anggota tim ini.</p>}
                      {tMembers.map((m) => (
                        <div key={m.id} className="team-member">
                          <div className="member-avatar">{getInitials(m.name)}</div>
                          <div className="member-info">
                            <span className="member-name">
                              {m.name}
                              {m.id === team.adminId && <span className="team-admin-tag">Admin</span>}
                              {m.hasAccount && <span className="member-account-badge"><Lock size={9} /> Akun</span>}
                              {m.authority && m.authority !== 'member' && (
                                <span className={`authority-badge auth-${m.authority}`}>{getAuthorityLabel(m.authority)}</span>
                              )}
                            </span>
                            <span className="member-email">
                              <Mail size={12} /> {m.email}
                            </span>
                            {m.position && (
                              <span className="member-position">
                                <Briefcase size={12} /> {m.position}
                                {m.employmentStatus && (
                                  <span className={`employment-badge status-${String(m.employmentStatus).toLowerCase()}`}>{m.employmentStatus}</span>
                                )}
                              </span>
                            )}
                          </div>
                          {canManageTeams && (
                            <div className="team-member-actions">
                              {authCanManageMembers && (
                                <button title="Edit anggota" onClick={() => setModal({ type: 'edit-member', memberId: m.id })}>
                                  <Pencil size={14} />
                                </button>
                              )}
                              {authCanManageMembers && (
                                <button title="Kirim email ke anggota" onClick={() => openNotify(m.id)}>
                                  <Send size={14} />
                                </button>
                              )}
                              {authCanManageMembers && m.id !== team.adminId && (
                                <button title="Jadikan admin tim" onClick={() => setTeamAdmin(team.id, m.id)}>
                                  <Crown size={14} />
                                </button>
                              )}
                              <button
                                className="danger"
                                title="Keluarkan dari tim"
                                onClick={() => removeMemberFromTeam(team.id, m.id)}
                              >
                                <X size={14} />
                              </button>
                              {authCanManageMembers && (
                                <button
                                  className="danger"
                                  title="Hapus anggota dari organisasi"
                                  onClick={() => handleDeleteMember(m)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {authCanManageMembers && (
                        <button className="team-add-member" onClick={() => openAddMember(team.id)}>
                          <Plus size={14} /> Tambah Anggota
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Data lama tanpa tim: tampilkan anggota langsung di divisi */}
              {teamsOfSelected.length === 0 && legacyMembersOfSelected.map((m) => (
                <div key={m.id} className="member-row legacy-row">
                  <div className="member-avatar">{getInitials(m.name)}</div>
                  <div className="member-info">
                    <span className="member-name">{m.name}</span>
                    <span className="member-email">
                      <Mail size={12} /> {m.email}
                    </span>
                    {m.position && (
                      <span className="member-position">
                        <Briefcase size={12} /> {m.position}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {teamsOfSelected.length === 0 && legacyMembersOfSelected.length === 0 && (
                <div className="empty-card">
                  <p>{canManageTeams ? 'Belum ada tim. Klik "Tambah Tim" untuk mulai.' : 'Belum ada tim.'}</p>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </motion.div>

      {/* ---------- MODALS ---------- */}
      {modal?.type === 'add-div' && (
        <ModalShell title="Tambah Divisi" onClose={() => setModal(null)}>
          <NameForm placeholder="Nama divisi (mis. IT, Marketing)" onSubmit={handleAddDivision} submitLabel="Simpan Divisi" />
        </ModalShell>
      )}

      {modal?.type === 'add-team' && (
        <ModalShell title="Tambah Tim" onClose={() => setModal(null)}>
          <NameForm placeholder="Nama tim (mis. Tim Pengembangan Web)" onSubmit={handleAddTeam} submitLabel="Simpan Tim" />
        </ModalShell>
      )}

      {modal?.type === 'rename' && (
        <ModalShell title={modal.kind === 'division' ? 'Ubah Nama Divisi' : 'Ubah Nama Tim'} onClose={() => setModal(null)}>
          <NameForm
            initialValue={modal.name}
            placeholder="Nama baru"
            submitLabel="Simpan"
            onSubmit={(name) => {
              if (modal.kind === 'division') renameDivision(modal.id, name)
              else renameTeam(modal.id, name)
              setModal(null)
            }}
          />
        </ModalShell>
      )}

      {modal?.type === 'add-member' && (
        <AddMemberModal
          team={teams.find((t) => t.id === modal.teamId)}
          teams={teams}
          members={members}
          memberById={memberById}
          onClose={() => setModal(null)}
          onCreateMember={(data) => {
            // teamId diambil dari dropdown "Tim Tujuan" di dalam form.
            createMemberAndAdd(data)
            registerMemberBackend(data)
            setModal(null)
          }}
          onAddExisting={(memberId) => {
            addMemberToTeam(modal.teamId, memberId)
            setModal(null)
          }}
        />
      )}

      {modal?.type === 'set-admin' && (
        <SetAdminModal
          team={teams.find((t) => t.id === modal.teamId)}
          teamMembers={teamMembers(teams.find((t) => t.id === modal.teamId))}
          onClose={() => setModal(null)}
          onSelect={(memberId) => {
            setTeamAdmin(modal.teamId, memberId)
            setModal(null)
          }}
        />
      )}

      {modal?.type === 'notify-member' && (
        <NotifyMemberModal
          member={memberById(modal.memberId)}
          onClose={() => setModal(null)}
          onSend={async (subject, body) => {
            const ok = await sendMemberEmail(memberById(modal.memberId), subject, body)
            if (ok) setModal(null)
            return ok
          }}
        />
      )}

      {modal?.type === 'edit-member' && (
        <EditMemberModal
          member={memberById(modal.memberId)}
          onClose={() => setModal(null)}
          onSave={(data) => {
            updateMember(modal.memberId, data)
            setModal(null)
          }}
        />
      )}
    </>
  )
}

/* ---------- Subcomponents ---------- */

function ModalShell({ title, onClose, children, className = '' }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${className}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose} title="Tutup (Esc)" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function NameForm({ placeholder, initialValue = '', submitLabel, onSubmit }) {
  const [value, setValue] = useState(initialValue)
  return (
    <>
      <div className="input-group">
        <input
          type="text"
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSubmit(value) }}
          autoFocus
        />
      </div>
      <div className="modal-footer">
        <button className="btn btn-primary" disabled={!value.trim()} onClick={() => onSubmit(value)}>
          {submitLabel}
        </button>
      </div>
    </>
  )
}

function AddMemberModal({ team, teams, members, memberById, onClose, onCreateMember, onAddExisting }) {
  const [mode, setMode] = useState('new')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    showPassword: false,
    phone: '',
    gender: '',
    birthDate: '',
    address: '',
    position: '',
    employmentStatus: '',
    joinDate: '',
    salary: '',
    skills: '',
    education: '',
    notes: '',
    authority: 'member',
  })
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    if (team?.id) return team.id
    if (teams && teams.length > 0) return teams[0].id
    return ''
  })
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')

  // Tim yang tersedia untuk menempatkan anggota baru.
  const availableTeams = teams || []
  const alreadyInTeam = (memberId) => (team?.memberIds || []).includes(memberId)
  const available = members.filter((m) => !alreadyInTeam(m.id))

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleCreate = () => {
    const { name, email, password, position } = form
    if (!name.trim()) return setError('Nama lengkap wajib diisi.')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Email tidak valid.')
    }
    if (!password || password.length < 8) {
      return setError('Password minimal 8 karakter (untuk login anggota).')
    }
    if (!position.trim()) return setError('Posisi/jabatan yang dilamar wajib diisi.')
    if (!selectedTeamId) return setError('Pilih tim tujuan anggota.')

    onCreateMember({
      name: form.name,
      email: form.email,
      password: form.password,
      teamId: selectedTeamId,
      authority: form.authority,
      phone: form.phone,
      gender: form.gender,
      birthDate: form.birthDate,
      address: form.address,
      position: form.position,
      employmentStatus: form.employmentStatus,
      joinDate: form.joinDate,
      salary: form.salary,
      skills: form.skills,
      education: form.education,
      notes: form.notes,
    })
  }

  const field = (key) => form[key] || ''

  const genderOptions = [
    { value: 'Laki-laki', label: 'Laki-laki' },
    { value: 'Perempuan', label: 'Perempuan' },
  ]
  const statusOptions = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Kontrak', label: 'Kontrak' },
    { value: 'Magang', label: 'Magang' },
    { value: 'Freelance', label: 'Freelance' },
  ]
  const eduOptions = [
    { value: 'SMA/SMK', label: 'SMA/SMK' },
    { value: 'D3', label: 'D3' },
    { value: 'S1', label: 'S1' },
    { value: 'S2', label: 'S2' },
    { value: 'S3', label: 'S3' },
  ]

  return (
    <ModalShell title={`Form Pendaftaran Anggota — ${team?.name || ''}`} className="member-form-modal" onClose={onClose}>
      <div className="member-mode-tabs">
        <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Form Daftar Baru</button>
        <button className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Akun yang Sudah Ada</button>
      </div>

      {mode === 'new' ? (
        <>
          {/* Pilih tim tujuan */}
          <div className="input-group">
            <label className="input-label">Tim Tujuan <span className="req-star">*</span></label>
            <Select
              value={selectedTeamId}
              onChange={setSelectedTeamId}
              options={availableTeams.map((t) => ({ value: t.id, label: t.name }))}
              placeholder="— Pilih tim —"
              allowReset={false}
            />
          </div>

          <div className="member-form-section">
            <div className="member-form-section-title"><UserIcon /> Data Akun Login</div>
            <div className="member-form-row">
              <div className="input-group">
                <label className="input-label">Email Login <span className="req-star">*</span></label>
                <input type="email" name="email" className="input" placeholder="nama@email.com" value={field('email')} onChange={handleChange} autoComplete="off" />
              </div>
              <div className="input-group">
                <label className="input-label">Password Login <span className="req-star">*</span></label>
                <div className="password-input-wrap">
                  <input
                    type={form.showPassword ? 'text' : 'password'}
                    name="password"
                    className="input"
                    placeholder="Min. 8 karakter"
                    value={field('password')}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setForm({ ...form, showPassword: !form.showPassword })}
                    title={form.showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    aria-label={form.showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {form.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="field-hint">Anggota bisa login dengan email & password ini. Email sambutan berisi kredensial dikirim otomatis ke email tersebut.</p>
          </div>

          <div className="member-form-section">
            <div className="member-form-section-title"><Shield size={15} /> Level Kewenangan (Item 6)</div>
            <p className="field-hint">Tentukan level kewenangan anggota dalam tim ini. Admin bisa set saat membuat anggota.</p>
            <div className="authority-grid">
              {AUTHORITY_LEVELS.map((a) => (
                <label
                  key={a.value}
                  className={`authority-option ${form.authority === a.value ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="authority"
                    value={a.value}
                    checked={form.authority === a.value}
                    onChange={() => setForm({ ...form, authority: a.value })}
                  />
                  <strong>{a.label}</strong>
                  <span>{a.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="member-form-section">
            <div className="member-form-section-title"><UserIcon /> Data Pribadi</div>
            <div className="input-group">
              <label className="input-label">Nama Lengkap <span className="req-star">*</span></label>
              <input type="text" name="name" className="input" placeholder="Nama sesuai identitas" value={field('name')} onChange={handleChange} />
            </div>
            <div className="member-form-row">
              <div className="input-group">
                <label className="input-label">No. HP / WhatsApp</label>
                <input type="tel" name="phone" className="input" placeholder="08xxxxxxxxxx" value={field('phone')} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Jenis Kelamin</label>
                <Select value={field('gender')} onChange={(v) => setForm({ ...form, gender: v })} options={genderOptions} placeholder="— Pilih —" />
              </div>
            </div>
            <div className="member-form-row">
              <div className="input-group">
                <label className="input-label">Tanggal Lahir</label>
                <input type="date" name="birthDate" className="input" value={field('birthDate')} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Pendidikan Terakhir</label>
                <Select value={field('education')} onChange={(v) => setForm({ ...form, education: v })} options={eduOptions} placeholder="— Pilih —" />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Alamat Domisili</label>
              <textarea name="address" className="input input-textarea" rows={2} placeholder="Alamat lengkap" value={field('address')} onChange={handleChange} />
            </div>
          </div>

          <div className="member-form-section">
            <div className="member-form-section-title"><Briefcase size={15} /> Data Pekerjaan / Lamaran</div>
            <div className="input-group">
              <label className="input-label">Posisi / Jabatan yang Dilamar <span className="req-star">*</span></label>
              <input type="text" name="position" className="input" placeholder="mis. Frontend Developer" value={field('position')} onChange={handleChange} />
            </div>
            <div className="member-form-row">
              <div className="input-group">
                <label className="input-label">Status Kepegawaian</label>
                <Select value={field('employmentStatus')} onChange={(v) => setForm({ ...form, employmentStatus: v })} options={statusOptions} placeholder="— Pilih —" />
              </div>
              <div className="input-group">
                <label className="input-label">Tanggal Mulai Bergabung</label>
                <input type="date" name="joinDate" className="input" value={field('joinDate')} onChange={handleChange} />
              </div>
            </div>
            <div className="member-form-row">
              <div className="input-group">
                <label className="input-label">Gaji / Upah (opsional)</label>
                <input type="number" name="salary" className="input" placeholder="mis. 5000000" value={field('salary')} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Keahlian / Skill</label>
                <input type="text" name="skills" className="input" placeholder="mis. React, Figma" value={field('skills')} onChange={handleChange} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Catatan Tambahan</label>
              <textarea name="notes" className="input input-textarea" rows={2} placeholder="Pengalaman, referensi, atau keterangan lain" value={field('notes')} onChange={handleChange} />
            </div>
          </div>

          {error && <p className="member-form-error">{error}</p>}
          <p className="field-hint">Form seperti pendaftaran lamaran kerja. Field bertanda * wajib diisi; email sambutan berisi kredensial login dikirim otomatis.</p>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={handleCreate}>
              <Plus size={16} /> Daftarkan Anggota
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="input-group">
            <label className="input-label">Pilih akun</label>
            <select className="input" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
              <option value="">— Pilih akun —</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
            </select>
          </div>
          <p className="field-hint">
            Akun yang sama bisa berada di lebih dari satu tim. {available.length === 0 && 'Semua akun sudah ada di tim ini.'}
          </p>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled={!selectedId} onClick={() => onAddExisting(Number(selectedId))}>
              <Check size={16} /> Tambah ke Tim
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}

function UserIcon() {
  return <Users size={15} />
}

function NotifyMemberModal({ member, onClose, onSend }) {
  const [subject, setSubject] = useState('Notifikasi dari Luxio')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  if (!member) return null

  const handleSend = async () => {
    if (!body.trim()) return setError('Pesan tidak boleh kosong.')
    setSending(true)
    setError('')
    const ok = await onSend(subject.trim(), body.trim())
    if (!ok) setError('Gagal mengirim email. Cek konfigurasi SMTP di backend.')
    setSending(false)
  }

  return (
    <ModalShell title={`Kirim Email — ${member.name}`} className="member-form-modal" onClose={onClose}>
      <p className="field-hint">
        Email akan dikirim ke <strong>{member.email}</strong> melalui SMTP yang sudah dikonfigurasi.
        Penerima melihat email ini di kotak masuk (Gmail/dll).
      </p>
      <div className="input-group">
        <label className="input-label">Subjek</label>
        <input type="text" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Pesan <span className="req-star">*</span></label>
        <textarea className="input input-textarea" rows={6} value={body} onChange={(e) => { setBody(e.target.value); setError('') }} placeholder="Tulis pesan notifikasi untuk anggota…" />
      </div>
      {error && <p className="member-form-error">{error}</p>}
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn btn-primary" disabled={sending || !body.trim()} onClick={handleSend}>
          <Send size={16} /> {sending ? 'Mengirim…' : 'Kirim Email'}
        </button>
      </div>
    </ModalShell>
  )
}

function SetAdminModal({ team, teamMembers, onSelect, onClose }) {
  if (!team) return null
  return (
    <ModalShell title={`Atur Admin — ${team.name}`} onClose={onClose}>
      <p className="field-hint">Pindahkan peran admin tim dari anggota satu ke anggota lain.</p>
      <div className="admin-pick-list">
        {teamMembers.map((m) => (
          <button
            key={m.id}
            className={`admin-pick ${m.id === team.adminId ? 'active' : ''}`}
            onClick={() => onSelect(m.id)}
          >
            <div className="member-avatar">{getInitials(m.name)}</div>
            <div className="member-info">
              <span className="member-name">
                {m.name}
                {m.id === team.adminId && <span className="team-admin-tag">Admin sekarang</span>}
              </span>
              <span className="member-email">
                <Mail size={12} /> {m.email}
              </span>
            </div>
            {m.id === team.adminId && <Crown size={16} className="admin-crown" />}
          </button>
        ))}
        {teamMembers.length === 0 && <p className="team-empty">Belum ada anggota di tim ini.</p>}
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
      </div>
    </ModalShell>
  )
}

function EditMemberModal({ member, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: member?.name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    gender: member?.gender || '',
    birthDate: member?.birthDate || '',
    address: member?.address || '',
    position: member?.position || '',
    employmentStatus: member?.employmentStatus || '',
    joinDate: member?.joinDate || '',
    salary: member?.salary || '',
    skills: member?.skills || '',
    education: member?.education || '',
    notes: member?.notes || '',
    authority: member?.authority || 'member',
  }))
  if (!member) return null

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const f = (key) => form[key] || ''

  return (
    <ModalShell title="Edit Anggota" className="member-form-modal" onClose={onClose}>
      <div className="member-form-section">
        <div className="member-form-section-title"><UserIcon /> Data Pribadi</div>
        <div className="input-group">
          <label className="input-label">Nama Lengkap</label>
          <input type="text" name="name" className="input" value={f('name')} onChange={handleChange} />
        </div>
        <div className="member-form-row">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" name="email" className="input" value={f('email')} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label">No. HP / WhatsApp</label>
            <input type="tel" name="phone" className="input" value={f('phone')} onChange={handleChange} />
          </div>
        </div>
        <div className="member-form-row">
          <div className="input-group">
            <label className="input-label">Jenis Kelamin</label>
            <select name="gender" className="input" value={f('gender')} onChange={handleChange}>
              <option value="">— Pilih —</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Tanggal Lahir</label>
            <input type="date" name="birthDate" className="input" value={f('birthDate')} onChange={handleChange} />
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Alamat Domisili</label>
          <textarea name="address" className="input input-textarea" rows={2} value={f('address')} onChange={handleChange} />
        </div>
      </div>

      <div className="member-form-section">
        <div className="member-form-section-title"><Briefcase size={15} /> Data Pekerjaan</div>
        <div className="input-group">
          <label className="input-label">Posisi / Jabatan</label>
          <input type="text" name="position" className="input" value={f('position')} onChange={handleChange} />
        </div>
        <div className="member-form-row">
          <div className="input-group">
            <label className="input-label">Status Kepegawaian</label>
            <select name="employmentStatus" className="input" value={f('employmentStatus')} onChange={handleChange}>
              <option value="">— Pilih —</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Kontrak">Kontrak</option>
              <option value="Magang">Magang</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Tanggal Mulai Bergabung</label>
            <input type="date" name="joinDate" className="input" value={f('joinDate')} onChange={handleChange} />
          </div>
        </div>
        <div className="member-form-row">
          <div className="input-group">
            <label className="input-label">Gaji / Upah</label>
            <input type="number" name="salary" className="input" value={f('salary')} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label className="input-label">Pendidikan Terakhir</label>
            <select name="education" className="input" value={f('education')} onChange={handleChange}>
              <option value="">— Pilih —</option>
              <option value="SMA/SMK">SMA/SMK</option>
              <option value="D3">D3</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
            </select>
          </div>
        </div>
        <div className="input-group">
          <label className="input-label">Keahlian / Skill</label>
          <input type="text" name="skills" className="input" value={f('skills')} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Catatan Tambahan</label>
          <textarea name="notes" className="input input-textarea" rows={2} value={f('notes')} onChange={handleChange} />
        </div>
      </div>

      <div className="member-form-section">
        <div className="member-form-section-title"><Shield size={15} /> Level Kewenangan</div>
        <div className="authority-grid">
          {AUTHORITY_LEVELS.map((a) => (
            <label
              key={a.value}
              className={`authority-option ${form.authority === a.value ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="authority"
                value={a.value}
                checked={form.authority === a.value}
                onChange={(e) => setForm({ ...form, authority: e.target.value })}
              />
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button
          className="btn btn-primary"
          disabled={!form.name.trim() || !form.email.trim()}
          onClick={() => onSave({
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            gender: form.gender,
            birthDate: form.birthDate,
            address: form.address.trim(),
            position: form.position.trim(),
            employmentStatus: form.employmentStatus,
            joinDate: form.joinDate,
            salary: form.salary,
            skills: form.skills.trim(),
            education: form.education,
            notes: form.notes.trim(),
            authority: form.authority,
          })}
        >
          Simpan
        </button>
      </div>
    </ModalShell>
  )
}
