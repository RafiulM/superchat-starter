# Project Requirements Document for Superchat-Starter

## 1. Project Overview

Superchat-Starter is the foundation for an "everything-app" AI platform, starting with a high-quality AI Chat feature. It combines user authentication, type-safe data storage, and a modern UI so you can focus on building and shipping AI-driven experiences quickly. By leveraging Next.js 15 with the App Router, TypeScript, Better Auth, Drizzle ORM, and a set of UI libraries, this codebase gives you authentication flows, a database connection, theming, and a dashboard layout out of the box.

The goal is to build an AI Chat module that lets signed-in users send messages and receive real-time, streaming replies from a chosen large language model (LLM). Success will be measured by a smooth signup and sign-in process, fast message streaming (under 500 ms per token), reliable saving of conversations, and a user interface that works on both mobile and desktop with dark mode support.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)
- Email/password signup, sign-in, and session handling using Better Auth.  
- A PostgreSQL database via Drizzle ORM with schemas for users, chat sessions, and messages.  
- An AI Chat page under `/dashboard/chat` that streams messages through the Vercel `@ai-sdk`.  
- A dashboard layout with a sidebar for conversation history and a main panel for chat.  
- Mobile-first, responsive UI built with Tailwind CSS v4 and `shadcn/ui` primitives.  
- Dark mode toggle and basic theming.  
- Docker and Docker Compose setup for local dev (including a Postgres container).

### Out-of-Scope (Future Phases)
- AI Search and AI Image Generation features.  
- Social logins (Google, GitHub) and advanced auth features (password resets, MFA).  
- Background job queues for long-running tasks (e.g., high-resolution image gen).  
- Social features (sharing, real-time collaboration).  
- Extensive analytics or usage dashboards beyond basic metrics.

## 3. User Flow

A new user lands on the home page and clicks “Sign Up.” They enter an email and password, receive a confirmation email, and (once verified) are redirected to the dashboard. The sidebar shows “Chat” by default. When they click it, the main panel displays a text input at the bottom and a scrollable history area above.

The user types a question and hits send. Behind the scenes, the frontend calls `/api/chat`, passing user credentials via cookies. The server-side route uses the Vercel AI SDK to route the prompt to the chosen LLM (for example, OpenAI’s GPT-4). As tokens stream back, the chat UI displays them in real time. When the response is complete, both the user message and AI reply are saved to Postgres. The sidebar updates to list the active conversation by title or date.

## 4. Core Features

- **Authentication**: Email/password signup, sign-in, session cookies, and protected API routes via Better Auth.  
- **Database Layer**: PostgreSQL with Drizzle ORM. Schemas for `users`, `chat_sessions`, and `messages`.  
- **AI Chat API Route**: `/app/api/chat/route.ts` that receives prompts, calls `@ai-sdk`, streams LLM responses, and persists data.  
- **Chat UI**: An `assistant-ui` component embedded in a Next.js page that handles streaming, error states, and loading indicators.  
- **Conversation Management**: Sidebar listing past chat sessions; clicking one loads its messages.  
- **UI Framework**: Tailwind CSS v4 + `shadcn/ui` for buttons, cards, input fields, modals, and dark mode toggle.  
- **State Management**: Local state or lightweight library (Zustand/Jotai) for streaming updates and loading flags.  
- **Containerization**: Docker Compose with services for Next.js app and Postgres DB.

## 5. Tech Stack & Tools

- **Frontend Framework**: Next.js 15 (App Router) with Turbopack; React components for client UI.  
- **Language**: TypeScript for end-to-end type safety.  
- **Authentication**: Better Auth for secure email/password flows.  
- **Database & ORM**: PostgreSQL + Drizzle ORM (TypeScript-first).  
- **AI Integration**: Vercel `@ai-sdk` to call LLM providers (OpenAI, Anthropic).  
- **UI Components**: `shadcn/ui` primitives, `assistant-ui` for chat interface.  
- **Styling**: Tailwind CSS v4 with dark mode support.  
- **State Management**: Zustand or Jotai (for streaming and conversation state).  
- **Data Fetching**: React Query or SWR for chat history and optimistic updates.  
- **Containerization**: Docker & Docker Compose.  
- **IDE Tools**: VS Code with ESLint, Prettier, TypeScript extensions. Optionally Windsurf plugin for AI-assisted code completions.

## 6. Non-Functional Requirements

- **Performance**: Chat messages should start streaming within 500 ms of request.  
- **Scalability**: The architecture must support horizontal scaling of the Next.js server and multiple DB connections.  
- **Security**:  
  - Sensitive secrets (API keys) only in environment variables; never exposed to client.  
  - HTTPS encryption, secure cookies with `HttpOnly` and `Secure` flags.  
- **Data Integrity**: Ensure ACID compliance via Postgres; transactional writes for multi-table inserts.  
- **Usability**:  
  - Mobile-friendly layout.  
  - Accessible (ARIA attributes, keyboard nav).  
- **Reliability**:  
  - 99.9% API uptime.  
  - Automatic retries for transient AI SDK or DB failures (with exponential backoff).

## 7. Constraints & Assumptions

- **GPT-4o Availability**: Assumes the chosen LLM API (e.g., OpenAI) is available and supports streaming.  
- **Environment**: Node.js 20+, Docker installed locally for dev and CI.  
- **Secrets Management**: Developers have `OPENAI_API_KEY` (or equivalent) in `.env`.  
- **Database Migrations**: Will use Drizzle’s migration tooling; assumes Postgres >= 13.  
- **Hosting**: Target Vercel or a container-friendly cloud provider (e.g., AWS ECS, DigitalOcean App Platform).

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**: LLM providers often throttle requests. Mitigation: Implement client-side rate limiting and server queueing.  
- **Streaming Interruptions**: Network glitches can break streaming. Mitigation: Use library features to resume or retry partial streams.  
- **Large Conversation Growth**: Unlimited messages lead to slow queries. Mitigation: Add pagination or archive old chats.  
- **State Bloat**: Holding full message history in client state can cause memory issues. Mitigation: Cache only recent messages and fetch older ones on demand.  
- **CORS & CSRF**: Incorrectly configured headers can block API calls or allow CSRF attacks. Mitigation: Use Next.js built-in protections and strict CORS settings.

---

This PRD provides a clear, unambiguous blueprint for building the first version of the Superchat AI platform. All subsequent technical documents (tech stack details, frontend/backend guidelines, file structure) should reference these requirements directly.