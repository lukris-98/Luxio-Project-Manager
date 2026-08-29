import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { Star, Users, Search, Trash2, MessageSquare, BarChart3, ThumbsUp, Calendar, Building2, Briefcase } from 'lucide-react'
import './Performance.css'

const ALLOWED_ROLES = ['admin', 'super_admin', 'owner']

const CATEGORIES = [
  { value: 'Produktivitas', icon: BarChart3 },
  { value: 'Kualitas Kerja', icon: ThumbsUp },
  { value: 'Kerja Sama Tim', icon: Users },
  { value: 'Komunikasi', icon: MessageSquare },
  { value: 'Disiplin', icon: Calendar },
  { value: 'Inisiatif', icon: Briefcase },
]

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]))

function formatDate(ts) {
  if (!ts) return '-'
  try {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function StarRow({ value, size = 14 }) {
  const filled = Math.round(value)
  return (
    <div className="perf-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`perf-star${n <= filled ? ' filled' : ''}`}>
          <Star size={size} fill={n <= filled ? '#FACC15' : 'none'} />
        </span>
      ))}
    </div>
  )
}

function StarPicker({ value, onChange, size = 22 }) {
  return (
    <div className="perf-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`perf-star${n <= value ? ' filled' : ''}`}
          onClick={() => onChange(n)}
          title={`${n} bintang`}
          aria-label={`Nilai ${n} bintang`}
        >
          <Star size={size} fill={n <= value ? '#FACC15' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function Performance() {
  const {
    currentUser, activeRole, members, divisions,
    performanceRatings, addPerformanceRating, deletePerformanceRating,
  } = useStore()

  const role = activeRole || currentUser?.role
  const isAllowed = ALLOWED_ROLES.includes(role)
  const currentUserId = currentUser?.id

  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [formScore, setFormScore] = useState(5)
  const [formCategory, setFormCategory] = useState(CATEGORIES[0].value)
  const [formFeedback, setFormFeedback] = useState('')

  const divMap = useMemo(() => {
    const map = {}
    divisions.forEach((d) => { map[d.id] = d })
    return map
  }, [divisions])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? members.filter((m) => (m.name || '').toLowerCase().includes(q))
      : [...members]
    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [members, search])

  const groups = useMemo(() => {
    const g = {}
    filteredMembers.forEach((m) => {
      const div = divMap[m.divisionId]
      const key = div ? String(div.id) : '__none__'
      if (!g[key]) g[key] = { id: div ? div.id : null, name: div ? div.name : 'Tanpa Divisi', members: [] }
      g[key].members.push(m)
    })
    return Object.values(g).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }, [filteredMembers, divMap])

  const handleAddRating = (memberId) => {
    if (!formScore) return
    addPerformanceRating(memberId, { score: formScore, feedback: formFeedback, category: formCategory })
    setFormFeedback('')
  }

  if (!isAllowed) {
    return (
      <>
        <div className="perf-page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Penilaian Kinerja</h1>
              <p>Nilai kinerja anggota tim</p>
            </div>
          </div>
          <div className="perf-unauthorized">
            <BarChart3 size={48} />
            <h2>Akses Ditolak</h2>
            <p>Halaman ini hanya dapat diakses oleh admin, super admin, atau owner.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <motion.div className="perf-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <div className="page-header-left">
            <h1>Penilaian Kinerja</h1>
            <p>Nilai kinerja anggota tim</p>
          </div>
        </div>

        <div className="perf-search">
          <div className="perf-search-input">
            <input
              className="input"
              placeholder="Cari nama anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {members.length === 0 ? (
          <div className="perf-empty">
            <Users size={48} />
            <h3>Belum ada anggota tim</h3>
            <p>Tambahkan anggota di halaman Tim untuk mulai menilai kinerja</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="perf-empty">
            <Search size={40} />
            <h3>Tidak ada yang cocok</h3>
            <p>Coba ubah kata kunci pencarian</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id == null ? 'none' : group.id} className="perf-group">
              <div className="perf-group-head">
                <Building2 size={16} />
                <h2>{group.name}</h2>
                <span className="perf-group-count">{group.members.length} anggota</span>
              </div>

              {group.members.map((member) => {
                const ratings = performanceRatings[member.id] || []
                const avg = ratings.length
                  ? ratings.reduce((s, r) => s + Number(r.score || 0), 0) / ratings.length
                  : 0
                const isExpanded = expandedId === member.id
                return (
                  <motion.div
                    key={member.id}
                    className="perf-member-card"
                    onClick={() => setExpandedId(isExpanded ? null : member.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="perf-member-header">
                      <div className="perf-member-info">
                        <span className="perf-member-name">{member.name}</span>
                        <span className="perf-member-role">
                          {member.position || 'Anggota'} · {group.name}
                        </span>
                      </div>
                      <div className="perf-member-meta">
                        {ratings.length > 0 && <StarRow value={avg} />}
                        <span className="perf-average">{ratings.length ? avg.toFixed(1) : '-'}</span>
                        <span className="perf-member-role">
                          {ratings.length} penilaian
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="perf-expanded" onClick={(e) => e.stopPropagation()}>
                        {ratings.length > 0 ? (
                          ratings.map((r) => {
                            const isMine = r.raterId === currentUserId
                            const CatIcon = CAT_MAP[r.category]?.icon
                            return (
                              <div key={r.id} className="perf-rating-item">
                                <div className="perf-rating-header">
                                  <div className="perf-rating-score">
                                    <StarRow value={r.score} size={12} />
                                    <span className="perf-rating-rater">{r.score}/5</span>
                                  </div>
                                  {isMine && (
                                    <button
                                      className="perf-delete"
                                      onClick={() => deletePerformanceRating(member.id, r.id)}
                                      title="Hapus penilaian"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                {r.category && (
                                  <span className="perf-rating-rater perf-rating-cat">
                                    {CatIcon && <CatIcon size={12} />}
                                    {r.category}
                                  </span>
                                )}
                                {r.feedback && <p className="perf-rating-feedback">{r.feedback}</p>}
                                <span className="perf-rating-rater">
                                  {r.raterName || 'Admin'} · {formatDate(r.createdAt)}
                                </span>
                              </div>
                            )
                          })
                        ) : (
                          <p className="perf-rating-rater">Belum ada penilaian untuk anggota ini.</p>
                        )}

                        <div className="perf-form">
                          <div className="perf-form-row">
                            <div className="input-group">
                              <label className="input-label">Skor</label>
                              <StarPicker value={formScore} onChange={setFormScore} />
                            </div>
                            <div className="input-group">
                              <label className="input-label">Kategori</label>
                              <select className="input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="input-group">
                            <label className="input-label">Umpan Balik</label>
                            <textarea
                              className="input"
                              rows={2}
                              placeholder="Tulis umpan balik untuk anggota ini..."
                              value={formFeedback}
                              onChange={(e) => setFormFeedback(e.target.value)}
                            />
                          </div>
                          <button className="btn btn-primary" onClick={() => handleAddRating(member.id)}>
                            <ThumbsUp size={16} /> Kirim Penilaian
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ))
        )}
      </motion.div>
    </>
  )
}
