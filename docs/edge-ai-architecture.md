# Edge-first AI architecture (proposed)

## Decision
Prefer offline-first Android processing. Retain the React PWA for browser/admin use and evaluate Capacitor Android packaging for native on-device inference. Do not require an LLM for medicine lookup.

## Local pipeline
1. Sync authorized catalog + rack/shelf mappings into a tenant/store-scoped SQLite cache, with freshness metadata and device authorization.
2. Text search: exact + indexed + fuzzy candidate retrieval, constrained by strength and formulation.
3. Voice: benchmark quantized whisper.cpp on representative low/mid-range Android devices with Telugu, Hindi, English and shop noise.
4. QR/barcode: on-device scanner. OCR: evaluate printed text on-device before introducing handwritten prescription processing.
5. Show verified catalog candidates and require human confirmation on ambiguity. Never autonomously choose substitutes or authorize dispensing.

## Cloud fallback
Only when connectivity, consent, policy and authorization permit. Route through FastAPI to approved AWS Bedrock or a hosted model. Apply timeouts, bounded retries, rate limits, cost budgets and audit records. Never silently upload prescription photos or patient information. When offline or fallback fails, provide manual search/review rather than inventing a match.

## Evaluation gates
Benchmark on representative shop phones: median/p95 latency, memory, battery, recognition error rate, catalog recall@k, false medicine/strength matches, offline behavior and sync conflict rates. Product identity must be resolved against verified records.

## Implementation phases
- Phase A: existing React PWA + FastAPI local search (no cloud AI)
- Phase B: Android shell + SQLite cache + sync protocol
- Phase C: native voice and QR scanning
- Phase D: optional cloud fallback with privacy controls

This is a design decision, not a claim that native models or cloud fallback are already implemented.
