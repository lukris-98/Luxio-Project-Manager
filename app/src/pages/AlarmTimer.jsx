import { useEffect, useRef, useState } from 'react'
import { useStore, dataKeyFor } from '../store/useStore'
import { Clock, Timer, AlarmClock, Play, Pause, RotateCcw, Plus, Trash2, Bell, BellOff } from 'lucide-react'
import './AlarmTimer.css'

// Bunyikan "beep" via Web Audio API saat timer/stopwatch selesai.
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1)
    osc.start()
    osc.stop(ctx.currentTime + 1)
  } catch (e) {
    /* audio tidak tersedia — abaikan */
  }
}

const pad2 = (n) => String(n).padStart(2, '0')

const formatTime = (totalSeconds) => `${pad2(Math.floor(totalSeconds / 60))}:${pad2(totalSeconds % 60)}`

const formatStopwatch = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hh = pad2(Math.floor(totalSeconds / 3600))
  const mm = pad2(Math.floor((totalSeconds % 3600) / 60))
  const ss = pad2(totalSeconds % 60)
  return `${hh}:${mm}:${ss}`
}

export default function AlarmTimer() {
  const { currentUser, activeRole, alarms, addAlarm, toggleAlarm, deleteAlarm } = useStore()
  const dataKey = dataKeyFor(currentUser, activeRole)
  const myAlarms = dataKey != null && alarms ? alarms[dataKey] || [] : []

  const [activeTab, setActiveTab] = useState('alarm')
  const [alarmTime, setAlarmTime] = useState('08:00')
  const [alarmLabel, setAlarmLabel] = useState('')

  // Timer
  const [timerMinutes, setTimerMinutes] = useState(5)
  const [timerRemaining, setTimerRemaining] = useState(5 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerEndRef = useRef(0)

  // Stopwatch
  const [swRunning, setSwRunning] = useState(false)
  const [swMs, setSwMs] = useState(0)
  const [laps, setLaps] = useState([])
  const swStartRef = useRef(0)

  // Cek alarm aktif setiap detik; saat waktu cocok => alert + nonaktifkan alarm.
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      const current = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
      const state = useStore.getState()
      const uid = dataKeyFor(state.currentUser, state.activeRole)
      const list = (uid != null && state.alarms[uid]) || []
      list.forEach((a) => {
        if (a.enabled && a.time === current) {
          alert(`Alarm: ${a.label} (${a.time})`)
          state.toggleAlarm(a.id)
        }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Tick timer countdown.
  useEffect(() => {
    if (!timerRunning) return
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.round((timerEndRef.current - Date.now()) / 1000))
      setTimerRemaining(remaining)
      if (remaining <= 0) {
        setTimerRunning(false)
        alert('Waktu habis!')
        playBeep()
      }
    }, 200)
    return () => clearInterval(id)
  }, [timerRunning])

  // Tick stopwatch.
  useEffect(() => {
    if (!swRunning) return
    const id = setInterval(() => {
      setSwMs(Date.now() - swStartRef.current)
    }, 50)
    return () => clearInterval(id)
  }, [swRunning])

  const handleAddAlarm = (e) => {
    e.preventDefault()
    if (!alarmTime) return
    addAlarm({ time: alarmTime, label: alarmLabel })
    setAlarmLabel('')
  }

  const handleTimerMinutes = (e) => {
    let val = parseInt(e.target.value, 10)
    if (Number.isNaN(val)) val = ''
    setTimerMinutes(val)
    if (!timerRunning) {
      setTimerRemaining((Number.isNaN(val) ? 0 : val) * 60)
    }
  }

  const startTimer = () => {
    timerEndRef.current = Date.now() + timerRemaining * 1000
    setTimerRunning(true)
  }

  const pauseTimer = () => setTimerRunning(false)

  const resetTimer = () => {
    setTimerRunning(false)
    setTimerRemaining((Number.isNaN(timerMinutes) ? 0 : timerMinutes) * 60)
  }

  const startSw = () => {
    swStartRef.current = Date.now() - swMs
    setSwRunning(true)
  }

  const pauseSw = () => setSwRunning(false)

  const resetSw = () => {
    setSwRunning(false)
    setSwMs(0)
    setLaps([])
  }

  const addLap = () => {
    setLaps((prev) => [...prev, swMs])
  }

  return (
    <>
      <div className="alarm-page">
        <div className="page-header">
          <div className="page-header-left">
            <h1>Alarm & Timer</h1>
            <p>Atur pengingat, timer, dan stopwatch</p>
          </div>
        </div>

        <div className="alarm-tabs">
          <button className={`alarm-tab ${activeTab === 'alarm' ? 'active' : ''}`} onClick={() => setActiveTab('alarm')}>
            <AlarmClock size={16} /> Alarm
          </button>
          <button className={`alarm-tab ${activeTab === 'timer' ? 'active' : ''}`} onClick={() => setActiveTab('timer')}>
            <Timer size={16} /> Timer
          </button>
          <button className={`alarm-tab ${activeTab === 'stopwatch' ? 'active' : ''}`} onClick={() => setActiveTab('stopwatch')}>
            <Clock size={16} /> Stopwatch
          </button>
        </div>

        {/* ============ TAB ALARM ============ */}
        {activeTab === 'alarm' && (
          <div className="alarm-card">
            <form className="alarm-form" onSubmit={handleAddAlarm}>
              <div className="input-group alarm-time-field">
                <label className="input-label">Waktu</label>
                <input type="time" className="input" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Label</label>
                <input
                  type="text"
                  className="input"
                  placeholder="cth: Meeting pagi"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Tambah</button>
            </form>
          </div>
        )}

        {activeTab === 'alarm' && (
          myAlarms.length === 0 ? (
            <div className="empty-state">
              <AlarmClock size={48} />
              <h3>Belum ada alarm</h3>
              <p>Tambahkan alarm untuk mengingatkan kamu sesuai jadwal</p>
            </div>
          ) : (
            <div className="alarm-list">
              {myAlarms.map((alarm) => (
                <div key={alarm.id} className="alarm-item">
                  <div className="alarm-item-info">
                    <span className="alarm-item-time">{alarm.time}</span>
                    <span className="alarm-item-label">{alarm.label}</span>
                  </div>
                  <div className="alarm-item-actions">
                    <button
                      className={`alarm-toggle ${alarm.enabled ? 'on' : ''}`}
                      onClick={() => toggleAlarm(alarm.id)}
                      title={alarm.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {alarm.enabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button className="alarm-btn-danger" onClick={() => deleteAlarm(alarm.id)} title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ============ TAB TIMER ============ */}
        {activeTab === 'timer' && (
          <div className="alarm-card">
            <div className="alarm-input-row">
              <div className="input-group alarm-minutes-field">
                <label className="input-label">Menit (1–60)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="60"
                  value={timerMinutes}
                  onChange={handleTimerMinutes}
                  disabled={timerRunning}
                />
              </div>
            </div>
            <div className="alarm-timer-display">{formatTime(timerRemaining)}</div>
            <div className="alarm-controls">
              {timerRunning ? (
                <button className="btn btn-secondary" onClick={pauseTimer}><Pause size={16} /> Pause</button>
              ) : (
                <button className="btn btn-primary" onClick={startTimer} disabled={timerRemaining <= 0}><Play size={16} /> Mulai</button>
              )}
              <button className="btn btn-secondary" onClick={resetTimer}><RotateCcw size={16} /> Reset</button>
            </div>
          </div>
        )}

        {/* ============ TAB STOPWATCH ============ */}
        {activeTab === 'stopwatch' && (
          <div className="alarm-card">
            <div className="alarm-timer-display">{formatStopwatch(swMs)}</div>
            <div className="alarm-controls">
              {swRunning ? (
                <button className="btn btn-secondary" onClick={pauseSw}><Pause size={16} /> Pause</button>
              ) : (
                <button className="btn btn-primary" onClick={startSw}><Play size={16} /> Mulai</button>
              )}
              <button className="btn btn-secondary" onClick={addLap}>Lap</button>
              <button className="btn btn-secondary" onClick={resetSw}><RotateCcw size={16} /> Reset</button>
            </div>

            {laps.length > 0 && (
              <div className="alarm-laps">
                {laps.map((lapTime, i) => (
                  <div key={i} className="alarm-lap">
                    <span className="alarm-lap-num">Lap {i + 1}</span>
                    <span>{formatStopwatch(lapTime)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
