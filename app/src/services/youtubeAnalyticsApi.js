// =====================================================================
// youtubeAnalyticsApi.js — Klien YouTube Analytics API v2
// =====================================================================
// API ini menjawab pertanyaan "berapa view/watch time/subscriber pada
// rentang tanggal X, dipecah menurut dimensi Y". Bentuknya query
// interaktif: satu request → satu tabel (columnHeaders + rows).
//
// Bedanya dengan YouTube Reporting API: Reporting menghasilkan file CSV
// harian massal lewat job terjadwal (lihat youtubeReportingApi.js).
//
// Scope: yt-analytics.readonly (ikut YOUTUBE_PAGE_SCOPES agar satu popup).
// Dokumentasi: koleksi dokumentasi api/google api/youtube-analytics-docs/
// =====================================================================

import { googleFetch } from './googleAuth'
import { YOUTUBE_PAGE_SCOPES } from './youtubeApi'

const BASE = 'https://youtubeanalytics.googleapis.com/v2'

/** YYYY-MM-DD yang dipakai parameter startDate/endDate. */
export const toApiDate = (d) => new Date(d).toISOString().slice(0, 10)

/** Rentang N hari terakhir. Data analytics tertinggal ±2 hari. */
export const lastNDays = (n = 28, lagDays = 2) => {
  const end = new Date()
  end.setDate(end.getDate() - lagDays)
  const start = new Date(end)
  start.setDate(start.getDate() - (n - 1))
  return { startDate: toApiDate(start), endDate: toApiDate(end) }
}

/**
 * Query mentah ke reports.query.
 * Response Google berbentuk { columnHeaders: [{name,...}], rows: [[...]] };
 * fungsi ini mengembalikannya apa adanya + helper `toObjects`.
 */
export const queryReport = async ({
  ids = 'channel==MINE',
  startDate,
  endDate,
  metrics,
  dimensions = '',
  filters = '',
  sort = '',
  maxResults = 0,
  startIndex = 0,
  currency = '',
} = {}) => {
  const params = new URLSearchParams({ ids, startDate, endDate, metrics })
  if (dimensions) params.set('dimensions', dimensions)
  if (filters) params.set('filters', filters)
  if (sort) params.set('sort', sort)
  if (maxResults > 0) params.set('maxResults', String(maxResults))
  if (startIndex > 0) params.set('startIndex', String(startIndex))
  if (currency) params.set('currency', currency)

  const data = await googleFetch(`${BASE}/reports?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  const headers = (data.columnHeaders || []).map((h) => h.name)
  return {
    headers,
    rows: data.rows || [],
    /** Ubah rows array-of-array menjadi array-of-object berdasarkan header. */
    toObjects: () =>
      (data.rows || []).map((row) => {
        const o = {}
        headers.forEach((h, i) => { o[h] = row[i] })
        return o
      }),
  }
}

// ---------- Laporan siap pakai ----------

/** Total ringkas satu rentang (tanpa dimensi → satu baris saja). */
export const getSummary = async ({ startDate, endDate } = lastNDays(28)) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,comments,shares,subscribersGained,subscribersLost',
  })
  const row = r.rows[0] || []
  const get = (name) => {
    const i = r.headers.indexOf(name)
    return i >= 0 ? Number(row[i] || 0) : 0
  }
  return {
    views: get('views'),
    minutesWatched: get('estimatedMinutesWatched'),
    avgViewDuration: get('averageViewDuration'),
    avgViewPercentage: get('averageViewPercentage'),
    likes: get('likes'),
    comments: get('comments'),
    shares: get('shares'),
    subscribersGained: get('subscribersGained'),
    subscribersLost: get('subscribersLost'),
    get subscribersNet() { return this.subscribersGained - this.subscribersLost },
    startDate,
    endDate,
  }
}

/** Tren harian untuk grafik garis. */
export const getDailyTrend = async ({ startDate, endDate } = lastNDays(28)) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,subscribersGained',
    dimensions: 'day',
    sort: 'day',
  })
  return r.toObjects().map((o) => ({
    day: o.day,
    views: Number(o.views || 0),
    minutesWatched: Number(o.estimatedMinutesWatched || 0),
    subscribersGained: Number(o.subscribersGained || 0),
  }))
}

/** Video dengan view terbanyak pada rentang tersebut. */
export const getTopVideos = async ({ startDate, endDate } = lastNDays(28), limit = 10) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes',
    dimensions: 'video',
    sort: '-views',
    maxResults: limit,
  })
  return r.toObjects().map((o) => ({
    videoId: o.video,
    views: Number(o.views || 0),
    minutesWatched: Number(o.estimatedMinutesWatched || 0),
    avgViewDuration: Number(o.averageViewDuration || 0),
    likes: Number(o.likes || 0),
  }))
}

/** Negara penonton teratas. */
export const getTopCountries = async ({ startDate, endDate } = lastNDays(28), limit = 10) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'country',
    sort: '-views',
    maxResults: limit,
  })
  return r.toObjects().map((o) => ({
    country: o.country,
    views: Number(o.views || 0),
    minutesWatched: Number(o.estimatedMinutesWatched || 0),
  }))
}

/** Demografi umur × gender (metrik viewerPercentage). */
export const getDemographics = async ({ startDate, endDate } = lastNDays(28)) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'viewerPercentage',
    dimensions: 'ageGroup,gender',
    sort: '-viewerPercentage',
  })
  return r.toObjects().map((o) => ({
    ageGroup: String(o.ageGroup || '').replace('age', ''),
    gender: o.gender,
    percentage: Number(o.viewerPercentage || 0),
  }))
}

/** Sumber trafik (search, suggested, browse, external, dll). */
export const getTrafficSources = async ({ startDate, endDate } = lastNDays(28)) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'insightTrafficSourceType',
    sort: '-views',
  })
  return r.toObjects().map((o) => ({
    source: o.insightTrafficSourceType,
    views: Number(o.views || 0),
    minutesWatched: Number(o.estimatedMinutesWatched || 0),
  }))
}

/** Perangkat penonton. */
export const getDeviceTypes = async ({ startDate, endDate } = lastNDays(28)) => {
  const r = await queryReport({
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched',
    dimensions: 'deviceType',
    sort: '-views',
  })
  return r.toObjects().map((o) => ({
    device: o.deviceType,
    views: Number(o.views || 0),
    minutesWatched: Number(o.estimatedMinutesWatched || 0),
  }))
}

// ---------- Grup kustom ----------

export const listGroups = async () => {
  const data = await googleFetch(`${BASE}/groups?mine=true`, { scopes: YOUTUBE_PAGE_SCOPES })
  return (data.items || []).map((g) => ({
    id: g.id,
    title: g.snippet?.title || '',
    itemCount: Number(g.contentDetails?.itemCount || 0),
    itemType: g.contentDetails?.itemType || '',
  }))
}

// ---------- Util tampilan ----------

/** Menit ditonton → "12 j 34 m". */
export const formatMinutes = (minutes) => {
  const m = Math.round(Number(minutes || 0))
  const h = Math.floor(m / 60)
  return h > 0 ? `${h} j ${m % 60} m` : `${m} m`
}

/** Detik → "3:45". */
export const formatSeconds = (seconds) => {
  const s = Math.round(Number(seconds || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Label bahasa Indonesia untuk nilai dimensi yang sering muncul. */
export const TRAFFIC_SOURCE_LABEL = {
  ADVERTISING: 'Iklan',
  ANNOTATION: 'Anotasi',
  CAMPAIGN_CARD: 'Kartu kampanye',
  END_SCREEN: 'End screen',
  EXT_URL: 'Situs eksternal',
  NO_LINK_EMBEDDED: 'Embed tanpa tautan',
  NO_LINK_OTHER: 'Lainnya',
  NOTIFICATION: 'Notifikasi',
  PLAYLIST: 'Playlist',
  PROMOTED: 'Dipromosikan',
  RELATED_VIDEO: 'Video terkait',
  SHORTS: 'Shorts',
  SUBSCRIBER: 'Feed subscriber',
  YT_CHANNEL: 'Halaman channel',
  YT_OTHER_PAGE: 'Halaman YouTube lain',
  YT_PLAYLIST_PAGE: 'Halaman playlist',
  YT_SEARCH: 'Pencarian YouTube',
  HASHTAGS: 'Hashtag',
  SOUND_PAGE: 'Halaman audio',
  VIDEO_REMIXES: 'Remix video',
}

export const DEVICE_LABEL = {
  DESKTOP: 'Desktop',
  GAME_CONSOLE: 'Konsol game',
  MOBILE: 'Ponsel',
  TABLET: 'Tablet',
  TV: 'TV',
  UNKNOWN_PLATFORM: 'Tidak diketahui',
}

export const GENDER_LABEL = {
  female: 'Perempuan',
  male: 'Laki-laki',
  user_specified: 'Lainnya',
}
