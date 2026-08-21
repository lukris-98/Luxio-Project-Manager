# Luxio - Task Manager Pro

## 1. Project Overview

**Nama:** Luxio  
**Tipe:** Progressive Web App (PWA)  
**Platform:** Web (cross-platform via PWA)  
**Target:** Agency/Kantor dengan multiple divisi yang butuh workflow berantai & monitoring realtime

---

## 2. UI/UX Design Philosophy

### Visual Direction (2026 Fresh & Unique)

- **Design Language:** Neo-Brutalism meets Spatial UI
- **Bukan:** Glassmorphism yang sudah mainstream, atau flat design yang boring
- **Yaitu:** Layered cards dengan subtle depth, typografi bold, warna berani tapi terkontrol

### Color Palette

```
Primary:       #1A1A2E (Deep Navy - base)
Secondary:     #16213E (Dark Blue)
Accent:        #E94560 (Vibrant Coral Red)
Success:       #00D9A5 (Mint Green)
Warning:       #FFB830 (Amber)
Surface:       #0F0F1A (Near Black)
Surface-Light: #252542 (Muted Purple-Gray)
Text-Primary:  #FFFFFF
Text-Muted:    #8B8BA7
```

### Typography

- **Headings:** Space Grotesk (bold, geometric) - fresh & modern
- **Body:** DM Sans - readable, contemporary
- **Monospace (IDs/codes):** JetBrains Mono

### Layout Approach

- **Mobile First** dengan responsive breakpoints
- **Sidebar navigation** di desktop, bottom nav di mobile
- **Card-based** content dengan hover states yang meaningful
- **Spatial indicators** - depth layers untuk status priority

---

## 3. Core Features

### 3.1 Workflow/Task Chain System

**Konsep:** Task bisa terdiri dari multiple stages, masing-masing stage punya subtask/checklist.

```
Project A
├── Stage 1: Packing (Checklist: √ Kotak, √ Bubble wrap, √ Label)
├── Stage 2: Sorting (Checklist: √ Kategori, √ Berat, √ Tujuan)
├── Stage 3: Shipping (Checklist: √ Kurir assigned, √ Resi dicetak)
└── Stage 4: Delivered (Checklist: √ Penerima确认)
```

**Rules:**
- Stage berikutnya tidak bisa di-start kalau stage sebelumnya belum 100% complete
- Setiap subtask bisa assign ke user berbeda
- Auto-notifikasi saat stage bisa lanjut
- Visual flow diagram untuk lihat progress

### 3.2 Multi-Divisi Management

**Struktur:**
```
Kantor Pusat
├── Divisi Operations
│   ├── Team Pengiriman
│   └── Team Warehouse
├── Divisi Marketing
│   ├── Team Content
│   └── Team Ads
├── Divisi Finance
└── Divisi HR
```

**Fitur:**
- Setiap user masuk ke divisi tertentu
- Head of Divisi bisa lihat semua task anggotanya
- Cross-divisi task collaboration

### 3.3 Realtime Dashboard

**Dashboard Levels:**

1. **Executive Dashboard** - Overview semua divisi
2. **Divisi Head Dashboard** - Detail divisi sendiri
3. **Personal Dashboard** - Task saya hari ini

**Metrics:**
- Task completion rate (%)
- Average time per stage
- Bottleneck detection (stage yang sering stuck)
- Team productivity ranking
- Realtime updates via WebSocket

### 3.4 Task Management

- **Task Types:**
  - One-time task
  - Recurring task (daily, weekly, monthly)
  - Workflow task (dengan stages)

- **Task Properties:**
  - Title, description
  - Priority (Low, Medium, High, Urgent)
  - Due date & time
  - Assignee(s)
  - Tags/labels
  - Attachments
  - Comments/activity log

- **Views:**
  - List view
  - Kanban board (By Status / By Assignee / By Priority)
  - Calendar view
  - Timeline/Gantt view

---

## 4. User Roles

| Role | Akses |
|------|-------|
| **Admin** | Full akses, manage users, settings, all divisions |
| **Divisi Head** | View all tasks di divisinya, assign tasks, manage members |
| **Supervisor** | View tasks di team tertentu, reassign if needed |
| **Member** | View & complete tasks yang di-assign |

---

## 5. Technical Stack Recommendation

### Frontend (PWA)
- **Framework:** React + Vite atau Next.js
- **State Management:** Zustand atau Jotai
- **UI Components:** Radix UI (headless) + custom styling
- **PWA:** Vite PWA plugin
- **Real-time:** Supabase Realtime atau Socket.io

### Backend (Simple & Scalable)
- **Database:** Supabase (PostgreSQL) atau PlanetScale
- **Auth:** Supabase Auth atau Clerk
- **API:** REST atau tRPC

### Infrastructure
- **Hosting:** Vercel / Netlify (frontend), Supabase (backend)

---

## 6. Page Structure

### Pages

1. **Login/Register** - Clean, branded login
2. **Dashboard** - Stats, quick actions, recent tasks
3. **Projects** - List of all projects/workflows
4. **Project Detail** - Kanban board + timeline
5. **Task Detail** - Full task info, checklist, comments
6. **My Tasks** - Personal task list
7. **Team View** - Divisi members & their tasks
8. **Analytics** - Charts & insights
9. **Settings** - Profile, notifications, team management (admin only)

---

## 7. Key Interactions

### Workflow Progression
```
[Stage 1: 3/3 ✓] ──(Auto-unlock)──► [Stage 2: Locked 🔒]
                                              │
                              When Stage 1 complete:
                              - Notification to assignee
                              - Stage 2 auto-highlighted
                              - Timer starts for Stage 2
```

### Real-time Indicators
- Live cursor/presence (siapa lagi online)
- Task status change instant update
- Push notifications untuk urgent tasks

---

## 8. Acceptance Criteria

- [x] PWA bisa di-install di mobile & desktop
- [x] Workflow dengan stage berantai berfungsi (tidak bisa skip stage)
- [x] Checklist di setiap stage wajib 100% sebelum lanjut
- [x] Multi-divisi dengan role-based access
- [x] Dashboard realtime update tanpa refresh
- [x] Responsive design works di mobile, tablet, desktop
- [x] Dark theme primary (sesuai color palette)
- [x] Fast loading (<3s initial load)

---

## 9. Design Inspirations (Fresh 2026)

- **Spatial depth** - Bukan 2D flat, tapi layers yang purposeful
- **Bento grid** - Layout style untuk dashboard
- **Micro-movements** - Animasi halus, tidak berlebihan
- **Bold typography** - Headlines yang confident
- **Constraint-based** - Tidak滥用 animation, setiap motion ada tujuannya