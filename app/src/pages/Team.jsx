import { useState, useEffect, useMemo } from 'react'
import { useStore, useEffectiveRole } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { Users, Building2, Mail, Plus, Trash2, Pencil, Crown, X, Shield, Check } from 'lucide-react'
import './Team.css'

const getInitials = (name) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

export default function Team() {
  const {
    divisions, members, teams,
    addDivision, renameDivision, removeDivision,
    addTeam, renameTeam, removeTeam,
    addMemberToTeam, removeMemberFromTeam, createMemberAndAdd, setTeamAdmin,
    updateMember, removeMember,
  } = useStore()

  const role = useEffectiveRole()
  const isDivisiMode = role === 'owner' || role === 'super_admin'
  const canManageTeams = isDivisiMode || role === 'admin'
  const isUser = role === 'user'

  const [selectedDivId, setSelectedDivId] = useState(null)
  const [modal, setModal] = useState(null) // { type, ... }

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

  // ---------- MODAL HELPERS ----------
  const openAddDiv = () => setModal({ type: 'add-div' })
  const openAddTeam = (divisionId) => setModal({ type: 'add-team', divisionId })
  const openAddMember = (teamId) => setModal({ type: 'add-member', teamId })
  const openSetAdmin = (teamId) => setModal({ type: 'set-admin', teamId })
  const openRename = (kind, id, name) => setModal({ type: 'rename', kind, id, name })

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
    <Layout>
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
              <button className="btn btn-primary" onClick={() => openAddTeam(selectedDivId)}>
                <Plus size={16} /> Tambah Tim
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
                    <button title="Ubah nama" onClick={() => openRename('division', div.id, div.name)}>
                      <Pencil size={14} />
                    </button>
                    <button className="danger" title="Hapus divisi" onClick={() => handleDeleteDivision(div)}>
                      <Trash2 size={14} />
                    </button>
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
                          {isDivisiMode && (
                            <button title="Atur admin tim" onClick={() => openSetAdmin(team.id)}>
                              <Crown size={14} />
                            </button>
                          )}
                          <button title="Ubah nama tim" onClick={() => openRename('team', team.id, team.name)}>
                            <Pencil size={14} />
                          </button>
                          <button className="danger" title="Hapus tim" onClick={() => handleDeleteTeam(team)}>
                            <Trash2 size={14} />
                          </button>
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
                            </span>
                            <span className="member-email">
                              <Mail size={12} /> {m.email}
                            </span>
                          </div>
                          {canManageTeams && (
                            <div className="team-member-actions">
                              {isDivisiMode && (
                                <button title="Edit anggota" onClick={() => setModal({ type: 'edit-member', memberId: m.id })}>
                                  <Pencil size={14} />
                                </button>
                              )}
                              {isDivisiMode && m.id !== team.adminId && (
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
                              {isDivisiMode && (
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
                      {canManageTeams && (
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
          members={members}
          memberById={memberById}
          onClose={() => setModal(null)}
          onCreateMember={(data) => {
            createMemberAndAdd({ teamId: modal.teamId, ...data })
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
    </Layout>
  )
}

/* ---------- Subcomponents ---------- */

function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
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

function AddMemberModal({ team, members, memberById, onCreateMember, onAddExisting, onClose }) {
  const [mode, setMode] = useState('new')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const alreadyInTeam = (memberId) => (team.memberIds || []).includes(memberId)
  const available = members.filter((m) => !alreadyInTeam(m.id))

  return (
    <ModalShell title={`Tambah Anggota — ${team?.name || ''}`} onClose={onClose}>
      <div className="member-mode-tabs">
        <button className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>Akun Baru</button>
        <button className={mode === 'existing' ? 'active' : ''} onClick={() => setMode('existing')}>Akun yang Sudah Ada</button>
      </div>

      {mode === 'new' ? (
        <>
          <div className="input-group">
            <label className="input-label">Nama Lengkap</label>
            <input type="text" className="input" placeholder="Nama orang / akun" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" className="input" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <p className="field-hint">Akun baru dibuat dan langsung dimasukkan ke tim ini. Role akun otomatis mengikuti paket.</p>
          <div className="modal-footer">
            <button className="btn btn-primary" disabled={!name.trim() || !email.trim()} onClick={() => onCreateMember({ name, email })}>
              <Plus size={16} /> Buat & Tambah
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
  const [name, setName] = useState(member?.name || '')
  const [email, setEmail] = useState(member?.email || '')
  if (!member) return null
  return (
    <ModalShell title="Edit Anggota" onClose={onClose}>
      <div className="input-group">
        <label className="input-label">Nama Lengkap</label>
        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Email</label>
        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Batal</button>
        <button
          className="btn btn-primary"
          disabled={!name.trim() || !email.trim()}
          onClick={() => onSave({ name: name.trim(), email: email.trim() })}
        >
          Simpan
        </button>
      </div>
    </ModalShell>
  )
}
