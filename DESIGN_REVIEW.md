# Design and Reliability Review

## Critical observations

1. **Secrets and third-party API credentials are hardcoded in client-side JavaScript.**
   - `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are embedded directly in `js/main.js`.
   - Firebase configuration values are embedded in `js/firebase-config.js`.
   - This is expected for Firebase *public* config, but **not for paid/limited third-party APIs** like Adzuna/GNews if quota abuse is a concern.

2. **Global state is defined in two places with different shapes.**
   - `window.AppState` is initialized in `js/main.js`.
   - `const AppState` is initialized again in `js/firebase-config.js`.
   - This can cause inconsistent behavior across pages and difficult-to-debug state drift.

3. **Dashboard depends on remote APIs from the browser for core widgets.**
   - `js/dashboard.js` fetches market and news data directly from public endpoints.
   - Browser CORS/network failures are normal in this design and will repeatedly trigger fallbacks.
   - Users interpret these failures as app errors, even if fallback content appears.

4. **There are references to configuration that is never defined.**
   - `js/dashboard.js` references `AppConfig.GNEWS_API_KEY`, but the key does not exist in `js/main.js` config.
   - This won’t always crash due fallback logic, but it guarantees failed live-news requests.

5. **App scripts mix responsibilities and duplicate data models.**
   - Career data appears in multiple places (`js/main.js`, `js/careers.js`, and assessment recommendation arrays).
   - This increases drift risk where title/category/salary values conflict by page.

6. **Error handling is mostly console-based and not user-guided.**
   - Many failures are logged to console (`console.error`) but user messaging is inconsistent.
   - This leads to user-visible “not working” behavior without actionable recovery steps.

## Recommendations

1. **Unify state management**
   - Keep a single global state object (`window.AppState`) and extend it in one module.
   - Avoid redefining `const AppState` in multiple files.

2. **Move third-party API calls to a backend proxy**
   - Keep credentials server-side and expose only controlled endpoints to the browser.
   - Add caching and rate limiting server-side to reduce quota errors.

3. **Define a complete config contract**
   - Validate required config at startup and show clear warnings in UI when missing.
   - Remove or guard unreachable features (e.g., live news if API key not configured).

4. **Normalize career data source**
   - Keep one canonical data schema and source-of-truth file/service.
   - Build lightweight mapping/transformation per page rather than duplicating arrays.

5. **Strengthen user-facing resilience**
   - Add visible “data source unavailable” states with retry buttons.
   - Distinguish between offline mode, authentication issues, and rate-limit problems.

6. **Introduce basic quality gates**
   - Add static checks (ESLint), formatting, and a smoke test that loads all pages.
   - Add runtime guards for localStorage parsing and undefined config fields.

## Priority order

1. State unification (`AppState`) and config validation.
2. Backend proxy for external APIs.
3. Data model consolidation.
4. UX error states and retries.
5. Automated lint/smoke checks.