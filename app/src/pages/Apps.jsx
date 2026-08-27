import { useStore } from '../store/useStore'
import Layout from '../components/Layout'
import {
  LayoutDashboard,
  Target,
  KanbanSquare,
  ListTodo,
  StickyNote,
  KeyRound,
  Calendar,
  CheckSquare,
  MessageSquare,
  Clock,
  Search,
  AlarmClock,
  Trophy,
  Mail,
  Send,
  CalendarDays,
  MessageCircle,
  BookOpen,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Plug,
  Zap,
} from 'lucide-react'
import './Apps.css'

const INTERNAL_APPS = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: '#FF6B35', desc: 'Ringkasan performa & aktivitas tim' },
  { id: 'projects', name: 'Target', icon: Target, color: '#F87171', desc: 'Kelola target & progres proyek' },
  { id: 'kanban', name: 'Kanban', icon: KanbanSquare, color: '#A78BFA', desc: 'Papan visual alur kerja tim' },
  { id: 'todo-list', name: 'Todo', icon: ListTodo, color: '#4ADE80', desc: 'Daftar tugas harian pribadi' },
  { id: 'private-note', name: 'Catatan', icon: StickyNote, color: '#FACC15', desc: 'Catatan cepat & penting' },
  { id: 'vault', name: 'Brankas', icon: KeyRound, color: '#F59E0B', desc: 'Simpan kredensial & akun aman' },
  { id: 'calendar', name: 'Kalender', icon: Calendar, color: '#22D3EE', desc: 'Agenda, jadwal & tenggat' },
  { id: 'my-tasks', name: 'Task Saya', icon: CheckSquare, color: '#34D399', desc: 'Tugas yang ditugaskan ke kamu' },
  { id: 'chat', name: 'Chat', icon: MessageSquare, color: '#22D3EE', desc: 'Obrolan & diskusi tim' },
  { id: 'attendance', name: 'Absen', icon: Clock, color: '#4ADE80', desc: 'Presensi & kehadiran tim' },
  { id: 'research', name: 'Riset Konten', icon: Search, color: '#34D399', desc: 'Riset topik & kata kunci' },
  { id: 'alarm-timer', name: 'Alarm & Timer', icon: AlarmClock, color: '#F472B6', desc: 'Alarm, timer & pomodoro' },
  { id: 'games', name: 'Game Mode', icon: Trophy, color: '#FACC15', desc: 'Ice breaker & game santai tim' },
]

const EXTERNAL_INTEGRATIONS = [
  { name: 'Gmail', icon: Mail, color: '#EA4335' },
  { name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { name: 'Telegram', icon: Send, color: '#229ED9' },
  { name: 'Google Calendar', icon: CalendarDays, color: '#4285F4' },
  { name: 'Slack', icon: MessageSquare, color: '#611F69' },
  { name: 'Notion', icon: BookOpen, color: '#FFFFFF' },
]

export default function Apps() {
  const { setCurrentPage } = useStore()

  return (
    <Layout>
      <div className="apps-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Aplikasi</h1>
            <p>Pusat aplikasi & integrasi</p>
          </div>
          <div className="page-header-right">
            <span className="apps-page-count">{INTERNAL_APPS.length} aplikasi internal</span>
          </div>
        </div>

        <section className="apps-section">
          <h2 className="apps-section-title">
            <Smartphone size={18} /> Aplikasi Internal
          </h2>
          <div className="apps-grid">
            {INTERNAL_APPS.map((app) => {
              const Icon = app.icon
              return (
                <div
                  key={app.id}
                  className="app-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentPage(app.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setCurrentPage(app.id) }}
                >
                  <div className="app-card-icon" style={{ background: app.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="app-card-body">
                    <span className="app-card-name">{app.name}</span>
                    <span className="app-card-desc">{app.desc}</span>
                  </div>
                  <div className="app-card-launch">
                    Buka <ChevronRight size={14} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="apps-section">
          <h2 className="apps-section-title">
            <Plug size={18} /> Integrasi Eksternal
          </h2>
          <div className="apps-grid">
            {EXTERNAL_INTEGRATIONS.map((app) => {
              const Icon = app.icon
              return (
                <div
                  key={app.name}
                  className="app-card app-card-integration"
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentPage('connect')}
                  onKeyDown={(e) => { if (e.key === 'Enter') setCurrentPage('connect') }}
                >
                  <div className="app-card-icon" style={{ background: app.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="app-card-body">
                    <span className="app-card-name">{app.name}</span>
                    <span className="app-card-desc">Hubungkan akun & sinkronkan data</span>
                  </div>
                  <div className="app-card-launch">
                    <span className="app-card-badge">
                      <Zap size={11} /> Hubungkan
                    </span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </Layout>
  )
}
