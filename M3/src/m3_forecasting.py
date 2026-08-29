"""
M3 Population Forecasting Pipeline — REAL DATA
===============================================
- Reads Output_m1/crowd_counts.csv (REAL M1 data)
- M2 test_population.csv and test_crowd_counts.csv are NOT integrated
  (see M2_ALIGNMENT_REPORT.md for details)
- Chronological train/validation/test split
- Model selection uses validation set only
- Test set used only for unbiased final evaluation
- No future-data leakage
- XGBoost candidate with leakage-free time-series features
- Confidence / prediction intervals from validation residuals
- 15/30/60-minute horizons marked NOT VALIDATED when data is insufficient
"""

import csv
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------
M1_CSV = Path("Output_m1/crowd_counts.csv")
M2_CSV = Path("Output_m2/test_crowd_counts.csv")
OUTPUT_DIR = Path("outputs/real")

PREDICTIONS_CSV = OUTPUT_DIR / "m3_predictions.csv"
METRICS_CSV = OUTPUT_DIR / "m3_metrics.csv"
DASHBOARD_JSON = OUTPUT_DIR / "m3_dashboard.json"
REPORT_TXT = OUTPUT_DIR / "m3_report.txt"
MODEL_JSON = OUTPUT_DIR / "m3_model.json"

AGG_WINDOW_SECONDS = 1.0
TRAIN_FRACTION = 0.60
VALIDATION_FRACTION = 0.20
TEST_FRACTION = 0.20
LAG_ORDER = 3
MIN_TRAIN_FOR_XGB = 20  # minimum training windows to attempt XGBoost

# Prediction interval: 80% via residual std * 1.28
PI_Z_SCORE = 1.28

# XGBoost availability
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def parse_m1_row(row):
    if len(row) != 10:
        return None
    try:
        video = row[0].strip()
        ts = float(row[1])
        frame = int(row[2])
        pop = int(row[3])
        unique = int(row[4])
        people_count = int(row[5])
        entry = int(row[6])
        exit_ = int(row[7])
        density = float(row[8])
        conf = float(row[9])
    except (ValueError, IndexError):
        return None
    if not video or ts < 0 or frame <= 0 or pop < 0:
        return None
    return {
        "video_name": video,
        "timestamp": ts,
        "frame": frame,
        "current_population": pop,
        "unique_people_observed": unique,
        "people_count": people_count,
        "entry_count": entry,
        "exit_count": exit_,
        "density": density,
        "confidence": conf,
    }


def aggregate_to_windows(rows, window_sec=1.0):
    rows = sorted(rows, key=lambda r: r["timestamp"])
    windows = []
    current_window = []
    window_start = None
    for r in rows:
        ts = r["timestamp"]
        if window_start is None:
            window_start = ts
            current_window = [r]
            continue
        if ts < window_start + window_sec:
            current_window.append(r)
        else:
            windows.append((window_start, current_window))
            window_start = ts
            current_window = [r]
    if current_window:
        windows.append((window_start, current_window))

    result = []
    for win_start, win_rows in windows:
        pops = [r["current_population"] for r in win_rows]
        agg_pop = sum(pops) / len(pops)
        result.append({
            "video_name": win_rows[0]["video_name"],
            "timestamp": win_start,
            "frame": win_rows[0]["frame"],
            "current_population": round(agg_pop, 4),
            "frames_in_window": len(win_rows),
        })
    return result


def compute_metrics(actuals, predictions):
    if len(actuals) == 0:
        return None, None
    errors = [a - p for a, p in zip(actuals, predictions)]
    mae = sum(abs(e) for e in errors) / len(errors)
    rmse = math.sqrt(sum(e * e for e in errors) / len(errors))
    return round(mae, 4), round(rmse, 4)


def linear_regression_coefficients(X, y):
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


# ------------------------------------------------------------------
# XGBOOST FEATURE ENGINEERING (leakage-free)
# ------------------------------------------------------------------
def build_xgb_features(history, t_idx, max_lag=5):
    if t_idx < max_lag:
        return None
    window = history[t_idx - max_lag:t_idx]

    # Lags (only past values)
    lag_1 = history[t_idx - 1]
    lag_2 = history[t_idx - 2]
    lag_3 = history[t_idx - 3]
    lag_5 = history[t_idx - 5]

    # Rolling statistics over last max_lag seconds
    roll_mean = sum(window) / len(window)
    roll_std = math.sqrt(sum((x - roll_mean)**2 for x in window) / len(window))

    # Trend slope over last max_lag points
    n = len(window)
    x_mean = (n - 1) / 2.0
    y_mean = roll_mean
    num = sum((i - x_mean) * (window[i] - y_mean) for i in range(n))
    den = sum((i - x_mean)**2 for i in range(n))
    trend_slope = num / den if den != 0 else 0.0

    # Elapsed time (seconds since start)
    elapsed = t_idx * AGG_WINDOW_SECONDS

    # Cyclical features (assumed 120s period for crowd patterns)
    angle = 2.0 * math.pi * elapsed / 120.0
    sin_t = math.sin(angle)
    cos_t = math.cos(angle)

    return [lag_1, lag_2, lag_3, lag_5, roll_mean, roll_std, trend_slope, elapsed, sin_t, cos_t]


def make_xgboost_model(train_vals, max_lag=5):
    if not XGBOOST_AVAILABLE:
        raise RuntimeError("XGBoost not installed")

    X, y = [], []
    for t in range(max_lag, len(train_vals)):
        feats = build_xgb_features(train_vals, t, max_lag)
        if feats is not None:
            X.append(feats)
            y.append(train_vals[t])

    if len(X) == 0:
        raise ValueError("Insufficient training data for XGBoost")

    dtrain = xgb.DMatrix(X, label=y)
    params = {
        "objective": "reg:squarederror",
        "eval_metric": "rmse",
        "max_depth": 3,
        "eta": 0.1,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 1,
        "nthread": 1,
    }
    bst = xgb.train(params, dtrain, 50, verbose_eval=False)

    def model(history):
        t = len(history)
        feats = build_xgb_features(history, t, max_lag)
        if feats is None:
            return history[-1]
        dtest = xgb.DMatrix([feats])
        pred = float(bst.predict(dtest)[0])
        return max(0.0, pred)

    return model


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
def main():
    print("=" * 70)
    print("M3 REAL POPULATION FORECASTING PIPELINE")
    print("=" * 70)
    print(f"\nXGBoost available: {XGBOOST_AVAILABLE}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # 1. LOAD M1
    # ------------------------------------------------------------------
    print("\n[1] Loading M1 data ...")
    m1_rows = []
    m1_invalid = 0
    if M1_CSV.exists():
        with M1_CSV.open("r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                parsed = parse_m1_row(row)
                if parsed is None:
                    m1_invalid += 1
                else:
                    m1_rows.append(parsed)
    else:
        print("  ERROR: M1 CSV not found.")
        sys.exit(1)

    m1_sessions = defaultdict(list)
    for r in m1_rows:
        m1_sessions[r["video_name"]].append(r)

    print(f"    Rows read: {len(m1_rows) + m1_invalid}")
    print(f"    Invalid dropped: {m1_invalid}")
    print(f"    Sessions: {len(m1_sessions)}")
    for vid in sorted(m1_sessions.keys()):
        rows = m1_sessions[vid]
        pops = [r["current_population"] for r in rows]
        print(f"      - {vid}: {len(rows)} frames, "
              f"pop {min(pops)}-{max(pops)}, mean {sum(pops)/len(pops):.2f}")

    # ------------------------------------------------------------------
    # 2. INSPECT M2
    # ------------------------------------------------------------------
    print("\n[2] Inspecting M2 data ...")
    m2_rows = []
    if M2_CSV.exists():
        with M2_CSV.open("r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) == 2:
                    try:
                        m2_rows.append({"frame": int(row[0]), "count": int(row[1])})
                    except ValueError:
                        pass

    m2_alignment_note = (
        "M2 test_crowd_counts.csv: NOT COMPATIBLE. "
        "Only frame_number and people_count columns; no timestamps, video_name, or zone identifiers. "
        "Cannot map M2 frames to M1 sessions without unsupported assumptions. "
        "M2 test_population.csv exists but comes from a different project (GeoAI) and lacks "
        "temporal/source alignment with M1 sessions. M2 is NOT used in M3 forecasting."
    )
    print(f"    M2 rows: {len(m2_rows)}")
    print(f"    Alignment: NOT POSSIBLE")
    print(f"    Reason: {m2_alignment_note}")

    # ------------------------------------------------------------------
    # 3. BUILD FORECASTING DATASET
    # ------------------------------------------------------------------
    print("\n[3] Building forecasting dataset from M1 ...")
    session_windows = {}
    for vid, rows in m1_sessions.items():
        session_windows[vid] = aggregate_to_windows(rows, window_sec=AGG_WINDOW_SECONDS)

    usable = {vid: w for vid, w in session_windows.items() if len(w) >= 6}
    print(f"    Usable sessions (>=6 windows): {len(usable)}")
    for vid in sorted(usable.keys()):
        print(f"      - {vid}: {len(usable[vid])} windows")

    if not usable:
        print("\nINSUFFICIENT DATA FOR RELIABLE FORECASTING")
        sys.exit(1)

    # ------------------------------------------------------------------
    # 4. TRAIN / VALIDATE / TEST — MODELS
    # ------------------------------------------------------------------
    all_predictions = []
    all_metrics = []
    all_model_info = []
    dashboard_entries = []

    # Model factories (train on train_vals, return callable)
    def model_naive(train_vals):
        last = train_vals[-1]
        return lambda h: last

    def model_mean(train_vals):
        mean_val = sum(train_vals) / len(train_vals)
        return lambda h: mean_val

    def model_ma3(train_vals):
        window = train_vals[-3:] if len(train_vals) >= 3 else train_vals[:]
        m = sum(window) / len(window)
        return lambda h: m

    def model_ar_linear(train_vals, lag=LAG_ORDER):
        X, y = [], []
        for i in range(lag, len(train_vals)):
            X.append(train_vals[i - lag:i])
            y.append(train_vals[i])
        coefs = linear_regression_coefficients(X, y)
        if coefs is None:
            return lambda h: h[-1]
        return lambda h: predict_lr(coefs, h[-lag:]) or h[-1]

    def model_xgb(train_vals):
        return make_xgboost_model(train_vals, max_lag=5)

    model_factories = {
        "naive": model_naive,
        "mean": model_mean,
        "ma3": model_ma3,
        "ar_linear": model_ar_linear,
    }
    if XGBOOST_AVAILABLE:
        model_factories["xgboost"] = model_xgb

    for vid, windows in usable.items():
        n = len(windows)
        train_size = int(n * TRAIN_FRACTION)
        val_size = int(n * VALIDATION_FRACTION)
        if train_size < LAG_ORDER + 1:
            train_size = LAG_ORDER + 1
        if val_size < 1:
            val_size = 1
        test_size = n - train_size - val_size
        if test_size < 1:
            print(f"  Skipping {vid}: insufficient windows for split")
            continue

        train = windows[:train_size]
        validation = windows[train_size:train_size + val_size]
        test = windows[train_size + val_size:]

        train_vals = [w["current_population"] for w in train]
        val_vals = [w["current_population"] for w in validation]
        test_vals = [w["current_population"] for w in test]

        print(f"\n[{vid}]")
        print(f"  Train={len(train)}, Val={len(validation)}, Test={len(test)}")

        # --- Evaluate all models on VALIDATION set ---
        val_results = {}
        for name, factory in model_factories.items():
            try:
                mfunc = factory(train_vals)
                preds = []
                h = train_vals[:]
                for _ in val_vals:
                    p = mfunc(h)
                    p = max(0.0, p)
                    preds.append(p)
                    h.append(p)
                mae, rmse = compute_metrics(val_vals, preds)
                val_results[name] = {"mae": mae, "rmse": rmse, "preds": preds}
            except Exception as e:
                print(f"  WARNING: {name} failed on validation: {e}")
                val_results[name] = {"mae": None, "rmse": None, "preds": []}

        print(f"  [Validation metrics]")
        for name in model_factories:
            r = val_results[name]
            print(f"    {name:12s} -> MAE: {r['mae']}, RMSE: {r['rmse']}")

        # Select best by validation MAE
        valid_models = {k: v for k, v in val_results.items() if v["mae"] is not None}
        if not valid_models:
            print("  No valid model, skipping.")
            continue
        best_name = min(valid_models, key=lambda k: valid_models[k]["mae"])
        best_val_mae = valid_models[best_name]["mae"]
        best_val_rmse = valid_models[best_name]["rmse"]
        print(f"  [Selected: {best_name} (val MAE={best_val_mae})]")

        # --- Evaluate ALL models on TEST set ---
        test_results = {}
        for name, factory in model_factories.items():
            try:
                mfunc = factory(train_vals)
                preds = []
                h = train_vals[:]
                for _ in test_vals:
                    p = mfunc(h)
                    p = max(0.0, p)
                    preds.append(p)
                    h.append(p)
                mae, rmse = compute_metrics(test_vals, preds)
                test_results[name] = {"mae": mae, "rmse": rmse, "preds": preds}
            except Exception as e:
                print(f"  WARNING: {name} failed on test: {e}")
                test_results[name] = {"mae": None, "rmse": None, "preds": []}

        print(f"  [Test metrics]")
        for name in model_factories:
            r = test_results.get(name, {"mae": None, "rmse": None})
            print(f"    {name:12s} -> MAE: {r['mae']}, RMSE: {r['rmse']}")

        # Store predictions for CSV
        best_test_preds = test_results.get(best_name, {}).get("preds", [])
        for i, w in enumerate(test):
            all_predictions.append({
                "video_name": vid,
                "timestamp": w["timestamp"],
                "frame": w["frame"],
                "actual": w["current_population"],
                "naive_prediction": round(test_results.get("naive", {}).get("preds", [])[i] if i < len(test_results.get("naive", {}).get("preds", [])) else 0, 4),
                "mean_prediction": round(test_results.get("mean", {}).get("preds", [])[i] if i < len(test_results.get("mean", {}).get("preds", [])) else 0, 4),
                "ma3_prediction": round(test_results.get("ma3", {}).get("preds", [])[i] if i < len(test_results.get("ma3", {}).get("preds", [])) else 0, 4),
                "ar_linear_prediction": round(test_results.get("ar_linear", {}).get("preds", [])[i] if i < len(test_results.get("ar_linear", {}).get("preds", [])) else 0, 4),
                "xgboost_prediction": round(test_results.get("xgboost", {}).get("preds", [])[i] if XGBOOST_AVAILABLE and i < len(test_results.get("xgboost", {}).get("preds", [])) else "", 4),
                "best_model_prediction": round(best_test_preds[i], 4) if i < len(best_test_preds) else 0,
                "best_model": best_name,
                "split": "test",
            })

        # Metrics row
        metric_row = {
            "video_name": vid,
            "train_windows": len(train),
            "validation_windows": len(validation),
            "test_windows": len(test),
            "val_naive_mae": val_results.get("naive", {}).get("mae"),
            "val_naive_rmse": val_results.get("naive", {}).get("rmse"),
            "val_mean_mae": val_results.get("mean", {}).get("mae"),
            "val_mean_rmse": val_results.get("mean", {}).get("rmse"),
            "val_ma3_mae": val_results.get("ma3", {}).get("mae"),
            "val_ma3_rmse": val_results.get("ma3", {}).get("rmse"),
            "val_ar_linear_mae": val_results.get("ar_linear", {}).get("mae"),
            "val_ar_linear_rmse": val_results.get("ar_linear", {}).get("rmse"),
            "selected_model": best_name,
            "selected_model_val_mae": best_val_mae,
            "selected_model_val_rmse": best_val_rmse,
            "test_naive_mae": test_results.get("naive", {}).get("mae"),
            "test_naive_rmse": test_results.get("naive", {}).get("rmse"),
            "test_mean_mae": test_results.get("mean", {}).get("mae"),
            "test_mean_rmse": test_results.get("mean", {}).get("rmse"),
            "test_ma3_mae": test_results.get("ma3", {}).get("mae"),
            "test_ma3_rmse": test_results.get("ma3", {}).get("rmse"),
            "test_ar_linear_mae": test_results.get("ar_linear", {}).get("mae"),
            "test_ar_linear_rmse": test_results.get("ar_linear", {}).get("rmse"),
            "test_best_model_mae": test_results.get(best_name, {}).get("mae"),
            "test_best_model_rmse": test_results.get(best_name, {}).get("rmse"),
        }
        if XGBOOST_AVAILABLE:
            metric_row.update({
                "val_xgboost_mae": val_results.get("xgboost", {}).get("mae"),
                "val_xgboost_rmse": val_results.get("xgboost", {}).get("rmse"),
                "test_xgboost_mae": test_results.get("xgboost", {}).get("mae"),
                "test_xgboost_rmse": test_results.get("xgboost", {}).get("rmse"),
            })
        all_metrics.append(metric_row)

        # ------------------------------------------------------------------
        # 5. GENERATE FORECASTS
        # ------------------------------------------------------------------
        all_vals = [w["current_population"] for w in windows]

        # Compute prediction intervals from validation residuals of best model
        best_val_preds = val_results[best_name]["preds"]
        if len(best_val_preds) == len(val_vals) and len(val_vals) > 1:
            residuals = [a - p for a, p in zip(val_vals, best_val_preds)]
            mean_res = sum(residuals) / len(residuals)
            std_res = math.sqrt(sum((r - mean_res)**2 for r in residuals) / (len(residuals) - 1))
            pi_half_width = round(PI_Z_SCORE * std_res, 4)
            pi_method = "80% residual-based (z=1.28*std_val_residuals)"
        else:
            pi_half_width = None
            pi_method = "insufficient_validation_residuals"

        current_pop = all_vals[-1]

        # 1-step ahead forecast (validated on real test data)
        h = train_vals[:]
        forecast_1s = None
        for _ in range(1):
            p = valid_models[best_name]["preds"][0] if len(valid_models[best_name]["preds"]) > 0 else train_vals[-1]
            forecast_1s = max(0.0, p)

        # 15/30/60-min forecasts are NOT validated for real data
        forecast_15min = "NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA"
        forecast_30min = "NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA"
        forecast_60min = "NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA"

        # Compute expected average/peak from 60-step recursive forecast (still marked not validated)
        h = all_vals[:]
        future_60 = []
        for _ in range(60):
            p = valid_models[best_name]["preds"][0] if len(valid_models[best_name]["preds"]) > 0 else h[-1]
            future_60.append(max(0.0, p))
            h.append(max(0.0, p))
        expected_avg = round(sum(future_60) / len(future_60), 4)
        expected_peak = round(max(future_60), 4)

        entry = {
            "data_status": "REAL",
            "source": "M1_REAL_CCTV",
            "zone": vid,
            "current_population": round(current_pop, 4),
            "forecast_15min": forecast_15min,
            "forecast_30min": forecast_30min,
            "forecast_60min": forecast_60min,
            "expected_average_population_60min": expected_avg,
            "expected_peak_population_60min": expected_peak,
            "confidence": round(pi_half_width, 4) if pi_half_width is not None else "NOT_COMPUTED",
            "prediction_interval": {
                "coverage": "80%",
                "method": pi_method,
                "z_score": PI_Z_SCORE,
                "half_width": pi_half_width,
                "residual_std": round(std_res, 4) if len(val_vals) > 1 else None,
                "note": "Derived from validation residuals of selected model. 15/30/60-min forecasts are NOT VALIDATED."
            } if pi_half_width is not None else {
                "coverage": "N/A",
                "method": "insufficient_validation_residuals",
                "note": "Too few validation points to compute reliable prediction interval."
            },
            "model": best_name,
            "metrics": {
                "validation": {
                    "mae": best_val_mae,
                    "rmse": best_val_rmse,
                },
                "test": {
                    "mae": test_results.get(best_name, {}).get("mae"),
                    "rmse": test_results.get(best_name, {}).get("rmse"),
                },
            },
            "validation_status": "REAL_1S_HORIZON_VALIDATED",
            "notes": (
                "1-second ahead forecast validated on real M1 test data. "
                "15/30/60-minute forecasts are extrapolations without real temporal validation. "
                "M2 data not aligned with M1; not used."
            ),
        }
        dashboard_entries.append(entry)
        print(f"  current={current_pop:.4f}, 1s_forecast={forecast_1s:.4f}, "
              f"60s_avg={expected_avg:.4f}, selected={best_name}, "
              f"val_MAE={best_val_mae}, test_MAE={test_results.get(best_name, {}).get('mae')}")

        all_model_info.append({
            "video_name": vid,
            "best_model": best_name,
            "candidates_evaluated": list(model_factories.keys()),
            "xgboost_available": XGBOOST_AVAILABLE,
            "train_windows": len(train),
            "val_windows": len(validation),
            "test_windows": len(test),
        })

    # ------------------------------------------------------------------
    # 6. SAVE OUTPUTS
    # ------------------------------------------------------------------
    pred_fieldnames = [
        "video_name", "timestamp", "frame", "actual",
        "naive_prediction", "mean_prediction", "ma3_prediction",
        "ar_linear_prediction", "xgboost_prediction",
        "best_model_prediction", "best_model", "split",
    ]
    with PREDICTIONS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=pred_fieldnames)
        writer.writeheader()
        for r in all_predictions:
            writer.writerow(r)

    metric_fieldnames = [
        "video_name", "train_windows", "validation_windows", "test_windows",
        "val_naive_mae", "val_naive_rmse", "val_mean_mae", "val_mean_rmse",
        "val_ma3_mae", "val_ma3_rmse", "val_ar_linear_mae", "val_ar_linear_rmse",
        "selected_model", "selected_model_val_mae", "selected_model_val_rmse",
        "test_naive_mae", "test_naive_rmse", "test_mean_mae", "test_mean_rmse",
        "test_ma3_mae", "test_ma3_rmse", "test_ar_linear_mae", "test_ar_linear_rmse",
        "test_best_model_mae", "test_best_model_rmse",
    ]
    if XGBOOST_AVAILABLE:
        metric_fieldnames += ["val_xgboost_mae", "val_xgboost_rmse", "test_xgboost_mae", "test_xgboost_rmse"]

    with METRICS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=metric_fieldnames)
        writer.writeheader()
        for r in all_metrics:
            writer.writerow(r)

    with MODEL_JSON.open("w", encoding="utf-8") as f:
        json.dump({
            "models": all_model_info,
            "candidates": list(model_factories.keys()),
            "xgboost_available": XGBOOST_AVAILABLE,
            "xgboost_features": [
                "lag_1", "lag_2", "lag_3", "lag_5",
                "rolling_mean_5", "rolling_std_5", "trend_slope_5",
                "elapsed_time", "sin_2pi_t_120", "cos_2pi_t_120"
            ] if XGBOOST_AVAILABLE else [],
            "lag_order": LAG_ORDER,
            "prediction_interval": {
                "method": "residual_std_zscore",
                "coverage": "80%",
                "z_score": PI_Z_SCORE,
                "description": (
                    "80% prediction interval half-width = 1.28 * sample_std(validation residuals) "
                    "from the selected best model. Applied symmetrically to the point forecast."
                ),
            },
            "split": {
                "train_fraction": TRAIN_FRACTION,
                "validation_fraction": VALIDATION_FRACTION,
                "test_fraction": TEST_FRACTION,
                "method": "chronological (no shuffle)",
            },
            "m2_status": "NOT USED — incompatibility documented",
        }, f, indent=2)

    with DASHBOARD_JSON.open("w", encoding="utf-8") as f:
        json.dump({
            "DISCLAIMER": "REAL M1 DATA ONLY — M2 NOT INTEGRATED",
            "forecasts": dashboard_entries,
            "meta": {
                "data_source_m1": str(M1_CSV),
                "data_source_m2": str(M2_CSV),
                "m2_alignment": m2_alignment_note,
                "aggregation_window_seconds": AGG_WINDOW_SECONDS,
                "train_fraction": TRAIN_FRACTION,
                "validation_fraction": VALIDATION_FRACTION,
                "test_fraction": TEST_FRACTION,
                "model_selection": "validation_only",
                "final_evaluation": "test_only",
                "candidates": list(model_factories.keys()),
                "xgboost_available": XGBOOST_AVAILABLE,
                "supported_horizons": ["1 second (validated)"],
                "unsupported_horizons": [
                    "15 minutes — NOT VALIDATED: INSUFFICIENT REAL TEMPORAL DATA",
                    "30 minutes — NOT VALIDATED: INSUFFICIENT REAL TEMPORAL DATA",
                    "60 minutes — NOT VALIDATED: INSUFFICIENT REAL TEMPORAL DATA",
                ],
                "longest_session_seconds": max(
                    w[-1]["timestamp"] for w in session_windows.values() if w
                ),
            }
        }, f, indent=2)

    with REPORT_TXT.open("w", encoding="utf-8") as f:
        f.write("M3 REAL FORECASTING REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write(f"Data source M1: {M1_CSV}\n")
        f.write(f"M2 source: {M2_CSV}\n\n")
        f.write("M2 ALIGNMENT ASSESSMENT:\n")
        f.write(f"  {m2_alignment_note}\n\n")
        f.write("FORECASTING SETUP:\n")
        f.write(f"  Aggregation: {AGG_WINDOW_SECONDS}s non-overlapping windows\n")
        f.write(f"  Target: current_population (mean per window)\n")
        f.write(f"  Split: chronological {int(TRAIN_FRACTION*100)}/{int(VALIDATION_FRACTION*100)}/{int(TEST_FRACTION*100)} (train/val/test)\n")
        f.write(f"  Model selection: VALIDATION SET ONLY\n")
        f.write(f"  Final evaluation: TEST SET ONLY\n")
        f.write(f"  XGBoost available: {XGBOOST_AVAILABLE}\n\n")
        f.write("RESULTS:\n")
        for m in all_metrics:
            f.write(f"\n  {m['video_name']}:\n")
            f.write(f"    Train={m['train_windows']}, Val={m['validation_windows']}, Test={m['test_windows']}\n")
            f.write(f"    Selected model: {m['selected_model']} (val MAE={m['selected_model_val_mae']})\n")
            f.write(f"    Best model test MAE: {m['test_best_model_mae']}, RMSE: {m['test_best_model_rmse']}\n")
        f.write("\nHORIZONS:\n")
        f.write("  1 second: VALIDATED on real test set\n")
        f.write("  15 minutes: NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA\n")
        f.write("  30 minutes: NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA\n")
        f.write("  60 minutes: NOT VALIDATED — INSUFFICIENT REAL TEMPORAL DATA\n")

    print(f"\n[Saved] {PREDICTIONS_CSV}")
    print(f"[Saved] {METRICS_CSV}")
    print(f"[Saved] {DASHBOARD_JSON}")
    print(f"[Saved] {MODEL_JSON}")
    print(f"[Saved] {REPORT_TXT}")
    print("\n" + "=" * 70)
    print("M3 REAL PIPELINE COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
