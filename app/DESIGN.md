---
name: Sanity
colors:
  primary: "#f36458"
  secondary: "#0052ef"
  background: "#f7f7f7"
  background-canvas: "#f7f7f7"
  background-bone: "#ffffff"
  surface: "#ffffff"
  surface-card: "#ffffff"
  surface-dark: "#212121"
  surface-deep: "#0b0b0b"
  foreground: "#0b0b0b"
  ink: "#0b0b0b"
  body: "#0b0b0b"
  charcoal: "#0b0b0b"
  mute: "#b9b9b9"
  ash: "#797979"
  stone: "#b9b9b9"
  on-primary: "#ffffff"
  on-secondary: "#ffffff"
  on-background: "#0b0b0b"
  on-surface: "#0b0b0b"
  on-dark: "#ffffff"
  on-dark-mute: "#b9b9b9"
  hairline: "#ededed"
  hairline-strong: "#212121"
  divider: "#ededed"
  divider-dark: "#212121"
  hero-warm: "#f36458"
  hero-glow: "#55beff"
  hero-pink: "#e600ff"
  badge-success: "#19d600"
  badge-warning: "#f59e0b"
  badge-info: "#55beff"
  link: "#0052ef"
  ring-focus: "rgba(0, 82, 239, 0.15)"
colors-dark:
  primary: "#f36458"
  secondary: "#0052ef"
  background: "#0b0b0b"
  background-canvas: "#0b0b0b"
  background-bone: "#212121"
  surface: "#212121"
  surface-card: "#212121"
  surface-dark: "#0b0b0b"
  surface-deep: "#000000"
  foreground: "#ffffff"
  ink: "#ffffff"
  body: "#b9b9b9"
  charcoal: "#ffffff"
  mute: "#797979"
  ash: "#b9b9b9"
  stone: "#797979"
  on-primary: "#ffffff"
  on-secondary: "#ffffff"
  on-background: "#ffffff"
  on-surface: "#ffffff"
  on-dark: "#ffffff"
  on-dark-mute: "#b9b9b9"
  hairline: "#212121"
  hairline-strong: "#797979"
  divider: "#212121"
  divider-dark: "#353535"
  hero-warm: "#f36458"
  hero-glow: "#55beff"
  hero-pink: "#e600ff"
  badge-success: "#19d600"
  badge-warning: "#f59e0b"
  badge-info: "#55beff"
  link: "#55beff"
  ring-focus: "rgba(0, 82, 239, 0.3)"
typography:
  display-xl:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: 1.00
    letterSpacing: "-3.6px"
  display-lg:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-1.68px"
  heading-lg:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1.10
    letterSpacing: "-1.14px"
  heading-md:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.24
    letterSpacing: "-0.24px"
  body-lg:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "-0.18px"
  body-md:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "normal"
  body-sm:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "normal"
  button-md:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "normal"
  button-sm:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "0.5px"
  caption:
    fontFamily: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "-0.13px"
  code-md:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: "normal"
  code-sm:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: "normal"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
  section: "96px"
  band: "120px"
rounded:
  none: "0"
  xs: "3px"
  sm: "5px"
  md: "6px"
  lg: "12px"
  full: "99999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.button-md}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.button-md}"
    rounded: "{rounded.sm}"
    padding: "0px 12px"
    height: "44px"
  text-input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: "8px 12px"
    height: "44px"
  search-input:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    padding: "0px 12px"
    height: "44px"
  card-default:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "24px"
    height: "auto"
  card-feature:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.heading-md}"
    rounded: "{rounded.lg}"
    padding: "32px 48px"
    height: "auto"
  nav-bar:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.button-md}"
    rounded: "{rounded.none}"
    height: "60px"
  badge:
    backgroundColor: "{colors.background-bone}"
    textColor: "{colors.surface-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "8px"
    height: "auto"
  badge-filled:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "8px"
    height: "auto"
  modal:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "32px"
    height: "auto"
  alert:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
    height: "auto"
  progress:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    height: "8px"
  tabs:
    backgroundColor: "transparent"
    textColor: "{colors.on-dark-mute}"
    typography: "{typography.button-sm}"
    rounded: "{rounded.full}"
    height: "44px"
  checkbox:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xs}"
    height: "20px"
  radio:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    height: "20px"
---

## Overview

Sanity presents itself as a nocturnal command center — a developer-content platform rendered in dark, precise, and deeply structured tones. The entire experience sits on a near-black canvas ({colors.surface-dark}) that reads less like a "dark mode toggle" and more like the natural state of a tool built for people who live in terminals. Where most CMS marketing pages reach for friendly pastels and soft illustration, Sanity leans into the gravity of its own product: structured content deserves a structured stage.

The emotional response is one of precision engineering. Every pixel feels intentional. The typography communicates authority through tight letter-spacing and compressed display sizes. Vivid accent colors — coral-red ({colors.primary}), electric blue ({colors.secondary}), neon green ({colors.badge-success}) — punctuate an otherwise achromatic canvas with surgical precision. The signature typographic voice is Space Grotesk, a geometric sans-serif with tight negative tracking that gives headlines a compressed, engineered quality. This is paired with IBM Plex Mono ({typography.code-md.fontFamily}) for code and technical labels, creating a dual-register voice: editorial authority meets developer credibility.

**Key characteristics:**
- Near-black canvas ({colors.surface-dark}) as the default, natural environment — not a dark "mode" but the primary identity
- Space Grotesk with extreme negative tracking at display sizes, creating a precision-engineered typographic voice
- Pure achromatic gray scale — no warm or cool undertones, pure neutral discipline
- Vivid accent punctuation: coral-red ({colors.primary}), electric blue ({colors.secondary}), and neon green ({colors.badge-success}) against the dark field
- Pill-shaped primary buttons ({rounded.full}) contrasting with subtle rounded rectangles ({rounded.xs} to {rounded.md}) for secondary actions
- IBM Plex Mono as the technical counterweight to the editorial display face
- Hover states that shift to electric blue ({colors.secondary}) across all interactive elements — a consistent "activation" signal

## Colors

Sanity's palette is an exercise in controlled restraint. The achromatic grayscale forms the foundation — every neutral is a pure, untinted gray with no warm or cool bias. Against this disciplined backdrop, a small set of vivid accents lands with the impact of signal lights in a dark control room.

### Brand & Accent

The brand is anchored by a single warm accent: coral-red ({colors.primary}). This is the primary CTA color — used for "Get Started" buttons and main conversion points. It is the only warm note in an otherwise cool system. The interactive layer uses electric blue ({colors.secondary}) as a universal hover and active state across *all* interactive elements — buttons, links, inputs, and navigation items all shift to this blue on hover. This consistency creates a predictable "activation" language: if it turns blue, you can click it.

Success states use a vivid green ({colors.badge-success}). Error signals use pure red ({colors.danger}). Warning states use amber ({colors.badge-warning}). Informational accents use light blue ({colors.badge-info}).

### Surface

The surface hierarchy is communicated entirely through color shifts rather than shadows. In the default (light) mode:

| Surface Level | Color | Use |
|--------------|-------|-----|
| Canvas | {colors.background-canvas} | Page-level background |
| Bone | {colors.background-bone} | Inset surfaces, card groups |
| Surface | {colors.surface} | Default surface |
| Card | {colors.surface-card} | Card backgrounds |
| Dark | {colors.surface-dark} | Elevated dark surfaces |
| Deep | {colors.surface-deep} | Deepest footer surfaces |

In dark mode, the hierarchy inverts and compresses:

| Surface Level | Light | Dark |
|--------------|-------|------|
| Canvas | {colors.background-canvas} | {colors-dark.background-canvas} |
| Bone | {colors.background-bone} | {colors-dark.background-bone} |
| Surface | {colors.surface} | {colors-dark.surface} |
| Card | {colors.surface-card} | {colors-dark.surface-card} |
| Dark | {colors.surface-dark} | {colors-dark.surface-dark} |
| Deep | {colors.surface-deep} | {colors-dark.surface-deep} |

Borders use a precise hairline system: {colors.hairline} for subtle containment, {colors.hairline-strong} for emphasized edges, {colors.divider} for section dividers, and {colors.divider-dark} for dividers on dark surfaces.

### Text

The text hierarchy uses five distinct levels for maximum information density control:

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| Ink | {colors.ink} | {colors-dark.ink} | Primary headings, high-emphasis text |
| Body | {colors.body} | {colors-dark.body} | Long-form paragraphs, descriptions |
| Charcoal | {colors.charcoal} | {colors-dark.charcoal} | Captions, metadata |
| Ash | {colors.ash} | {colors-dark.ash} | Secondary text, timestamps |
| Stone | {colors.stone} | {colors-dark.stone} | Disabled text, placeholders |

Text on dark surfaces uses {colors.on-dark} for primary copy and {colors.on-dark-mute} for secondary copy — ensuring legibility against the near-black canvas.

### Semantic

| Role | Color | Use |
|------|-------|-----|
| Link | {colors.link} (light) / {colors-dark.link} (dark) | Inline links |
| Focus ring | {colors.ring-focus} (light) / {colors-dark.ring-focus} (dark) | Input focus, keyboard navigation |
| Hero warm | {colors.hero-warm} | Hero gradient start |
| Hero glow | {colors.hero-glow} | Hero gradient mid-point |
| Hero pink | {colors.hero-pink} | Hero gradient end |

The hero gradient ({colors.hero-warm} → {colors.hero-glow} → {colors.hero-pink}) creates a signature atmospheric band used in full-bleed hero sections. This is the one place where multiple saturated colors converge.

## Typography

### Font Family

Sanity uses a dual-register font system: **Space Grotesk** serves as both display and body typeface, while **IBM Plex Mono** handles all code and technical content.

- **Display / Body**: `{typography.body-md.fontFamily}` — A geometric sans-serif with slightly condensed proportions, ideal for tight letter-spacing at display sizes while remaining legible at body copy scale. Space Grotesk channels the precision of engineering drawings.
- **Code / Technical**: `{typography.code-md.fontFamily}` — A monospace face designed for code readability, with clear distinction between similar characters (0/O, 1/l/I). Used for code blocks, technical labels, and uppercase system readouts.
- **Fallback stack**: `ui-sans-serif, system-ui, sans-serif` for Space Grotesk; `ui-monospace, monospace` for IBM Plex Mono.

*Note: Sanity's original brand uses a custom typeface (waldenburgNormal). Space Grotesk serves as the recommended open-source substitute that best preserves the geometric, slightly condensed character. IBM Plex Mono is available on Google Fonts under the SIL Open Font License.*

### Hierarchy

| Token | Font Family | Size | Weight | Line Height | Letter Spacing | Use |
|-------|-------------|------|--------|-------------|----------------|-----|
| {typography.display-xl} | Space Grotesk | {typography.display-xl.fontSize} | {typography.display-xl.fontWeight} | {typography.display-xl.lineHeight} | {typography.display-xl.letterSpacing} | Hero headlines, maximum impact |
| {typography.display-lg} | Space Grotesk | {typography.display-lg.fontSize} | {typography.display-lg.fontWeight} | {typography.display-lg.lineHeight} | {typography.display-lg.letterSpacing} | Large section headers |
| {typography.heading-lg} | Space Grotesk | {typography.heading-lg.fontSize} | {typography.heading-lg.fontWeight} | {typography.heading-lg.lineHeight} | {typography.heading-lg.letterSpacing} | Primary section anchors |
| {typography.heading-md} | Space Grotesk | {typography.heading-md.fontSize} | {typography.heading-md.fontWeight} | {typography.heading-md.lineHeight} | {typography.heading-md.letterSpacing} | Card titles, subsection headers |
| {typography.body-lg} | Space Grotesk | {typography.body-lg.fontSize} | {typography.body-lg.fontWeight} | {typography.body-lg.lineHeight} | {typography.body-lg.letterSpacing} | Intro paragraphs, feature descriptions |
| {typography.body-md} | Space Grotesk | {typography.body-md.fontSize} | {typography.body-md.fontWeight} | {typography.body-md.lineHeight} | {typography.body-md.letterSpacing} | Standard body text |
| {typography.body-sm} | Space Grotesk | {typography.body-sm.fontSize} | {typography.body-sm.fontWeight} | {typography.body-sm.lineHeight} | {typography.body-sm.letterSpacing} | Compact body text |
| {typography.button-md} | Space Grotesk | {typography.button-md.fontSize} | {typography.button-md.fontWeight} | {typography.button-md.lineHeight} | {typography.button-md.letterSpacing} | Button labels, interactive text |
| {typography.button-sm} | IBM Plex Mono | {typography.button-sm.fontSize} | {typography.button-sm.fontWeight} | {typography.button-sm.lineHeight} | {typography.button-sm.letterSpacing} | Uppercase labels, tab navigation, filter controls |
| {typography.caption} | Space Grotesk | {typography.caption.fontSize} | {typography.caption.fontWeight} | {typography.caption.lineHeight} | {typography.caption.letterSpacing} | Metadata, descriptions, tags |
| {typography.code-md} | IBM Plex Mono | {typography.code-md.fontSize} | {typography.code-md.fontWeight} | {typography.code-md.lineHeight} | {typography.code-md.letterSpacing} | Code blocks, technical content |
| {typography.code-sm} | IBM Plex Mono | {typography.code-sm.fontSize} | {typography.code-sm.fontWeight} | {typography.code-sm.lineHeight} | {typography.code-sm.letterSpacing} | Inline code, small technical labels |

### Principles

- **Extreme negative tracking at scale**: Display headings at {typography.display-lg.fontSize}+ use aggressive negative letter-spacing ({typography.display-xl.letterSpacing}), creating a tight, engineered quality that distinguishes Sanity from looser editorial typography.
- **Single font, multiple registers**: Space Grotesk handles both editorial display and functional UI text. The weight range is narrow (400–600), keeping the voice consistent.
- **Tight headings, relaxed body**: Headings use {typography.display-xl.lineHeight}–{typography.heading-md.lineHeight} line-height (extremely tight), while body text breathes at {typography.body-md.lineHeight}. This contrast creates clear visual hierarchy.
- **Uppercase for technical labels**: {typography.button-sm} uses IBM Plex Mono with `text-transform: uppercase` and tight line-heights, creating a "system readout" aesthetic for technical metadata.

### Note on Font Substitutes

When Space Grotesk is unavailable, `ui-sans-serif, system-ui, sans-serif` provides an adequate system-native fallback. The key characteristic to preserve is the geometric, slightly condensed letterform structure — avoid rounded or humanist sans-serif substitutes (e.g., Nunito, Lato). Inter is an acceptable substitute that maintains the precise, engineering-grade aesthetic. IBM Plex Mono is freely available on Google Fonts and should be loaded explicitly for code contexts.

## Layout & Spacing

Sanity's spacing system is built on an 8px base unit. The semantic spacing scale maps functional spacing needs to consistent values:

| Token | Value | Use |
|-------|-------|-----|
| {spacing.xxs} | {spacing.xxs} | Hairline gaps, micro internal padding |
| {spacing.xs} | {spacing.xs} | Tight component internal spacing |
| {spacing.sm} | {spacing.sm} | Base unit — button padding, input padding, badge padding |
| {spacing.md} | {spacing.md} | Standard component gap, button horizontal padding |
| {spacing.lg} | {spacing.lg} | Section internal padding, card spacing |
| {spacing.xl} | {spacing.xl} | Large component padding, card internal spacing |
| {spacing.xxl} | {spacing.xxl} | Section padding, container gutters |
| {spacing.xxxl} | {spacing.xxxl} | Large section vertical spacing |
| {spacing.section} | {spacing.section} | Hero vertical padding, major section breaks |
| {spacing.band} | {spacing.band} | Maximum section separation |

**Grid & Container:**
- Max content width: ~1440px
- Page gutter: {spacing.xxl} on desktop, {spacing.lg} on mobile
- Content sections use full-bleed backgrounds with centered, max-width content
- Multi-column layouts: 2–3 columns on desktop, single column on mobile
- Card grids: CSS Grid with consistent gaps of {spacing.xl}–{spacing.lg}

**Whitespace Philosophy:**
Sanity uses aggressive vertical spacing between sections ({spacing.xxxl}–{spacing.section}) to create breathing room on the dark canvas. Within sections, spacing is tighter ({spacing.lg}–{spacing.xl}), creating dense information clusters separated by generous voids. This rhythm gives the page a "slides" quality — each section feels like its own focused frame.

## Elevation & Depth

Sanity's depth system is almost entirely **colorimetric** rather than shadow-based. Elevation is communicated through surface color shifts: {colors.surface-dark} (ground) → {colors.surface} (elevated) → {colors.surface-card} (prominent) → {colors.background-bone} (inverted/highest). This approach is native to dark interfaces where traditional drop shadows would be invisible.

### Level Table

| Level | Light Treatment | Dark Treatment | Use Case |
|-------|----------------|----------------|----------|
| Level 0 | {elevation.level0} | {elevation.level0} | Default state — dark surfaces create depth through color alone |
| Level 1 | `{elevation.level1}` (light) | `0 0 0 1px #212121` (dark) | Subtle containment, border-like shadow for minimal separation |
| Level 2 | `{elevation.level2}` (light) | `0 0 0 2px rgba(0, 82, 239, 0.2)` (dark) | Focus rings, interactive feedback, elevated elements |
| Level 3 | `{elevation.level3}` (light) | `0 0 0 1px #353535, 0 8px 32px rgba(0,0,0,0.4)` (dark) | Modals, dropdowns, overlays |

Border-based containment (1px solid {colors.hairline} or {colors.hairline-strong}) serves as the primary spatial separator, with the border darkness calibrated to be visible but not dominant. The system avoids "floating card" aesthetics — everything feels mounted to the surface rather than hovering above it.

### Decorative Depth

Full-bleed hero sections use a gradient band spanning {colors.hero-warm} → {colors.hero-glow} → {colors.hero-pink} as an atmospheric backdrop. This gradient is the one decorative element that breaks the achromatic discipline — a controlled moment of visual richness reserved for brand storytelling sections. Dark overlay surfaces use `rgba(0, 0, 0, 0.4)` (light) / `rgba(0, 0, 0, 0.7)` (dark) for modal scrims and backdrop treatments.

## Shapes

### Border Radius Scale

Sanity's shape language uses a deliberately limited radius scale that jumps from subtle rounding to full pill with no intermediate values between 12px and 99999px:

| Token | Value | Use Case |
|-------|-------|----------|
| {rounded.none} | {rounded.none} | Hero bands, full-bleed sections, nav bars |
| {rounded.xs} | {rounded.xs} | Inputs, textareas, search fields, subtle rounding |
| {rounded.sm} | {rounded.sm} | Ghost buttons, small cards, secondary interactions |
| {rounded.md} | {rounded.md} | Standard cards, containers, modals, alerts |
| {rounded.lg} | {rounded.lg} | Large cards, feature containers, form wrappers |
| {rounded.full} | {rounded.full} | Primary buttons, badges, pills, tabs, progress bars, avatars |

**The Pill Gap Principle:** Sanity deliberately avoids rounded corners between 13px and 99998px. The system jumps directly from {rounded.lg} (large cards) to {rounded.full} (pill shape). This creates a clear binary: either you have geometrically precise corners ({rounded.xs}–{rounded.lg}) or you are fully pill-shaped ({rounded.full}). There is no ambiguous middle ground.

### Photography Geometry

- **Card thumbnails**: 16:9 aspect ratio, {rounded.md} corners, full-bleed within card container
- **Hero imagery**: 21:9 or full-bleed edge-to-edge, {rounded.none} corners
- **Contributor avatars**: Circular ({rounded.full}), 40–48px
- **Logo lockups**: Intrinsic aspect ratio, {rounded.none}
- **Screenshots / code samples**: {rounded.md} corners with 1px {colors.hairline} border, full-width within content column
- **Image behavior**: Responsive with `max-width: 100%`, automatic height, no forced aspect ratios below 768px viewport

## Components

Components are grouped by functional category. Each spec follows the format: Background color, text color, typography token, border radius, padding, and height.

### Buttons & Interaction

**Button Primary (CTA Pill)**
- Background {colors.primary}, text {colors.on-primary}, type {typography.button-md}
- Rounded: {rounded.full}, padding {spacing.sm} {spacing.lg}, height 44px
- *Hover*: Background shifts to {colors.secondary} (electric blue), text remains {colors.on-primary}
- *Active/Pressed*: Background shifts to the active shade of {colors.secondary}
- *Disabled*: Opacity 0.4, no hover effect

**Button Secondary (Dark Pill)**
- Background {colors.surface-dark}, text {colors.on-dark-mute}, type {typography.button-md}
- Rounded: {rounded.full}, padding {spacing.sm} {spacing.md}, height 44px
- *Hover*: Background shifts to {colors.secondary}, text shifts to {colors.on-primary}
- *Active/Pressed*: Background active shade of {colors.secondary}

**Button Ghost (Subtle)**
- Background {colors.surface-dark}, text {colors.on-dark-mute}, type {typography.button-md}
- Rounded: {rounded.sm}, padding 0 {spacing.md}, height 44px
- *Hover*: Background shifts to {colors.secondary}, text shifts to {colors.on-primary}
- *Active*: Background active shade of {colors.secondary}

**Outlined Button**
- Background {colors.background-bone}, text {colors.surface-deep}, type {typography.button-md}
- Rounded: {rounded.full}, padding {spacing.sm}, height 44px
- Border: 1px solid {colors.surface-deep}
- *Hover*: Background shifts to {colors.secondary}, text shifts to {colors.on-primary}

### Inputs & Selection

**Text Input / Textarea**
- Background {colors.surface-dark}, text {colors.on-dark-mute}, type {typography.body-md}
- Rounded: {rounded.xs}, padding {spacing.sm} {spacing.md}, height 44px
- Border: 1px solid {colors.hairline}
- *Focus*: Ring {colors.ring-focus} at 2px width, background shifts subtly
- *Placeholder*: Color {colors.ash}
- *Disabled*: Opacity 0.4

**Search Input**
- Background {colors.surface-dark}, text {colors.on-dark-mute}, type {typography.body-md}
- Rounded: {rounded.xs}, padding 0 {spacing.md}, height 44px
- *Focus*: Same ring treatment as text input

**Checkbox**
- Background {colors.surface-dark}, text {colors.on-dark}, type {typography.body-md}
- Rounded: {rounded.xs} (square with micro rounding), height 20px
- Shape: {shape.checkbox} (square)
- *Checked*: Background {colors.secondary}
- *Focus*: {colors.ring-focus} ring

**Radio**
- Background {colors.surface-dark}, text {colors.on-dark}, type {typography.body-md}
- Rounded: {rounded.full} (circular), height 20px
- Shape: {shape.radio} (circle)
- *Checked*: Inner dot in {colors.secondary}
- *Focus*: {colors.ring-focus} ring

**Switch**
- Rounded: {rounded.full} (pill track), height 24px
- Track background: {colors.mute}
- *Checked track*: {colors.secondary}
- *Thumb*: {colors.background-bone}

### Chips & Controls

**Badge (Neutral Subtle)**
- Background {colors.background-bone}, text {colors.surface-dark}, type {typography.caption}
- Rounded: {rounded.full}, padding {spacing.sm}, height auto
- Shape: {shape.badge} (pill)

**Badge (Neutral Filled)**
- Background {colors.surface-dark}, text {colors.on-dark}, type {typography.caption}
- Rounded: {rounded.full}, padding {spacing.sm}, height auto

**Badge (Success / Warning / Info)**
- Background {colors.badge-success} / {colors.badge-warning} / {colors.badge-info}, text {colors.on-dark}, type {typography.caption}
- Rounded: {rounded.full}, padding {spacing.xs} {spacing.sm}, height auto

**Tabs**
- Background transparent, text {colors.on-dark-mute}, type {typography.button-sm}
- Rounded: {rounded.full}, height 44px
- *Active tab*: Background {colors.secondary}, text {colors.on-primary}
- Shape: {shape.tabs} (pill)

### Data & Containers

**Card (Default)**
- Background {colors.surface-card}, text {colors.on-dark}, type {typography.body-md}
- Rounded: {rounded.md}, padding {spacing.xl}, height auto
- Border: 1px solid {colors.hairline}

**Card (Feature / Large)**
- Background {colors.surface-dark}, text {colors.on-dark}, type {typography.heading-md}
- Rounded: {rounded.lg}, padding {spacing.xxl} {spacing.xxxl}, height auto
- Border: none or 1px solid {colors.hairline}

**Modal**
- Background {colors.surface-dark}, text {colors.on-dark}, type {typography.body-md}
- Rounded: {rounded.md}, padding {spacing.xxl}, height auto
- Shape: {shape.modal} (rounded)
- *Overlay*: {colors.surface-deep} at 60% opacity

**Table**
- Background transparent, text {colors.on-dark-mute}, type {typography.body-sm}
- Rounded: {rounded.none}, cell padding {spacing.md}
- *Header*: {typography.button-sm} uppercase, text {colors.ash}
- *Row hover*: Background shift to {colors.surface}
- *Border*: 1px solid {colors.hairline} between rows

### Feedback Components

**Alert (Info / Success / Warning / Danger)**
- Background {colors.surface-card}, text {colors.on-dark}, type {typography.body-md}
- Rounded: {rounded.md}, padding {spacing.lg}, height auto
- Shape: {shape.alert} (rounded)
- *Left accent border*: {colors.badge-info} / {colors.badge-success} / {colors.badge-warning} / {colors.danger} at 3px width

**Tooltip**
- Background {colors.surface-deep}, text {colors.on-dark}, type {typography.caption}
- Rounded: {rounded.sm}, padding {spacing.xs} {spacing.sm}
- Z-index: {zIndex.tooltip} (600)

**Progress Bar**
- Background {colors.surface}, fill {colors.primary}, type {typography.caption}
- Rounded: {rounded.full}, height 8px
- Shape: {shape.progress} (pill)

### Navigation

**Navigation Bar (Top)**
- Background {colors.surface-dark}, text {colors.on-dark-mute}, type {typography.button-md}
- Rounded: {rounded.none}, height 60px
- *Link hover*: Text shifts to {colors.secondary}
- Bottom border: 1px solid {colors.hairline}
- *Logo*: Left-aligned, brand wordmark in {colors.on-dark}
- *CTA button*: Right-aligned {component.button-primary}

**Dropdown / Menu**
- Background {colors.surface-card}, text {colors.on-dark-mute}, type {typography.body-md}
- Rounded: {rounded.md}, padding {spacing.sm} 0
- *Item hover*: Background {colors.secondary}, text {colors.on-primary}
- Z-index: {zIndex.dropdown} (100)

**Footer**
- Background {colors.surface-deep}, text {colors.on-dark-mute}, type {typography.body-sm}
- Rounded: {rounded.none}
- *Section headers*: {typography.button-sm} uppercase, text {colors.on-dark}
- *Link hover*: Text shifts to {colors.secondary}

## Do's and Don'ts

### Do

- Use the achromatic gray scale as the foundation — maintain pure neutral discipline with no warm or cool tinting
- Apply electric blue ({colors.secondary}) consistently as the universal hover/active state across all interactive elements
- Use extreme negative letter-spacing ({typography.display-xl.letterSpacing}) on display headings {typography.display-lg.fontSize} and above
- Keep primary CTAs as full-pill shapes ({rounded.full}) with coral-red ({colors.primary})
- Use IBM Plex Mono uppercase ({typography.button-sm}) for technical labels, tags, and system metadata
- Communicate depth through surface color (dark-to-light) rather than shadows
- Maintain generous vertical section spacing ({spacing.xxxl}–{spacing.section}) on the dark canvas
- Keep the {rounded.full} pill reserved for primary buttons, badges, and tabs — never use it for cards or containers

### Don't

- Don't introduce warm or cool color tints to the neutral scale — Sanity's grays are pure achromatic
- Don't use drop shadows for elevation — dark interfaces demand colorimetric depth
- Don't apply border-radius between {rounded.lg} and {rounded.full} — the system jumps from 12px directly to 99999px
- Don't mix the coral-red CTA ({colors.primary}) with the electric blue interactive color ({colors.secondary}) in the same element
- Don't use heavy font weights (700+) — the system maxes out at 600 and only for {typography.button-sm} (11px uppercase) labels
- Don't place light text on light surfaces or dark text on dark surfaces without checking the gray-on-gray contrast ratio
- Don't use traditional offset box-shadows — ring shadows (`0 0 0 Npx`) or border-based containment only
- Don't break the tight line-height on headings — {typography.display-xl.lineHeight}–{typography.heading-md.lineHeight} is the range, never go to 1.5+ for display text

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop XL | >= 1640px | Full layout, maximum content width (~1440px) |
| Desktop | >= 1440px | Standard desktop layout |
| Desktop Compact | >= 1200px | Slightly condensed desktop, reduced column gaps |
| Laptop | >= 1100px | Reduced column widths, smaller card grids |
| Tablet Landscape | >= 960px | 2-column layouts begin collapsing to single column |
| Tablet | >= 768px | Transition zone, navigation collapses, elements stack |
| Mobile Large | >= 720px | Near-tablet layout, reduced section spacing |
| Mobile | >= 480px | Single-column, stacked layout, compact padding |
| Mobile Small | >= 376px | Minimum supported width, tight gutters |

### Touch Targets

All interactive elements maintain a minimum touch target of 44px — this applies to buttons, input fields, tabs, chips, and links in navigation. On mobile (below 768px), chip and badge padding increases by {spacing.xs} to ensure comfortable tap areas. Ghost buttons maintain their 44px height but reduce horizontal padding to {spacing.sm}.

### Collapsing Strategy

- **Navigation**: Horizontal links collapse to hamburger menu below 768px; backdrop blur persists on mobile
- **Hero typography**: Scales from {typography.display-xl.fontSize} → {typography.display-lg.fontSize} → {typography.heading-lg.fontSize} across breakpoints, maintaining tight letter-spacing ratios
- **Grid layouts**: 3-column → 2-column at ~960px, single-column below 768px
- **Card grids**: Horizontal scrolling on mobile instead of wrapping (preserving card aspect ratios)
- **Section spacing**: Vertical padding reduces by approximately 40% on mobile ({spacing.section} → {spacing.xxxl} → {spacing.xxl})
- **Button sizing**: CTA pills maintain padding but reduce font size; ghost buttons stay fixed
- **Code blocks**: Horizontal scroll with preserved monospace formatting

### Image Behavior

- Images use `max-width: 100%` with automatic height calculation
- Card thumbnails use fixed 16:9 aspect ratio above 768px; switch to full-width with auto-height below
- Hero imagery uses full-bleed with `object-fit: cover` for desktop; `object-fit: contain` may be used on mobile to prevent cropping
- High-DPI (2x/3x) assets are served for retina displays; SVG preferred for icons and logos
- Gradient hero treatments scale fluidly with viewport — the {colors.hero-warm} → {colors.hero-glow} → {colors.hero-pink} band repositions but never collapses

## Iteration Guide

1. **Start dark**: Begin with {colors.surface-dark} background, {colors.on-dark} primary text, {colors.on-dark-mute} secondary text. This is the natural state of the system — light mode is the variant, not the default.
2. **Add structure**: Use {colors.surface} surfaces and {colors.hairline} borders for containment — no shadows. Depth comes from color, not offset shadows.
3. **Apply typography**: Space Grotesk with tight letter-spacing on headings ({typography.display-xl.letterSpacing}–{typography.heading-md.letterSpacing}), {typography.body-md.lineHeight} line-height on body. Use {typography.button-sm} for uppercase technical labels.
4. **Color punctuation**: Add {colors.primary} for CTAs and {colors.secondary} for all hover/interactive states. The coral-red and electric blue are the only saturated colors — use them sparingly.
5. **Refine spacing**: {spacing.sm} base unit, {spacing.xl}–{spacing.xxl} within sections, {spacing.xxxl}–{spacing.section} between sections. Maintain generous vertical rhythm.
6. **Technical details**: Add IBM Plex Mono uppercase labels ({typography.button-sm}) for tags, metadata, and system readouts. Set `text-transform: uppercase` with {typography.button-sm.letterSpacing} letter-spacing.
7. **Polish**: Ensure all interactive elements hover to {colors.secondary}, all primary buttons are pills ({rounded.full}), ghost/secondary buttons use {rounded.sm}, and borders are hairline (1px).
8. **Validate dark mode**: Check that every color token has a corresponding dark mode value. Verify the surface hierarchy compresses correctly ({colors.surface-dark} ground → {colors.surface-card} elevated).
9. **Test contrast**: Ensure {colors.on-dark-mute} against {colors.surface-dark} meets WCAG AA for body text. Test {colors.on-dark} against all surface levels.
10. **Review component specs**: Confirm every component uses the spec format (Background `{token}`, text `{token}`, type `{typography.token}`, rounded: `{token}`, padding Xpx, height Xpx).

## Known Gaps

- **Pressed/active variants**: Only button-primary has a dedicated pressed variant documented. Other interactive components (badges, tabs, cards) lack explicit pressed/active state documentation beyond the shared "hover to {colors.secondary}" rule.
- **Focus-ring only components**: Several components (checkbox, radio, switch) rely on the shared {colors.ring-focus} ring for keyboard focus but lack explicit disabled, error, and read-only state documentation.
- **Dark mode card elevation**: The shift from {elevation.level1} (light, `0 1px 3px rgba(0,0,0,0.08)`) to dark mode's border-based depth (equivalent to {colors.hairline}) changes the visual language from shadow-based to border-based — this transition is documented at the token level but not validated across all component surfaces.
- **Footer component**: The footer is partially described (background {colors.surface-deep}, link behavior) but lacks full component spec with padding, typography for all link levels, and responsive collapsing behavior.
- **Table component**: Column type variations (numeric, text, image) and sort-state styling are not documented. Responsive table behavior (horizontal scroll vs. card-format on mobile) is not specified.
- **Tooltip positioning**: Tooltip arrow/direction variants and trigger behaviors (hover vs. click vs. focus) are not documented.
- **Animation durations**: While {animation.duration.fast} (150ms), {animation.duration.normal} (200ms), {animation.duration.slow} (300ms), and {animation.duration.slower} (500ms) are defined, no per-component animation or transition specifications exist.
- **Auth-gated surfaces**: Pages and component variants behind authentication (logged-in dashboard, content editor, settings panels) are not extracted or documented.
