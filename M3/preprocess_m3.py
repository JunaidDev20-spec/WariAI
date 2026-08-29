import os
import csv
from collections import defaultdict
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------
INPUT_CSV = Path("Output_m1/crowd_counts.csv")
OUTPUT_DIR = Path("data/processed")
OUTPUT_CSV = OUTPUT_DIR / "processed_crowd_counts.csv"

# Aggregation settings (explicitly documented)
AGG_WINDOW_SECONDS = 60.0  # fixed non-overlapping windows
AGG_METHOD = "mean"        # only mean or median allowed per M3 rules


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def parse_row(row):
    """Return parsed dict or None if row is invalid."""
    if len(row) != 10:
        return None
    try:
        video = row[0].strip()
        ts = float(row[1])
        frame = int(row[2])
        pop = int(row[3])
        unique = int(row[4])   # preserved but NOT used as target
        people_count = int(row[5])
        entry = int(row[6])
        exit_ = int(row[7])
        density = float(row[8])
        conf = float(row[9])
    except (ValueError, IndexError):
        return None

    # Explicit invalid checks
    if not video:
        return None
    if ts < 0 or frame <= 0:
        return None
    if pop < 0:
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


def aggregate_session(rows, window_sec=60.0, method="mean"):
    """
    Aggregate frame-level rows into fixed non-overlapping time windows.
    Returns list of dicts. Original timestamps are preserved as window_start.
    """
    if not rows:
        return []

    # Sort by timestamp
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
            # finalize current window
            windows.append((window_start, current_window))
            window_start = ts
            current_window = [r]

    if current_window:
        windows.append((window_start, current_window))

    aggregated = []
    for win_start, win_rows in windows:
        pops = [r["current_population"] for r in win_rows]
        if method == "mean":
            agg_pop = sum(pops) / len(pops)
        elif method == "median":
            pops_sorted = sorted(pops)
            n = len(pops_sorted)
            agg_pop = (pops_sorted[n // 2] + pops_sorted[(n - 1) // 2]) / 2.0
        else:
            raise ValueError(f"Unsupported aggregation method: {method}")

        aggregated.append({
            "video_name": win_rows[0]["video_name"],
            "timestamp": win_start,
            "frame": win_rows[0]["frame"],  # first frame in window
            "current_population": round(agg_pop, 4),
            "unique_people_observed": win_rows[-1]["unique_people_observed"],
            "people_count": round(agg_pop, 4),  # alias for compatibility
            "entry_count": win_rows[-1]["entry_count"],
            "exit_count": win_rows[-1]["exit_count"],
            "density": round(sum(r["density"] for r in win_rows) / len(win_rows), 4),
            "confidence": round(sum(r["confidence"] for r in win_rows) / len(win_rows), 4),
            "frames_in_window": len(win_rows),
        })
    return aggregated


# ------------------------------------------------------------------
# MAIN PIPELINE
# ------------------------------------------------------------------
def main():
    print("=" * 60)
    print("M3 PREPROCESSING PIPELINE")
    print("=" * 60)

    # 1. Check input exists
    if not INPUT_CSV.exists():
        print(f"ERROR: Input file not found: {INPUT_CSV}")
        return

    # 2. Read and parse
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

    print(f"\n[1] Raw rows read:      {len(raw_rows) + invalid_rows}")
    print(f"[2] Invalid rows dropped: {invalid_rows}")

    # 3. Group by session
    sessions = defaultdict(list)
    for r in raw_rows:
        sessions[r["video_name"]].append(r)

    print(f"[3] Sessions found:     {len(sessions)}")
    for vid in sorted(sessions.keys()):
        print(f"    - {vid}: {len(sessions[vid])} frames")

    # 4. Aggregate per session
    processed_rows = []
    stats = {}
    for vid, rows in sessions.items():
        rows_sorted = sorted(rows, key=lambda r: r["timestamp"])
        ts_min = rows_sorted[0]["timestamp"]
        ts_max = rows_sorted[-1]["timestamp"]
        pops = [r["current_population"] for r in rows_sorted]

        # Detect sampling interval from first two frames if available
        if len(rows_sorted) >= 2:
            interval = rows_sorted[1]["timestamp"] - rows_sorted[0]["timestamp"]
        else:
            interval = None

        stats[vid] = {
            "rows": len(rows_sorted),
            "ts_min": ts_min,
            "ts_max": ts_max,
            "duration": ts_max - ts_min,
            "pop_min": min(pops),
            "pop_max": max(pops),
            "pop_mean": round(sum(pops) / len(pops), 4),
            "interval": interval,
        }

        agg = aggregate_session(rows_sorted, window_sec=AGG_WINDOW_SECONDS, method=AGG_METHOD)
        processed_rows.extend(agg)

    # 5. Print statistics
    print("\n" + "=" * 60)
    print("ACTUAL STATISTICS")
    print("=" * 60)
    for vid in sorted(stats.keys()):
        s = stats[vid]
        print(f"\nSession: {vid}")
        print(f"  Frames before aggregation: {s['rows']}")
        print(f"  Timestamp range: {s['ts_min']:.3f}s - {s['ts_max']:.3f}s")
        print(f"  Duration: {s['duration']:.3f}s")
        print(f"  current_population min: {s['pop_min']}")
        print(f"  current_population max: {s['pop_max']}")
        print(f"  current_population mean: {s['pop_mean']}")
        print(f"  Sampling interval (estimated): {s['interval']:.3f}s" if s['interval'] else "  Sampling interval: N/A")

    print(f"\n[4] Rows after aggregation:  {len(processed_rows)}")
    print(f"[5] Aggregation window:      {AGG_WINDOW_SECONDS}s")
    print(f"[6] Aggregation method:      {AGG_METHOD}")

    # 6. Save output
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "video_name", "timestamp", "frame", "current_population",
        "unique_people_observed", "people_count", "entry_count",
        "exit_count", "density", "confidence", "frames_in_window",
    ]

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in processed_rows:
            writer.writerow(r)

    print(f"\n[7] Saved processed dataset to: {OUTPUT_CSV}")
    print("=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)

    # 7. Forecasting sufficiency note
    print("\nNOTE: The longest session is ~120s. No session provides")
    print("15/30/60-minute history. This data is NOT sufficient for")
    print("long-horizon forecasting without additional data.")


if __name__ == "__main__":
    main()
