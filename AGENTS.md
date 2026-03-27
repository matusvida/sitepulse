# SitePulse Frontend — Agent Guidelines

## Project Overview

Next.js 16 (App Router) frontend for a construction site monitoring platform. Displays timelapse imagery, before/after comparisons, AI-generated progress reports, and construction plan milestone tracking.

## Tech Stack

- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4 (no component library — custom UI primitives in `src/components/ui/`)
- Recharts for data visualization
- Lucide React for icons
- react-markdown for rendering AI reports

## Architecture

- **App Router** — all pages under `src/app/dashboard/` with nested layouts
- **API client** — `src/lib/api.ts` contains all backend calls. Uses a `get`/`post`/`patch` wrapper around `fetch`. Falls back to mock data from `src/lib/mock-data.ts` when the backend is unreachable.
- **Data fetching** — `src/lib/use-api.ts` exports a `useApi` hook (loading/error/refetch). All pages use this, not SWR or React Query.
- **Project context** — `src/lib/project-context.tsx` provides `useProject()` with `currentProject` and multi-project switching.
- **Types** — `src/lib/types.ts` is the single source of truth for all TypeScript interfaces.

## Key Conventions

- All components are client components (`"use client"`) since the app relies on browser state and API calls.
- The backend returns **camelCase JSON** — TypeScript interfaces match the API response directly, no transformation needed.
- UI primitives (`Card`, `Badge`, `Button`, `Select`, `Input`, `Modal`, `Toggle`, `Tabs`) are in `src/components/ui/`. Use these instead of creating new ones.
- `cn()` from `src/lib/utils.ts` is the class merging utility (simple `filter(Boolean).join(" ")`, not clsx).
- Image URLs are constructed via `snapshotUrl(projectId, date)` from `api.ts` — these proxy through the backend which streams JPEG bytes from MinIO.

## File Layout

```
src/
  app/dashboard/           # All dashboard pages
    layout.tsx             # AppShell wrapper
    page.tsx               # Overview
    progress/
      layout.tsx           # Sub-nav (Charts, Timeline, Compare)
      page.tsx             # Charts
      timeline/page.tsx    # Timelapse viewer
      compare/page.tsx     # Before/after comparison
    plan/page.tsx          # Plan upload + milestones
    alerts/page.tsx        # Alert management
    reports/page.tsx       # AI report generation
    settings/page.tsx      # Project settings
    activity/page.tsx      # Hidden from nav, kept for future use
  components/
    layout/                # App shell, sidebar, top nav
    ui/                    # Reusable primitives
    charts/                # Recharts wrapper
  lib/
    api.ts                 # API client (all endpoints)
    types.ts               # All TypeScript interfaces
    use-api.ts             # Data fetching hook
    project-context.tsx    # Project provider
    mock-data.ts           # Fallback data
    utils.ts               # cn(), formatDate(), timeAgo()
```

## Coding Rules

- Do not add new UI libraries. Use existing primitives in `src/components/ui/`.
- Keep pages as single files — do not split a page into multiple component files unless a component is shared across pages.
- Use `useCallback` and `useMemo` for handlers and derived data in pages with heavy re-renders (timeline, compare).
- API functions should catch errors and return fallback data where possible, not crash the page.
- Navigation uses Next.js `<Link>` — never use `<a>` tags for internal routes.
- The Progress section uses a shared layout (`progress/layout.tsx`) with persistent sub-navigation tabs. Do not duplicate the heading or tabs inside page components.
- Sidebar navigation items are defined in `src/components/layout/sidebar.tsx`. The Activity page is intentionally hidden from the nav.

## Backend API

The backend runs at `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL`). All endpoints are prefixed with `/api/projects/{projectId}/`. See `src/lib/api.ts` for the full list of available functions. When adding a new backend call, add it to `api.ts` and add any new types to `types.ts`.

## Do Not

- Do not use `getServerSideProps` or server actions — this is a fully client-rendered SPA behind the dashboard layout.
- Do not import from `react-dom/server`.
- Do not add state management libraries (Redux, Zustand). The `useProject` context + `useApi` hook pattern is sufficient.
- Do not modify `globals.css` for component-specific styles. Use Tailwind classes.
- Do not store secrets or API keys in the frontend. All LLM/storage calls go through the backend.
