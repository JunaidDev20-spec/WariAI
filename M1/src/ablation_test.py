#!/usr/bin/env python
"""Minimal ablation test for YOLO11n vs YOLO11s and imgsz 640 vs 960.

Does NOT modify detect_track.py, original videos, or existing outputs.
Writes results only to outputs/ablation/.
"""

from __future__ import annotations

import argparse
import json
import logging
import time
from pathlib import Path

import cv2
import pandas as pd
from ultralytics import YOLO


CONFIGS = [
    {"model": "yolo11n.pt", "imgsz": 640, "label": "yolo11n_640"},
    {"model": "yolo11n.pt", "imgsz": 960, "label": "yolo11n_960"},
    {"model": "yolo11s.pt", "imgsz": 640, "label": "yolo11s_640"},
    {"model": "yolo11s.pt", "imgsz": 960, "label": "yolo11s_960"},
]


def run_config(video_path: Path, model_name: str, imgsz: int, device: str | None, max_frames: int | None = None) -> dict:
    model = YOLO(model_name)
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))

    records: list[dict] = []
    observed_track_ids: set[int] = set()
    frame_number = 0
    inference_times: list[float] = []
    max_pop = 0

    try:
        while True:
            if max_frames and frame_number >= max_frames:
                break
            ok, frame = capture.read()
            if not ok:
                break
            frame_number += 1

            t0 = time.perf_counter()
            result = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=[0],
                conf=0.35,
                verbose=False,
                device=device,
                imgsz=imgsz,
            )[0]
            t1 = time.perf_counter()
            inference_times.append(t1 - t0)

            detections = []
            if result.boxes is not None and result.boxes.id is not None:
                xyxy = result.boxes.xyxy.cpu().numpy().astype(int)
                ids = result.boxes.id.int().cpu().tolist()
                confidences = result.boxes.conf.cpu().tolist()
                for (x1, y1, x2, y2), track_id, score in zip(xyxy, ids, confidences):
                    detections.append((int(x1), int(y1), int(x2), int(y2), int(track_id), float(score)))
                    observed_track_ids.add(int(track_id))

            current_pop = len({item[4] for item in detections})
            max_pop = max(max_pop, current_pop)
            mean_conf = float(sum(item[5] for item in detections) / current_pop) if current_pop else 0.0

            records.append({
                "frame": frame_number,
                "current_population": current_pop,
                "unique_people_observed": len(observed_track_ids),
                "mean_confidence": round(mean_conf, 4),
            })
    finally:
        capture.release()

    total_inference = sum(inference_times)
    mean_inference = total_inference / len(inference_times) if inference_times else 0.0
    mean_pop = sum(r["current_population"] for r in records) / len(records) if records else 0.0
    mean_conf = sum(r["mean_confidence"] for r in records) / len(records) if records else 0.0

    return {
        "model": model_name,
        "imgsz": imgsz,
        "frames_processed": len(records),
        "max_current_population": max_pop,
        "mean_current_population": round(mean_pop, 2),
        "mean_confidence": round(mean_conf, 4),
        "total_inference_seconds": round(total_inference, 3),
        "mean_inference_ms": round(mean_inference * 1000, 2),
        "unique_tracks_seen": len(observed_track_ids),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Ablation: YOLO11n vs YOLO11s, imgsz 640 vs 960")
    parser.add_argument("--video", type=Path, default=Path("Videos/walking_front.mp4.mp4"), help="Video to test")
    parser.add_argument("--device", default=None, help="Ultralytics device, e.g. cpu or 0")
    parser.add_argument("--model", default=None, help="Run single model (e.g. yolo11n.pt)")
    parser.add_argument("--imgsz", type=int, default=None, help="Run single imgsz (e.g. 960)")
    parser.add_argument("--label", default=None, help="Label for single run")
    parser.add_argument("--max-frames", type=int, default=None, help="Limit frames for faster testing")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/ablation"), help="Results directory")
    args = parser.parse_args()

    if args.model and args.imgsz:
        configs = [{"model": args.model, "imgsz": args.imgsz, "label": args.label or f"{args.model.replace('.pt','')}_{args.imgsz}"}]
    else:
        configs = CONFIGS

    if not args.video.is_file():
        raise SystemExit(f"Video not found: {args.video}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)

    results = []
    for cfg in configs:
        logging.info("Running %s on %s (imgsz=%d)", cfg["model"], args.video.name, cfg["imgsz"])
        stats = run_config(args.video, cfg["model"], cfg["imgsz"], args.device, args.max_frames)
        stats["label"] = cfg["label"]
        results.append(stats)

    df = pd.DataFrame(results)
    if args.model and args.imgsz and args.label:
        csv_path = args.output_dir / f"{args.video.stem}_{args.label}_ablation.csv"
        json_path = args.output_dir / f"{args.video.stem}_{args.label}_ablation.json"
    else:
        csv_path = args.output_dir / f"{args.video.stem}_ablation.csv"
        json_path = args.output_dir / f"{args.video.stem}_ablation.json"
    df.to_csv(csv_path, index=False)
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n=== Ablation Results ===")
    print(df.to_string(index=False))
    print(f"\nCSV: {csv_path}")
    print(f"JSON: {json_path}")


if __name__ == "__main__":
    main()
