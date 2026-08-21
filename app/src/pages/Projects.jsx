import { useState } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import Select from '../components/Select'
import TargetForm from '../components/TargetForm'
import { motion } from 'framer-motion'
import { Target, Plus, Search, Filter, CalendarClock } from 'lucide-react'
import { deadlineText } from '../utils/deadline'
import './Projects.css'

const VIEW_LABELS = {
  kanban: 'Kanban',
  todo: 'To-do',
  workflow: 'Workflow',
}

export default function Projects() {
  const { projects, divisions, members, companyInfo, openProject } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [filterDivision, setFilterDivision] = useState('')
  const [filterType, setFilterType] = useState('')

  const isIndividual = companyInfo?.type === 'individual'

  const assigneeName = (project) =>
    members.find((m) => m.id === project.assigneeId)?.name
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }
  
  return (
    <Layout>
      <motion.div 
        className="projects-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Target & Project</h1>
            <p>Kelola semua target dan project tim</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Target Baru
          </button>
        </motion.div>
        
        {/* Filters */}
        <motion.div className="filters-bar" variants={itemVariants}>
          <div className="search-box">
            <Search size={16} />
            <input type="text" placeholder="Cari target..." className="input" />
          </div>
          {!isIndividual && (
            <Select
              className="filter-select"
              placeholder="Semua Divisi"
              value={filterDivision}
              onChange={setFilterDivision}
              options={divisions.map((div) => ({ value: div.id, label: div.name }))}
            />
          )}
          <Select
            className="filter-select"
            placeholder="Semua Tipe"
            value={filterType}
            onChange={setFilterType}
            options={[
              { value: 'weekly', label: 'Mingguan' },
              { value: 'monthly', label: 'Bulanan' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'project', label: 'Project' },
            ]}
          />
        </motion.div>
        
        {/* Projects Grid */}
        <motion.div className="projects-grid" variants={containerVariants}>
          {projects.length > 0 ? projects.map((project) => (
            <motion.div 
              key={project.id} 
              className={`project-card ${project.status === 'completed' ? 'achieved' : ''}`}
              variants={itemVariants}
              onClick={() => openProject(project.id)}
            >
              <div className="project-card-header">
                <div className="project-icon">
                  <Target size={18} />
                </div>
                <div className="project-badges">
                  {project.status === 'completed' && (
                    <span className="badge achieved-badge">Tercapai</span>
                  )}
                  <span className="badge badge-muted">{project.type}</span>
                  {project.viewType && (
                    <span className={`badge viewtype-badge-${project.viewType}`}>
                      {VIEW_LABELS[project.viewType]}
                    </span>
                  )}
                </div>
              </div>
              
              <h3 className="project-name">{project.name}</h3>
              {project.description && (
                <p className="project-desc">{project.description}</p>
              )}
              <div className="project-meta">
                <span>{project.division || assigneeName(project) || 'Personal'}</span>
                {deadlineText(project) && (
                  <span className="project-deadline">
                    <CalendarClock size={12} /> {deadlineText(project)}
                  </span>
                )}
              </div>
              
              {/* Progress */}
              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-value">{project.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </motion.div>
          )) : (
            <motion.div className="empty-state-full" variants={itemVariants}>
              <Target size={48} />
              <h3>Belum ada target</h3>
              <p>Buat target pertama kamu untuk mulai tracking progress tim</p>
            </motion.div>
          )}
        </motion.div>

        {showForm && (
          <TargetForm
            onClose={() => setShowForm(false)}
            onCreated={(id) => openProject(id)}
          />
        )}
      </motion.div>
    </Layout>
  )
}