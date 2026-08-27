#!/usr/bin/env python
"""Manual validation for selected video frames in crowd_counts.csv."""

from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd


def main() -> None:
    parser = argparse.ArgumentParser(description="Compare manually entered counts with model counts")
    parser.add_argument("--csv", type=Path, default=Path("outputs/crowd_counts.csv"))
    parser.add_argument("--video", help="Optional exact video_name filter")
    parser.add_argument("--frames", nargs="+", type=int, help="Frames to validate; otherwise interactive prompts")
    args = parser.parse_args()
    if not args.csv.is_file():
        raise SystemExit(f"Results CSV not found: {args.csv}")

    results = pd.read_csv(args.csv)
    population_column = "current_population" if "current_population" in results.columns else "people_count"
    if args.video:
        results = results[results["video_name"] == args.video]
    if results.empty:
        raise SystemExit("No matching records found.")

    frames = args.frames or []
    if not frames:
        print("Available videos:")
        print("\n".join(f"  {name}" for name in results["video_name"].unique()))
        raw = input("Enter frame numbers separated by commas: ").strip()
        try:
            frames = [int(value.strip()) for value in raw.split(",") if value.strip()]
        except ValueError as exc:
            raise SystemExit("Frame numbers must be integers.") from exc

    errors: list[float] = []
    for frame in frames:
        matches = results[results["frame"] == frame]
        if len(matches) != 1:
            print(f"Frame {frame}: expected exactly one record; use --video if filenames share this frame.")
            continue
        row = matches.iloc[0]
        while True:
            raw_count = input(
                f"{row.video_name}, frame {frame}, model={row[population_column]}. Ground-truth count: "
            ).strip()
            try:
                truth = int(raw_count)
                if truth < 0:
                    raise ValueError
                break
            except ValueError:
                print("Enter a non-negative whole number.")
        error = int(row[population_column]) - truth
        errors.append(abs(error))
        print(f"  error={error:+d}, absolute error={abs(error)}")

    if errors:
        print(f"Validated frames: {len(errors)}")
        print(f"MAE: {sum(errors) / len(errors):.3f} people")
    else:
        print("No frames were validated.")


if __name__ == "__main__":
    main()
