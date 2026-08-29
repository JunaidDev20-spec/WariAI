# Design and operational guidance

## Architecture and data contract

The production baseline is a U-Net with a ResNet-34 encoder. It is a practical first model because it preserves local boundaries, is economical on limited training data, and runs quickly on ordinary GPUs. Its input is a raster-aligned stack of imagery bands, Sentinel-2 indices (NDVI/NDWI when the stack uses conventional Sentinel band order), and auditable GIS channels for buildings, roads, paths, water, restricted land, and hazards.

Compare this baseline against DeepLabV3+ or SegFormer using the same geographic holdout folds. Select the deployable model by usable-class IoU, boundary F1, false-positive usable-area rate, inference time, and the held-out-Mukam result—not a single aggregate benchmark.

Every source must have a stated license, acquisition date, CRS, resolution, and provenance. Use a local projected CRS in metres for area, buffers, and distance metrics; do not calculate these in EPSG:4326.

## Labels and splits

Use classes 0–9 defined in `src/geoai_occupancy/__init__.py`; retain `255` as ignore/no-data. Annotators create polygon masks with `mukam_id`, `polygon_id`, class, source, confidence, date, and reviewer. Rasterize only after resolving conflicts using a documented precedence: water/restricted/hazard/building override candidate land.

Create train/validation/test manifests by Mukam, never by randomly shuffling tiles. Report both ordinary within-region validation and a leave-one-Mukam-out test. A model may only be considered generalizable when it performs acceptably on unseen Mukams.

## Planning inference, not a crowd-behaviour claim

The neural network supplies class probabilities and a pixel confidence band. `analysis.py` then removes buffered buildings, water, restricted land, and hazards, computes access distance, and applies explicitly configurable density scenarios. These are planning assumptions—not observations of crowd behaviour.

The supplied defaults are low/medium/high = 0.5/1.0/2.0 people per m². Validate them with the responsible safety authority before use. No output should be used as an evacuation authorization, capacity certification, or real-time crowd forecast without field verification.

## Acceptance checklist

- Review false-positive usable ground manually; it is a primary safety failure.
- Inspect output GeoTIFF and zones in QGIS against all constraint layers.
- Check unknown regions, cloud/no-data, imagery age, and OSM completeness.
- Validate access/egress and emergency use on site.
- Calibrate thresholds, buffers, density, minimum zone area, and scoring per Mukam.
- Preserve model version, config, inputs, annotation revision, and run date with each release.
