import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { api } from '../services/api'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Plus, X, Send, ChevronDown, ChevronUp, Search, Eye, User } from 'lucide-react'
import './Profile.css'

export default function Profile() {
  const { currentUser } = useStore()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState('')
  const [showPostForm, setShowPostForm] = useState(false)
  const [formUrl, setFormUrl] = useState('')
  const [formCaption, setFormCaption] = useState('')
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [ts, setTs] = useState(0)

  const loadPosts = useCallback(async (userId) => {
    setLoading(true)
    try {
      const res = await api.getPosts(userId || '')
      setPosts(res.posts || [])
    } catch (_) { setPosts([]) }
    setLoading(false)
  }, [])

  useEffect(() => { loadPosts(selectedUser) }, [loadPosts, selectedUser, ts])

  const handleCreatePost = async () => {
    if (!formUrl.trim()) return
    try {
      await api.createPost({ image_url: formUrl.trim(), caption: formCaption.trim() })
      setFormUrl(''); setFormCaption(''); setShowPostForm(false)
      setTs(Date.now())
    } catch (_) {}
  }

  const handleLike = async (postId) => {
    try {
      const res = await api.toggleLike(postId)
      setPosts(posts.map(p => p.id === postId ? { ...p, liked: res.liked, like_count: p.like_count + (res.liked ? 1 : -1) } : p))
    } catch (_) {}
  }

  const handleComment = async (postId) => {
    const body = (commentText[postId] || '').trim()
    if (!body) return
    try {
      await api.addComment(postId, body)
      const res = await api.getComments(postId)
      setComments({ ...comments, [postId]: res.comments || [] })
      setCommentText({ ...commentText, [postId]: '' })
      setPosts(posts.map(p => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
    } catch (_) {}
  }

  const handleShare = async (postId) => {
    try {
      await api.sharePost(postId)
      setPosts(posts.map(p => p.id === postId ? { ...p, share_count: p.share_count + 1 } : p))
    } catch (_) {}
  }

  const toggleComments = async (postId) => {
    if (comments[postId]) {
      setComments({ ...comments, [postId]: null })
      return
    }
    try {
      const res = await api.getComments(postId)
      setComments({ ...comments, [postId]: res.comments || [] })
    } catch (_) {}
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const res = await api.searchUsers(searchQuery.trim())
      setUsers(res.users || [])
      setShowSearch(true)
    } catch (_) {}
  }

  const selectUser = (userId) => {
    setSelectedUser(userId)
    setShowSearch(false)
    setSearchQuery('')
    setUsers([])
  }

  return (
    <>
      <div className="profile-page">
        <div className="profile-header-row">
          <div className="profile-header-left">
            <h1>Profil Sosial</h1>
            <p>Foto, like, komentar, dan share antar akun</p>
          </div>
          <div className="profile-header-actions">
            <div className="profile-search">
              <input
                className="input"
                placeholder="Cari akun..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-secondary btn-sm" onClick={handleSearch}><Search size={14} /></button>
            </div>
            {selectedUser && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedUser(''); setTs(Date.now()) }}>
                <User size={14} /> Semua
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setShowPostForm(true)}>
              <Plus size={14} /> Unggah Foto
            </button>
          </div>
        </div>

        {showSearch && users.length > 0 && (
          <div className="profile-search-results">
            {users.map(u => (
              <button key={u.id} className="profile-search-user" onClick={() => selectUser(u.id)}>
                <div className="profile-search-user-avatar">
                  <img src="/luxio.png" alt="" />
                </div>
                <div className="profile-search-user-info">
                  <span className="profile-search-user-name">{u.name}</span>
                  <span className="profile-search-user-email">{u.email}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showPostForm && (
          <div className="profile-modal-overlay" onClick={() => setShowPostForm(false)}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-head">
                <h3>Unggah Foto Baru</h3>
                <button className="profile-modal-close" onClick={() => setShowPostForm(false)}><X size={18} /></button>
              </div>
              <div className="input-group">
                <label className="input-label">URL Gambar</label>
                <input className="input" placeholder="https://...jpg" value={formUrl} onChange={e => setFormUrl(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Keterangan</label>
                <textarea className="input" rows={3} placeholder="Tulis caption..." value={formCaption} onChange={e => setFormCaption(e.target.value)} />
              </div>
              <button className="btn btn-primary" disabled={!formUrl.trim()} onClick={handleCreatePost}>
                <Send size={14} /> Unggah
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="profile-loading">Memuat...</div>
        ) : posts.length === 0 ? (
          <div className="profile-empty">
            <Eye size={32} />
            <p>Belum ada postingan. Unggah foto pertama kamu!</p>
          </div>
        ) : (
          <div className="profile-feed">
            {posts.map((post) => (
              <motion.div key={post.id} className="profile-post" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="profile-post-author">
                  <img src="/luxio.png" alt="" className="profile-post-avatar" />
                  <span className="profile-post-author-name">{post.author_name || post.author_email || 'User'}</span>
                </div>

                <div className="profile-post-image-wrap" onContextMenu={(e) => e.preventDefault()}>
                  <img src={post.image_url} alt={post.caption || 'Foto'} className="profile-post-image" draggable={false} />
                </div>

                <div className="profile-post-actions">
                  <button className={`profile-action-btn ${post.liked ? 'liked' : ''}`} onClick={() => handleLike(post.id)}>
                    <Heart size={20} fill={post.liked ? 'var(--accent)' : 'none'} />
                    <span>{post.like_count}</span>
                  </button>
                  <button className="profile-action-btn" onClick={() => toggleComments(post.id)}>
                    <MessageCircle size={20} />
                    <span>{post.comment_count}</span>
                  </button>
                  <button className="profile-action-btn" onClick={() => handleShare(post.id)}>
                    <Share2 size={20} />
                    <span>{post.share_count}</span>
                  </button>
                </div>

                {post.caption && <p className="profile-post-caption">{post.caption}</p>}

                {comments[post.id] && (
                  <div className="profile-post-comments">
                    <div className="profile-comments-list">
                      {comments[post.id].length === 0 ? (
                        <span className="profile-no-comments">Belum ada komentar</span>
                      ) : (
                        comments[post.id].map(c => (
                          <div key={c.id} className="profile-comment">
                            <span className="profile-comment-author">{c.author_name || c.author_email || 'User'}</span>
                            <span className="profile-comment-body">{c.body}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="profile-comment-input">
                      <input
                        className="input"
                        placeholder="Tulis komentar..."
                        value={commentText[post.id] || ''}
                        onChange={e => setCommentText({ ...commentText, [post.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                      />
                      <button className="btn btn-primary btn-sm" disabled={!commentText[post.id]?.trim()} onClick={() => handleComment(post.id)}>
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}