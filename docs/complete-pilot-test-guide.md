# MediLocate AI — Complete shopkeeper pilot test guide

**Version:** November 2026 | **Environment:** Web browser / GitHub Pages | **Status:** Prototype; not approved for real pharmacy or patient use

## 1. Goal
Validate one end-to-end workflow: start a shop profile → import Excel or rack photo → review OCR/imported entries → confirm medicine/rack locations → save locally → enter or scan a synthetic printed prescription → verify extracted names → show exact medicine-to-rack matches.

## 2. Access and prerequisites
- Product homepage (once Pages deployment is enabled): https://durgarao3d6.github.io/MediLocate-AI/
- Interactive pilot: https://durgarao3d6.github.io/MediLocate-AI/pilot.html
- Source: https://github.com/durgarao3d6/MediLocate-AI
- Use current Chrome or Edge on desktop or Android; enable JavaScript and browser storage.
- Use **synthetic medicine examples only**. Do not upload patient prescriptions, real stock data, or identifying pharmacy details.
- OCR uses Tesseract.js with an English language model; first use can require internet. The text it extracts may be wrong.

## 3. Prepare synthetic test data
Create an Excel workbook with first-row headers exactly:
| name | strength | form | rack | shelf |
|---|---|---|---|---|
| Dolo 650 | 650 mg | tablet | A3 | 2 |
| Cetirizine | 10 mg | tablet | B1 | 4 |
| Sample Medicine | 5 mg | tablet | C2 | 1 |

Save as `pilot-racks.xlsx`. All entries are test data and must not be interpreted as inventory availability.

Create a test prescription image (or enter text directly) containing:
```
Dolo 650
Cetirizine 10 mg
Unknown Sample
```
**Important:** The pilot's matching is exact after basic normalization. For the first row, use `Dolo 650`; for the second, use `Cetirizine 10 mg` to match the saved name plus strength. OCR may add extra words or misspellings, so edit the text manually before matching.

## 4. Execute the full workflow
1. Open the product homepage and select **Launch pilot**.
2. Enter `Demo Pharmacy` and click **Start pilot**. Expected: Rack inventory screen opens.
3. Choose **Upload Excel (.xlsx)** and select `pilot-racks.xlsx`. Expected: three editable candidate rows.
4. Inspect each row for name, strength, formulation, rack and shelf. Uncheck or correct any erroneous row.
5. Select **Confirm and save selected entries**. Expected: three confirmed medicines appear in the catalog. The catalog is saved locally in IndexedDB.
6. Reload the page. Select **Demo Pharmacy**. Expected: the confirmed catalog remains.
7. To test photo OCR separately, capture a photo of a *synthetic* rack label. Set default rack and shelf; review every extracted line. Delete or uncheck invalid OCR suggestions. Do not assume a photo establishes stock quantity.
8. Select **3. Prescription**. Capture a synthetic printed prescription or type one medicine per line into the text area.
9. Review and correct every extracted medicine name and strength; remove headers, patient information and other non-medicine lines.
10. Click **Find racks**. Expected: `Dolo 650` resolves to A3/2; `Cetirizine 10 mg` resolves to B1/4; `Unknown Sample` displays **No exact catalog match**.
11. Turn off network access and repeat a search using already saved catalog data. Expected: existing shop and catalog remain available. Do not expect first-time OCR model downloads to work offline.
12. Try opening in another browser/device. Expected: data is **not** synchronized between devices. This is a known limitation, not a bug.

## 5. Acceptance checklist
- [ ] Homepage opens with no broken styling.
- [ ] Launch pilot navigates to `pilot.html`.
- [ ] A local shop profile can be created.
- [ ] XLSX rows load and remain editable.
- [ ] OCR suggests candidate text from a synthetic rack photo (accuracy assessed manually).
- [ ] No unconfirmed candidate is saved.
- [ ] Confirmed catalog survives page refresh.
- [ ] Synthetic prescription text can be edited.
- [ ] Exact matches show the correct rack and shelf.
- [ ] Unknown or ambiguous medicine is not automatically substituted.
- [ ] Saved catalog is accessible without network after initial load.
- [ ] UI is usable on a mobile-width browser.
- [ ] Browser console has no unexpected errors.

## 6. Record evidence
For each checklist item record: **date/time, browser and version, operating system, pass/fail, actual behavior, screenshot (synthetic data only), and GitHub commit SHA**. File defects as GitHub Issues with reproduction steps, expected/actual result and non-sensitive logs.

## 7. Known gaps / non-goals
- **Not native SQLite:** the hosted pilot uses IndexedDB. Capacitor Android packaging and SQLite require further coding and device verification.
- **Not real registration:** local shop profiles have no passwords, account verification or cloud backup.
- **No real AI understanding of rack layout:** English OCR produces editable candidate text, not guaranteed product identification.
- **Not handwriting-grade prescription OCR:** handwritten or multilingual prescriptions are not validated.
- **No secure ERP sync or stock truth:** rack mapping is not proof of current stock.
- **No medical decision-making:** no automatic substitutions, dosing, dispensing or patient record management.
- **No privacy certification:** do not use patient or production pharmacy data.
- **No cross-device sync:** each browser profile has its own local catalog.

## 8. Hosting and deployment
The repository includes `.github/workflows/pages.yml`, which builds `apps/web` and deploys `dist` to GitHub Pages. A repository administrator must set **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then push to `main` or manually run the Pages workflow. Wait for a successful deployment in **Actions** before opening the Pages URL. If the URL is unavailable, inspect the workflow logs and repository Pages settings. The backend API is not hosted by GitHub Pages.

## 9. Local developer fallback
```bash
git clone https://github.com/durgarao3d6/MediLocate-AI.git
cd MediLocate-AI/apps/web
npm install
npm run dev
```
Open the Vite local address and test `/pilot.html`. To verify the production bundle: `npm run build`.

## 10. Go/no-go for real pilot
**No-go for real patient or pharmacy data** until secure authentication, data separation, consent/privacy handling, encryption, device backup/recovery, OCR safety review and clinical workflow validation are implemented. A synthetic-data usability pilot is acceptable.
