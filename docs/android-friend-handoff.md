# Android build and test handoff

**Status:** Android native project and APK are not yet generated or device-tested. Code is available in GitHub.

## For a friend with Android Studio
1. Clone https://github.com/durgarao3d6/MediLocate-AI
2. Install Node.js 20+, Android Studio + SDK, and supported Java SDK.
3. In `apps/web`, run `npm install` then `npm run build`.
4. Run `npm run android:add` once (creates native `android/` directory).
5. Run `npm run android:open`, wait for Gradle sync, and build/run in Android Studio.
6. For future changes use `npm run android:sync`.

## Important networking limitation
The default API URL is `http://localhost:8000`, which will not reach the development server from a physical Android phone. Do not deploy the unauthenticated API publicly to work around this. For a safe test, use a controlled private network with an HTTPS development backend and configure `VITE_API_URL` before building. The web UI can be tested locally in a desktop browser using Docker Compose.

## Device test checklist
- App launches and search finds Dolo 650.
- Rack/shelf assignment survives API restart.
- Tap **Sync offline catalog** while online.
- Disconnect internet, then search a previously synchronized medicine; confirm stale-data warning.
- Reconnect and resync.
- Confirm rack QR payload parsing only accepts MEDILOCATE format.
- Measure search latency on 4GB and 8GB Android phones.
- Report Android version, RAM, chipset, build errors and logs without private data.

## Not yet supported
- Production SQLite native database (IndexedDB is used in the web UI)
- Camera-based QR scanning (QR payload entry only)
- Whisper or other on-device speech models
- Real-world inventory or patient data
- Authentication, tenant isolation, audit logs, or production security

This is a development handoff, not a production deployment guide.
