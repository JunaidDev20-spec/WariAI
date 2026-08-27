#!/usr/bin/env python
"""Anonymous person detection and ByteTrack-based crowd counting.

The program deliberately uses only YOLO class 0 (person). It does not perform
face recognition, identity matching, demographic classification, or inference
about any person's affiliation.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path
from typing import Iterable

import cv2
import pandas as pd
from ultralytics import YOLO


VIDEO_SUFFIXES = {".mp4", ".mov", ".m4v", ".avi", ".mkv"}
CSV_COLUMNS = [
    "video_name",
    "timestamp",
    "frame",
    "current_population",
    "unique_people_observed",
    # Backwards-compatible alias for current_population. Do not sum it over
    # frames: its value is the instantaneous visible population only.
    "people_count",
    "entry_count",
    "exit_count",
    "density",
    "confidence",
]


def parse_line(value: str | None) -> tuple[int, int, int, int] | None:
    """Parse a virtual counting line as x1,y1,x2,y2, or return None."""
    if not value:
        return None
    try:
        points = tuple(int(part.strip()) for part in value.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("--line must be x1,y1,x2,y2") from exc
    if len(points) != 4 or points[0:2] == points[2:4]:
        raise argparse.ArgumentTypeError("--line must contain two distinct points")
    return points


def video_paths(video_dir: Path) -> list[Path]:
    """Return supported videos, including compound-looking .mp4.mov names."""
    return sorted(path for path in video_dir.iterdir() if path.is_file() and path.suffix.lower() in VIDEO_SUFFIXES)


def signed_side(point: tuple[int, int], line: tuple[int, int, int, int]) -> float:
    """Cross-product sign indicating which side of a directed line a point lies."""
    x, y = point
    x1, y1, x2, y2 = line
    return (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)


def crossed(previous: float, current: float) -> bool:
    """Return true only for a meaningful side change (not a point touching line)."""
    return (previous < 0 < current) or (previous > 0 > current)


def format_timestamp(frame_number: int, fps: float) -> str:
    seconds = frame_number / fps if fps > 0 else 0.0
    return f"{seconds:.3f}"


def draw_frame(
    frame,
    boxes: Iterable[tuple[int, int, int, int, int, float]],
    current_population: int,
    unique_people_observed: int,
    entries: int,
    exits: int,
    line: tuple[int, int, int, int] | None,
) -> None:
    """Draw anonymous boxes, temporary tracking IDs, and aggregate statistics."""
    for x1, y1, x2, y2, track_id, confidence in boxes:
        cv2.rectangle(frame, (x1, y1), (x2, y2), (42, 220, 120), 2)
        cv2.putText(
            frame,
            f"ID {track_id} {confidence:.2f}",
            (x1, max(18, y1 - 7)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (42, 220, 120),
            2,
            cv2.LINE_AA,
        )
    if line:
        cv2.line(frame, line[:2], line[2:], (0, 195, 255), 2)
    cv2.rectangle(frame, (8, 8), (360, 98), (0, 0, 0), -1)
    cv2.putText(
        frame,
        f"Current: {current_population}  Tracks seen: {unique_people_observed}",
        (16, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
    )
    cv2.putText(frame, f"In: {entries}  Out: {exits}", (16, 63), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)


def process_video(
    video_path: Path,
    model: YOLO,
    annotated_dir: Path,
    confidence_threshold: float,
    line: tuple[int, int, int, int] | None,
    device: str | None,
) -> list[dict]:
    """Track people in one video and return one timestamped record per frame."""
    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")

    fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if width <= 0 or height <= 0:
        capture.release()
        raise RuntimeError(f"Invalid frame size for {video_path}")

    output_path = annotated_dir / f"{video_path.stem}_annotated.mp4"
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    if not writer.isOpened():
        capture.release()
        raise RuntimeError(f"Cannot create annotated video: {output_path}")

    records: list[dict] = []
    line_side: dict[int, float] = {}
    counted_directions: set[tuple[int, str]] = set()
    observed_track_ids: set[int] = set()
    entry_count = 0
    exit_count = 0
    frame_number = 0
    logging.info("Processing %s (%.2f fps, %dx%d)", video_path.name, fps, width, height)

    # A model object is shared for efficiency, but tracker history must never
    # leak from one source video into the next.
    predictor = getattr(model, "predictor", None)
    for tracker in getattr(predictor, "trackers", []) or []:
        tracker.reset()

    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            frame_number += 1
            result = model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=[0],
                conf=confidence_threshold,
                verbose=False,
                device=device,
            )[0]
            detections: list[tuple[int, int, int, int, int, float]] = []
            if result.boxes is not None and result.boxes.id is not None:
                xyxy = result.boxes.xyxy.cpu().numpy().astype(int)
                ids = result.boxes.id.int().cpu().tolist()
                confidences = result.boxes.conf.cpu().tolist()
                for (x1, y1, x2, y2), track_id, score in zip(xyxy, ids, confidences):
                    detections.append((int(x1), int(y1), int(x2), int(y2), int(track_id), float(score)))
                    observed_track_ids.add(int(track_id))
                    if line:
                        side = signed_side(((int(x1) + int(x2)) // 2, (int(y1) + int(y2)) // 2), line)
                        old_side = line_side.get(int(track_id))
                        if old_side is not None and crossed(old_side, side):
                            direction = "entry" if old_side < side else "exit"
                            key = (int(track_id), direction)
                            if key not in counted_directions:
                                entry_count += int(direction == "entry")
                                exit_count += int(direction == "exit")
                                counted_directions.add(key)
                        if side != 0:
                            line_side[int(track_id)] = side

            # This is a snapshot, never an accumulated total: a tracked person
            # visible in this decoded frame contributes exactly one to it.
            current_population = len({item[4] for item in detections})
            mean_confidence = (
                float(sum(item[5] for item in detections) / current_population) if current_population else 0.0
            )
            records.append(
                {
                    "video_name": video_path.name,
                    "timestamp": format_timestamp(frame_number, fps),
                    "frame": frame_number,
                    "current_population": current_population,
                    "unique_people_observed": len(observed_track_ids),
                    "people_count": current_population,
                    "entry_count": entry_count,
                    "exit_count": exit_count,
                    "density": round(current_population * 1_000_000 / (width * height), 4),
                    "confidence": round(mean_confidence, 4),
                }
            )
            draw_frame(
                frame,
                detections,
                current_population,
                len(observed_track_ids),
                entry_count,
                exit_count,
                line,
            )
            writer.write(frame)
    finally:
        capture.release()
        writer.release()

    logging.info("Saved %s", output_path)
    return records


def main() -> None:
    parser = argparse.ArgumentParser(description="Anonymous YOLO + ByteTrack crowd counting")
    parser.add_argument("--video-dir", type=Path, default=Path("Videos"), help="Folder containing source videos")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs"), help="Folder for CSV, JSON and annotated videos")
    parser.add_argument("--model", default="yolo11n.pt", help="Ultralytics pretrained model weights")
    parser.add_argument("--confidence", type=float, default=0.35, help="Person detection confidence threshold")
    parser.add_argument("--line", type=parse_line, default=None, help="Optional entry/exit line: x1,y1,x2,y2")
    parser.add_argument("--device", default=None, help="Ultralytics device, e.g. cpu or 0")
    args = parser.parse_args()

    if not args.video_dir.is_dir():
        raise SystemExit(f"Video directory not found: {args.video_dir}")
    if not 0 < args.confidence <= 1:
        raise SystemExit("--confidence must be within (0, 1]")
    videos = video_paths(args.video_dir)
    if not videos:
        raise SystemExit(f"No supported videos found in {args.video_dir}")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    annotated_dir = args.output_dir / "annotated"
    annotated_dir.mkdir(exist_ok=True)
    logging.basicConfig(format="%(levelname)s: %(message)s", level=logging.INFO)
    model = YOLO(args.model)  # Downloads pretrained weights on first run only.
    all_records: list[dict] = []
    failures: list[str] = []
    for video in videos:
        try:
            all_records.extend(process_video(video, model, annotated_dir, args.confidence, args.line, args.device))
        except Exception as exc:  # Keep the batch usable if a single file is corrupt.
            logging.exception("Failed to process %s", video.name)
            failures.append(f"{video.name}: {exc}")

    if not all_records:
        raise SystemExit("No videos were processed successfully. See errors above.")
    dataframe = pd.DataFrame(all_records, columns=CSV_COLUMNS)
    csv_path = args.output_dir / "crowd_counts.csv"
    json_path = args.output_dir / "crowd_counts.json"
    dataframe.to_csv(csv_path, index=False)
    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(all_records, handle, indent=2)
    logging.info("Wrote %s and %s (%d frame records)", csv_path, json_path, len(dataframe))
    if failures:
        logging.warning("Completed with %d video failure(s): %s", len(failures), "; ".join(failures))


if __name__ == "__main__":
    main()
