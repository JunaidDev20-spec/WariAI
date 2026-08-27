#!/usr/bin/env python
"""Manual 20-frame validation for the walking_top source video only.

This utility is validation-only. It reads the original video and the existing
crowd-count CSV but never writes either of them.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import pandas as pd


VIDEO_NAME = "walking_top.mp4.mp4"
FRAME_COUNT = 20


def evenly_spaced_frames(total_frames: int, sample_count: int = FRAME_COUNT) -> list[int]:
    """Return inclusive, 1-based frame numbers distributed across a video."""
    if total_frames < sample_count:
        raise ValueError(f"Video has {total_frames} frames; need at least {sample_count}.")
    frames = [round(1 + index * (total_frames - 1) / (sample_count - 1)) for index in range(sample_count)]
    if len(set(frames)) != sample_count:
        raise ValueError("Could not create distinct representative frames.")
    return frames


def save_frame_with_label(frame, output_path: Path, frame_number: int, model_count: int) -> None:
    """Save a review image with enough context for a manual counter."""
    height, width = frame.shape[:2]
    banner_height = min(72, max(44, height // 4))
    cv2.rectangle(frame, (0, 0), (width, banner_height), (0, 0, 0), -1)
    label = f"Frame {frame_number} | Model current population: {model_count}"
    cv2.putText(frame, label, (8, max(26, banner_height - 16)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
    if not cv2.imwrite(str(output_path), frame):
        raise RuntimeError(f"Could not save frame image: {output_path}")


def prepare_samples(video_path: Path, csv_path: Path, frames_dir: Path, results_path: Path) -> pd.DataFrame:
    """Extract frames and create a ground-truth entry sheet, without scoring it."""
    data = pd.read_csv(csv_path)
    required_columns = {"video_name", "frame", "timestamp", "current_population"}
    missing = required_columns - set(data.columns)
    if missing:
        raise ValueError(f"CSV is missing required columns: {', '.join(sorted(missing))}")
    video_rows = data[data["video_name"] == VIDEO_NAME].copy()
    if video_rows.empty:
        raise ValueError(f"No CSV records found for {VIDEO_NAME}.")
    video_rows["frame"] = video_rows["frame"].astype(int)
    if video_rows["frame"].duplicated().any():
        raise ValueError("CSV contains duplicate frame records for the top-view video.")

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open source video: {video_path}")
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    selected_frames = evenly_spaced_frames(total_frames)
    frames_dir.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    try:
        for frame_number in selected_frames:
            match = video_rows[video_rows["frame"] == frame_number]
            if len(match) != 1:
                raise ValueError(f"Expected one CSV record for frame {frame_number}, found {len(match)}.")
            row = match.iloc[0]
            capture.set(cv2.CAP_PROP_POS_FRAMES, frame_number - 1)
            ok, frame = capture.read()
            if not ok:
                raise RuntimeError(f"Could not decode source frame {frame_number}.")
            model_count = int(row["current_population"])
            image_path = frames_dir / f"frame_{frame_number:04d}_model_{model_count:02d}.jpg"
            save_frame_with_label(frame, image_path, frame_number, model_count)
            records.append({
                "video_name": VIDEO_NAME,
                "frame": frame_number,
                "timestamp": row["timestamp"],
                "model_current_population": model_count,
                "ground_truth_count": pd.NA,
                "count_error_model_minus_truth": pd.NA,
                "absolute_error": pd.NA,
                "percentage_error": pd.NA,
                "frame_image": str(image_path),
            })
    finally:
        capture.release()
    results = pd.DataFrame(records)
    results.to_csv(results_path, index=False)
    return results


def ask_ground_truth(results: pd.DataFrame) -> pd.DataFrame:
    """Prompt for all manually observed counts with strict numeric validation."""
    completed = results.copy()
    print("\nCount people in each extracted image and enter the actual visible count.")
    for index, row in completed.iterrows():
        while True:
            raw = input(f"Frame {row.frame} (timestamp {row.timestamp}s, model={row.model_current_population}): ").strip()
            try:
                truth = int(raw)
                if truth < 0:
                    raise ValueError
                break
            except ValueError:
                print("Please enter a non-negative whole number.")
        model_count = int(row["model_current_population"])
        completed.at[index, "ground_truth_count"] = truth
        completed.at[index, "count_error_model_minus_truth"] = model_count - truth
        completed.at[index, "absolute_error"] = abs(model_count - truth)
        completed.at[index, "percentage_error"] = (model_count - truth) / truth * 100 if truth else pd.NA
    return completed


def build_summary(results: pd.DataFrame) -> dict:
    """Calculate requested aggregate metrics after all 20 truth counts exist."""
    if len(results) != FRAME_COUNT or results["ground_truth_count"].isna().any():
        raise ValueError(f"All {FRAME_COUNT} ground-truth counts are required before scoring.")
    valid_percentages = results["percentage_error"].dropna().astype(float)
    mae = float(results["absolute_error"].astype(float).mean())
    mpe = float(valid_percentages.mean()) if not valid_percentages.empty else None
    mape = float(valid_percentages.abs().mean()) if not valid_percentages.empty else None
    return {
        "video_name": VIDEO_NAME,
        "sampled_frames": FRAME_COUNT,
        "metric_definitions": {
            "mae": "Mean absolute count error in people.",
            "mean_percentage_error": "Mean signed ((model - ground truth) / ground truth) * 100; zero-ground-truth frames are excluded.",
            "counting_accuracy_percent": "100 minus mean absolute percentage error; zero-ground-truth frames are excluded and the result is bounded at 0.",
        },
        "mae": round(mae, 4),
        "mean_percentage_error": round(mpe, 4) if mpe is not None else None,
        "mean_absolute_percentage_error": round(mape, 4) if mape is not None else None,
        "counting_accuracy_percent": round(max(0.0, 100.0 - mape), 4) if mape is not None else None,
    }


def main() -> None:
    project_dir = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description="Validate 20 representative walking_top video frames manually")
    parser.add_argument("--video", type=Path, default=project_dir / "Videos" / VIDEO_NAME)
    parser.add_argument("--csv", type=Path, default=project_dir / "outputs" / "crowd_counts.csv")
    parser.add_argument("--frames-dir", type=Path, default=project_dir / "outputs" / "validation_frames" / "top_view")
    parser.add_argument("--results", type=Path, default=project_dir / "outputs" / "validation_results_top.csv")
    parser.add_argument("--summary", type=Path, default=project_dir / "outputs" / "validation_summary_top.json")
    parser.add_argument("--prepare-only", action="store_true", help="Extract frames and create blank results CSV without prompting.")
    args = parser.parse_args()
    if not args.video.is_file():
        raise SystemExit(f"Source video not found: {args.video}")
    if not args.csv.is_file():
        raise SystemExit(f"Crowd-count CSV not found: {args.csv}")
    args.results.parent.mkdir(parents=True, exist_ok=True)
    results = prepare_samples(args.video, args.csv, args.frames_dir, args.results)
    print(f"Saved {len(results)} review frames to: {args.frames_dir}")
    print("Frame | Timestamp | Model current population")
    for row in results.itertuples(index=False):
        print(f"{row.frame:5d} | {row.timestamp:>9} | {row.model_current_population:>24}")
    if args.prepare_only:
        print(f"Saved blank ground-truth entry sheet: {args.results}")
        return
    completed = ask_ground_truth(results)
    completed.to_csv(args.results, index=False)
    summary = build_summary(completed)
    with args.summary.open("w", encoding="utf-8") as handle:
        json.dump(summary, handle, indent=2)
    print(f"\nSaved scored results: {args.results}")
    print(f"Saved summary: {args.summary}")
    print(f"MAE: {summary['mae']}")
    print(f"Mean percentage error: {summary['mean_percentage_error']}%")
    print(f"Counting accuracy: {summary['counting_accuracy_percent']}%")


if __name__ == "__main__":
    main()
