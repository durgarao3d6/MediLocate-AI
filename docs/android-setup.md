# Android development setup

The React app now has Capacitor configuration and Android package scripts. The generated native `android/` project is not checked in yet.

## Prerequisites
- Node.js 20+
- Android Studio and Android SDK
- Java SDK supported by the selected Capacitor/Gradle versions

## Generate Android project

```bash
cd apps/web
npm install
npm run android:add
npm run android:open
```

For later web changes: `npm run android:sync`.

## API connectivity
The UI currently defaults to `http://localhost:8000`, which works in a desktop browser but **not** from a physical Android phone. Configure `VITE_API_URL` for a reachable HTTPS backend before building Android; do not expose the current unauthenticated prototype to the internet. Android emulator networking needs an emulator-accessible host and an appropriate secure dev network configuration.

## Offline roadmap
`src/local-search.ts` is a deterministic local search module, not a persistent database. The next step is tenant-scoped SQLite storage, authenticated snapshot synchronization, freshness indicators, and conflict-safe location updates. Do not put real pharmacy data in localStorage.

## Model integration
On-device voice (whisper.cpp / sherpa-onnx) and OCR are still research candidates, not bundled models. Benchmark on low-cost Android devices before choosing weights and quantization.
