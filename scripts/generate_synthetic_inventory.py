"""Generate non-clinical fake catalog data for performance testing only."""
import argparse
import csv
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--output", type=Path, default=Path("sample-data/synthetic-1000.csv"))
    args = parser.parse_args()
    if not 1 <= args.count <= 5000:
        parser.error("--count must be 1..5000")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["external_id","name","strength","quantity","unit"])
        for i in range(1, args.count+1):
            writer.writerow([f"TEST{i:05d}",f"Synthetic Medicine {i:05d}",f"{(i%20+1)*5} mg",i%50,"packs"])
    print(f"Wrote {args.count} synthetic entries to {args.output}")

if __name__ == "__main__":
    main()
