// =====================================================================
// youtubeApi.js — Klien YouTube Data API v3 via googleAuth.js
// =====================================================================
// Scope: youtube.readonly (baca channel/video/playlist milik sendiri).
// Operasi tulis (upload video, ubah playlist) butuh GOOGLE_SCOPES
// .YOUTUBE_MANAGE dan belum diaktifkan di halaman ini secara default.
//
// PENTING soal kuota: kuota harian default 10.000 unit. Operasi baca = 1
// unit, `search.list` = 100 unit, tulis = 50 unit, upload = 1600 unit.
// Karena itu halaman YouTube menghindari search.list dan memakai
// playlist "uploads" milik channel untuk mendaftar video (1 unit).
//
// Dokumentasi lengkap: koleksi dokumentasi api/google api/youtube-data-docs/
// =====================================================================

import { googleFetch, GOOGLE_SCOPES } from './googleAuth'

const BASE = 'https://www.googleapis.com/youtube/v3'

// Satu scope set untuk SELURUH halaman YouTube (ketiga tab) supaya user
// hanya menghadapi satu popup consent, bukan tiga.
export const YOUTUBE_PAGE_SCOPES = [
  ...GOOGLE_SCOPES.YOUTUBE,
  ...GOOGLE_SCOPES.YOUTUBE_ANALYTICS,
  ...GOOGLE_SCOPES.PROFILE,
]

const num = (v) => Number(v || 0)

// ---------- Channel ----------

/** Channel milik akun yang login. */
export const getMyChannel = async () => {
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails,brandingSettings',
    mine: 'true',
  })
  const data = await googleFetch(`${BASE}/channels?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  const c = data.items?.[0]
  if (!c) return null
  return {
    id: c.id,
    title: c.snippet?.title || '',
    description: c.snippet?.description || '',
    customUrl: c.snippet?.customUrl || '',
    publishedAt: c.snippet?.publishedAt || '',
    thumbnail: c.snippet?.thumbnails?.medium?.url || c.snippet?.thumbnails?.default?.url || '',
    country: c.snippet?.country || '',
    views: num(c.statistics?.viewCount),
    subscribers: num(c.statistics?.subscriberCount),
    subscribersHidden: Boolean(c.statistics?.hiddenSubscriberCount),
    videos: num(c.statistics?.videoCount),
    // Playlist berisi semua video yang diunggah channel ini.
    uploadsPlaylistId: c.contentDetails?.relatedPlaylists?.uploads || '',
    banner: c.brandingSettings?.image?.bannerExternalUrl || '',
  }
}

// ---------- Video ----------

const mapVideo = (v) => ({
  id: v.id,
  title: v.snippet?.title || '(tanpa judul)',
  description: v.snippet?.description || '',
  publishedAt: v.snippet?.publishedAt || '',
  thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
  channelTitle: v.snippet?.channelTitle || '',
  tags: v.snippet?.tags || [],
  categoryId: v.snippet?.categoryId || '',
  privacyStatus: v.status?.privacyStatus || '',
  uploadStatus: v.status?.uploadStatus || '',
  duration: v.contentDetails?.duration || '',
  views: num(v.statistics?.viewCount),
  likes: num(v.statistics?.likeCount),
  comments: num(v.statistics?.commentCount),
})

/**
 * Daftar video channel lewat playlist "uploads" (1 unit kuota per halaman),
 * lalu ambil statistik lengkap dengan videos.list batch (1 unit).
 */
export const listChannelVideos = async (uploadsPlaylistId, { pageToken = '', maxResults = 25 } = {}) => {
  if (!uploadsPlaylistId) return { videos: [], nextPageToken: '' }
  const params = new URLSearchParams({
    part: 'contentDetails',
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
  })
  if (pageToken) params.set('pageToken', pageToken)
  const list = await googleFetch(`${BASE}/playlistItems?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  const ids = (list.items || []).map((i) => i.contentDetails?.videoId).filter(Boolean)
  if (!ids.length) return { videos: [], nextPageToken: list.nextPageToken || '' }
  const videos = await getVideos(ids)
  return { videos, nextPageToken: list.nextPageToken || '' }
}

/** Detail beberapa video sekaligus (maksimum 50 id per request). */
export const getVideos = async (ids = []) => {
  if (!ids.length) return []
  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails,status',
    id: ids.slice(0, 50).join(','),
  })
  const data = await googleFetch(`${BASE}/videos?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return (data.items || []).map(mapVideo)
}

/** Video paling populer di channel — dipakai untuk kartu ringkasan. */
export const getTopVideos = async (uploadsPlaylistId, limit = 5) => {
  const { videos } = await listChannelVideos(uploadsPlaylistId, { maxResults: 50 })
  return [...videos].sort((a, b) => b.views - a.views).slice(0, limit)
}

// ---------- Playlist ----------

export const listMyPlaylists = async ({ pageToken = '', maxResults = 25 } = {}) => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,status',
    mine: 'true',
    maxResults: String(maxResults),
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/playlists?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    playlists: (data.items || []).map((p) => ({
      id: p.id,
      title: p.snippet?.title || '(tanpa judul)',
      description: p.snippet?.description || '',
      thumbnail: p.snippet?.thumbnails?.medium?.url || p.snippet?.thumbnails?.default?.url || '',
      publishedAt: p.snippet?.publishedAt || '',
      itemCount: num(p.contentDetails?.itemCount),
      privacyStatus: p.status?.privacyStatus || '',
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

export const listPlaylistItems = async (playlistId, { pageToken = '', maxResults = 25 } = {}) => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: String(maxResults),
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/playlistItems?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    items: (data.items || []).map((i) => ({
      id: i.id,
      videoId: i.contentDetails?.videoId || '',
      title: i.snippet?.title || '',
      position: num(i.snippet?.position),
      thumbnail: i.snippet?.thumbnails?.medium?.url || '',
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

// ---------- Komentar ----------

export const listVideoComments = async (videoId, { pageToken = '', maxResults = 20 } = {}) => {
  const params = new URLSearchParams({
    part: 'snippet,replies',
    videoId,
    maxResults: String(maxResults),
    order: 'time',
    textFormat: 'plainText',
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/commentThreads?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    threads: (data.items || []).map((t) => {
      const top = t.snippet?.topLevelComment?.snippet || {}
      return {
        id: t.id,
        author: top.authorDisplayName || 'Anonim',
        authorImage: top.authorProfileImageUrl || '',
        text: top.textDisplay || '',
        likes: num(top.likeCount),
        publishedAt: top.publishedAt || '',
        replyCount: num(t.snippet?.totalReplyCount),
      }
    }),
    nextPageToken: data.nextPageToken || '',
  }
}

// ---------- Subscription ----------

export const listMySubscriptions = async ({ pageToken = '', maxResults = 25 } = {}) => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: String(maxResults),
    order: 'alphabetical',
  })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await googleFetch(`${BASE}/subscriptions?${params.toString()}`, { scopes: YOUTUBE_PAGE_SCOPES })
  return {
    subscriptions: (data.items || []).map((s) => ({
      id: s.id,
      channelId: s.snippet?.resourceId?.channelId || '',
      title: s.snippet?.title || '',
      thumbnail: s.snippet?.thumbnails?.default?.url || '',
      newItemCount: num(s.contentDetails?.newItemCount),
      totalItemCount: num(s.contentDetails?.totalItemCount),
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

// ---------- Util tampilan ----------

/** Ubah durasi ISO 8601 (PT1H2M3S) menjadi 1:02:03. */
export const formatDuration = (iso) => {
  const m = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  if (!m) return '—'
  const [, d, h, mi, s] = m.map((v) => (v ? Number(v) : 0))
  const total = d * 86400 + h * 3600 + mi * 60 + s
  if (!total) return '0:00'
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  return hh > 0
    ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${mm}:${String(ss).padStart(2, '0')}`
}

/** 12.345 → "12,3 rb"; 1.234.567 → "1,2 jt". */
export const formatCount = (n) => {
  const v = Number(n || 0)
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')} jt`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace('.', ',')} rb`
  return String(v)
}
