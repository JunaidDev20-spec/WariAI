from __future__ import annotations
import csv
import json
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class FrameResult:
    video_name: str
    timestamp: str
    frame: int
    current_population: int
    unique_people_observed: int
    people_count: int
    entry_count: int
    exit_count: int
    density: float
    confidence: float


@dataclass
class VideoResult:
    video: str
    results: list[FrameResult] = field(default_factory=list)


class JsonWriter:
    def __init__(self, output_dir: str | Path = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def write(self, result: VideoResult) -> Path:
        video_stem = Path(result.video).stem
        output_path = self.output_dir / f"{video_stem}_population.json"

        data = {
            "video_name": Path(result.video).name,
            "results": [
                {
                    "video_name": r.video_name,
                    "timestamp": r.timestamp,
                    "frame": r.frame,
                    "current_population": r.current_population,
                    "unique_people_observed": r.unique_people_observed,
                    "people_count": r.people_count,
                    "entry_count": r.entry_count,
                    "exit_count": r.exit_count,
                    "density": r.density,
                    "confidence": r.confidence,
                }
                for r in result.results
            ],
        }

        output_path.write_text(json.dumps(data, indent=2))
        return output_path


class CsvWriter:
    def __init__(self, output_dir: str | Path = "outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def write(self, result: VideoResult) -> Path:
        video_stem = Path(result.video).stem
        output_path = self.output_dir / f"{video_stem}_population.csv"

        with output_path.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                "video_name",
                "timestamp",
                "frame",
                "current_population",
                "unique_people_observed",
                "people_count",
                "entry_count",
                "exit_count",
                "density",
                "confidence",
            ])
            for r in result.results:
                writer.writerow([
                    r.video_name,
                    r.timestamp,
                    r.frame,
                    r.current_population,
                    r.unique_people_observed,
                    r.people_count,
                    r.entry_count,
                    r.exit_count,
                    r.density,
                    r.confidence,
                ])

        return output_path
