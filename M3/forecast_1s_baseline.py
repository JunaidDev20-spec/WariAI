import csv
from collections import defaultdict
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------
INPUT_CSV = Path("Output_m1/crowd_counts.csv")
OUTPUT_DIR = Path("outputs")
PREDICTIONS_CSV = OUTPUT_DIR / "predictions_1s.csv"
METRICS_CSV = OUTPUT_DIR / "metrics_1s.csv"
REPORT_TXT = OUTPUT_DIR / "forecasting_report_1s.txt"

AGG_WINDOW_SECONDS = 1.0
TRAIN_FRACTION = 0.80


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def parse_row(row):
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
    rmse = (sum(e * e for e in errors) / len(errors)) ** 0.5
    return mae, rmse


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
def main():
    print("=" * 70)
    print("M3 ~1-SECOND FORECASTING BASELINE EXPERIMENT")
    print("=" * 70)

    if not INPUT_CSV.exists():
        print(f"ERROR: Input file not found: {INPUT_CSV}")
        return

    # Read and parse
    raw_rows = []
    invalid_rows = 0
    with INPUT_CSV.open("r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if header is None:
            print("ERROR: Empty CSV file.")
            return
        for row in reader:
            parsed = parse_row(row)
            if parsed is None:
                invalid_rows += 1
            else:
                raw_rows.append(parsed)

    print(f"\n[1] Raw rows read:       {len(raw_rows) + invalid_rows}")
    print(f"[2] Invalid rows dropped: {invalid_rows}")

    # Group by session
    sessions = defaultdict(list)
    for r in raw_rows:
        sessions[r["video_name"]].append(r)

    print(f"[3] Sessions found:      {len(sessions)}")

    # Aggregate to 1-second windows
    session_windows = {}
    for vid, rows in sessions.items():
        windows = aggregate_to_windows(rows, window_sec=AGG_WINDOW_SECONDS)
        session_windows[vid] = windows
        print(f"    - {vid}: {len(windows)} windows")

    # Determine usable sessions (need at least 3 windows for train/test)
    usable_sessions = {vid: w for vid, w in session_windows.items() if len(w) >= 3}
    print(f"\n[4] Usable sessions (>=3 windows): {len(usable_sessions)}")
    for vid in sorted(usable_sessions.keys()):
        print(f"    - {vid}: {len(usable_sessions[vid])} windows")

    if not usable_sessions:
        print("\nINSUFFICIENT DATA FOR RELIABLE FORECASTING")
        return

    # Chronological 80/20 split per session
    all_predictions = []
    all_metrics = []

    for vid, windows in usable_sessions.items():
        n = len(windows)
        train_size = int(n * TRAIN_FRACTION)
        if train_size < 1:
            train_size = 1
        test_size = n - train_size
        if test_size < 1:
            test_size = 1
            train_size = n - test_size

        train = windows[:train_size]
        test = windows[train_size:train_size + test_size]

        train_vals = [w["current_population"] for w in train]
        test_vals = [w["current_population"] for w in test]

        # Baseline 1: Naive persistence (last train value)
        naive_preds = [train_vals[-1]] * len(test_vals)
        naive_mae, naive_rmse = compute_metrics(test_vals, naive_preds)

        # Baseline 2: Mean of training values
        mean_train = sum(train_vals) / len(train_vals)
        mean_preds = [mean_train] * len(test_vals)
        mean_mae, mean_rmse = compute_metrics(test_vals, mean_preds)

        # Baseline 3: Moving average of last 3 train values
        window3 = train_vals[-3:] if len(train_vals) >= 3 else train_vals[:]
        ma3_preds = [sum(window3) / len(window3)] * len(test_vals)
        ma3_mae, ma3_rmse = compute_metrics(test_vals, ma3_preds)

        print(f"\n[{vid}]")
        print(f"  Train windows: {len(train)}, Test windows: {len(test)}")
        print(f"  Naive persistence -> MAE: {naive_mae:.4f}, RMSE: {naive_rmse:.4f}")
        print(f"  Mean baseline      -> MAE: {mean_mae:.4f}, RMSE: {mean_rmse:.4f}")
        print(f"  MA-3 baseline      -> MAE: {ma3_mae:.4f}, RMSE: {ma3_rmse:.4f}")

        for i, w in enumerate(test):
            all_predictions.append({
                "video_name": vid,
                "timestamp": w["timestamp"],
                "frame": w["frame"],
                "actual": w["current_population"],
                "naive_prediction": round(naive_preds[i], 4),
                "mean_prediction": round(mean_preds[i], 4),
                "ma3_prediction": round(ma3_preds[i], 4),
                "split": "test",
            })

        all_metrics.append({
            "video_name": vid,
            "train_windows": len(train),
            "test_windows": len(test),
            "naive_mae": round(naive_mae, 4),
            "naive_rmse": round(naive_rmse, 4),
            "mean_mae": round(mean_mae, 4),
            "mean_rmse": round(mean_rmse, 4),
            "ma3_mae": round(ma3_mae, 4),
            "ma3_rmse": round(ma3_rmse, 4),
        })

    # Save predictions
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    pred_fieldnames = [
        "video_name", "timestamp", "frame", "actual",
        "naive_prediction", "mean_prediction", "ma3_prediction", "split",
    ]
    with PREDICTIONS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=pred_fieldnames)
        writer.writeheader()
        for r in all_predictions:
            writer.writerow(r)

    # Save metrics
    metric_fieldnames = [
        "video_name", "train_windows", "test_windows",
        "naive_mae", "naive_rmse", "mean_mae", "mean_rmse", "ma3_mae", "ma3_rmse",
    ]
    with METRICS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=metric_fieldnames)
        writer.writeheader()
        for r in all_metrics:
            writer.writerow(r)

    # Save report
    with REPORT_TXT.open("w", encoding="utf-8") as f:
        f.write("M3 ~1-SECOND FORECASTING BASELINE EXPERIMENT REPORT\n")
        f.write("=" * 70 + "\n\n")
        f.write("DATA SOURCE: Output_m1/crowd_counts.csv (frame-level)\n")
        f.write("AGGREGATION: 1-second non-overlapping windows, mean current_population\n")
        f.write("SPLIT: chronological 80/20 per session\n")
        f.write("HORIZON: 1-step ahead (next 1-second window)\n")
        f.write("NOTE: This is a short-horizon prototype, NOT 15/30/60-minute forecasting.\n\n")
        for m in all_metrics:
            f.write(f"Session: {m['video_name']}\n")
            f.write(f"  Train windows: {m['train_windows']}, Test windows: {m['test_windows']}\n")
            f.write(f"  Naive persistence -> MAE: {m['naive_mae']:.4f}, RMSE: {m['naive_rmse']:.4f}\n")
            f.write(f"  Mean baseline      -> MAE: {m['mean_mae']:.4f}, RMSE: {m['mean_rmse']:.4f}\n")
            f.write(f"  MA-3 baseline      -> MAE: {m['ma3_mae']:.4f}, RMSE: {m['ma3_rmse']:.4f}\n\n")

    print(f"\n[5] Saved predictions to:   {PREDICTIONS_CSV}")
    print(f"[6] Saved metrics to:       {METRICS_CSV}")
    print(f"[7] Saved report to:        {REPORT_TXT}")
    print("\n" + "=" * 70)
    print("EXPERIMENT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
