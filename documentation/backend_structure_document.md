# Backend Structure Document

This document outlines the backend setup for the Superchat Starter AI platform. It explains how the system is built, how data flows, and how everything works together in simple, clear terms.

## 1. Backend Architecture

Overall, the backend is built on Next.js 15 (App Router) with TypeScript and Turbopack. It uses server-side components and API routes to separate frontend views from backend logic. Here’s how it’s put together:

• Framework: Next.js 15 App Router with Turbopack bundler
• Language: TypeScript for end-to-end type safety
• Design Patterns:
  - Server Components to keep secrets and heavy AI calls on the server
  - API Route Handlers under `/app/api` for RESTful endpoints
  - Component-driven approach using primitive UI building blocks

How this supports our goals:

• Scalability: Each API route can run as an independent serverless function or container, so we can scale chat, search, or image services separately.  
• Maintainability: TypeScript types flow from database schemas to React components, catching errors early. Modular feature folders (`/app/chat`, `/app/search`) keep code organized.  
• Performance: Turbopack speeds up builds, and server streaming (for AI chat) reduces latency.

## 2. Database Management

We use a relational (SQL) database: PostgreSQL. Drizzle ORM sits on top to give us type-safe queries and schema definitions.

• Database Type: SQL (PostgreSQL)  
• ORM: Drizzle ORM for schema definitions, migrations, and queries  
• Data Access:  
  - Server Components or API routes import Drizzle models directly  
  - Queries and updates run in route handlers when users send messages or start sessions  

Data management best practices:

• Migrations: Use Drizzle’s built-in migration tool to evolve the schema without losing data.  
• Connection Pooling: Managed by the database host or via a connection pool library to handle many concurrent users.  
• Backups: Regular automated backups configured at the hosting provider level.

## 3. Database Schema

### Human-Readable Format

Users:
- `id`: unique identifier for each user
- `email`: user’s login email
- `hashed_password`: password hash
- `created_at`, `updated_at`: timestamps

Chat Sessions:
- `id`: unique session identifier
- `user_id`: links to the user who owns this session
- `title`: optional label for the session (e.g., "Project Brainstorm")
- `created_at`, `updated_at`: timestamps

Messages:
- `id`: unique message identifier
- `session_id`: links to the chat session
- `role`: indicates who sent it (`user` or `assistant`)
- `content`: the text of the message
- `timestamp`: when the message was created

### SQL Schema (PostgreSQL)
```sql
-- Users table
o create table users (
  id serial primary key,
  email text unique not null,
  hashed_password text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Chat sessions table
o create table chat_sessions (
  id serial primary key,
  user_id integer references users(id) on delete cascade,
  title text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Messages table
o create table messages (
  id serial primary key,
  session_id integer references chat_sessions(id) on delete cascade,
  role text check (role in ('user','assistant')) not null,
  content text not null,
  timestamp timestamp with time zone default now()
);
```  

## 4. API Design and Endpoints

We follow a RESTful approach using Next.js API Route Handlers. Key endpoints:

• **Authentication**  
  - `POST /app/api/auth/signup`: create a new user account  
  - `POST /app/api/auth/signin`: check credentials and start a session  
  - `POST /app/api/auth/signout`: end the user session

• **Chat**  
  - `POST /app/api/chat`: send a user message; the backend calls the AI SDK, streams the response, and saves both messages to the database  
  - `GET /app/api/chat/sessions`: list chat sessions for the logged-in user  
  - `GET /app/api/chat/messages?sessionId=...`: fetch past messages for a session

• **Future Endpoints**  
  - `POST /app/api/search`: handle AI-powered search queries  
  - `POST /app/api/image`: generate images via AI and store prompts

Each endpoint:
- Validates the user’s session or token  
- Uses TypeScript types for request and response bodies  
- Catches and logs errors, returning clear HTTP status codes and messages

## 5. Hosting Solutions

For production, we recommend deploying on a platform like Vercel or AWS using Docker containers. Local development runs in Docker Compose with a PostgreSQL container.

Benefits:

• Reliability: Vercel or AWS provides managed infrastructure with built-in redundancy.  
• Scalability: Serverless functions (on Vercel) or auto-scaling containers (on AWS ECS) grow with traffic.  
• Cost-Effectiveness: Pay only for what you use—idle services scale to zero (on serverless).  

Local Dev Setup:

• Docker Compose file spins up:  
  - Next.js server  
  - PostgreSQL database

## 6. Infrastructure Components

• Load Balancer:  
  - Serverless platform handles routing to function instances  
  - Or an AWS ALB if using ECS/EKS

• Caching & CDN:  
  - Static assets served by Vercel’s CDN or AWS CloudFront  
  - Future use of Redis for session caching or heavy AI response caching

• Background Jobs (Future):  
  - BullMQ or a managed queue for long-running tasks (e.g., high-res image generation)  

• Bundler:  
  - Turbopack for faster builds and hot reloads in development

## 7. Security Measures

• Authentication & Authorization:
  - Better Auth for email/password flows  
  - Protected API routes verify session tokens

• Data Encryption:
  - TLS/HTTPS enforced in production  
  - Environment variables stored securely (e.g., Vercel secrets)

• Secrets Management:
  - `.env` files for local dev (never committed)  
  - Platform secrets (API keys) stored in environment settings

• Password Safety:
  - Hash passwords with a modern algorithm (bcrypt or Argon2)

• API Security:
  - Rate limiting on chat endpoints to prevent abuse  
  - Input validation and sanitization to guard against injection

## 8. Monitoring and Maintenance

• Logging & Error Tracking:
  - Sentry (or Logtail) captures runtime errors and performance issues  
  - Next.js built-in request logs and database query logging

• Performance Monitoring:
  - Vercel Analytics or CloudWatch Metrics for response times and error rates

• Maintenance Practices:
  - Automated CI/CD pipeline runs linting, tests, and schema migrations on each push  
  - Drizzle migrations ensure safe database updates  
  - Scheduled backups of the PostgreSQL database

## 9. Conclusion and Overall Backend Summary

The backend for Superchat Starter is designed to be modular, secure, and easy to extend:

• **Next.js App Router** with server components keeps AI logic and secrets on the server.  
• **PostgreSQL + Drizzle ORM** offers a type-safe, reliable data layer.  
• **Better Auth** secures user accounts and session handling.  
• **API Routes** expose clear REST endpoints for chat, future search, and image features.  
• **Docker** powers consistent local dev, while **Vercel/AWS** handles production scaling.

This setup aligns with the goal of rapidly building an "everything-app" driven by AI, providing a stable foundation for chat, search, image generation, and beyond. Any developer can pick up this structure and immediately focus on adding or improving AI features without worrying about the underlying plumbing.