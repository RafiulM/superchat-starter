# Frontend Guideline Document

This document describes the frontend setup for the Superchat Starter—an enhanced “Everything-App” AI platform. It covers architecture, design principles, styling, components, state management, routing, performance, and testing. By following these guidelines, any developer or non-technical stakeholder can understand how the frontend is organized, why we chose certain tools, and how to extend or maintain the UI.

## 1. Frontend Architecture

### 1.1 Overview
- **Framework**: Next.js 15 (App Router) provides file-based routing, server/client component boundaries, and built-in optimizations via Turbopack.  
- **Language**: TypeScript ensures type safety across components, API routes, and database interactions.  
- **UI Primitives**: `shadcn/ui` (built on Radix) supplies accessible, unstyled React components.  
- **Styling**: Tailwind CSS v4 (utility-first) handles all styling needs.  
- **Authentication**: Better Auth manages user sign-up, sign-in, and sessions.  
- **Database**: PostgreSQL accessed through Drizzle ORM offers a type-safe, SQL-first data layer.  
- **AI SDK**: Vercel’s `@ai-sdk` and `assistant-ui` power real-time AI chat interactions.  
- **Containerization**: Docker and Docker Compose guarantee consistent dev and prod environments.

### 1.2 Scalability, Maintainability, Performance
- **Server Components** keep secrets (API keys) on the server and reduce bundle size for clients.  
- **App Router** and file conventions let us add new features (chat, search, image) in isolated folders.  
- **Type Safety** from TypeScript and Drizzle means fewer runtime errors and easier refactoring.  
- **Utility-First Styling** with Tailwind speeds up feature delivery and avoids large CSS bundles.  
- **Turbopack** accelerates incremental builds, enabling rapid local iteration.

## 2. Design Principles

### 2.1 Key Principles
- **Usability**: Intuitive layouts, clear call-to-action buttons, and consistent spacing.  
- **Accessibility**: Keyboard navigable, proper ARIA labels, contrast ratios that meet WCAG 2.1 AA.  
- **Responsiveness**: Mobile-first design; UI adapts from small screens to desktop seamlessly.  
- **Consistency**: Shared color palette, typography, and component behavior across the app.  
- **Performance-Focused**: Minimal initial load, lazy-load non-critical assets, and smooth animations.

### 2.2 Applying Principles
- **Forms**: Always label inputs; use focus rings; provide inline validation messages.  
- **Navigation**: Persistent header and sidebar; collapsible menus on mobile.  
- **Dark Mode**: Toggle seamlessly; maintain contrast in both themes.  
- **Feedback**: Loading spinners, disabled states, and toast notifications guide users.

## 3. Styling and Theming

### 3.1 Styling Approach
- **Utility-First**: Tailwind CSS with JIT mode for on-demand class generation.  
- **Component Classes**: Use `className` on `shadcn/ui` primitives instead of external stylesheets.  
- **No BEM/SMACSS**: Tailwind covers most needs; component variants handled via Tailwind’s `@apply` and plugin system.

### 3.2 Theming
- **Dark/Light Mode**: Tailwind’s `dark:` variants powered by a root `<html data-theme="dark|light">`.  
- **Custom Properties**: For brand colors, defined in `tailwind.config.js` under `theme.extend.colors`.

### 3.3 Style & Palette
- **Design Style**: Modern flat design—clean, minimal, with subtle shadows and rounded corners.  
- **Primary**: #3B82F6 (blue)  
- **Secondary**: #6366F1 (indigo)  
- **Accent**: #10B981 (green)  
- **Neutral**: #6B7280 (gray)  
- **Background Light**: #FFFFFF  
- **Background Dark**: #1F2937  
- **Error**: #EF4444 (red)  
- **Success**: #34D399 (emerald)  
- **Warning**: #F59E0B (amber)

### 3.4 Typography
- **Font Family**: Inter (system-UI fallback) for body and UI elements.  
- **Scale**: 14px base; modular scale (16px, 20px, 24px, 32px) for headings and large text.  
- **Line Height**: 1.5 for body, 1.25 for headings.

## 4. Component Structure

### 4.1 Organization
- `/components/ui` – shared primitives (buttons, inputs, cards) from `shadcn/ui`.  
- `/components/common` – app-level wrapper components (SiteHeader, AppSidebar, Footer).  
- `/components/features` – feature-specific components (ChatBubble, ConversationList).  
- `/app/[feature]/...` – feature pages and layouts (e.g., `/app/dashboard/chat/page.tsx`).

### 4.2 Reusability & Maintenance
- **Atomic Components**: Build small, focused components that accept props for customization.  
- **Composition**: Use slot/children patterns rather than prop-heavy components.  
- **Documentation**: JSDoc comments and Storybook stories (if available) for each component.

## 5. State Management

### 5.1 Approach
- **Data Fetching & Caching**: React Query (or SWR) manages remote data, caching, revalidation, and optimistic updates.  
- **Local UI State**: Zustand for chat streaming state, conversation context, and ephemeral toggles.  
- **Context**: React Context for theme toggles and global settings.

### 5.2 Sharing State
- **Query Keys**: Use consistent keys (`["conversations", userId]`) for caching.  
- **Store Slices**: Separate Zustand stores for UI (modals, toasts) and chat flow (messages, loading).  
- **Hydration**: Server-side fetched initial data passed via props to React Query.

## 6. Routing and Navigation

### 6.1 Routing
- **App Router**: File-based routing in `/app`.  
- **Layouts**: Shared `layout.tsx` for header, sidebar, and footer across pages.  
- **Nested Routes**: Place related pages in subfolders (`/app/dashboard/chat`, `/app/dashboard/search`).

### 6.2 Navigation Structure
- **Header**: Site branding, user menu, theme toggle.  
- **Sidebar**: Links to Chat, Search, Image Gen, Settings. Collapsible on mobile.  
- **Breadcrumbs**: Optional, based on depth.

## 7. Performance Optimization

- **Code Splitting**: Next.js auto-splits by route. Use `next/dynamic` for heavy components.  
- **Image Optimization**: `next/image` for responsive, lazy-loaded images with built-in CDN.  
- **Lazy Loading**: Dynamically import non-critical modules (e.g., analytics, charts).  
- **Caching**: Leverage React Query’s stale-while-revalidate; set HTTP caching headers in API routes.  
- **Minification & Tree-Shaking**: Inherited from Next.js/Turbopack.

## 8. Testing and Quality Assurance

### 8.1 Unit Tests
- **Tooling**: Jest + React Testing Library.  
- **Coverage**: Test logic in utility functions, form validation, and small components.

### 8.2 Integration Tests
- **Tooling**: Jest with supertest or MSW (Mock Service Worker) to mock API routes.  
- **Focus**: `/api/chat/route.ts` – ensure correct AI SDK call and database persistence.

### 8.3 End-to-End Tests
- **Tooling**: Playwright or Cypress.  
- **Scenarios**: User sign-in, send chat message, stream response, view chat history, error cases.

### 8.4 Linting and Formatting
- **ESLint** with Next.js and TypeScript plugins.  
- **Prettier** for consistent code style.  
- **Pre-commit Hooks**: Husky + lint-staged to run checks before commits.

## 9. Conclusion and Overall Frontend Summary

Superchat Starter’s frontend is built on a modern stack—Next.js 15, TypeScript, Tailwind CSS, and AI-focused libraries—that balances developer productivity with user experience. Its component-driven design, utility-first styling, and clear separation between server and client logic ensure scalability and maintainability. By following these guidelines—adhering to the design principles, using the color palette and typography standards, organizing components properly, and leveraging robust state management and testing strategies—you’ll create a consistent, high-performance AI platform that’s easy to extend and maintain.