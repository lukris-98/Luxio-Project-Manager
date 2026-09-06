import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { CheckCircle2, Clock, PlayCircle } from 'lucide-react'
import './ProjectDashboard.css'

const PIE_COLORS = { done: '#00D9A5', progress: '#0780FA', pending: '#FFB830' }

// =====================================================================
// ProjectDashboard.jsx — Dashboard analitik satu project:
//   - Pie chart: distribusi status semua item (kanban + to-do)
//   - Line chart: perkembangan progress (rencana vs realisasi)
//   - Ringkasan angka progress saat ini
// =====================================================================
export default function ProjectDashboard({ project, boards, projectTasks }) {

  // Hitung distribusi status dari board kanban + to-do project.
  const dist = useMemo(() => {
    let done = 0
    let progress = 0
    let pending = 0

    boards.forEach((board) => {
      board.columns.forEach((col) => {
        const n = col.tasks.length
        const name = (col.name || '').toLowerCase()
        if (/done|selesai/.test(name)) done += n
        else if (/progress|proses|review/.test(name)) progress += n
        else pending += n
      })
    })

    projectTasks.forEach((t) => {
      if (t.status === 'completed') done++
      else if (t.status === 'in_progress') progress++
      else pending++
    })

    return { done, progress, pending }
  }, [boards, projectTasks])

  const pieData = [
    { name: 'Selesai', value: dist.done, key: 'done' },
    { name: 'On Progress', value: dist.progress, key: 'progress' },
    { name: 'Pending', value: dist.pending, key: 'pending' },
  ].filter((d) => d.value > 0)

  const totalItems = dist.done + dist.progress + dist.pending
  const currentPct = totalItems > 0 ? Math.round((dist.done / totalItems) * 100) : 0

  // Line: rencana (linear 0->100 sepanjang periode) vs realisasi (ramp ke % saat ini).
  const lineData = useMemo(() => {
    const now = new Date()
    const start = project.createdAt ? new Date(project.createdAt) : new Date(now.getTime() - 21 * 864e5)
    const end = project.deadline ? new Date(project.deadline) : new Date(now.getTime() + 21 * 864e5)
    const span = Math.max(1, end.getTime() - start.getTime())
    const N = 7
    const progress = project.status === 'completed' ? 100 : (project.progress || 0)
    return Array.from({ length: N }, (_, i) => {
      const f = i / (N - 1)
      const t = new Date(start.getTime() + span * f)
      return {
        label: t.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        Rencana: Math.round(f * 100),
        Realisasi: Math.round(progress * f),
      }
    })
  }, [project])

  return (
    <div className="proj-dash">
      <div className="proj-dash-charts">
        <div className="proj-dash-card">
          <h3>Distribusi Tugas</h3>
          {totalItems === 0 ? (
            <p className="proj-dash-empty">Belum ada item untuk ditampilkan.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((d) => (
                    <Cell key={d.key} fill={PIE_COLORS[d.key]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={28} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="proj-dash-card">
          <h3>Perkembangan Progress</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" unit="%" domain={[0, 100]} />
              <Tooltip />
              <Legend verticalAlign="bottom" height={28} iconType="circle" />
              <Line type="monotone" dataKey="Rencana" stroke="#8B8BA7" strokeDasharray="5 4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Realisasi" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail data progress saat ini */}
      <div className="proj-dash-summary">
        <div className="proj-dash-stat">
          <CheckCircle2 size={16} />
          <span>{dist.done}</span>
          <label>Selesai</label>
        </div>
        <div className="proj-dash-stat">
          <PlayCircle size={16} />
          <span>{dist.progress}</span>
          <label>On Progress</label>
        </div>
        <div className="proj-dash-stat">
          <Clock size={16} />
          <span>{dist.pending}</span>
          <label>Pending</label>
        </div>
        <div className="proj-dash-stat accent">
          <span>{currentPct}%</span>
          <label>Progress Keseluruhan</label>
        </div>
      </div>
    </div>
  )
}
