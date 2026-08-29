import { useStore } from '../store/useStore'
import { motion } from 'framer-motion'
import { Target, CheckCircle, Clock, AlertTriangle, TrendingUp, ArrowRight, Users, Folder, CalendarClock } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import './Dashboard.css'

export default function Dashboard() {
  const { projects, tasks, divisions, getStats, companyInfo } = useStore()
  
  const stats = getStats()
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }
  
  return (
    <>
      <motion.div 
        className="dashboard"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome */}
        <motion.div className="welcome-section" variants={itemVariants}>
          <div className="welcome-text">
            <h1>Halo! 👋</h1>
            <p>{companyInfo.name || 'Perusahaan Kamu'} · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
        </motion.div>
        
        {/* Stats */}
        <motion.div className="stats-grid" variants={itemVariants}>
          <div className="stat-card">
            <div className="stat-icon">
              <Folder size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.activeProjects || 0}</span>
              <span className="stat-label">Target Aktif</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <CheckCircle size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.completedTasks || 0}</span>
              <span className="stat-label">Selesai</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalTasks - stats.completedTasks || 0}</span>
              <span className="stat-label">On Progress</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={20} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{divisions.length || 0}</span>
              <span className="stat-label">Divisi</span>
            </div>
          </div>
        </motion.div>
        
        {/* Main Content */}
        <div className="dashboard-grid">
          {/* Divisi Performance */}
          <motion.div className="dashboard-card" variants={itemVariants}>
            <div className="card-header">
              <h3>Performa Divisi</h3>
            </div>
            <div className="division-list">
              {divisions.length > 0 ? divisions.map((div, idx) => (
                <div key={idx} className="division-item">
                  <div className="division-info">
                    <span className="division-name">{div.name}</span>
                    <span className="division-meta">{div.memberCount || 0} anggota</span>
                  </div>
                  <div className="division-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                    <span className="progress-text">Belum ada data</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <p>Belum ada divisi. Setup dulu di pengaturan.</p>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Target Aktif */}
          <motion.div className="dashboard-card" variants={itemVariants}>
            <div className="card-header">
              <h3>Target Aktif</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => useStore.getState().setCurrentPage('projects')}>
                Lihat Semua <ArrowRight size={14} />
              </button>
            </div>
            <div className="projects-list">
              {projects.length > 0 ? projects.slice(0, 4).map((project) => (
                <div 
                  key={project.id} 
                  className="project-item"
                  onClick={() => useStore.getState().setCurrentPage('project-detail')}
                >
                  <div className="project-icon">
                    <Target size={18} />
                  </div>
                  <div className="project-content">
                    <span className="project-name">{project.name}</span>
                    <span className="project-meta">
                      {project.division || 'Personal'}
                      {deadlineText(project) && (
                        <span className="project-deadline">
                          <CalendarClock size={11} /> {deadlineText(project)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="project-progress">
                    <span className="progress-value">{project.progress}%</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state">
                  <Target size={32} />
                  <p>Belum ada target. Buat target pertama kamu!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Quick Actions */}
        <motion.div className="quick-actions" variants={itemVariants}>
          <h3>Aksi Cepat</h3>
          <div className="actions-grid">
            <button className="action-card" onClick={() => useStore.getState().setCurrentPage('projects')}>
              <span className="action-icon">+</span>
              <span>Target Baru</span>
            </button>
            <button className="action-card" onClick={() => useStore.getState().setCurrentPage('team')}>
              <span className="action-icon">+</span>
              <span>Anggota Baru</span>
            </button>
            <button className="action-card" onClick={() => useStore.getState().setCurrentPage('my-tasks')}>
              <span className="action-icon">✓</span>
              <span>Lihat Task Saya</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  )
}