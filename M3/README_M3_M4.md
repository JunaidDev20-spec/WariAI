# M3 + M4 Population Forecasting and Decision System

## Architecture

```
M1 CCTV (Output_m1/crowd_counts.csv)
    ↓
M2 historical/reference data (Output_m2/ — NOT integrated, see M2_ALIGNMENT_REPORT.md)
    ↓
M3 Forecasting
    ↓
    15/30/60-minute population forecast
    ↓
M4 Risk / Decision
    ↓
Dashboard JSON
```

## 1. M1 Input

- **File:** `Output_m1/crowd_counts.csv`
- **Content:** Frame-level crowd counts from CCTV videos.
- **Key field:** `current_population` — instantaneous count of distinct active person tracks per frame.
- **Sessions:** 6 videos (crowd_cars, makkah_madinah, marathon, walking_front, walking_top, Wari_real_vid).
- **Longest session:** ~120 seconds (Wari_real_vid.mp4, walking_front.mp4.mp4).

## 2. M2 Input

- **Files inspected:** `Output_m2/test_population.csv`, `Output_m2/test_crowd_counts.csv`
- **Status:** **NOT USED** — M2 data comes from a different project (GeoAI Physical Occupancy).
- **Reason for exclusion:**
  - `test_crowd_counts.csv` contains only `frame_number` and `people_count` with no timestamps, video names, or zone identifiers.
  - `test_population.csv` has video timestamps but belongs to the GeoAI project, not the Wari CCTV project.
  - No metadata maps M2 frames to M1 sessions.
- **See:** `M2_ALIGNMENT_REPORT.md` for full details.

## 3. M3 Preprocessing

1. Parse `Output_m1/crowd_counts.csv` row by row.
2. Validate each row (10 columns, non-negative population, valid timestamps).
3. Aggregate frame-level data into non-overlapping windows of `AGG_WINDOW_SECONDS` (default: 1.0s).
4. Compute mean `current_population` per window.
5. Group by session (video_name).

## 4. M3 Models

### Real Data (`src/m3_forecasting.py`)

Candidates evaluated on **validation set only**:
- `naive` — persistence (last observed value)
- `mean` — training set mean
- `ma3` — moving average of last 3 windows
- `ar_linear` — autoregressive linear regression (lag=3)
- `xgboost` — gradient-boosted trees with time-series features (if installed)

### Synthetic Data (`src/m3_synthetic_forecast.py`)

Candidates:
- `naive`
- `mean`
- `ma_300` — moving average of last 300s
- `exp_smoothing` — single exponential smoothing
- `ar_linear_lag60` — autoregressive linear (lag=60)
- `linear_trend`
- `xgboost` — if installed

## 5. XGBoost Features

All features are computed **only from past data** (no future leakage):

| Feature | Description |
|---------|-------------|
| `lag_1` | value at t-1 |
| `lag_2` | value at t-2 |
| `lag_3` | value at t-3 |
| `lag_5` | value at t-5 |
| `rolling_mean_5` | mean of last 5 points |
| `rolling_std_5` | std of last 5 points |
| `trend_slope_5` | OLS slope over last 5 points |
| `elapsed_time` | seconds since series start |
| `sin_2pi_t_120` | cyclical 120s period |
| `cos_2pi_t_120` | cyclical 120s period |

## 6. Train / Validation / Test Methodology

- **Chronological split** — data is never shuffled.
- **Fractions:** 60% train / 20% validation / 20% test.
- **Model selection:** uses validation MAE **only**.
- **Final evaluation:** test set is held out and used only once for unbiased evaluation.
- **No future data leakage:** features use only values available at or before the forecast origin.

## 7. 15/30/60-Minute Forecasting

| Data Source | 1-second | 15-minute | 30-minute | 60-minute |
|-------------|----------|-----------|-----------|-----------|
| **REAL (M1)** | **VALIDATED** | NOT VALIDATED | NOT VALIDATED | NOT VALIDATED |
| **SYNTHETIC** | — | VALIDATED | VALIDATED | VALIDATED |

Real M1 sessions max at ~120 seconds. 15/30/60-minute horizons require at least 900/1800/3600 seconds of history, which does not exist in the real data. These horizons are explicitly marked as extrapolations.

## 8. Confidence Calculation

- **Method:** 80% prediction interval via residual standard deviation.
- **Formula:** `half_width = 1.28 * sample_std(validation_residuals)`
- **Derived from:** validation residuals of the selected best model.
- **Applied symmetrically:** `[forecast - half_width, forecast + half_width]`
- **Never hardcoded to 0.5.**

## 9. M4 Risk Calculation

Transparent deterministic rules using configurable thresholds:

| Risk Level | Threshold (population) | Action |
|------------|------------------------|--------|
| LOW | < 100 | PROCEED |
| MODERATE | 100 – 500 | MONITOR |
| HIGH | 500 – 1000 | PREPARE |
| CRITICAL | > 1000 | RESTRICT |

**Important:** If 15/30/60-minute forecasts are NOT VALIDATED, M4 uses `current_population` for risk classification rather than fabricating a numeric forecast.

## 10. Dashboard Output

### Real M3 Dashboard
- **Location:** `outputs/real/m3_dashboard.json`
- **Format:** JSON array of forecast entries with `source`, `zone`, `current_population`, `forecast_15min`, `forecast_30min`, `forecast_60min`, `expected_average_population_60min`, `expected_peak_population_60min`, `confidence`, `prediction_interval`, `model`, `metrics`, `validation_status`.

### Real M4 Decision
- **Location:** `outputs/real/m4_decision.json`
- **Format:** JSON with `m4_label`, `total_forecasts`, `risk_distribution`, `action_distribution`, `decisions[]`.

### Synthetic Dashboard
- **Location:** `outputs/synthetic/synthetic_dashboard.json`
- **Format:** Same structure, explicitly labelled `SYNTHETIC/DEMO`.

## 11. Real-Data Limitations

- Maximum session duration: ~120 seconds.
- No 15/30/60-minute historical data available.
- M2 data not aligned with M1.
- Small validation sets (2-23 windows) limit model selection reliability.
- All long-horizon forecasts are extrapolations, not validated predictions.

## 12. Synthetic/Demo Limitations

- Synthetic data is generated programmatically and does **not** represent real Wari data.
- Long-horizon validation on synthetic data validates the *pipeline methodology*, not real-world accuracy.
- Thresholds are demo values; real thresholds require domain expertise.

## 13. Commands to Run the Complete Pipeline

```powershell
# 1. Generate synthetic dataset
python src/m3_generate_synthetic.py

# 2. Run REAL M3 forecasting
python src/m3_forecasting.py

# 3. Run SYNTHETIC M3 forecasting
python src/m3_synthetic_forecast.py

# 4. Run M4 decision module (consumes both real and synthetic M3 outputs)
python src/m4_decision.py

# 5. Run automated validation
python src/m3_validate.py
```

## Output Structure

```
outputs/
├── real/
│   ├── m3_dashboard.json
│   ├── m3_metrics.csv
│   ├── m3_model.json
│   ├── m3_predictions.csv
│   ├── m3_report.txt
│   └── m4_decision.json
├── synthetic/
│   ├── synthetic_dashboard.json
│   ├── synthetic_metrics.csv
│   ├── synthetic_model.json
│   ├── synthetic_predictions.csv
│   ├── synthetic_report.txt
│   └── m4_decision.json
├── m3_dashboard.json              (legacy flat output — can be removed)
├── m3_m4_decision_dashboard.json  (legacy flat output — can be removed)
└── ...
```

## Dependencies

See `requirements.txt`. Key packages:
- `pandas`, `numpy`, `scikit-learn` — data handling
- `xgboost` — gradient-boosted forecasting candidate (optional but recommended)
