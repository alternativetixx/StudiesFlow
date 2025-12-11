# Study App Design Guidelines

## Design Approach

**Hybrid System-Based Design** inspired by:
- **Notion** (dashboard modularity, clean information architecture)
- **Linear** (sleek modern aesthetics, command-bar UX)
- **Material Design** (elevation, interactive feedback, micro-animations)

**Rationale:** This is a feature-dense productivity tool where usability and information clarity are paramount, but it must feel modern and engaging to compete with traditional study apps.

---

## Core Design Elements

### A. Typography

**Font Stack:**
- Primary: Inter (Google Fonts) - UI elements, body text, dashboard content
- Accent: Space Grotesk (Google Fonts) - headings, hero taglines, marketing copy

**Type Scale:**
- Hero headline: text-5xl md:text-6xl lg:text-7xl, font-bold
- Section headers: text-3xl md:text-4xl, font-bold
- Card titles: text-xl font-semibold
- Body text: text-base, font-normal
- Small labels/metadata: text-sm, text-xs for timestamps

### B. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 4, 6, 8, 12, 16, 20** for consistency
- Component padding: p-4, p-6, p-8
- Section spacing: gap-8, space-y-12, my-20
- Dashboard grid gaps: gap-6 (desktop), gap-4 (mobile)

**Container Widths:**
- Landing page sections: max-w-7xl mx-auto px-6
- Dashboard: Full-width with max-w-screen-2xl mx-auto
- Modals/Forms: max-w-md to max-w-2xl depending on content

**Grid Patterns:**
- Feature cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Dashboard widgets: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 (responsive Notion-style)
- Task table: Single column stack on mobile, full table on desktop

### C. Visual Treatment

**Glassmorphism Implementation:**
- Card backgrounds: backdrop-blur-xl bg-white/10 dark:bg-black/20
- Borders: border border-white/20
- Subtle shadows: shadow-xl shadow-black/5

**Neon Accent Strategy:**
- Primary CTA buttons: Vibrant gradient borders with glow effect
- Active states: Neon outline (cyan/purple/pink spectrum)
- Progress indicators: Gradient fill with shimmer animation
- Use sparingly on: Timer rings, achievement badges, streak counters

**Elevation System:**
- Base cards: shadow-lg
- Hover states: shadow-xl with subtle translate-y-[-2px]
- Modals/overlays: shadow-2xl
- Floating elements (chat bubble, shortcuts): shadow-2xl with glow

### D. Component Library

**Navigation:**
- Landing navbar: Sticky top, backdrop-blur-md, logo left, links center, CTA right
- Dashboard sidebar: Fixed left (desktop), collapsible hamburger (mobile), icon + label navigation
- Hamburger menu (post-login): Slide-in from right, profile at top, links below

**Hero Section (Landing):**
- **Image Strategy:** Animated gradient background (NO static image), overlay with mesh pattern
- Centered layout with max-w-4xl
- Headline + tagline + dual CTAs (primary + secondary)
- Countdown timer to "next exam" as attention grabber
- Viewport: 85vh to allow scroll hint

**Cards:**
- Feature cards: Rounded-2xl, glass effect, icon top, title + description, hover lift
- Dashboard widgets: Rounded-xl, consistent padding (p-6), header with actions
- Task cards: Compact, swipeable on mobile, priority indicator left border

**Forms:**
- Input fields: Rounded-lg, border-2, focus:ring-2 focus:border-accent
- Labels: text-sm font-medium, mb-2
- Buttons: Full-width on mobile, inline on desktop
- Error states: Red border + text-red-500 message below

**Interactive Elements:**
- Primary buttons: Gradient background with neon border, hover:scale-105
- Secondary buttons: Outline with hover fill
- Icon buttons: Rounded-full, hover:bg-accent/10
- Toggle switches: Smooth transition with track + thumb

**Modals:**
- Centered overlay with backdrop-blur-sm bg-black/50
- Modal content: max-w-lg, rounded-2xl, glass effect
- Close button: Top-right, circular, hover state
- Actions: Right-aligned at bottom

**Data Visualization:**
- Chart.js with custom color palette matching theme
- Progress bars: Rounded-full, gradient fill, percentage label
- Calendar view: FullCalendar with custom CSS matching glassmorphism
- Heatmap: Color-coded intensity grid

**Timers & Counters:**
- Pomodoro: Large circular SVG ring (stroke-dasharray animation)
- Countdown: Large numbers with flip animation on change
- Streak counter: Fire emoji + number with pulse on increment

**Special Components:**
- AI Chat bubble: Fixed bottom-right, rounded-full entry point, expands to card
- Sticky notes: Draggable div with resize handles, paper texture overlay
- Battle Mode: Full-screen black overlay, centered content, minimal UI
- Confetti: canvas-confetti library, triggered on achievements

### E. Responsive Breakpoints

- Mobile: < 768px (stack everything, hamburger nav, swipe gestures)
- Tablet: 768px - 1024px (2-column grids, sidebar collapses)
- Desktop: > 1024px (full layout, 3-column grids, fixed sidebar)

### F. Micro-Interactions

**Use sparingly but impactfully:**
- Button hover: Scale 102-105%, subtle shadow increase
- Card hover: Lift with shadow, border glow
- Task completion: Confetti burst + checkmark animation
- Timer start: Pulse ring once, then smooth countdown
- Achievement unlock: Full-screen confetti + badge slide-in + sound
- Tab switching: Fade content in/out (duration-200)

**Critical:** Avoid excessive animations that distract from productivity. Motion should enhance feedback, not entertain.

---

## Page-Specific Guidelines

**Landing Page:**
- 6-8 sections: Hero → Features (3-col grid) → How It Works (timeline) → Testimonials (slider) → Pricing Tease → CTA
- Testimonials: Horizontal auto-scroll carousel with user avatars
- 50k+ counter: Animated counting effect on viewport enter
- Footer: Links grid + newsletter signup + social icons

**Dashboard:**
- Top bar: Today's Focus banner (full-width, gradient background)
- Main grid: Modular widget layout (users can reorder later - future feature)
- Widgets stack on mobile, 2-3 columns on desktop
- Floating chat bubble: Always visible bottom-right
- Quick action buttons: Floating action button (FAB) menu bottom-left on mobile

**Authentication Pages:**
- Centered card on gradient background
- Form max-w-md, social proof (user count) below
- Persistent dark mode toggle top-right
- Success states: Modal with animation, not inline redirect

---

## Images

**Hero Section:** NO static image - use animated CSS gradient background with subtle mesh/grain overlay for depth.

**Feature Cards:** Icon-based (Heroicons CDN), not photos. Each feature gets a distinct icon in accent color.

**Testimonials:** Small circular avatars (80x80px) generated with initials + random gradient backgrounds (or use UI Avatars API).

**Dashboard:** No decorative images. Focus on data visualization (charts, progress bars, calendars).

**Achievements/Badges:** SVG icons or emoji (🔥⚡🏆🎯) with glow effects, not raster images.

---

## Accessibility

- Minimum contrast ratio: WCAG AA (4.5:1 for text)
- Focus indicators: 2px ring in accent color
- Keyboard navigation: Full support with visible focus states
- Screen reader labels: aria-label on icon-only buttons
- Skip to main content link for dashboard