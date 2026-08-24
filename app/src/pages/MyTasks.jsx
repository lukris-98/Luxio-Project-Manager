import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { CheckSquare, Clock, AlertCircle, Trash2 } from 'lucide-react'
import './MyTasks.css'

export default function MyTasks() {
  const { tasks, deleteTask } = useStore()
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  }
  
  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high': return 'badge-error'
      case 'medium': return 'badge-warning'
      default: return 'badge-muted'
    }
  }
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckSquare size={16} />
      case 'in_progress': return <Clock size={16} />
      default: return <AlertCircle size={16} />
    }
  }
  
  return (
    <Layout>
      <motion.div 
        className="my-tasks-page"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="page-header" variants={itemVariants}>
          <div className="page-header-left">
            <h1>Task Saya</h1>
            <p>Tugas yang assigned ke kamu</p>
          </div>
        </motion.div>
        
        <motion.div className="tasks-list" variants={containerVariants}>
          {tasks.length > 0 ? tasks.map((task) => (
            <motion.div 
              key={task.id} 
              className={`task-item ${task.status}`}
              variants={itemVariants}
            >
              <div className="task-status-icon">
                {getStatusIcon(task.status)}
              </div>
              
              <div className="task-content">
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <span className={`badge ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="task-meta">
                  <span>{task.project}</span>
                </div>
              </div>
              
              <div className="task-due">
                <Clock size={14} />
                <span>{new Date(task.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              </div>

              <button
                className="task-delete"
                onClick={() => deleteTask(task.id)}
                title="Hapus task"
                aria-label="Hapus task"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          )) : (
            <motion.div className="empty-state" variants={itemVariants}>
              <CheckSquare size={48} />
              <h3>Belum ada task</h3>
              <p>Task akan muncul setelah ada target yang dibuat</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  )
}