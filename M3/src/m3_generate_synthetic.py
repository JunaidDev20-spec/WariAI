"""
M3 Synthetic Dataset Generator for Long-Horizon Forecasting Prototype
-----------------------------------------------------------------------
GENERATES SYNTHETIC/DEMO DATA ONLY.

Reference statistics used from real M1/M2 data:
- M1 current_population: mean=6.8443, std=5.0817, max=19
- M2 people_count: mean=325.7173, std=94.1460, max=735

This script does NOT modify Output_m1 or Output_m2.
"""

import csv
import math
import random
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------
OUTPUT_DIR = Path("outputs")
SYNTHETIC_CSV = OUTPUT_DIR / "synthetic_population_timeseries.csv"
ZONE_STATS_CSV = OUTPUT_DIR / "synthetic_zone_stats.csv"

TOTAL_DURATION_SECONDS = 12600  # 210 minutes = 3.5 hours per zone
SAMPLING_INTERVAL_SECONDS = 1.0
NUM_ZONES = 4

# Zone configurations inspired by real M1/M2 statistics
ZONES = {
    "zone_low": {
        "base_level": 1.5,
        "amplitude": 1.0,
        "noise_std": 0.8,
        "spike_prob": 0.01,
        "spike_magnitude": 4.0,
        "trend_slope": 0.0001,
        "description": "Low traffic zone (ref: makkah_madinah/marathon)",
    },
    "zone_medium": {
        "base_level": 4.0,
        "amplitude": 3.0,
        "noise_std": 2.0,
        "spike_prob": 0.02,
        "spike_magnitude": 10.0,
        "trend_slope": 0.0002,
        "description": "Medium traffic zone (ref: Wari_real_vid)",
    },
    "zone_high": {
        "base_level": 12.0,
        "amplitude": 4.0,
        "noise_std": 3.0,
        "spike_prob": 0.025,
        "spike_magnitude": 8.0,
        "trend_slope": -0.0001,
        "description": "High traffic zone (ref: walking_front/walking_top)",
    },
    "zone_very_high": {
        "base_level": 326.0,
        "amplitude": 150.0,
        "noise_std": 94.0,
        "spike_prob": 0.015,
        "spike_magnitude": 300.0,
        "trend_slope": 0.001,
        "description": "Very high traffic zone (ref: Output_m2 test_crowd_counts)",
    },
}

# Period for sinusoidal variation (seconds)
PERIOD_SECONDS = 120.0

# Random seed for reproducibility
RANDOM_SEED = 42


# ------------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------------
def gaussian_noise(mu=0.0, sigma=1.0):
    """Box-Muller transform for Gaussian noise."""
    u1 = random.random()
    u2 = random.random()
    z = math.sqrt(-2.0 * math.log(max(u1, 1e-10))) * math.cos(2.0 * math.pi * u2)
    return mu + z * sigma


def generate_zone(zone_id, stats, duration, interval):
    """Generate synthetic population time series for one zone."""
    rows = []
    num_points = int(duration / interval)

    # State for random walk
    current = stats["base_level"]

    for i in range(num_points):
        t = i * interval

        # 1. Base level + trend
        base = stats["base_level"] + stats["trend_slope"] * t

        # 2. Periodic variation (sinusoidal daily-like cycle)
        periodic = stats["amplitude"] * math.sin(2.0 * math.pi * t / PERIOD_SECONDS)

        # 3. Random walk component (mean-reverting)
        drift = -0.01 * (current - base)
        current += drift + gaussian_noise(0.0, stats["noise_std"] * 0.3)
        current = max(0.0, current)

        # 4. Combine components
        population = base + periodic + (current - base) * 0.5

        # 5. Occasional peaks
        if random.random() < stats["spike_prob"]:
            population += stats["spike_magnitude"] * random.random()

        # 6. Clamp to non-negative and round
        population = max(0.0, population)
        population = round(population, 4)

        rows.append({
            "timestamp": round(t, 3),
            "zone_id": zone_id,
            "population": population,
        })

    return rows


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
def main():
    print("=" * 70)
    print("M3 SYNTHETIC DATASET GENERATOR (DEMO/PROTOTYPING ONLY)")
    print("=" * 70)
    print("\nWARNING: This data is SYNTHETIC and for M3 prototyping only.")
    print("         It does NOT represent real Wari historical data.")
    print("         Long-horizon results are validated on synthetic data.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    random.seed(RANDOM_SEED)

    all_rows = []
    zone_summaries = []

    train_dur = 7200   # 120 minutes
    val_dur = 1800     # 30 minutes
    test_dur = 3600    # 60 minutes
    total_dur = train_dur + val_dur + test_dur  # 12600 seconds = 210 minutes

    print(f"\n[1] Generating {NUM_ZONES} zones, {total_dur}s each ({total_dur/60:.0f} minutes)...")
    print(f"    Train: {train_dur/60:.0f} min | Val: {val_dur/60:.0f} min | Test: {test_dur/60:.0f} min")
    print(f"    Sampling interval: {SAMPLING_INTERVAL_SECONDS}s")
    print(f"    Total rows per zone: {int(total_dur / SAMPLING_INTERVAL_SECONDS)}")

    for zone_id, stats in ZONES.items():
        rows = generate_zone(zone_id, stats, total_dur, SAMPLING_INTERVAL_SECONDS)
        all_rows.extend(rows)

        pops = [r["population"] for r in rows]
        zone_summaries.append({
            "zone_id": zone_id,
            "description": stats["description"],
            "rows": len(rows),
            "duration_seconds": total_dur,
            "population_min": min(pops),
            "population_max": max(pops),
            "population_mean": round(sum(pops) / len(pops), 4),
            "population_std": round((sum((x - sum(pops)/len(pops))**2 for x in pops) / len(pops))**0.5, 4),
        })

        print(f"    - {zone_id}: {len(rows)} rows, "
              f"pop {min(pops):.2f}-{max(pops):.2f}, "
              f"mean {sum(pops)/len(pops):.2f}")

    # Save synthetic dataset
    with SYNTHETIC_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["timestamp", "zone_id", "population"])
        writer.writeheader()
        for r in all_rows:
            writer.writerow(r)

    # Save zone stats
    with ZONE_STATS_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=zone_summaries[0].keys())
        writer.writeheader()
        for s in zone_summaries:
            writer.writerow(s)

    print(f"\n[2] Saved synthetic dataset to: {SYNTHETIC_CSV}")
    print(f"[3] Saved zone statistics to: {ZONE_STATS_CSV}")
    print(f"\n[4] Total synthetic rows: {len(all_rows)}")
    print("\n" + "=" * 70)
    print("SYNTHETIC DATA GENERATION COMPLETE")
    print("=" * 70)
    print("\nNOTE: All downstream forecasting results from this dataset")
    print("      are SYNTHETIC/DEMO and do NOT reflect real Wari data.")


if __name__ == "__main__":
    main()
