# Mobile model evaluation — research shortlist (2026-11-16)

## Principle
Prefer local indexed medicine search over LLM inference. Models are only used for speech, OCR, or demonstrably useful language understanding. Resolve candidates against the pharmacy's verified catalog and require pharmacist confirmation for ambiguous medicines, strengths or formulations.

## Candidate matrix
| Task | Candidate | Role | Decision |
|---|---|---|---|
| Medicine lookup | SQLite FTS5 + fuzzy matching | On-device retrieval | Adopt baseline |
| Multilingual ASR | whisper.cpp multilingual tiny/base | Offline voice | Benchmark first |
| Alternative ASR | sherpa-onnx | Android offline voice; Indic model packs possible | Benchmark second |
| Barcode/QR | ZXing | On-device QR/barcode scanning | Adopt baseline |
| Printed OCR | PaddleOCR PP-OCRv6 tiny / PP-OCRv5 mobile | Android text extraction | Prototype |
| Handwritten Rx | Specialist handwriting OCR/cloud vision | Human-reviewed candidate extraction | Defer |
| Small LLM | Gemma 3 1B / Qwen3 0.6B | Optional intent parsing | Defer |
| Cloud fallback | AWS Bedrock via FastAPI | Only on consented, authorized complex tasks | Later |

## Sources
- https://github.com/ggml-org/whisper.cpp
- https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md
- https://github.com/k2-fsa/sherpa-onnx
- https://huggingface.co/ippocode/indic-asr-onnx (community checkpoint; verify provenance/license)
- https://www.paddleocr.ai/latest/en/version3.x/inference_deployment/cross_platform/android_deployment.html
- https://developers.google.com/mediapipe/solutions/genai/llm_inference/android

## Benchmark plan
Use at least two Android tiers (4 GB and 8 GB RAM if available). Capture synthetic or consented voice queries with noisy-shop conditions across English, Hindi and Telugu, including brand names, strengths and forms. Measure p50/p95 end-to-end latency, peak RAM, model download size, battery impact, word error rate, and catalog top-3 recall. Compare local-only vs cloud fallback under realistic network conditions.

## Decision gates
- Exact strength and formulation must be preserved.
- No automatic substitution, dispensing, or confident result from unverified transcription.
- Local catalog remains functional without network.
- Cloud calls require explicit data handling policy and user permission where appropriate.
- Validate license terms for both model weights and runtime before commercial deployment.

## Implementation order
1. SQLite cache and local search.
2. Android Capacitor shell and QR scanner.
3. whisper.cpp multilingual tiny baseline.
4. sherpa-onnx / Indic ASR comparison.
5. PaddleOCR printed text.
6. Optional AWS fallback and small LLM evaluation.
