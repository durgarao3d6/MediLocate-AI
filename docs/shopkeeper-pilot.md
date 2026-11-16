# Shopkeeper pilot: one complete journey

## Implemented prototype flow
1. Open app and create/select a local pharmacy profile (no registration or server login).
2. Import a .xlsx worksheet with columns `name,strength,form,rack,shelf` OR capture rack photographs and extract English OCR candidate lines.
3. Shopkeeper edits every proposed entry and explicitly confirms selected rows with rack/shelf values.
4. The app saves the confirmed catalog in per-shop IndexedDB storage. It works in the browser without an API.
5. Capture a printed English prescription or paste/type one medicine per line, review the extracted text.
6. App performs exact normalized matching (medicine name or name + strength) against the confirmed local catalog and displays rack/shelf. Unmatched medicines are explicitly flagged.

## What this does NOT yet do
- Native Android SQLite: the pilot currently uses IndexedDB, which is local persistent browser storage. Native SQLite must be implemented and tested on Android.
- Secure registration, login or cloud sync. Local pilot profiles are not authenticated and not safe for real multi-tenant deployment.
- Reliable AI understanding of crowded rack photos or handwritten prescriptions. Tesseract.js extracts candidate text only and English trained data may require a first-time download. Photographing a rack cannot establish that a medicine is in stock.
- Clinical matching or automatic substitutions. Matching is deliberately strict and may miss variants.
- Real patient data handling. Avoid real prescriptions or personally identifiable information during this prototype.
- APK build and device test.

## Local test
```bash
cd apps/web
npm install
npm run dev
```
Open the displayed local URL. Test with a synthetic Excel file and printed test prescription, not patient data. The original API prototype remains in `src/main.tsx`; the pilot entry point is `src/pilot.tsx`.

## Android handoff
See `docs/android-friend-handoff.md`. Before any real pharmacy trial, complete native SQLite, privacy controls, app permissions, OCR model packaging, validation, and security review.
