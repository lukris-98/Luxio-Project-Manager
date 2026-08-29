import { useMemo } from 'react'
import { useStore, dataKeyFor, GAMIFICATION_BADGES, levelFromXp, xpForNextLevel } from '../store/useStore'
import { motion } from 'framer-motion'
import { Award, Star, Trophy, Zap, CheckCircle, FolderOpen, FileText, Sparkles } from 'lucide-react'
import './Games.css'

const QUESTS = [
  { icon: CheckCircle, label: 'Selesaikan task', xp: 10, desc: 'Tandai task sebagai selesai' },
  { icon: FolderOpen, label: 'Buat target baru', xp: 20, desc: 'Mulai project atau target baru' },
  { icon: FileText, label: 'Buat catatan', xp: 5, desc: 'Tulis catatan pribadi' },
]

export default function Games() {
  const { currentUser, activeRole, gamification, tasks, projects, privateNotes, addXp } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)

  const g = useMemo(() => {
    if (dataKey == null) return { xp: 0, badges: [] }
    return gamification[dataKey] || { xp: 0, badges: [] }
  }, [dataKey, gamification])

  const level = useMemo(() => levelFromXp(g.xp), [g.xp])
  const xpRemaining = useMemo(() => {
    const needed = xpForNextLevel(g.xp)
    const inLevel = g.xp % 200
    return { current: inLevel, needed }
  }, [g.xp])
  const progressPct = useMemo(() => {
    if (xpRemaining.needed <= 0) return 100
    return Math.min(100, Math.round((xpRemaining.current / (xpRemaining.current + xpRemaining.needed)) * 100))
  }, [xpRemaining])

  const stats = useMemo(() => {
    if (dataKey == null) return { tasksDone: 0, projectsCount: 0, notesCount: 0, totalXp: 0 }
    return {
      tasksDone: tasks.filter((t) => t.status === 'completed').length,
      projectsCount: projects.length,
      notesCount: (privateNotes[dataKey] || []).length,
      totalXp: g.xp,
    }
  }, [dataKey, tasks, projects, privateNotes, g.xp])

  const handleQuest = (xp) => {
    addXp(xp, 'Quest Game Mode')
  }

  return (
    <>
      <motion.div className="games-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <div className="page-header-left">
            <h1>Game Mode</h1>
            <p>Level, XP, dan badge</p>
          </div>
        </div>

        <div className="games-level-card">
          <div className="games-level-top">
            <div className="games-level-info">
              <span className="games-level-badge">Level {level}</span>
              <span className="games-xp-total">{g.xp} XP</span>
            </div>
            <Award size={36} className="games-level-icon" />
          </div>
          <div className="games-xp-bar">
            <div className="games-xp-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="games-xp-label">{xpRemaining.needed} XP lagi ke level {level + 1}</span>
        </div>

        <div className="games-section">
          <h2 className="games-section-title"><Star size={16} /> Badge</h2>
          <div className="games-badge-grid">
            {GAMIFICATION_BADGES.map((badge) => {
              const unlocked = g.badges.includes(badge.id)
              return (
                <div key={badge.id} className={`games-badge${unlocked ? '' : ' locked'}`}>
                  <span className="games-badge-icon">{badge.icon}</span>
                  <span className="games-badge-name">{badge.name}</span>
                  <span className="games-badge-desc">{badge.desc}</span>
                  {unlocked && <Trophy size={14} className="games-badge-check" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="games-section">
          <h2 className="games-section-title"><Zap size={16} /> Statistik</h2>
          <div className="games-stats">
            <div className="games-stat-card">
              <CheckCircle size={20} />
              <span className="games-stat-value">{stats.tasksDone}</span>
              <span className="games-stat-label">Task selesai</span>
            </div>
            <div className="games-stat-card">
              <FolderOpen size={20} />
              <span className="games-stat-value">{stats.projectsCount}</span>
              <span className="games-stat-label">Target dibuat</span>
            </div>
            <div className="games-stat-card">
              <FileText size={20} />
              <span className="games-stat-value">{stats.notesCount}</span>
              <span className="games-stat-label">Catatan dibuat</span>
            </div>
            <div className="games-stat-card">
              <Sparkles size={20} />
              <span className="games-stat-value">{stats.totalXp}</span>
              <span className="games-stat-label">Total XP</span>
            </div>
          </div>
        </div>

        <div className="games-section">
          <h2 className="games-section-title"><Zap size={16} /> Quest</h2>
          <p className="games-quest-subtitle">Lakukan aksi berikut untuk mendapat XP tambahan</p>
          <div className="games-quests">
            {QUESTS.map((q) => (
              <div key={q.label} className="games-quest">
                <div className="games-quest-left">
                  <q.icon size={18} />
                  <div>
                    <span className="games-quest-label">{q.label}</span>
                    <span className="games-quest-desc">{q.desc}</span>
                  </div>
                </div>
                <div className="games-quest-right">
                  <span className="games-quest-xp">+{q.xp} XP</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleQuest(q.xp)}>
                    <Zap size={14} /> Kerjakan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}