# Luxio - Wireframe Designs

## Design Philosophy (2026 Fresh)
- **Neo-Brutalism + Spatial UI** - Bold, layered, confident
- **Dark theme primary** dengan accent colors yang vibrant
- **Typografi:** Space Grotesk (headings) + DM Sans (body)

---

## Color Palette (Implementation Reference)

```css
:root {
  --primary:      #1A1A2E;   /* Deep Navy */
  --secondary:    #16213E;   /* Dark Blue */
  --accent:       #E94560;   /* Vibrant Coral Red */
  --success:      #00D9A5;   /* Mint Green */
  --warning:      #FFB830;   /* Amber */
  --surface:      #0F0F1A;   /* Near Black */
  --surface-light:#252542;   /* Muted Purple-Gray */
  --text-primary: #FFFFFF;
  --text-muted:   #8B8BA7;
}
```

---

## 1. LAPTOP (Desktop) - 1280px+

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LUXIO                                      🔔  👤 Admin        [Logout]│
├────────────┬────────────────────────────────────────────────────────────┤
│            │  ┌─────────────────────────────────────────────────────┐   │
│  Dashboard │  │  EXECUTIVE DASHBOARD                    📊 Filters   │   │
│            │  ├─────────────────────────────────────────────────────┤   │
│  Projects  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│            │  │  │ 156      │ │ 89%      │ │ 12       │ │ 3        │  │   │
│  My Tasks  │  │  │ Tasks    │ │ Complete │ │ Active   │ │ Bottleneck│  │   │
│            │  │  │ Today    │ │ Rate     │ │ Projects │ │ Stages   │  │   │
│  Team      │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│            │  └─────────────────────────────────────────────────────┘   │
│  Analytics │  ┌──────────────────────────────┐ ┌─────────────────────┐  │
│            │  │ DIVISI PERFORMANCE           │ │ RECENT ACTIVITY     │  │
│  Settings  │  │ ┌────┬────────┬────────────┐ │ │ • John completed    │  │
│            │  │ │ Ops│ ██████ │ 95%       │ │ │   Task #123         │  │
│            │  │ │ Mkt│ ████   │ 62%       │ │ │ • Sarah started     │  │
│            │  │ │ Fin│ ██████ │ 88%       │ │ │   Stage 2: Packing  │  │
│            │  │ │ HR │ ████   │ 71%       │ │ │ • New task assigned │  │
│            │  │ └────┴────────┴────────────┘ │ │   to Marketing     │  │
│            │  └──────────────────────────────┘ └─────────────────────┘  │
│            │  ┌─────────────────────────────────────────────────────┐   │
│            │  │ ACTIVE WORKFLOWS                    [+ New Project]  │   │
│            │  │ ┌─────────────────────────────────────────────────┐ │   │
│            │  │ │ 📦 Pengiriman JNT - Jakarta    ████████░░ 80%   │ │   │
│            │  │ │ Stage: Packing → Sorting → Shipping → Delivered │ │   │
│            │  │ │ Assignee: Ahmad (Packing), Budi (Sorting)       │ │   │
│            │  │ └─────────────────────────────────────────────────┘ │   │
│            │  │ ┌─────────────────────────────────────────────────┐ │   │
│            │  │ │ 📦 Pengiriman JNE - Surabaya   ██████░░░░ 60%   │ │   │
│            │  │ │ Stage: Packing → Sorting → Shipping → Delivered │ │   │
│            │  │ │ Assignee: Cindy (Packing), Dina (Sorting)       │ │   │
│            │  │ └─────────────────────────────────────────────────┘ │   │
│            │  └─────────────────────────────────────────────────────┘   │
└────────────┴────────────────────────────────────────────────────────────┘
```

**Desktop Layout Notes:**
- Sidebar fixed di kiri (240px width)
- Content area scrollable
- Bento grid untuk dashboard cards
- 4-column stats grid di atas
- 2-column untuk charts & activity

---

## 2. TABLET - 768px to 1279px

```
┌────────────────────────────────────────────────────────┐
│  LUXIO                            🔔 👤        [Menu]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DASHBOARD                    📊 Filters         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐         │
│  │   156      │ │    89%     │ │    12      │         │
│  │   Tasks    │ │   Complete │ │   Projects │         │
│  └────────────┘ └────────────┘ └────────────┘         │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  DIVISI PERFORMANCE (Scrollable)                 │  │
│  │  Ops ████████░░ 95%   Mkt ████░░░░░░ 62%         │  │
│  │  Fin ██████░░░░ 88%   HR  ████░░░░░░ 71%         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📦 Pengiriman JNT - Jakarta      80% ✓          │  │
│  │  Packing → Sorting → Shipping → Delivered        │  │
│  │  Ahmad, Budi                              [...]   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  📦 Pengiriman JNE - Surabaya     60%            │  │
│  │  Packing → Sorting → Shipping → Delivered        │  │
│  │  Cindy, Dina                             [...]   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [Dashboard] [Projects] [My Tasks] [Team]   [+ FAB]  │
└────────────────────────────────────────────────────────┘
```

**Tablet Layout Notes:**
- Collapsible sidebar (icon-only mode)
- 3-column stats grid
- Horizontal scroll untuk divisi performance
- Bottom navigation + Floating Action Button
- Cards full-width dengan horizontal layout

---

## 3. MOBILE - < 768px

```
┌────────────────────────┐
│  LUXIO          🔔 👤  │
├────────────────────────┤
│  ┌──────────────────┐  │
│  │ Hi, Admin 👋     │  │
│  │ Here's your      │  │
│  │ overview today   │  │
│  └──────────────────┘  │
│                        │
│  ┌────┐ ┌────┐        │
│  │156 │ │89% │        │
│  │ 📋 │ │ ✅ │        │
│  └────┘ └────┘        │
│  ┌────┐ ┌────┐        │
│  │ 12 │ │ 3  │        │
│  │ 📦 │ │ ⚠️ │        │
│  └────┘ └────┘        │
│                        │
│  ── Active Workflows ─│
│                        │
│  ┌──────────────────┐  │
│  │ 📦 JNT Jakarta   │  │
│  │ ████████░░ 80%   │  │
│  │ Stage: Packing ✓ │  │
│  │ [View Details →] │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ 📦 JNE Surabaya  │  │
│  │ ██████░░░░ 60%   │  │
│  │ Stage: Sorting   │  │
│  │ [View Details →] │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │ 📦 J&T Bandung   │  │
│  │ ████░░░░░░ 40%   │  │
│  │ Stage: Packing   │  │
│  │ [View Details →] │  │
│  └──────────────────┘  │
│                        │
│  [🏠] [📋] [👥] [⚙️]  │
│       [+ New Task]     │
└────────────────────────┘
```

**Mobile Layout Notes:**
- Single column layout
- Bottom navigation (5 items max)
- Stats dalam 2x2 grid
- Card-based workflow list
- Pull-to-refresh
- FAB untuk quick add

---

## 4. Project/Workflow Detail View

### Desktop
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Projects     📦 Pengiriman JNT - Jakarta     [Edit] │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ WORKFLOW PROGRESS                                          │ │
│  │                                                            │ │
│  │  [1:Packing  ] ──► [2:Sorting ] ──► [3:Shipping] ──►[4: ] │ │
│  │     ✓✓✓           🔒 Locked          🔒 Locked    🔒Locked │ │
│  │    COMPLETE                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────┐ ┌───────────────────────────┐ │
│  │ CURRENT STAGE: PACKING      │ │ DETAILS                   │ │
│  │                             │ │ 📅 Due: 15 Jan 2026       │ │
│  │ □ Kotak kardus ukuran besar │ │ 👤 Assigned: Ahmad        │ │
│  │ □ Bubble wrap 3 lapis       │ │ 🏷️ Tags: Express, Jakarta │ │
│  │ □ Label resmi JNT           │ │ ⚡ Priority: High         │ │
│  │ □ Packing list              │ │                           │ │
│  │                             │ │ [Add Checklist Item]      │ │
│  │ [Mark as Complete]          │ │                           │ │
│  └─────────────────────────────┘ └───────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ COMMENTS & ACTIVITY                          [+ Comment]   │ │
│  │ 👤 Ahmad - 10:30 AM                                           │ │
│  │ Bubble wrap sudah tersedia, tinggal packing                 │ │
│  │                                                            │ │
│  │ 👤 Admin - 09:15 AM                                         │ │
│  │ Task assigned to Ahmad                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Key UI Components

### Status Badges
- **Completed:** Mint green (#00D9A5) + checkmark
- **In Progress:** Coral red (#E94560) + pulse animation
- **Locked:** Gray (#8B8BA7) + lock icon
- **Overdue:** Amber (#FFB830) + warning icon

### Progress Bars
- Rounded corners (8px radius)
- Gradient fill dari accent ke success
- Subtle glow effect pada active stage

### Cards
- Background: surface-light (#252542)
- Border: 1px solid rgba(255,255,255,0.05)
- Shadow: 0 4px 24px rgba(0,0,0,0.3)
- Hover: translateY(-2px) + increased shadow

### Typography Scale
- H1: 32px / Space Grotesk Bold
- H2: 24px / Space Grotesk Bold
- H3: 18px / Space Grotesk SemiBold
- Body: 14px / DM Sans Regular
- Caption: 12px / DM Sans Medium

---

## 6. Responsive Breakpoints

```css
/* Mobile First */
:root {
  --sidebar-width: 0px;   /* Hidden, bottom nav instead */
  --content-padding: 16px;
  --card-gap: 12px;
}

@media (min-width: 768px) {
  :root {
    --sidebar-width: 72px;  /* Icon only */
    --content-padding: 24px;
    --card-gap: 16px;
  }
}

@media (min-width: 1280px) {
  :root {
    --sidebar-width: 240px;  /* Full sidebar */
    --content-padding: 32px;
    --card-gap: 24px;
  }
}
```