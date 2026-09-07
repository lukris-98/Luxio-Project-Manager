// =====================================================================
// bloggerApi.js — Klien Blogger API v3 (REST) via token OAuth googleAuth.js
// =====================================================================
// Mencakup tugas yang biasa dilakukan di Blogger.com:
//  - Daftar blog milik akun + pilih blog aktif.
//  - Daftar post (semua/draft/terjadwal/published) + cari + halaman.
//  - Buat / edit / hapus post, publish draft, kembalikan ke draft.
//  - Daftar halaman statis (pages) + CRUD dasar.
//  - Moderasi komentar: daftar, setujui (spam/ham), hapus.
//  - Lihat statistik dasar (views via blog info).
// =====================================================================

import { googleFetch, GOOGLE_SCOPES } from './googleAuth'
import { cacheGet, cacheSet, cacheInvalidate } from './bloggerCache'

const BASE = 'https://www.googleapis.com/blogger/v3'
const SCOPES = () => [...GOOGLE_SCOPES.BLOGGER]

// Helper: GET dengan cache TTL (berpindah tab/blog jadi instan).
const cachedFetch = async (url, { ttl = 120_000 } = {}) => {
  const key = url
  const hit = cacheGet(key)
  if (hit) return hit
  const data = await googleFetch(url, { scopes: SCOPES() })
  cacheSet(key, data, ttl)
  return data
}

// ---------- Blog ----------

export const listBlogs = async () => {
  const data = await cachedFetch(`${BASE}/users/self/blogs`)
  return (data.items || []).map((b) => ({
    id: b.id,
    name: b.name,
    url: b.url,
    posts: b.posts?.totalItems ?? 0,
    pages: b.pages?.totalItems ?? 0,
    comments: b.comments?.totalItems ?? 0,
  }))
}

export const getBlog = (id) =>
  googleFetch(`${BASE}/blogs/${id}`, { scopes: SCOPES() })

// ---------- Post ----------

export const listPosts = async (blogId, { status = 'live', max = 25, pageToken = '' } = {}) => {
  const fetchPage = async (statusParam) => {
    const params = new URLSearchParams({ maxResults: String(max), view: 'AUTHOR', fetchBodies: 'true' })
    if (statusParam) params.set('status', statusParam)
    if (pageToken) params.set('pageToken', pageToken)
    const url = `${BASE}/blogs/${blogId}/posts?${params.toString()}`
    const data = await cachedFetch(url)
    return { posts: (data.items || []).map(mapPost), nextPageToken: data.nextPageToken || '' }
  }
  // 'all' bukan nilai status API valid — gabungkan live + draft + scheduled.
  if (status === 'all' && !pageToken) {
    const [live, draft, scheduled] = await Promise.all([
      fetchPage('live'), fetchPage('draft'), fetchPage('scheduled'),
    ])
    const seen = new Set()
    const merged = [...live.posts, ...draft.posts, ...scheduled.posts]
      .filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
      .sort((a, b) => new Date(b.updated || 0) - new Date(a.updated || 0))
    return { posts: merged, nextPageToken: '' }
  }
  return fetchPage(status === 'all' ? '' : status)
}

const mapPost = (p) => ({
  id: p.id,
  blogId: p.blog?.id || p.blogId,
  title: p.title || '(tanpa judul)',
  content: p.content || '',
  url: p.url,
  published: p.published,
  updated: p.updated,
  status: p.status, // LIVE | DRAFT | SCHEDULED
  labels: (p.labels || []).map((l) => (typeof l === 'string' ? l : l.name || '')),
  comments: p.replies?.totalItems ?? 0,
  author: p.author?.displayName || '',
  images: p.images || [],
})

export const getPost = async (blogId, postId) => {
  const data = await cachedFetch(`${BASE}/blogs/${blogId}/posts/${postId}?view=AUTHOR`)
  return mapPost(data)
}

// Setiap operasi tulis menghapus cache post + hitungan blog agar UI
// langsung menampilkan data terbaru pada fetch berikutnya.
const invalidatePosts = (blogId) => {
  cacheInvalidate(`${BASE}/blogs/${blogId}/posts`)
  cacheInvalidate(`${BASE}/users/self/blogs`)
}

export const createPost = (blogId, { title, content, labels = [], isDraft = false }) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/?isDraft=${isDraft}`, {
    method: 'POST',
    scopes: SCOPES(),
    body: { kind: 'blogger#post', blog: { id: blogId }, title, content, labels },
  }).then((r) => { invalidatePosts(blogId); return mapPost(r) })

export const updatePost = (blogId, postId, { title, content, labels = [] }) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}`, {
    method: 'PATCH',
    scopes: SCOPES(),
    body: { kind: 'blogger#post', title, content, labels },
  }).then((r) => { invalidatePosts(blogId); return mapPost(r) })

// Publish post yang masih draft.
export const publishPost = (blogId, postId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/publish`, {
    method: 'POST',
    scopes: SCOPES(),
  }).then((r) => { invalidatePosts(blogId); return mapPost(r) })

// Kembalikan post LIVE menjadi draft.
export const revertPost = (blogId, postId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/revert`, {
    method: 'POST',
    scopes: SCOPES(),
  }).then((r) => { invalidatePosts(blogId); return mapPost(r) })

export const deletePost = (blogId, postId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}`, {
    method: 'DELETE',
    scopes: SCOPES(),
  }).then((r) => { invalidatePosts(blogId); return r })

// ---------- Halaman statis ----------

const invalidatePages = (blogId) => cacheInvalidate(`${BASE}/blogs/${blogId}/pages`)

export const listPages = async (blogId) => {
  const data = await cachedFetch(`${BASE}/blogs/${blogId}/pages?view=AUTHOR`)
  return (data.items || []).map((p) => ({
    id: p.id,
    title: p.title || '(tanpa judul)',
    content: p.content || '',
    url: p.url,
    published: p.published,
    status: p.status,
  }))
}

// ---------- Komentar ----------

const invalidateComments = (blogId) => {
  cacheInvalidate(`${BASE}/blogs/${blogId}/comments`)
  cacheInvalidate(`${BASE}/users/self/blogs`)
}

export const listComments = async (blogId, { max = 50, pageToken = '' } = {}) => {
  const params = new URLSearchParams({ maxResults: String(max), view: 'ADMIN' })
  if (pageToken) params.set('pageToken', pageToken)
  const data = await cachedFetch(`${BASE}/blogs/${blogId}/comments?${params.toString()}`)
  return {
    comments: (data.items || []).map((c) => ({
      id: c.id,
      postId: c.post?.id,
      author: c.author?.displayName || 'Anonim',
      authorUrl: c.author?.url,
      content: c.content,
      published: c.published,
      status: c.status, // LIVE | EMPTIED | PENDING
    })),
    nextPageToken: data.nextPageToken || '',
  }
}

export const getPostComments = (blogId, postId) =>
  cachedFetch(`${BASE}/blogs/${blogId}/posts/${postId}/comments`)

// Tandai komentar sebagai spam / tidak-spam (moderasi).
export const markCommentSpam = (blogId, postId, commentId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/comments/${commentId}/spam`, {
    method: 'POST',
    scopes: SCOPES(),
  }).then((r) => { invalidateComments(blogId); return r })

export const approveComment = (blogId, postId, commentId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/comments/${commentId}/approve`, {
    method: 'POST',
    scopes: SCOPES(),
  }).then((r) => { invalidateComments(blogId); return r })

export const deleteComment = (blogId, postId, commentId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    scopes: SCOPES(),
  }).then((r) => { invalidateComments(blogId); return r })

// Hapus konten komentar (komentar jadi "EMPTIED", jejak tetap ada).
export const deleteCommentContent = (blogId, postId, commentId) =>
  googleFetch(`${BASE}/blogs/${blogId}/posts/${postId}/comments/${commentId}/deletecontent`, {
    method: 'POST',
    scopes: SCOPES(),
  }).then((r) => { invalidateComments(blogId); return r })
