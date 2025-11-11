# Project Roadmap

This roadmap captures the security-first hardening steps and the product evolution plan across immediate, short-, mid-, and long-term horizons.

## Immediate / Must-Fix (0–1 month)
1. **Secret Rotation & History Cleanup**
   - Remove committed secrets from git history, rotate Groq/OpenCage/Mongo credentials, and ship a cleaned `.env.example` with updated `.gitignore`.
2. **Secure Configuration**
   - Require `SECRET_KEY`, `GROQ_API_KEY`, `OPENCAGE_API_KEY`, and `MONGO_URI` at startup; fail fast when unset and document expected values.
3. **Sanitising Logger**
   - Build a reusable logging utility that redacts tokens, emails, and birth data before emitting to logs; apply across all routes/services.
4. **CORS Restrictions**
   - Replace wildcard origins with env-driven allowlists. Disable `supports_credentials` unless cookies/session auth is introduced.
5. **Dependency Cleanup**
   - Drop unused packages (torch/accelerate/transformers), upgrade remaining deps, and run `pip-audit` plus `npm audit` as part of CI.
6. **Basic Input Validation**
   - Validate birth date/time ranges, city strings, and chart IDs to prevent malformed data and injection scenarios.
7. **Initial Test Suite**
   - Add pytest coverage for natal chart generation, interpretation endpoints, and profile CRUD. Prepare frontend smoke tests (Playwright/Cypress) for onboarding, interpretation, and chat flows.

## Short-Term (1–3 months)
1. **User Authentication**
   - Implement JWT-based signup/login, secure token storage, and protect profile/interpretation/chat endpoints. Add refresh token flow if long-lived sessions are needed.
2. **Role Management**
   - Introduce simple user/admin roles to guard management routes and future analytics dashboards.
3. **User Dashboard Enhancements**
   - Expand profile view to show interpretation history, allow chart deletion, and provide clear offline indicators.
4. **Transit Calculation**
   - Deliver `/api/transit` endpoint that compares current planetary positions to natal charts, plus corresponding UI.
5. **UX Improvements**
   - Add reliable loading states, error messaging, smoother page transitions, and responsive tweaks for mobile devices.
6. **Continuous Integration**
   - Configure GitHub Actions (or equivalent) to run lint, unit tests, and build steps for both backend and frontend on every pull request.

## Mid-Term (3–6 months)
1. **Refactor LLM Integration**
   - Abstract Groq calls behind a provider interface; prototype open-source or alternative APIs to reduce vendor risk and costs.
2. **Internationalisation**
   - Localise frontend strings and allow prompt/response language selection for the LLM.
3. **Analytics & Monitoring**
   - Instrument anonymous usage metrics, integrate APM (e.g., Sentry Performance, DataDog) for latency tracking, and add structured logging.
4. **Rate Limiting & Abuse Prevention**
   - Apply `flask-limiter` or edge throttling to endpoints like `/api/interpretation` and `/chat/message`.
5. **Schema & Data Management**
   - Introduce repeatable migration scripts (custom Mongo migrations or hybrid storage strategy) to manage evolving schemas.

## Long-Term (6–12 months)
1. **Server-Side Rendering / Next.js**
   - Evaluate migrating to an SSR-compatible stack (Next.js) for improved SEO, performance, and mobile web experience.
2. **Self-Hosted or Hybrid LLM**
   - Explore hosting open-source language models or hybrid inference to reduce reliance on Groq and control latency/costs.
3. **Data Retention & Compliance**
   - Implement GDPR-compliant retention policies, in-app export/delete workflows, encryption at rest, and incident response runbooks.
4. **Advanced Astrology Features**
   - Offer synastry refinements, progressions, solar return interpretations, and experimentation with premium tiers or ritual libraries.
5. **Mobile App**
   - Package the experience with React Native or Capacitor, leverage secure storage for tokens, and integrate push notifications for daily insights.

Iterate on this roadmap as user feedback and business priorities evolve, but lock in the immediate security and reliability work first to create a safe foundation for the upcoming feature cadence.
