from __future__ import annotations
import argparse
import sys
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from detector import HeadDetector
from video import VideoProcessor
from tracker import PersonTracker
from output import CsvWriter, JsonWriter
from output.json_writer import VideoResult, FrameResult


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crowd counting with person tracking",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--video",
        type=str,
        help="Path to input video file. If not provided, you will be prompted.",
    )
    parser.add_argument(
        "--checkpoint",
        type=str,
        default="models/head_point_expanded.pt",
        help="Path to the trained head detection model checkpoint.",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.015,
        help="Detection threshold for the head point model.",
    )
    parser.add_argument(
        "--tile-size",
        type=int,
        default=256,
        help="Tile size for tiled inference.",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs",
        help="Directory for output files.",
    )
    parser.add_argument(
        "--iou-threshold",
        type=float,
        default=0.3,
        help="IOU threshold for matching detections to tracks.",
    )
    parser.add_argument(
        "--max-disappeared",
        type=int,
        default=30,
        help="Maximum frames a track can disappear before being removed.",
    )
    parser.add_argument(
        "--point-box-size",
        type=int,
        default=20,
        help="Size of bounding box around each detection point for tracking.",
    )
    return parser.parse_args()


def get_video_path(args_video: str | None) -> str:
    if args_video:
        return args_video

    print("No video file specified with --video")
    video_path = input("Enter path to video file: ").strip().strip('"').strip("'")
    if not video_path:
        print("No video file provided. Exiting.")
        sys.exit(1)
    return video_path


def process_video(
    video_path: str,
    checkpoint: str,
    threshold: float,
    tile_size: int,
    output_dir: str,
    iou_threshold: float,
    max_disappeared: int,
    point_box_size: int,
) -> tuple[Path, Path]:
    print(f"\nLoading detection model from: {checkpoint}")
    detector = HeadDetector(
        checkpoint=checkpoint,
        threshold=threshold,
        tile_size=tile_size,
    )
    print(f"Detection model loaded. Device: {detector.device}")

    tracker = PersonTracker(
        iou_threshold=iou_threshold,
        max_disappeared=max_disappeared,
        point_box_size=point_box_size,
    )
    print("Person tracker initialized.")

    print(f"\nOpening video: {video_path}")
    with VideoProcessor(video_path) as video:
        info = video.info
        print(f"Video info: {info.width}x{info.height}, {info.fps:.1f} fps, {info.total_frames} frames")

        video_name = Path(video_path).name
        result = VideoResult(video=video_path)

        frame_number = 0
        print("\nProcessing video...\n")

        while True:
            ok, frame = video.read_frame()
            if not ok or frame is None:
                break

            count, points, overlay, confs = detector.detect_with_count(frame)
            tracker.update(points)

            timestamp_seconds = frame_number / info.fps if info.fps > 0 else 0.0
            hours = int(timestamp_seconds // 3600)
            minutes = int((timestamp_seconds % 3600) // 60)
            seconds = timestamp_seconds % 60
            timestamp = f"{hours:02d}:{minutes:02d}:{seconds:06.3f}"

            current_population = tracker.active_tracks
            unique_people_observed = tracker.total_unique_people
            entry_count = tracker.entry_count
            exit_count = tracker.exit_count

            area_pixels = info.width * info.height
            # Density: people per 100,000 pixels of frame area
            density = (current_population / area_pixels * 100000.0) if area_pixels > 0 else 0.0

            # Confidence: mean of per-point detection confidence scores from the score map
            confidence = float(np.mean(confs)) if confs else 0.0

            result.results.append(
                FrameResult(
                    video_name=video_name,
                    timestamp=timestamp,
                    frame=frame_number,
                    current_population=current_population,
                    unique_people_observed=unique_people_observed,
                    people_count=count,
                    entry_count=entry_count,
                    exit_count=exit_count,
                    density=round(density, 2),
                    confidence=round(confidence, 2),
                )
            )

            if frame_number % 10 == 0 or frame_number == info.total_frames - 1:
                print(
                    f"Frame: {frame_number} / {info.total_frames} | "
                    f"People count: {count} | "
                    f"Active tracks: {tracker.active_tracks} | "
                    f"Unique IDs: {tracker.total_unique_people} | "
                    f"Entries: {tracker.entry_count} | "
                    f"Exits: {tracker.exit_count}"
                )

            frame_number += 1

    csv_writer = CsvWriter(output_dir=output_dir)
    csv_path = csv_writer.write(result)

    json_writer = JsonWriter(output_dir=output_dir)
    json_path = json_writer.write(result)

    print(f"\nProcessing complete.")
    print(f"Video: {video_path}")
    print(f"Frames processed: {len(result.results)}")
    if result.results:
        print(f"Total unique people observed: {result.results[-1].unique_people_observed}")
    print(f"CSV output: {csv_path}")
    print(f"JSON output: {json_path}")

    return csv_path, json_path


def main():
    args = parse_args()
    video_path = get_video_path(args.video)

    try:
        process_video(
            video_path=video_path,
            checkpoint=args.checkpoint,
            threshold=args.threshold,
            tile_size=args.tile_size,
            output_dir=args.output_dir,
            iou_threshold=args.iou_threshold,
            max_disappeared=args.max_disappeared,
            point_box_size=args.point_box_size,
        )
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        sys.exit(1)
    except RuntimeError as e:
        print(f"\nRuntime error: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\nProcessing interrupted by user.")
        sys.exit(130)


if __name__ == "__main__":
    main()
