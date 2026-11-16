# Mobile-first PWA — v0.1

The mobile web interface supports catalog search, rack/shelf assignment, and CSV import. A manifest and service worker are configured using vite-plugin-pwa.

## Development
`docker compose up --build`, then open http://localhost:5173.

## Production install
Build with `npm run build` in apps/web and serve the output over HTTPS. The SVG app icon is a placeholder; add 192px and 512px PNG icons and a maskable icon for broader Android installation support.

## Offline limitations
Only the app shell is cached. API data is not cached; medicine location search requires a network connection. Do not present stale rack/stock information as live. Future offline mode needs explicit local storage, timestamps, conflict resolution, and device authorization.

## Next
Add QR scanning with user confirmation, authentication, tenant-scoped inventory and audit trails before real shop pilots. Voice and prescription OCR require safety evaluation.
