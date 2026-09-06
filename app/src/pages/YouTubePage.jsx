import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Youtube, RefreshCw, AlertTriangle, Loader2, LogOut, Eye, ThumbsUp,
  MessageSquare, Users, Clock, PlaySquare, ListVideo, BarChart3, FileSpreadsheet,
  Plus, Trash2, Download, ExternalLink, TrendingUp, Globe, Smartphone,
  Info, ChevronDown, X, Database,
} from 'lucide-react'
import useGoogleAuth from '../hooks/useGoogleAuth'
import GoogleLoginGate from '../components/GoogleLoginGate'
import {
  YOUTUBE_PAGE_SCOPES, getMyChannel, listChannelVideos, listMyPlaylists,
  listMySubscriptions, listVideoComments, formatDuration, formatCount,
} from '../services/youtubeApi'
import * as ytAnalytics from '../services/youtubeAnalyticsApi'
import * as ytReporting from '../services/youtubeReportingApi'
import './GooglePages.css'
import './google-native.css'

// =====================================================================
// YouTubePage â€” satu halaman, tiga API YouTube dalam tiga tab.
// =====================================================================
//   Tab "Data"      â†’ YouTube Data API v3         (channel, video, playlist)
//   Tab "Analytics" â†’ YouTube Analytics API v2    (query metrik interaktif)
//   Tab "Reporting" â†’ YouTube Reporting API v1    (job + laporan CSV massal)
//
// Ketiganya memakai SATU scope set (YOUTUBE_PAGE_SCOPES) sehingga user
// hanya melihat satu popup consent untuk seluruh halaman.
//
// Dokumentasi:
//   koleksi dokumentasi api/google api/youtube-data-docs/
//   koleksi dokumentasi api/google api/youtube-analytics-docs/
//   koleksi dokumentasi api/google api/youtube-reporting-docs/
// =====================================================================

const TABS = [
  { id: 'data', label: 'Data', sub: 'Data API v3', icon: PlaySquare },
  { id: 'analytics', label: 'Analytics', sub: 'Analytics API v2', icon: BarChart3 },
  { id: 'reporting', label: 'Reporting', sub: 'Reporting API v1', icon: FileSpreadsheet },
]

const PERM_LIST = [
  'Melihat channel, video, playlist, dan subscription milik kamu',
  'Membaca komentar pada video kamu',
  'Membaca laporan performa channel (view, watch time, subscriber)',
  'Mengelola job laporan massal dan mengunduh hasilnya',
]

const RANGES = [
  { id: 7, label: '7 hari' },
  { id: 28, label: '28 hari' },
  { id: 90, label: '90 hari' },
  { id: 365, label: '1 tahun' },
]

const fmtDate = (iso) => {
  if (!iso) return 'â€”'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return 'â€”' }
}

export default function YouTubePage() {
  const auth = useGoogleAuth(YOUTUBE_PAGE_SCOPES)
  const [tab, setTab] = useState('data')
  const [channel, setChannel] = useState(null)
  const [error, setError] = useState('')
  const [loadingChannel, setLoadingChannel] = useState(false)

  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const showToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }, [])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const loadChannel = useCallback(async () => {
    setLoadingChannel(true)
    setError('')
    try {
      const c = await getMyChannel()
      if (!c) setError('Akun Google ini belum punya channel YouTube.')
      setChannel(c)
    } catch (e) {
      setError(e.message || 'Gagal memuat data channel.')
    } finally {
      setLoadingChannel(false)
    }
  }, [])

  useEffect(() => {
    if (auth.ready) loadChannel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.ready])

  if (!auth.configured || !auth.ready) {
    return (
      <div className="youtube-page">
        <GoogleLoginGate
          icon={Youtube}
          color="#FF0000"
          title="Hubungkan Channel YouTube"
          desc="Pantau performa channel, kelola playlist, dan tarik laporan massal dari tiga API YouTube dalam satu halaman."
          perms={PERM_LIST}
          note="Semua scope yang diminta bersifat readonly. Luxio tidak bisa mengunggah, mengubah, atau menghapus video kamu."
          error={!auth.configured
            ? 'VITE_GOOGLE_CLIENT_ID belum diatur, jadi login Google belum bisa dipakai.'
            : auth.error}
          busy={auth.busy}
          onLogin={auth.login}
        />
      </div>
    )
  }

  return (
    <div className="youtube-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>
            <Youtube size={20} style={{ color: '#FF0000', verticalAlign: '-3px' }} /> YouTube
          </h1>
          <p>
            {channel
              ? `${channel.title} Â· ${formatCount(channel.subscribers)} subscriber`
              : auth.email ? `Masuk sebagai ${auth.email}` : 'Kelola channel YouTube kamu'}
          </p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-secondary" onClick={loadChannel} disabled={loadingChannel}>
            <RefreshCw size={14} className={loadingChannel ? 'gp-spin' : ''} /> Muat ulang
          </button>
          {channel && (
            <a
              className="btn btn-secondary"
              href={`https://www.youtube.com/channel/${channel.id}`}
              target="_blank"
              rel="noopener"
            >
              <ExternalLink size={14} /> Channel
            </a>
          )}
          <button className="btn btn-ghost" onClick={auth.logout} title="Cabut akses YouTube">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="gp-error">
          <AlertTriangle size={15} /> <span>{error}</span>
        </div>
      )}

      <div className="gp-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`gp-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={14} />
            {t.label}
            <span className="gp-tab-sub">{t.sub}</span>
          </button>
        ))}
      </div>

      {tab === 'data' && <DataTab channel={channel} loading={loadingChannel} onToast={showToast} />}
      {tab === 'analytics' && <AnalyticsTab channel={channel} onToast={showToast} />}
      {tab === 'reporting' && <ReportingTab onToast={showToast} />}

      {toast && <div className="gp-toast">{toast}</div>}
    </div>
  )
}

// =====================================================================
// TAB 1 â€” YouTube Data API v3
// =====================================================================

function DataTab({ channel, loading, onToast }) {
  const [view, setView] = useState('videos') // videos | playlists | subs
  const [videos, setVideos] = useState([])
  const [nextToken, setNextToken] = useState('')
  const [playlists, setPlaylists] = useState([])
  const [subs, setSubs] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [comments, setComments] = useState(null) // { video, threads }

  const loadVideos = useCallback(async ({ append = false, token = '' } = {}) => {
    if (!channel?.uploadsPlaylistId) return
    setBusy(true)
    setErr('')
    try {
      const res = await listChannelVideos(channel.uploadsPlaylistId, { pageToken: token })
      setVideos((prev) => (append ? [...prev, ...res.videos] : res.videos))
      setNextToken(res.nextPageToken)
    } catch (e) { setErr(e.message || 'Gagal memuat video.') } finally { setBusy(false) }
  }, [channel])

  const loadPlaylists = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const res = await listMyPlaylists()
      setPlaylists(res.playlists)
    } catch (e) { setErr(e.message || 'Gagal memuat playlist.') } finally { setBusy(false) }
  }, [])

  const loadSubs = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const res = await listMySubscriptions()
      setSubs(res.subscriptions)
    } catch (e) { setErr(e.message || 'Gagal memuat subscription.') } finally { setBusy(false) }
  }, [])

  useEffect(() => {
    if (!channel) return
    if (view === 'videos' && videos.length === 0) loadVideos()
    if (view === 'playlists' && playlists.length === 0) loadPlaylists()
    if (view === 'subs' && subs.length === 0) loadSubs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, view])

  const openComments = async (v) => {
    setComments({ video: v, threads: null })
    try {
      const res = await listVideoComments(v.id)
      setComments({ video: v, threads: res.threads })
    } catch (e) {
      setComments({ video: v, threads: [] })
      onToast(e.message || 'Komentar tidak bisa dimuat (mungkin dinonaktifkan).')
    }
  }

  if (loading && !channel) {
    return <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Memuat channel...</div>
  }
  if (!channel) {
    return <div className="gp-empty"><Youtube size={26} /> Channel YouTube tidak ditemukan pada akun ini.</div>
  }

  return (
    <>
      <div className="gp-stats">
        <div className="gp-stat">
          <div className="gp-stat-label"><Users size={11} /> Subscriber</div>
          <div className="gp-stat-value">
            {channel.subscribersHidden ? 'disembunyikan' : formatCount(channel.subscribers)}
          </div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><Eye size={11} /> Total view</div>
          <div className="gp-stat-value">{formatCount(channel.views)}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><PlaySquare size={11} /> Video</div>
          <div className="gp-stat-value">{formatCount(channel.videos)}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><Clock size={11} /> Dibuat</div>
          <div className="gp-stat-value" style={{ fontSize: '1rem' }}>{fmtDate(channel.publishedAt)}</div>
          <div className="gp-stat-sub">{channel.customUrl || channel.id}</div>
        </div>
      </div>

      <div className="gp-toolbar">
        <button className={`gp-tab ${view === 'videos' ? 'active' : ''}`} onClick={() => setView('videos')}>
          <PlaySquare size={13} /> Video
        </button>
        <button className={`gp-tab ${view === 'playlists' ? 'active' : ''}`} onClick={() => setView('playlists')}>
          <ListVideo size={13} /> Playlist
        </button>
        <button className={`gp-tab ${view === 'subs' ? 'active' : ''}`} onClick={() => setView('subs')}>
          <Users size={13} /> Subscription
        </button>
      </div>

      {err && <div className="gp-error"><AlertTriangle size={15} /> <span>{err}</span></div>}

      <div className="gp-panel">
        <div className="gp-panel-body flush">
          {busy && (
            (view === 'videos' && videos.length === 0) ||
            (view === 'playlists' && playlists.length === 0) ||
            (view === 'subs' && subs.length === 0)
          ) ? (
            <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Memuat...</div>
          ) : view === 'videos' ? (
            videos.length === 0 ? (
              <div className="gp-empty"><PlaySquare size={26} /> Belum ada video di channel ini.</div>
            ) : videos.map((v) => (
              <div key={v.id} className="gp-row">
                <div className="gp-row-icon" style={{ width: 56, height: 34, borderRadius: 6 }}>
                  {v.thumbnail ? <img src={v.thumbnail} alt="" /> : <PlaySquare size={16} />}
                </div>
                <div className="gp-row-main">
                  <div className="gp-row-title">{v.title}</div>
                  <div className="gp-row-sub">
                    {formatCount(v.views)} view Â· {formatCount(v.likes)} suka Â· {formatCount(v.comments)} komentar
                    Â· {formatDuration(v.duration)} Â· {fmtDate(v.publishedAt)}
                    {v.privacyStatus && v.privacyStatus !== 'public' ? ` Â· ${v.privacyStatus}` : ''}
                  </div>
                </div>
                <div className="gp-row-actions">
                  <button onClick={() => openComments(v)} title="Lihat komentar">
                    <MessageSquare size={14} />
                  </button>
                  <a
                    className="btn btn-ghost"
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener"
                    title="Buka di YouTube"
                    style={{ padding: '5px 7px' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))
          ) : view === 'playlists' ? (
            playlists.length === 0 ? (
              <div className="gp-empty"><ListVideo size={26} /> Belum ada playlist.</div>
            ) : playlists.map((p) => (
              <div key={p.id} className="gp-row">
                <div className="gp-row-icon" style={{ width: 56, height: 34, borderRadius: 6 }}>
                  {p.thumbnail ? <img src={p.thumbnail} alt="" /> : <ListVideo size={16} />}
                </div>
                <div className="gp-row-main">
                  <div className="gp-row-title">{p.title}</div>
                  <div className="gp-row-sub">
                    {p.itemCount} video Â· {p.privacyStatus} Â· dibuat {fmtDate(p.publishedAt)}
                  </div>
                </div>
                <div className="gp-row-actions">
                  <a
                    className="btn btn-ghost"
                    href={`https://www.youtube.com/playlist?list=${p.id}`}
                    target="_blank"
                    rel="noopener"
                    title="Buka playlist"
                    style={{ padding: '5px 7px' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))
          ) : (
            subs.length === 0 ? (
              <div className="gp-empty"><Users size={26} /> Belum berlangganan channel lain.</div>
            ) : subs.map((s) => (
              <div key={s.id} className="gp-row">
                <div className="gp-row-icon" style={{ borderRadius: '50%' }}>
                  {s.thumbnail ? <img src={s.thumbnail} alt="" /> : <Users size={16} />}
                </div>
                <div className="gp-row-main">
                  <div className="gp-row-title">{s.title}</div>
                  <div className="gp-row-sub">{formatCount(s.totalItemCount)} video</div>
                </div>
                <div className="gp-row-actions">
                  <a
                    className="btn btn-ghost"
                    href={`https://www.youtube.com/channel/${s.channelId}`}
                    target="_blank"
                    rel="noopener"
                    title="Buka channel"
                    style={{ padding: '5px 7px' }}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {view === 'videos' && nextToken && (
        <button
          className="btn btn-secondary"
          onClick={() => loadVideos({ append: true, token: nextToken })}
          disabled={busy}
        >
          {busy ? <Loader2 size={14} className="gp-spin" /> : <ChevronDown size={14} />} Muat lebih banyak
        </button>
      )}

      {comments && (
        <div className="gp-modal-overlay" onClick={() => setComments(null)}>
          <div className="gp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gp-modal-header">
              <h2><MessageSquare size={16} /> {comments.video.title}</h2>
              <button className="gp-modal-close" onClick={() => setComments(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            <div className="gp-modal-body">
              {comments.threads === null ? (
                <div className="gp-empty"><Loader2 size={20} className="gp-spin" /> Memuat komentar...</div>
              ) : comments.threads.length === 0 ? (
                <div className="gp-empty"><MessageSquare size={22} /> Belum ada komentar.</div>
              ) : comments.threads.map((t) => (
                <div key={t.id} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{t.author}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '4px 0', whiteSpace: 'pre-wrap' }}>
                    {t.text}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                    <span><ThumbsUp size={10} /> {t.likes}</span>
                    <span>{t.replyCount} balasan</span>
                    <span>{fmtDate(t.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// =====================================================================
// TAB 2 â€” YouTube Analytics API v2
// =====================================================================

function AnalyticsTab({ channel, onToast }) {
  const [days, setDays] = useState(28)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [topVideos, setTopVideos] = useState([])
  const [countries, setCountries] = useState([])
  const [traffic, setTraffic] = useState([])
  const [devices, setDevices] = useState([])
  const [demo, setDemo] = useState([])

  const load = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const range = ytAnalytics.lastNDays(days)
      // Dijalankan paralel; kalau salah satu laporan tidak tersedia untuk
      // channel ini, sisanya tetap tampil.
      const [s, t, tv, c, tr, dv, dm] = await Promise.all([
        ytAnalytics.getSummary(range),
        ytAnalytics.getDailyTrend(range),
        ytAnalytics.getTopVideos(range, 10),
        ytAnalytics.getTopCountries(range, 8),
        ytAnalytics.getTrafficSources(range),
        ytAnalytics.getDeviceTypes(range),
        ytAnalytics.getDemographics(range).catch(() => []),
      ])
      setSummary(s); setTrend(t); setTopVideos(tv)
      setCountries(c); setTraffic(tr); setDevices(dv); setDemo(dm)
    } catch (e) {
      setErr(e.message || 'Gagal memuat laporan analytics.')
    } finally {
      setBusy(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  const videoTitleById = useMemo(() => {
    const m = {}
    return (id) => m[id] || id
  }, [])

  const maxTrend = Math.max(1, ...trend.map((d) => d.views))
  const totalTraffic = traffic.reduce((a, b) => a + b.views, 0) || 1
  const totalDevice = devices.reduce((a, b) => a + b.views, 0) || 1
  const maxCountry = Math.max(1, ...countries.map((c) => c.views))

  return (
    <>
      <div className="gp-notice">
        <Info size={15} />
        <span>
          Data YouTube Analytics tertinggal sekitar <strong>2 hari</strong> dari waktu nyata dan
          memakai zona waktu Pacific Time. Rentang di bawah otomatis berakhir 2 hari lalu.
        </span>
      </div>

      <div className="gp-toolbar">
        {RANGES.map((r) => (
          <button
            key={r.id}
            className={`gp-tab ${days === r.id ? 'active' : ''}`}
            onClick={() => setDays(r.id)}
          >
            {r.label}
          </button>
        ))}
        <button className="btn btn-secondary" onClick={load} disabled={busy}>
          <RefreshCw size={14} className={busy ? 'gp-spin' : ''} /> Muat ulang
        </button>
      </div>

      {err && <div className="gp-error"><AlertTriangle size={15} /> <span>{err}</span></div>}

      {busy && !summary ? (
        <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Menghitung laporan...</div>
      ) : !summary ? (
        <div className="gp-empty"><BarChart3 size={26} /> Belum ada data untuk rentang ini.</div>
      ) : (
        <>
          <div className="gp-stats">
            <div className="gp-stat">
              <div className="gp-stat-label"><Eye size={11} /> View</div>
              <div className="gp-stat-value">{formatCount(summary.views)}</div>
              <div className="gp-stat-sub">{summary.startDate} s/d {summary.endDate}</div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-label"><Clock size={11} /> Watch time</div>
              <div className="gp-stat-value">{ytAnalytics.formatMinutes(summary.minutesWatched)}</div>
              <div className="gp-stat-sub">rata-rata {ytAnalytics.formatSeconds(summary.avgViewDuration)} per view</div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-label"><Users size={11} /> Subscriber bersih</div>
              <div className={`gp-stat-value ${summary.subscribersNet >= 0 ? 'gp-stat-up' : 'gp-stat-down'}`}>
                {summary.subscribersNet >= 0 ? '+' : ''}{formatCount(summary.subscribersNet)}
              </div>
              <div className="gp-stat-sub">
                +{formatCount(summary.subscribersGained)} / -{formatCount(summary.subscribersLost)}
              </div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-label"><ThumbsUp size={11} /> Interaksi</div>
              <div className="gp-stat-value">{formatCount(summary.likes + summary.comments + summary.shares)}</div>
              <div className="gp-stat-sub">
                {formatCount(summary.likes)} suka Â· {formatCount(summary.comments)} komentar
              </div>
            </div>
            <div className="gp-stat">
              <div className="gp-stat-label"><TrendingUp size={11} /> Rata-rata ditonton</div>
              <div className="gp-stat-value">{summary.avgViewPercentage.toFixed(1)}%</div>
              <div className="gp-stat-sub">dari durasi video</div>
            </div>
          </div>

          {trend.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head">
                <h3><TrendingUp size={15} /> Tren view harian</h3>
                <span className="gp-chip">{trend.length} hari</span>
              </div>
              <div className="gp-spark">
                {trend.map((d) => (
                  <div
                    key={d.day}
                    className="gp-spark-bar"
                    style={{ height: `${Math.max(4, (d.views / maxTrend) * 100)}%` }}
                    title={`${d.day}: ${d.views} view`}
                  />
                ))}
              </div>
            </div>
          )}

          {topVideos.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head">
                <h3><PlaySquare size={15} /> Video teratas</h3>
              </div>
              <div className="gp-table-wrap">
                <table className="gp-table">
                  <thead>
                    <tr>
                      <th>Video</th>
                      <th className="num">View</th>
                      <th className="num">Watch time</th>
                      <th className="num">Rata-rata</th>
                      <th className="num">Suka</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVideos.map((v) => (
                      <tr key={v.videoId}>
                        <td>
                          <a
                            href={`https://www.youtube.com/watch?v=${v.videoId}`}
                            target="_blank"
                            rel="noopener"
                            style={{ color: 'var(--accent)' }}
                          >
                            {videoTitleById(v.videoId)}
                          </a>
                        </td>
                        <td className="num">{formatCount(v.views)}</td>
                        <td className="num">{ytAnalytics.formatMinutes(v.minutesWatched)}</td>
                        <td className="num">{ytAnalytics.formatSeconds(v.avgViewDuration)}</td>
                        <td className="num">{formatCount(v.likes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {traffic.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head"><h3><TrendingUp size={15} /> Sumber trafik</h3></div>
              <div className="gp-panel-body flush" style={{ paddingBottom: 10 }}>
                {traffic.map((t) => (
                  <div className="gp-bar-row" key={t.source}>
                    <span className="gp-bar-label">
                      {ytAnalytics.TRAFFIC_SOURCE_LABEL[t.source] || t.source}
                    </span>
                    <div className="gp-bar-track">
                      <div className="gp-bar-fill" style={{ width: `${(t.views / totalTraffic) * 100}%` }} />
                    </div>
                    <span className="gp-bar-value">{formatCount(t.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {countries.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head"><h3><Globe size={15} /> Negara penonton</h3></div>
              <div className="gp-panel-body flush" style={{ paddingBottom: 10 }}>
                {countries.map((c) => (
                  <div className="gp-bar-row" key={c.country}>
                    <span className="gp-bar-label">{c.country}</span>
                    <div className="gp-bar-track">
                      <div className="gp-bar-fill" style={{ width: `${(c.views / maxCountry) * 100}%` }} />
                    </div>
                    <span className="gp-bar-value">{formatCount(c.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {devices.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head"><h3><Smartphone size={15} /> Perangkat</h3></div>
              <div className="gp-panel-body flush" style={{ paddingBottom: 10 }}>
                {devices.map((d) => (
                  <div className="gp-bar-row" key={d.device}>
                    <span className="gp-bar-label">{ytAnalytics.DEVICE_LABEL[d.device] || d.device}</span>
                    <div className="gp-bar-track">
                      <div className="gp-bar-fill" style={{ width: `${(d.views / totalDevice) * 100}%` }} />
                    </div>
                    <span className="gp-bar-value">{formatCount(d.views)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {demo.length > 0 && (
            <div className="gp-panel">
              <div className="gp-panel-head"><h3><Users size={15} /> Demografi penonton</h3></div>
              <div className="gp-table-wrap">
                <table className="gp-table">
                  <thead>
                    <tr>
                      <th>Kelompok umur</th>
                      <th>Gender</th>
                      <th className="num">Persentase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demo.map((d, i) => (
                      <tr key={`${d.ageGroup}-${d.gender}-${i}`}>
                        <td>{d.ageGroup} tahun</td>
                        <td>{ytAnalytics.GENDER_LABEL[d.gender] || d.gender}</td>
                        <td className="num">{d.percentage.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

// =====================================================================
// TAB 3 â€” YouTube Reporting API v1
// =====================================================================

function ReportingTab({ onToast }) {
  const [types, setTypes] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [reports, setReports] = useState({}) // { jobId: [reports] }
  const [openJob, setOpenJob] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [preview, setPreview] = useState(null)

  const load = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const [t, j] = await Promise.all([
        ytReporting.listReportTypes({ includeSystemManaged: true }),
        ytReporting.listJobs({ includeSystemManaged: true }),
      ])
      setTypes(t.reportTypes)
      setJobs(j.jobs)
      if (!selectedType && t.reportTypes.length) {
        const firstUser = t.reportTypes.find((x) => !x.systemManaged) || t.reportTypes[0]
        setSelectedType(firstUser.id)
      }
    } catch (e) {
      setErr(e.message || 'Gagal memuat data Reporting API. Pastikan channel punya akses laporan massal.')
    } finally {
      setBusy(false)
    }
  }, [selectedType])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCreateJob = async () => {
    if (!selectedType) return
    try {
      const t = types.find((x) => x.id === selectedType)
      const job = await ytReporting.createJob(selectedType, t?.name || selectedType)
      setJobs((prev) => [job, ...prev])
      onToast('Job dibuat. Laporan pertama biasanya baru tersedia besok.')
    } catch (e) { setErr(e.message || 'Gagal membuat job.') }
  }

  const onDeleteJob = async (job) => {
    if (!window.confirm(`Hapus job "${job.name}"? Laporan yang sudah ada tetap bisa diunduh sampai kedaluwarsa.`)) return
    try {
      await ytReporting.deleteJob(job.id)
      setJobs((prev) => prev.filter((j) => j.id !== job.id))
      onToast('Job dihapus.')
    } catch (e) { setErr(e.message || 'Gagal menghapus job.') }
  }

  const toggleJob = async (job) => {
    if (openJob === job.id) { setOpenJob(''); return }
    setOpenJob(job.id)
    if (reports[job.id]) return
    try {
      const res = await ytReporting.listReports(job.id)
      setReports((prev) => ({ ...prev, [job.id]: res.reports }))
    } catch (e) {
      setReports((prev) => ({ ...prev, [job.id]: [] }))
      setErr(e.message || 'Gagal memuat daftar laporan.')
    }
  }

  const onPreview = async (rep) => {
    setPreview({ rep, data: null })
    try {
      setPreview({ rep, data: await ytReporting.previewReport(rep.downloadUrl, 50) })
    } catch (e) {
      setPreview(null)
      setErr(e.message || 'Gagal mengunduh laporan.')
    }
  }

  const onDownloadCsv = async (rep) => {
    try {
      onToast('Mengunduh CSV...')
      const csv = await ytReporting.downloadReportCsv(rep.downloadUrl)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `youtube-report-${rep.startTime?.slice(0, 10) || rep.id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setErr(e.message || 'Unduh CSV gagal.') }
  }

  const userJobs = jobs.filter((j) => !j.systemManaged)
  const sysJobs = jobs.filter((j) => j.systemManaged)

  return (
    <>
      <div className="gp-notice">
        <Info size={15} />
        <span>
          Reporting API bekerja <strong>asinkron</strong>: daftarkan job sekali, lalu YouTube
          menghasilkan satu file CSV per hari. Laporan pertama muncul Â±1 hari setelah job dibuat,
          dengan backfill historis sampai 30 hari, dan tersimpan sekitar 60 hari.
          Untuk pipeline data produksi jalankan alur ini di backend, bukan di browser.
        </span>
      </div>

      {err && <div className="gp-error"><AlertTriangle size={15} /> <span>{err}</span></div>}

      <div className="gp-toolbar">
        <select
          className="input"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          aria-label="Pilih jenis laporan"
          style={{ flex: 1, minWidth: 220 }}
        >
          {types.length === 0 && <option value="">Tidak ada jenis laporan tersedia</option>}
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}{t.systemManaged ? ' (dikelola sistem)' : ''}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={onCreateJob} disabled={!selectedType || busy}>
          <Plus size={14} /> Buat job
        </button>
        <button className="btn btn-secondary" onClick={load} disabled={busy}>
          <RefreshCw size={14} className={busy ? 'gp-spin' : ''} /> Muat ulang
        </button>
      </div>

      <div className="gp-stats">
        <div className="gp-stat">
          <div className="gp-stat-label"><Database size={11} /> Jenis laporan</div>
          <div className="gp-stat-value">{types.length}</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label"><FileSpreadsheet size={11} /> Job aktif</div>
          <div className="gp-stat-value">{userJobs.length}</div>
          <div className="gp-stat-sub">buatan sendiri</div>
        </div>
        <div className="gp-stat">
          <div className="gp-stat-label">Dikelola sistem</div>
          <div className="gp-stat-value">{sysJobs.length}</div>
        </div>
      </div>

      <div className="gp-panel">
        <div className="gp-panel-head">
          <h3><FileSpreadsheet size={15} /> Job laporan</h3>
          <span className="gp-chip">{jobs.length} total</span>
        </div>
        <div className="gp-panel-body flush">
          {busy && jobs.length === 0 ? (
            <div className="gp-empty"><Loader2 size={22} className="gp-spin" /> Memuat job...</div>
          ) : jobs.length === 0 ? (
            <div className="gp-empty">
              <FileSpreadsheet size={26} />
              Belum ada job. Pilih jenis laporan di atas lalu klik "Buat job".
            </div>
          ) : jobs.map((j) => (
            <div key={j.id}>
              <div className="gp-row clickable" onClick={() => toggleJob(j)}>
                <div className="gp-row-icon"><FileSpreadsheet size={16} /></div>
                <div className="gp-row-main">
                  <div className="gp-row-title">
                    {j.name}
                    {j.systemManaged && <span className="gp-chip warn" style={{ marginLeft: 6 }}>sistem</span>}
                  </div>
                  <div className="gp-row-sub">
                    {j.reportTypeId} Â· dibuat {fmtDate(j.createTime)}
                    {j.expireTime ? ` Â· kedaluwarsa ${fmtDate(j.expireTime)}` : ''}
                  </div>
                </div>
                <div className="gp-row-actions">
                  <button title="Lihat laporan"><ChevronDown size={14} /></button>
                  {!j.systemManaged && (
                    <button
                      className="danger"
                      onClick={(e) => { e.stopPropagation(); onDeleteJob(j) }}
                      title="Hapus job"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {openJob === j.id && (
                <div style={{ background: 'var(--bg-tertiary)' }}>
                  {!reports[j.id] ? (
                    <div className="gp-empty" style={{ minHeight: 90 }}>
                      <Loader2 size={18} className="gp-spin" /> Memuat laporan...
                    </div>
                  ) : reports[j.id].length === 0 ? (
                    <div className="gp-empty" style={{ minHeight: 90 }}>
                      Belum ada laporan siap. Job baru butuh Â±1 hari sebelum laporan pertama muncul.
                    </div>
                  ) : reports[j.id].map((r) => (
                    <div key={r.id} className="gp-row" style={{ paddingLeft: 46 }}>
                      <div className="gp-row-main">
                        <div className="gp-row-title" style={{ fontSize: '0.8125rem' }}>
                          {fmtDate(r.startTime)} â€” {fmtDate(r.endTime)}
                        </div>
                        <div className="gp-row-sub">dibuat {fmtDate(r.createTime)}</div>
                      </div>
                      <div className="gp-row-actions">
                        <button onClick={() => onPreview(r)} title="Pratinjau">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => onDownloadCsv(r)} title="Unduh CSV">
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="gp-modal-overlay" onClick={() => setPreview(null)}>
          <div className="gp-modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="gp-modal-header">
              <h2>
                <Eye size={16} /> Pratinjau laporan {fmtDate(preview.rep.startTime)}
              </h2>
              <button className="gp-modal-close" onClick={() => setPreview(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            <div className="gp-modal-body">
              {!preview.data ? (
                <div className="gp-empty"><Loader2 size={20} className="gp-spin" /> Mengunduh CSV...</div>
              ) : (
                <>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Menampilkan {preview.data.rows.length} dari {preview.data.totalRows} baris.
                  </p>
                  <div className="gp-table-wrap">
                    <table className="gp-table">
                      <thead>
                        <tr>{preview.data.headers.map((h) => <th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {preview.data.rows.map((row, i) => (
                          <tr key={i}>{row.map((c, k) => <td key={k}>{c}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
            <div className="gp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreview(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => onDownloadCsv(preview.rep)}>
                <Download size={14} /> Unduh CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
