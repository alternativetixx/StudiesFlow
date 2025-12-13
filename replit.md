# StudyFlow - AI-Powered Study Management Platform

## Overview

StudyFlow is a comprehensive study management and productivity application designed to help students organize their academic workflow, track progress, and stay motivated. The platform combines task management, exam tracking, AI-powered study assistance, Pomodoro timers, flashcards, and gamification features into a unified dashboard experience inspired by modern productivity tools like Notion and Linear.

**Core Value Proposition**: "The Only Study App That Feels Like Cheating (Legally)" - A feature-rich productivity tool that makes studying engaging through AI assistance, beautiful visualizations, and reward-based motivation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**:
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state, React hooks for local state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite

**Design System Philosophy**:
The application implements a hybrid design approach combining:
- Notion-style dashboard modularity and clean information architecture
- Linear-inspired sleek aesthetics and command-bar UX patterns
- Material Design elevation and micro-animation principles

**Key Design Decisions**:
- **Glassmorphism**: Cards use `backdrop-blur-xl bg-white/10 dark:bg-black/20` for modern visual treatment
- **Typography**: Inter for UI/body text, Space Grotesk for headings/marketing
- **Spacing**: Standardized Tailwind units (2, 4, 6, 8, 12, 16, 20) for consistency
- **Responsive Grid**: Mobile-first with breakpoints (md, lg, xl) for dashboard widgets

**Component Organization**:
- `/client/src/components/ui/` - Reusable shadcn components (buttons, cards, dialogs, forms, etc.)
- `/client/src/pages/` - Route-level page components (landing, login, signup, setup, dashboard)
- `/client/src/hooks/` - Custom React hooks (auth, mobile detection, toast notifications)
- `/client/src/lib/` - Utility functions (auth, database operations, query client)

### Backend Architecture

**Server Framework**: Express.js with TypeScript
- Full REST API with comprehensive endpoints for all features
- PostgreSQL database with Drizzle ORM for data persistence
- Session-based authentication with bcrypt password hashing

**Key Architectural Choices**:

1. **Server-Side Data Storage**: 
   - Uses PostgreSQL database via Drizzle ORM
   - All data persisted on server, synced across devices
   - Implementation: `/server/storage.ts` contains all CRUD operations

2. **Authentication Strategy**:
   - Server-side session management with express-session
   - Passwords hashed with bcrypt before storage
   - Session tokens stored in localStorage for API requests
   - Implementation: `/client/src/lib/api.ts` handles all API calls with auth headers

3. **API Endpoints**:
   - `/api/auth/*` - Authentication (login, signup, logout, profile)
   - `/api/subjects/*` - Subject CRUD operations
   - `/api/exams/*` - Exam management
   - `/api/tasks/*` - Task management with priority and status
   - `/api/notes/*` - Collaborative notes with sharing (viewer/commenter/editor roles)
   - `/api/calendar/*` - Calendar events with sharing and reminders
   - `/api/notifications/*` - Notification system for shares, reminders, due dates
   - `/api/flashcards/*` - Spaced repetition flashcards
   - `/api/sticky-notes/*` - Quick personal notes
   - `/api/journal/*` - Study journal with mood tracking
   - `/api/rewards/*` - Gamification rewards
   - `/api/ai/chat` - Gemini AI integration for study assistance
   - `/api/stats/*` - User statistics (streak, focus time, tasks completed)

**Build System**:
- Development: Vite dev server with HMR
- Production: esbuild bundles server code, Vite bundles client code
- Server dependencies selectively bundled (allowlist in `script/build.ts`) to optimize cold start performance

### Data Model

The application uses Zod schemas for validation (`shared/schema.ts`) with the following core entities:

**Primary Entities**:
- **User**: Basic profile (name, email, password, premium status, setup completion)
- **Subject**: Academic subjects with color coding, progress tracking, Google Drive integration
- **Exam**: Exam tracking with dates, confidence meters, subject association
- **Task**: Todo items with priority, due dates, tags, subject categorization
- **ScheduleBlock**: Weekly schedule time blocks with drag-and-drop support
- **StickyNote**: Persistent notes with position and color customization
- **Flashcard**: Spaced repetition system using Leitner algorithm
- **JournalEntry**: Study journal with mood tracking
- **Reward**: Custom reward goals with progress tracking
- **Quiz**: AI-generated practice quizzes
- **AIMessage**: Chat history with daily message limits

**Metadata Entities**:
- **UserStats**: Gamification data (streaks, study hours, achievements)
- **PomodoroSettings**: Customizable timer intervals
- **AppPreferences**: Dark mode, notification settings, etc.

**Schema Definition Approach**:
- Zod for runtime validation and type inference
- TypeScript types derived from Zod schemas (`z.infer<typeof schema>`)
- Insert types exclude auto-generated fields (id, timestamps)

### Authentication & Authorization

**Authentication Flow**:
1. User signs up → creates entry in IndexedDB users table
2. User ID stored in localStorage as auth token
3. All subsequent requests check localStorage for valid user ID
4. No password reset functionality (intentionally disabled per requirements)

**Account Management**:
- Profile editing (name updates)
- Account deletion requires email confirmation
- Premium upgrade via mailto link (no payment processing)
- Logout clears localStorage token

**Security Considerations**:
- This is a demo/development implementation
- Production deployment would require:
  - Server-side authentication with proper password hashing
  - JWT or session-based auth
  - HTTPS enforcement
  - CSRF protection

### AI Integration

**Provider**: Google Gemini (gemini-2.5-flash)
**Implementation**: `/server/routes.ts` - POST endpoint with user context

**AI Study Assistant Features**:
- Concept explanations with access to user's subjects
- Personalized quiz generation based on user's flashcards
- Study plan creation using calendar and task data
- Context-aware assistance with access to notes, analytics, and progress
- Motivational support based on streak and study time data

**User Context Integration**:
The AI has access to:
- User's subjects and topics
- Pending tasks and calendar events
- Flashcard collections
- Study streak and focus time statistics
- Notes content for context-aware help

**System Prompt Design**:
The AI is configured as "StudyFlow AI" with specific instructions to:
- Provide concise, student-friendly explanations
- Generate practical study resources
- Personalize responses using user's actual data
- Maintain encouraging tone
- Help organize tasks and calendar

## External Dependencies

### Third-Party UI Libraries

- **Radix UI**: Headless component primitives (dialogs, dropdowns, tooltips, etc.) - provides accessibility and interaction patterns
- **shadcn/ui**: Pre-built styled components wrapping Radix primitives
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Variant-based component styling utility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

### State Management & Data Fetching

- **TanStack Query (React Query)**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation and type inference
- **@hookform/resolvers**: Zod integration for React Hook Form

### Development Tools

- **Vite**: Build tool and dev server
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production server code
- **Wouter**: Lightweight routing library (~1.2kb)

### Backend Dependencies

- **Express**: Web server framework
- **OpenAI SDK**: GPT model integration for AI assistant
- **Drizzle Kit**: Database migration tool (configured for PostgreSQL but currently using IndexedDB)
- **Drizzle ORM**: TypeScript ORM (scaffolded but not actively used)
- **connect-pg-simple**: PostgreSQL session store (scaffolded for future use)

### Utility Libraries

- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation
- **clsx/twMerge**: Conditional className utilities
- **embla-carousel-react**: Carousel/slider component for testimonials

### Database & Persistence

**Current**: PostgreSQL with Drizzle ORM
- Full relational database with proper schema
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe database operations
- Schema defined in `shared/schema.ts` with full types

**Database Schema**:
- `users` - User accounts with authentication and stats
- `subjects` - Academic subjects with progress tracking
- `exams` - Exam tracking with confidence levels
- `tasks` - Tasks with priority, status, due dates
- `notes` - Collaborative notes with rich content
- `note_shares` - Note sharing with role-based access
- `note_comments` - Comments on shared notes
- `calendar_events` - Events, tasks, reminders with sharing
- `event_shares` - Calendar sharing invitations
- `notifications` - System notifications
- `flashcards` - Spaced repetition cards
- `sticky_notes` - Quick personal notes
- `journal_entries` - Mood and study journal
- `rewards` - Gamification rewards
- `ai_messages` - AI conversation history

### External Services

- **Gemini API**: Requires `GEMINI_API_KEY` environment variable for GEMINI access
- **Google Fonts**: Inter and Space Grotesk font families loaded via CDN
- **Google Drive**: Users manually link folder URLs (no API integration, just hyperlinks)

### Replit-Specific Integrations

- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Code navigation helper
- `@replit/vite-plugin-dev-banner`: Development mode indicator

**Note**: These plugins are conditionally loaded only in Replit development environment (`process.env.REPL_ID` check in `vite.config.ts`).