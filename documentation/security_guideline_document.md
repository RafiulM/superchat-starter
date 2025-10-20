# Security Guidelines for Superchat Starter (Everything-App AI Platform)

This document outlines essential security principles and best practices tailored for the **superchat-starter** repository. Following these guidelines ensures that your AI-driven “everything-app” remains secure by design, resilient against common threats, and aligned with compliance requirements.

---

## 1. Security by Design

- **Embed Security Early**: Integrate security considerations into design, development, testing, and deployment phases. Conduct threat modeling before major feature sprints (e.g., AI Chat, Search, Image Gen).
- **Simplicity & Least Privilege**: Keep components minimal and grant only the permissions necessary (e.g., database roles limited to specific tables). Avoid overly complex access control logic.
- **Defense in Depth**: Layer controls at network, application, and data levels. A breach in one layer should not expose your entire system.

---

## 2. Authentication & Access Control

### 2.1 User Authentication (Better Auth)
- Enforce **strong password policies**: minimum 12 characters, mixed case, symbols, numbers; reject common/compromised passwords.
- Store passwords with **Argon2** or **bcrypt** (unique salt per password).
- Implement **Multi-Factor Authentication (MFA)** for user accounts (e.g., TOTP via authenticator apps).

### 2.2 Session Management
- Use **cryptographically strong**, unpredictable session tokens. Rotate session IDs on login and privilege changes.
- Set **idle** and **absolute** session timeouts (e.g., 30 min idle, 24 h absolute).
- Secure cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes.

### 2.3 Role-Based Access Control (RBAC)
- Define roles (`user`, `admin`, `superadmin`) and minimal permissions per role.
- Enforce server-side authorization checks on every API route, especially `/app/api/chat`, `/app/api/search`, and `/app/api/image`.
- Validate JWT tokens carefully: verify signature algorithm, `exp`, `iat`, and audience (`aud`).

---

## 3. Input Handling & Processing

- **Validate & Sanitize Inputs** on all server routes:
  - `/app/api/chat/route.ts`: whitelist allowed model parameters, max prompt length.
  - `/app/api/settings`, user-supplied metadata.
- Use **parameterized queries** via Drizzle ORM; avoid raw SQL interpolation.
- **Prevent XSS**: sanitize and encode any user-generated content (chat messages, search terms) before injecting into the DOM. Use React’s built-in escaping and a CSP.
- **CSRF Protection**: implement anti-CSRF tokens on all state-changing endpoints or use `SameSite=Strict` cookies.
- **Redirect Validation**: if sending users back to `redirect_uri` after auth, validate against an allow-list of trusted domains.
- **File Uploads** (if applicable later): enforce extension/type checks, size limits, virus scanning, store outside webroot.

---

## 4. Data Protection & Privacy

### 4.1 Encryption
- **In Transit**: Enforce TLS 1.2+ on all endpoints (Next.js, WebSocket, database connection). Use HSTS.
- **At Rest**: Enable encryption at rest for PostgreSQL. Use AES-256 managed by your cloud provider or volume encryption.

### 4.2 Secrets Management
- **No Hardcoding**: Do not commit API keys (`OPENAI_API_KEY`, `VERCEL_AI_KEY`) or database credentials. Use a secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault).
- Store secrets in environment variables populated at runtime by your CI/CD or orchestration layer.

### 4.3 Sensitive Data Handling
- **PII Minimization**: Collect only necessary user information (email, name). Mask or redact PII in logs.
- **Logging & Error Messages**: Do not leak stack traces, SQL queries, or full JWT claims. Use generic error responses (`500 Internal Server Error`) and log details securely.

---

## 5. API & Service Security

- **HTTPS Only**: Redirect HTTP to HTTPS. Disable insecure TLS versions.
- **Rate Limiting & Throttling**: Protect `/api/chat`, `/api/search`, `/api/image` from brute-force or DoS (e.g., 100 requests/min per user/IP).
- **CORS Policy**: Restrict `Access-Control-Allow-Origin` to your frontend domain(s). Disallow wildcard origins.
- **Use Proper HTTP Verbs**: GET for read, POST for create, PUT/PATCH for update, DELETE for removal.
- **API Versioning**: Prefix routes (e.g., `/api/v1/chat`) for safe evolution.
- **Minimize Response Payloads**: Return only necessary fields in JSON (avoid sending entire user record).

---

## 6. Web Application Security Hygiene

- **Security Headers**:
  - Content-Security-Policy (restrict sources to same-origin and trusted CDNs)
  - Strict-Transport-Security
  - X-Content-Type-Options: `nosniff`
  - X-Frame-Options: `DENY`
  - Referrer-Policy: `no-referrer-when-downgrade`
- **Subresource Integrity (SRI)**: For any third-party scripts or styles.
- **Client Storage**: Avoid storing tokens in `localStorage` or `sessionStorage`; prefer secure, HttpOnly cookies.

---

## 7. Infrastructure & Configuration Management

- **Docker Hardening**:
  - Base images: use official, minimal images (e.g., `node:18-alpine`).
  - Run containers as non-root user.
  - Scan images with vulnerability scanners (e.g., Trivy).
- **Server Hardening**:
  - Disable unused services/ports.
  - Change default credentials.
  - Apply OS and package updates regularly.
- **TLS Configuration**: Strong cipher suites, disable SSLv3/TLS 1.0/1.1.
- **File Permissions**: Restrict to minimum (600/640) on secrets and config files.

---

## 8. Dependency Management

- **Lockfiles**: Commit `package-lock.json` or `yarn.lock` for deterministic builds.
- **Vet Dependencies**:
  - Use SCA tools (e.g., `npm audit`, Snyk) in CI to detect known CVEs.
  - Regularly update libraries (Next.js, Tailwind, Drizzle) to patched versions.
- **Minimize Footprint**: Only install necessary packages (avoid dev tools in production image).

---

## 9. DevOps & CI/CD Security

- **Pipeline Security**:
  - Use pull request checks for linting, type safety, and SCA scans.
  - Enforce branch protection and code reviews before merges.
- **Secrets in CI**: Store in encrypted variables (GitHub Actions secrets, GitLab CI variables). Do not echo in logs.
- **Automated Testing**:
  - Unit tests: verify input validation, auth logic, encryption.
  - Integration tests: simulate `/api/chat` with mock AI and database.
  - E2E tests: Playwright/Cypress for user flows (login, chat, logout).
- **Infrastructure as Code (IaC)**: If using Terraform/CloudFormation, scan for misconfigurations (e.g., open S3 buckets, public IPs).

---

## 10. Monitoring, Logging & Incident Response

- **Centralized Logging**: Aggregate logs (application, container, database) into a secure logging service (e.g., ELK, Datadog, Sentry).
- **Alerts & Metrics**: Monitor error rates, CPU/memory, request latencies, unusual authentication failures.
- **Incident Playbook**: Define steps for breach detection, containment, eradication, recovery, and postmortem.

---

By adhering to these guidelines, the **superchat-starter** platform will be fortified against common threats while maintaining flexibility for rapid AI feature development. Regularly revisit and update these practices as your codebase and threat landscape evolve.
