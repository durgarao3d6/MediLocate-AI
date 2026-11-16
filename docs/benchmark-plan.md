# Benchmark plan for the MVP

## Local search
Generate 1000 synthetic rows:
```bash
python scripts/generate_synthetic_inventory.py --count 1000
```
Import via the UI or POST /api/v1/imports in the local Docker environment. Sync the offline catalog; disconnect network and test typo-tolerant search. Record median and p95 response time over at least 100 representative queries.

## Voice models (not integrated)
Compare whisper.cpp multilingual tiny/base against sherpa-onnx on 4GB/8GB Android phones. Collect consented non-patient utterances of medicine names and strengths in English, Hindi and Telugu. Measure cold-start, p50/p95 latency, peak RAM, word error rate, catalog recall@3, and false strength matches.

## OCR (not integrated)
Evaluate PaddleOCR on synthetic printed prescriptions, low-light photos and medicine labels. Human-review every result; no autonomous medicine selection.

## Security
Use only synthetic catalog data until authentication, store separation, audit logging and transport security are complete. Never upload real prescriptions to unapproved cloud providers.
