# GeoAI Physical Occupancy and Gathering-Zone Detection

This project turns registered imagery and GIS layers into explainable, GIS-ready gathering-zone decision support. It deliberately separates **model evidence** (semantic land-cover / occupancy classification) from **planning inference** (constraints, accessibility, capacity, and ranking).

## What it produces

- classified and confidence GeoTIFFs
- candidate-zone GeoJSON and GeoPackage, with area, capacity scenarios, access, and risk attributes
- an interactive Leaflet map (`map.html`)
- evaluation metrics, confusion matrix, and per-class IoU

## Quick start

1. Create a virtual environment and install dependencies:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. Copy and edit `configs/mukam.example.yaml`. Inputs must be spatially registered. The imagery is a multiband GeoTIFF; vectors are GeoJSON/GeoPackage/Shapefile layers.

   Prepare labels as a one-band, grid-aligned GeoTIFF (classes 0–9; `255` ignore) and build tiles per whole Mukam:

   ```powershell
   python scripts/prepare_tiles.py --config configs/mukam.example.yaml --labels data/example_mukam/labels.tif --split train
   ```

   Allocate a Mukam to exactly one of `train`, `valid`, or `test`; do not split nearby tiles across them. Train/evaluate with `scripts/train.py` and `scripts/evaluate.py`.

3. Run inference:

   ```powershell
   python scripts/run_inference.py --config configs/mukam.example.yaml --checkpoint models/occupancy.ckpt
   ```

The default implementation supports a rule-based fallback for a smoke test, but production results require a trained checkpoint and reviewed constraints. See [docs/design.md](docs/design.md).
