# UX Redesign Plan

## Phase 1: Shell And Navigation

1. Refactor the dashboard shell in `src/components/layout/app-shell.tsx` and `src/components/layout/top-nav.tsx` to establish a stronger visual frame.
2. Add a proper footer/status area with help, last sync/system state, and secondary links so pages do not end abruptly.
3. Add project switching on mobile inside the drawer and unify project selection styling with the shared UI system.
4. Improve sidebar hierarchy in `src/components/layout/sidebar.tsx` with clearer active states, section spacing, and better small-screen behavior.

## Phase 2: Shared UI Primitives

1. Upgrade `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/select.tsx`, and `src/components/ui/card.tsx` for a more modern visual language.
2. Fix interaction quality in `src/components/ui/modal.tsx`, `src/components/ui/tabs.tsx`, and `src/components/ui/toggle.tsx`.
3. Standardize focus states, hover states, disabled states, spacing, radius, shadows, and empty/loading/error treatments across the app.

## Phase 3: Page-Level UX Improvements

1. Rework the Overview and Progress pages for stronger hierarchy, better KPI readability, and less prototype feel.
2. Replace weak or placeholder interactions on Progress pages, especially compare and timeline, with touch-friendly and keyboard-accessible controls.
3. Redesign Alerts and Plan pages so tables degrade into readable mobile cards/lists instead of horizontal-scroll-heavy layouts.
4. Improve Reports and Settings with clearer primary actions, better form grouping, stronger empty states, and more polished content presentation.

## Phase 4: Consistency And Trust

1. Remove placeholder UI that does not affect data yet, or wire it to real behavior.
2. Finish localization consistency and remove hardcoded English where the app already uses language context.
3. Fix all encoding/text issues such as broken dashes/ellipsis in `src/app/layout.tsx` and several dashboard pages.
4. Standardize loading, success, and error feedback so the product feels reliable.

## Suggested Delivery Order

1. Shell and shared primitives first.
2. Alerts, Plan, and Reports next.
3. Progress compare and timeline polish after that.
4. Final consistency pass and responsive QA last.

## Concrete Deliverables

1. Updated design tokens and shared controls.
2. New dashboard shell with footer and mobile-complete navigation.
3. Responsive page refinements across main workflows.
4. Accessibility and consistency cleanup pass.
