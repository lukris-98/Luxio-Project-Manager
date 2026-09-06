import { X, Mail, Phone, Briefcase, Calendar, MapPin, BadgeCheck, Shield, Building2, Users, Crown } from 'lucide-react'
import './MemberDetailModal.css'

// =====================================================================
// MemberDetailModal.jsx — Popup data lengkap anggota tim.
// =====================================================================
export default function MemberDetailModal({ member, divisions, teams, onClose }) {
  if (!member) return null
  const div = divisions.find((d) => d.id === member.divisionId)
  const team = teams.find((t) => t.divisionId === member.divisionId && (t.memberIds || []).includes(member.id))

  return (
    <div className="member-detail-overlay" onClick={onClose}>
      <div className="member-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-detail-head">
          <div className="member-detail-avatar">
            {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="member-detail-titles">
            <h2>{member.name}</h2>
            {team && <span className="member-detail-role"><Users size={13} /> {team.name}</span>}
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="member-detail-body">
          <div className="detail-row">
            <Mail size={14} />
            <span>{member.email}</span>
          </div>
          {member.phone && (
            <div className="detail-row">
              <Phone size={14} />
              <span>{member.phone}</span>
            </div>
          )}
          {member.position && (
            <div className="detail-row">
              <Briefcase size={14} />
              <span>{member.position}</span>
            </div>
          )}
          <div className="detail-row">
            <Building2 size={14} />
            <span>{div?.name || 'Tanpa divisi'}</span>
          </div>
          {team && (
            <div className="detail-row">
              <Users size={14} />
              <span>{team.name}</span>
            </div>
          )}
          {member.authority && (
            <div className="detail-row">
              <Shield size={14} />
              <span>{member.authority === 'owner' ? 'Owner' : member.authority === 'super_admin' ? 'Super Admin' : member.authority === 'admin' ? 'Admin' : member.authority === 'manager' ? 'Manager' : member.authority === 'viewer' ? 'Viewer' : 'Member'}</span>
            </div>
          )}
          {member.employmentStatus && (
            <div className="detail-row">
              <BadgeCheck size={14} />
              <span>{member.employmentStatus}</span>
            </div>
          )}
          {member.joinDate && (
            <div className="detail-row">
              <Calendar size={14} />
              <span>Bergabung {new Date(member.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
          {member.address && (
            <div className="detail-row">
              <MapPin size={14} />
              <span>{member.address}</span>
            </div>
          )}
          <div className="detail-row">
            <BadgeCheck size={14} />
            <span>{member.hasAccount ? 'Memiliki akun login' : 'Belum punya akun'}</span>
          </div>
          {member.createdAt && (
            <div className="detail-row muted">
              <Calendar size={14} />
              <span>Terdaftar sejak {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}