# Outputs

Generated artifacts from the M1 pipeline.

- `crowd_counts.csv` / `crowd_counts.json` — per-frame crowd counts and metadata.
- `validation_results_top.csv` / `validation_summary_top.json` — top-view validation results.
- `annotated/` — annotated videos with bounding boxes and counts.
- `validation_results/` — extracted validation frames.
- `ablation/` — ablation test results.

Large binary outputs are gitignored; only CSV and JSON results are tracked in Git.
