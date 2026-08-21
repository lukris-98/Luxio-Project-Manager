import { useState } from 'react'
import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './Calendar.css'

export default function Calendar() {
  const { tasks, projects } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days = []
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      })
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      })
    }
    
    return days
  }
  
  const getTasksForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    
    // Get tasks from projects/stages
    const projectTasks = []
    projects.forEach(project => {
      project.stages?.forEach(stage => {
        stage.checklist?.forEach(item => {
          // Use dueDate if available, otherwise use created date simulation
          const taskDate = new Date(project.createdAt || Date.now())
          const taskDateStr = taskDate.toISOString().split('T')[0]
          
          if (taskDateStr === dateStr) {
            projectTasks.push({
              title: item.text,
              project: project.name,
              completed: item.completed
            })
          }
        })
      })
    })
    
    // Get from tasks array
    const regularTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0]
      return taskDate === dateStr
    })
    
    return [...projectTasks, ...regularTasks]
  }
  
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }
  
  const isToday = (date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }
  
  const days = getDaysInMonth(currentDate)
  
  return (
    <Layout>
      <motion.div 
        className="calendar-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="page-header">
          <div className="page-header-left">
            <h1>Kalender</h1>
            <p>Lihat semua tugas berdasarkan tanggal</p>
          </div>
        </div>
        
        {/* Calendar */}
        <div className="calendar-container">
          {/* Month Navigation */}
          <div className="calendar-header">
            <button className="nav-btn" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button className="nav-btn" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Day Names */}
          <div className="calendar-grid-header">
            {dayNames.map((day, idx) => (
              <div key={idx} className="day-name">{day}</div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="calendar-grid">
            {days.map((day, idx) => {
              const tasksForDay = getTasksForDate(day.date)
              return (
                <div 
                  key={idx} 
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday(day.date) ? 'today' : ''}`}
                >
                  <span className="day-number">{day.day}</span>
                  <div className="day-tasks">
                    {tasksForDay.slice(0, 2).map((task, tIdx) => (
                      <div 
                        key={tIdx} 
                        className={`task-dot ${task.completed ? 'completed' : ''}`}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {tasksForDay.length > 2 && (
                      <span className="more-tasks">+{tasksForDay.length - 2} lagi</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Task List for Selected Day (optional - shows all tasks) */}
        <div className="calendar-task-list">
          <h3>Semua Tugas</h3>
          {tasks.length > 0 ? (
            <div className="task-items">
              {tasks.map(task => (
                <div key={task.id} className="task-item">
                  <input type="checkbox" />
                  <span className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.title}
                  </span>
                  <span className="task-project">{task.project}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-tasks">Belum ada tugas. Buat target terlebih dahulu.</p>
          )}
        </div>
      </motion.div>
    </Layout>
  )
}