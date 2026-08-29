"""
M3 Synthetic Long-Horizon Forecasting Pipeline
-----------------------------------------------------------------------
FOR SYNTHETIC DATA ONLY.

Trains and evaluates forecasting models on synthetic_population_timeseries.csv.
Forecast horizons: 15, 30, 60 minutes.
Models: naive persistence, mean baseline, MA-300, exponential smoothing,
        AR-Linear(lag=60), linear trend, XGBoost (optional).

All results are explicitly labeled as SYNTHETIC/DEMO.

CHANGES (methodology fixes):
- Dataset extended to 210 min/zone for genuine 15/30/60-min ground truth
- Exponential smoothing state rebuilt fresh per evaluation (no leakage)
- Model selection uses validation set only; test set remains untouched
- Prediction intervals derived from validation residual distribution
- Dashboard stores actual forecast population values, not error metrics
- 15/30/60-min metrics computed independently from distinct future windows
- XGBoost added as optional model with proper time-series features
"""

import csv
import json
import math
from collections import defaultdict
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------
SYNTHETIC_CSV = Path("outputs/synthetic_population_timeseries.csv")
OUTPUT_DIR = Path("outputs")

PREDICTIONS_CSV = OUTPUT_DIR / "synthetic_predictions.csv"
METRICS_CSV = OUTPUT_DIR / "synthetic_metrics.csv"
DASHBOARD_JSON = OUTPUT_DIR / "synthetic_dashboard.json"
REPORT_TXT = OUTPUT_DIR / "synthetic_report.txt"
MODEL_JSON = OUTPUT_DIR / "synthetic_model.json"

# Time settings (seconds)
TOTAL_DURATION = 12600.0  # 210 minutes per zone
TRAIN_DURATION = 7200.0   # 120 minutes
VAL_DURATION = 1800.0     # 30 minutes
TEST_DURATION = 3600.0    # 60 minutes  -- must be >= longest horizon (60 min)
SAMPLING_INTERVAL = 1.0   # 1-second sampling

# Forecast horizons in minutes
HORIZONS_MIN = [15, 30, 60]

# Model settings
LAG_ORDER = 60
MA_WINDOW = 300
ES_ALPHA = 0.3

# Prediction interval: 80% interval via residual std * 1.28
PI_Z_SCORE = 1.28

# XGBoost availability
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
    print(f"[INFO] XGBoost version {xgb.__version__} is available.")
except ImportError:
    XGBOOST_AVAILABLE = False
    print("[INFO] XGBoost is NOT installed. XGBoost model will be skipped.")


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def compute_metrics(actuals, predictions):
    """Return (MAE, RMSE) rounded to 4 decimals, or (None, None) if empty."""
    if len(actuals) == 0:
        return None, None
    errors = [a - p for a, p in zip(actuals, predictions)]
    mae = sum(abs(e) for e in errors) / len(errors)
    rmse = math.sqrt(sum(e * e for e in errors) / len(errors))
    return round(mae, 4), round(rmse, 4)


def linear_regression_coefficients(X, y):
    """Ordinary least squares for single-target linear regression."""
    n = len(X)
    if n == 0:
        return None
    d = len(X[0])
    if d == 0:
        return None

    XtX = [[0.0] * (d + 1) for _ in range(d + 1)]
    Xty = [0.0] * (d + 1)

    for i in range(n):
        row = [1.0] + X[i]
        for j in range(d + 1):
            for k in range(d + 1):
                XtX[j][k] += row[j] * row[k]
            Xty[j] += row[j] * y[i]

    for i in range(d + 1):
        max_row = i
        max_val = abs(XtX[i][i])
        for r in range(i + 1, d + 1):
            if abs(XtX[r][i]) > max_val:
                max_val = abs(XtX[r][i])
                max_row = r
        if max_val < 1e-12:
            return None
        if max_row != i:
            XtX[i], XtX[max_row] = XtX[max_row], XtX[i]
            Xty[i], Xty[max_row] = Xty[max_row], Xty[i]

        pivot = XtX[i][i]
        for j in range(i, d + 1):
            XtX[i][j] /= pivot
        Xty[i] /= pivot
        for r in range(d + 1):
            if r != i and abs(XtX[r][i]) > 1e-12:
                factor = XtX[r][i]
                for j in range(i, d + 1):
                    XtX[r][j] -= factor * XtX[i][j]
                Xty[r] -= factor * Xty[i]

    return Xty


def predict_lr(coefs, features):
    if coefs is None or len(features) != len(coefs) - 1:
        return None
    pred = coefs[0]
    for i, f in enumerate(features):
        pred += coefs[i + 1] * f
    return pred


def forecast_recursive(model_func, history, horizon):
    """Recursively forecast horizon steps ahead using model_func."""
    preds = []
    h = history[:]
    for _ in range(horizon):
        pred = model_func(h)
        if pred is None:
            pred = h[-1]
        pred = max(0.0, pred)
        preds.append(pred)
        h.append(pred)
    return preds


# ------------------------------------------------------------------
# TIME-SERIES FEATURE ENGINEERING FOR XGBOOST
# All features are generated ONLY from data available BEFORE the
# forecast origin. No future information is used.
# ------------------------------------------------------------------
def build_ts_features(history, t_idx, max_lag=60):
    """
    Build feature vector for time t using only history[:t_idx].
    
    Features:
      - lag_1, lag_5, lag_10, lag_30, lag_60
      - rolling_mean_60
      - rolling_std_60
      - trend_slope_60 (linear regression slope over last 60 points)
      - elapsed_time (seconds since start)
      - sin_2pi_t_120, cos_2pi_t_120 (cyclical 120s period)
    """
    if t_idx < max_lag:
        return None
    
    window = history[t_idx - max_lag:t_idx]
    
    # Lags
    lag_1 = history[t_idx - 1]
    lag_5 = history[t_idx - 5]
    lag_10 = history[t_idx - 10]
    lag_30 = history[t_idx - 30]
    lag_60 = history[t_idx - 60]
    
    # Rolling statistics over last 60 seconds
    roll_mean = sum(window) / len(window)
    roll_std = math.sqrt(sum((x - roll_mean)**2 for x in window) / len(window))
    
    # Trend (slope) over last 60 seconds using OLS
    n = len(window)
    x_mean = (n - 1) / 2.0
    y_mean = roll_mean
    num = sum((i - x_mean) * (window[i] - y_mean) for i in range(n))
    den = sum((i - x_mean)**2 for i in range(n))
    trend_slope = num / den if den != 0 else 0.0
    
    # Elapsed time (in seconds)
    elapsed = t_idx * SAMPLING_INTERVAL
    
    # Cyclical time features (120-second period matches generator)
    angle = 2.0 * math.pi * elapsed / 120.0
    sin_t = math.sin(angle)
    cos_t = math.cos(angle)
    
    return [
        lag_1, lag_5, lag_10, lag_30, lag_60,
        roll_mean, roll_std, trend_slope,
        elapsed, sin_t, cos_t
    ]


def build_training_matrix(train_vals, max_lag=60):
    """
    Build (X, y) training matrix from train_vals.
    Each row x_t uses features from train_vals[:t] to predict train_vals[t].
    """
    X, y = [], []
    for t in range(max_lag, len(train_vals)):
        features = build_ts_features(train_vals, t, max_lag)
        if features is not None:
            X.append(features)
            y.append(train_vals[t])
    return X, y


def make_xgboost(train_vals, max_lag=60):
    """
    Train an XGBoost model on train_vals and return a forecasting function.
    The forecasting function accepts a history list and returns one value.
    """
    if not XGBOOST_AVAILABLE:
        raise RuntimeError("XGBoost is not installed")
    
    X, y = build_training_matrix(train_vals, max_lag)
    if len(X) == 0:
        raise ValueError("Insufficient training data for XGBoost")
    
    dtrain = xgb.DMatrix(X, label=y)
    params = {
        "objective": "reg:squarederror",
        "eval_metric": "rmse",
        "max_depth": 5,
        "eta": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 1,
        "silent": 1,
        "nthread": 1,
    }
    num_round = 50
    bst = xgb.train(params, dtrain, num_round, verbose_eval=False)
    
    def model(history):
        t = len(history)
        features = build_ts_features(history, t, max_lag)
        if features is None:
            return history[-1]
        dtest = xgb.DMatrix([features])
        pred = float(bst.predict(dtest)[0])
        return max(0.0, pred)
    
    return model


# ------------------------------------------------------------------
# MODEL FACTORIES
# Each factory receives training values and returns a model function.
# The model function accepts the full history list and returns one
# forecast value.  State is NOT shared between separate evaluations.
# ------------------------------------------------------------------
def make_naive(train_vals):
    last = train_vals[-1]
    return lambda h: last


def make_mean(train_vals):
    mean_val = sum(train_vals) / len(train_vals)
    return lambda h: mean_val


def make_ma(train_vals, window=MA_WINDOW):
    def model(h):
        if len(h) < window:
            return sum(h) / len(h)
        return sum(h[-window:]) / window
    return model


def make_es(train_vals, alpha=ES_ALPHA):
    last = train_vals[-1]

    def model(h):
        nonlocal last
        pred = alpha * h[-1] + (1 - alpha) * last
        last = pred
        return pred

    return model


def make_ar(train_vals, lag=LAG_ORDER):
    X, y = [], []
    for i in range(lag, len(train_vals)):
        X.append(train_vals[i - lag:i])
        y.append(train_vals[i])
    coefs = linear_regression_coefficients(X, y)
    if coefs is None:
        return lambda h: h[-1]
    return lambda h: predict_lr(coefs, h[-lag:]) or h[-1]


def make_trend(train_vals):
    n = len(train_vals)
    x_mean = (n - 1) / 2.0
    y_mean = sum(train_vals) / n
    num = sum((i - x_mean) * (train_vals[i] - y_mean) for i in range(n))
    den = sum((i - x_mean) ** 2 for i in range(n))
    slope = num / den if den != 0 else 0.0
    intercept = y_mean - slope * x_mean
    return lambda h: max(0.0, intercept + slope * len(h))


model_factories = {
    "naive": make_naive,
    "mean": make_mean,
    "ma_300": lambda tv: make_ma(tv, window=300),
    "exp_smoothing": make_es,
    "ar_linear_lag60": lambda tv: make_ar(tv, lag=60),
    "linear_trend": make_trend,
}

# Add XGBoost if available
if XGBOOST_AVAILABLE:
    model_factories["xgboost"] = lambda tv: make_xgboost(tv, max_lag=60)


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
def main():
    print("=" * 70)
    print("M3 SYNTHETIC LONG-HORIZON FORECASTING PIPELINE")
    print("=" * 70)
    print("\nNOTE: All results are SYNTHETIC/DEMO only.")
    print("      This does NOT validate forecasting on real Wari data.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. LOAD SYNTHETIC DATA
    # ------------------------------------------------------------------
    print("\n[1] Loading synthetic dataset ...")
    zone_data = defaultdict(list)
    with SYNTHETIC_CSV.open("r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            zone_data[row["zone_id"]].append({
                "timestamp": float(row["timestamp"]),
                "population": float(row["population"]),
            })

    zone_ids = sorted(zone_data.keys())
    for zone_id in zone_ids:
        zone_data[zone_id].sort(key=lambda r: r["timestamp"])
        print(f"  - {zone_id}: {len(zone_data[zone_id])} rows "
              f"(t={zone_data[zone_id][0]['timestamp']:.0f} to "
              f"t={zone_data[zone_id][-1]['timestamp']:.0f} s)")

    # Verify sufficient rows
    required_rows = int(TOTAL_DURATION / SAMPLING_INTERVAL)
    for zone_id in zone_ids:
        actual_rows = len(zone_data[zone_id])
        if actual_rows < required_rows:
            print(f"  ERROR: {zone_id} rows={actual_rows} < required {required_rows}")
            return

    # ------------------------------------------------------------------
    # 2. CHRONOLOGICAL SPLIT
    # ------------------------------------------------------------------
    print("\n[2] Creating chronological train/validation/test splits ...")
    train_steps = int(TRAIN_DURATION / SAMPLING_INTERVAL)
    val_steps = int(VAL_DURATION / SAMPLING_INTERVAL)
    test_steps = int(TEST_DURATION / SAMPLING_INTERVAL)

    splits = {}
    for zone_id in zone_ids:
        rows = zone_data[zone_id]
        train = rows[:train_steps]
        val = rows[train_steps:train_steps + val_steps]
        test = rows[train_steps + val_steps:train_steps + val_steps + test_steps]
        splits[zone_id] = {"train": train, "val": val, "test": test}
        print(f"  - {zone_id}: train={len(train)} ({TRAIN_DURATION/60:.0f}min) | "
              f"val={len(val)} ({VAL_DURATION/60:.0f}min) | "
              f"test={len(test)} ({TEST_DURATION/60:.0f}min)")

    # ------------------------------------------------------------------
    # 3. TRAIN, VALIDATE, SELECT MODELS, EVALUATE
    # ------------------------------------------------------------------
    print(f"\n[3] Training, validating, and evaluating forecast horizons ...")
    print(f"     Models evaluated: {', '.join(model_factories.keys())}")
    all_predictions = []
    all_metrics = []
    dashboard_entries = []

    for zone_id in zone_ids:
        split = splits[zone_id]
        train_vals = [r["population"] for r in split["train"]]
        val_vals = [r["population"] for r in split["val"]]
        test_vals = [r["population"] for r in split["test"]]

        # horizons in steps
        horizon_steps = {h: int(h * 60 / SAMPLING_INTERVAL) for h in HORIZONS_MIN}

        # ------------------------------------------------------------------
        # 3a. Validate all models on ALL horizons
        # ------------------------------------------------------------------
        # val_results[model][horizon] = {"mae", "rmse", "preds", "actuals"}
        val_results = {}
        for model_name, factory in model_factories.items():
            val_results[model_name] = {}
            for h in HORIZONS_MIN:
                hs = horizon_steps[h]
                try:
                    model_func = factory(train_vals)
                    preds = forecast_recursive(model_func, train_vals[:], hs)
                    actuals = val_vals[:hs]
                    mae, rmse = compute_metrics(actuals, preds)
                    val_results[model_name][h] = {
                        "mae": mae, "rmse": rmse,
                        "preds": preds, "actuals": actuals
                    }
                except Exception as e:
                    print(f"  WARNING: {zone_id} {model_name} @ {h}min failed: {e}")
                    val_results[model_name][h] = {"mae": None, "rmse": None,
                                                   "preds": [], "actuals": []}

        # ------------------------------------------------------------------
        # 3b. Select best model: lowest max MAE across all validation horizons
        # ------------------------------------------------------------------
        best_model_name = None
        best_val_max_mae = float("inf")

        for model_name in model_factories:
            max_mae = 0.0
            valid = True
            for h in HORIZONS_MIN:
                mae = val_results[model_name][h]["mae"]
                if mae is None:
                    valid = False
                    break
                if mae > max_mae:
                    max_mae = mae
            if valid and max_mae < best_val_max_mae:
                best_val_max_mae = max_mae
                best_model_name = model_name

        if best_model_name is None:
            print(f"  WARNING: No valid model for {zone_id}, skipping.")
            continue

        print(f"\n  [{zone_id}] Best model: {best_model_name} "
              f"(max val MAE across horizons = {best_val_max_mae})")
        for h in HORIZONS_MIN:
            r = val_results[best_model_name][h]
            print(f"    Val {h}min -> MAE: {r['mae']}, RMSE: {r['rmse']}")

        # ------------------------------------------------------------------
        # 3c. Compute prediction intervals from validation residuals
        # ------------------------------------------------------------------
        pi_info = {}
        for h in HORIZONS_MIN:
            vr = val_results[best_model_name][h]
            residuals = [a - p for a, p in zip(vr["actuals"], vr["preds"])]
            if len(residuals) > 1:
                mean_res = sum(residuals) / len(residuals)
                std_res = math.sqrt(
                    sum((r - mean_res)**2 for r in residuals) / (len(residuals) - 1)
                )
                pi_half_width = round(PI_Z_SCORE * std_res, 4)
            else:
                pi_half_width = None
            pi_info[h] = {
                "half_width": pi_half_width,
                "residual_mean": round(sum(residuals) / len(residuals), 4) if residuals else None,
                "residual_std": round(std_res, 4) if len(residuals) > 1 else None,
                "coverage": "80%",
            }

        # ------------------------------------------------------------------
        # 3d. Evaluate best model on test set at each horizon
        # ------------------------------------------------------------------
        horizon_metrics = {}
        horizon_preds = {}
        for h_min in HORIZONS_MIN:
            hs = horizon_steps[h_min]
            model_func = model_factories[best_model_name](train_vals)
            preds = forecast_recursive(model_func, train_vals[:], hs)
            actuals = test_vals[:hs]
            mae, rmse = compute_metrics(actuals, preds)
            horizon_metrics[f"{h_min}min"] = {
                "mae": mae, "rmse": rmse, "horizon_steps": hs
            }
            horizon_preds[f"{h_min}min"] = preds
            print(f"    Test {h_min}min ({hs} steps) -> MAE: {mae}, RMSE: {rmse}")

        # ------------------------------------------------------------------
        # 3e. Store per-step predictions for all horizons
        # ------------------------------------------------------------------
        for h_min in HORIZONS_MIN:
            hs = horizon_steps[h_min]
            preds = horizon_preds[f"{h_min}min"]
            for i in range(min(hs, len(test_vals))):
                all_predictions.append({
                    "zone_id": zone_id,
                    "timestamp": split["test"][i]["timestamp"],
                    "actual": round(test_vals[i], 4),
                    "predicted": round(preds[i], 4),
                    "horizon": f"{h_min}min",
                    "split": "test",
                })

        # ------------------------------------------------------------------
        # 3f. Compute expected average and peak from actual 60-min forecasts
        # ------------------------------------------------------------------
        future_60 = horizon_preds["60min"]
        expected_avg = round(sum(future_60) / len(future_60), 4)
        expected_peak = round(max(future_60), 4)

        # ------------------------------------------------------------------
        # 3g. Build dashboard entry
        # ------------------------------------------------------------------
        current_pop = train_vals[-1]

        dashboard_entries.append({
            "source": "SYNTHETIC_M3_DEMO",
            "zone_id": zone_id,
            "forecast_generated_at": "2026-08-29T05:00:00Z",
            "data_label": "SYNTHETIC/DEMO — NOT REAL WARI DATA",
            "data_source": str(SYNTHETIC_CSV),
            "current_population": round(current_pop, 4),
            "forecast_15min": round(horizon_preds["15min"][-1], 4),
            "forecast_30min": round(horizon_preds["30min"][-1], 4),
            "forecast_60min": round(horizon_preds["60min"][-1], 4),
            "expected_average_population_60min": expected_avg,
            "expected_peak_population_60min": expected_peak,
            "prediction_interval": {
                "coverage": "80%",
                "method": "residual_std_zscore",
                "z_score": PI_Z_SCORE,
                "derived_from": "validation_residuals_best_model",
                "half_width_15min": pi_info[15]["half_width"],
                "half_width_30min": pi_info[30]["half_width"],
                "half_width_60min": pi_info[60]["half_width"],
                "residual_std_15min": pi_info[15]["residual_std"],
                "residual_std_30min": pi_info[30]["residual_std"],
                "residual_std_60min": pi_info[60]["residual_std"],
            },
            "model": best_model_name,
            "metrics": {
                "15min": {
                    "mae": horizon_metrics["15min"]["mae"],
                    "rmse": horizon_metrics["15min"]["rmse"],
                },
                "30min": {
                    "mae": horizon_metrics["30min"]["mae"],
                    "rmse": horizon_metrics["30min"]["rmse"],
                },
                "60min": {
                    "mae": horizon_metrics["60min"]["mae"],
                    "rmse": horizon_metrics["60min"]["rmse"],
                },
            },
            "validation": {
                "best_model_selection_criterion": "lowest_max_MAE_across_horizons",
                "max_val_mae_across_horizons": round(best_val_max_mae, 4),
                "15min": {
                    "mae": val_results[best_model_name][15]["mae"],
                    "rmse": val_results[best_model_name][15]["rmse"],
                },
                "30min": {
                    "mae": val_results[best_model_name][30]["mae"],
                    "rmse": val_results[best_model_name][30]["rmse"],
                },
                "60min": {
                    "mae": val_results[best_model_name][60]["mae"],
                    "rmse": val_results[best_model_name][60]["rmse"],
                },
            },
            "notes": (
                "SYNTHETIC/DEMO results only. "
                "Does not validate forecasting on real Wari data. "
                "Peak = max predicted population in 60-min horizon. "
                "PI: 80% residual-based (z=1.28*std_val_residuals)."
            ),
        })

        # ------------------------------------------------------------------
        # 3h. Store metrics row
        # ------------------------------------------------------------------
        metric_row = {
            "zone_id": zone_id,
            "best_model": best_model_name,
            "best_model_selection": "lowest_max_MAE_across_15_30_60min_val",
            "val_max_mae_across_horizons": round(best_val_max_mae, 4),
        }
        for h in HORIZONS_MIN:
            key = f"{h}min"
            vr = val_results[best_model_name][h]
            hm = horizon_metrics[key]
            metric_row[f"val_mae_{key}"] = vr["mae"]
            metric_row[f"val_rmse_{key}"] = vr["rmse"]
            metric_row[f"test_mae_{key}"] = hm["mae"]
            metric_row[f"test_rmse_{key}"] = hm["rmse"]
        all_metrics.append(metric_row)

    # ------------------------------------------------------------------
    # 4. SAVE OUTPUTS
    # ------------------------------------------------------------------
    with PREDICTIONS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "zone_id", "timestamp", "actual", "predicted", "horizon", "split"
        ])
        writer.writeheader()
        for r in all_predictions:
            writer.writerow(r)

    if all_metrics:
        with METRICS_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_metrics[0].keys())
            writer.writeheader()
            for r in all_metrics:
                writer.writerow(r)

    with DASHBOARD_JSON.open("w", encoding="utf-8") as f:
        json.dump({
            "DISCLAIMER": "SYNTHETIC/DEMO DATA ONLY — NOT REAL WARI DATA",
            "forecasts": dashboard_entries,
            "meta": {
                "data_source": str(SYNTHETIC_CSV),
                "data_label": "SYNTHETIC",
                "sampling_interval_seconds": SAMPLING_INTERVAL,
                "train_duration_seconds": TRAIN_DURATION,
                "val_duration_seconds": VAL_DURATION,
                "test_duration_seconds": TEST_DURATION,
                "forecast_horizons_minutes": HORIZONS_MIN,
                "models_evaluated": list(model_factories.keys()),
                "best_model_selection": "lowest max validation MAE across 15/30/60-min",
                "prediction_interval_method": (
                    "80% residual-based: z=1.28 * std(validation residuals) "
                    "from best model per zone per horizon"
                ),
                "peak_definition": (
                    "maximum predicted population within the 60-min forecast horizon"
                ),
                "supported_horizons": ["15 minutes", "30 minutes", "60 minutes"],
                "validation_note": (
                    "Long-horizon results validated on synthetic data only. "
                    "Test set held out during training and model selection."
                ),
            }
        }, f, indent=2)

    with MODEL_JSON.open("w", encoding="utf-8") as f:
        json.dump({
            "models": list(model_factories.keys()),
            "best_model_selection": "lowest max validation MAE across 15/30/60-min",
            "lag_order": LAG_ORDER,
            "ma_window": MA_WINDOW,
            "es_alpha": ES_ALPHA,
            "xgboost_available": XGBOOST_AVAILABLE,
            "xgboost_features": [
                "lag_1", "lag_5", "lag_10", "lag_30", "lag_60",
                "rolling_mean_60", "rolling_std_60", "trend_slope_60",
                "elapsed_time", "sin_2pi_t_120", "cos_2pi_t_120"
            ] if XGBOOST_AVAILABLE else [],
            "prediction_interval": {
                "method": "residual_std_zscore",
                "coverage": "80%",
                "z_score": PI_Z_SCORE,
                "description": (
                    "For each zone and horizon, compute residuals from best "
                    "model's validation predictions. PI half-width = 1.28 * "
                    "sample_std(residuals). Applied symmetrically to forecasts."
                ),
            },
            "es_state_leakage_prevention": (
                "Exponential smoothing model is rebuilt fresh (state reset) "
                "for each independent evaluation (every horizon, every zone). "
                "The nonlocal 'last' variable is scoped inside make_es() and "
                "is not shared across separate factory() calls."
            ),
            "data_splits": {
                "train_seconds": TRAIN_DURATION,
                "val_seconds": VAL_DURATION,
                "test_seconds": TEST_DURATION,
                "total_seconds": TOTAL_DURATION,
            },
            "disclaimer": "SYNTHETIC MODEL — NOT TRAINED ON REAL WARI DATA"
        }, f, indent=2)

    with REPORT_TXT.open("w", encoding="utf-8") as f:
        f.write("M3 SYNTHETIC LONG-HORIZON FORECASTING REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write("DISCLAIMER: ALL RESULTS ARE SYNTHETIC/DEMO ONLY.\n")
        f.write("            This does NOT validate forecasting on real Wari data.\n\n")
        f.write(f"Data source: {SYNTHETIC_CSV}\n")
        f.write(f"Zones: {len(zone_ids)}\n")
        f.write(f"Dataset duration per zone: {TOTAL_DURATION/60:.0f} minutes\n")
        f.write(f"Train: {TRAIN_DURATION/60:.0f} min | "
                f"Val: {VAL_DURATION/60:.0f} min | "
                f"Test: {TEST_DURATION/60:.0f} min\n")
        f.write(f"Sampling interval: {SAMPLING_INTERVAL:.0f} second(s)\n")
        f.write(f"Forecast horizons: {HORIZONS_MIN} minutes\n")
        f.write(f"Models: {', '.join(model_factories.keys())}\n")
        f.write(f"XGBoost available: {XGBOOST_AVAILABLE}\n\n")
        f.write("BEST MODEL SELECTION: lowest max validation MAE across 15/30/60-min\n\n")
        f.write("PREDICTION INTERVALS: 80% residual-based (z=1.28 * std of "
                "validation residuals from best model)\n\n")
        f.write("RESULTS:\n")
        for m in all_metrics:
            f.write(f"\nZone: {m['zone_id']}\n")
            f.write(f"  Best model: {m['best_model']}\n")
            f.write(f"  Selection criterion: {m['best_model_selection']}\n")
            f.write(f"  Max val MAE across horizons: {m['val_max_mae_across_horizons']}\n")
            for h in HORIZONS_MIN:
                key = f"{h}min"
                f.write(f"  Val  ({h}min) -> MAE: {m[f'val_mae_{key}']}, "
                        f"RMSE: {m[f'val_rmse_{key}']}\n")
                f.write(f"  Test ({h}min) -> MAE: {m[f'test_mae_{key}']}, "
                        f"RMSE: {m[f'test_rmse_{key}']}\n")

    print(f"\n[4] Saved predictions to:   {PREDICTIONS_CSV}")
    print(f"[5] Saved metrics to:       {METRICS_CSV}")
    print(f"[6] Saved dashboard JSON:   {DASHBOARD_JSON}")
    print(f"[7] Saved model info:       {MODEL_JSON}")
    print(f"[8] Saved report:           {REPORT_TXT}")
    print("\n" + "=" * 70)
    print("SYNTHETIC FORECASTING PIPELINE COMPLETE")
    print("=" * 70)
    print("\nREMINDER: All results are SYNTHETIC/DEMO.")
    print("          Do NOT use these results as real Wari forecasting accuracy.")


if __name__ == "__main__":
    main()
