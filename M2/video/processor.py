from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import cv2
import numpy as np


@dataclass
class VideoInfo:
    path: Path
    total_frames: int
    fps: float
    width: int
    height: int
    duration_seconds: float


class VideoProcessor:
    def __init__(self, video_path: str | Path):
        self.path = Path(video_path)
        if not self.path.exists():
            raise FileNotFoundError(f"Video file not found: {self.path}")
        self._cap = None
        self._info = None

    def open(self) -> VideoInfo:
        self._cap = cv2.VideoCapture(str(self.path))
        if not self._cap.isOpened():
            raise RuntimeError(f"Cannot open video file: {self.path}")

        total_frames = int(self._cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = self._cap.get(cv2.CAP_PROP_FPS)
        width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0

        self._info = VideoInfo(
            path=self.path,
            total_frames=total_frames,
            fps=fps,
            width=width,
            height=height,
            duration_seconds=duration,
        )
        return self._info

    @property
    def info(self) -> VideoInfo:
        if self._info is None:
            raise RuntimeError("Video not opened. Call open() first.")
        return self._info

    def read_frame(self) -> tuple[bool, np.ndarray | None]:
        if self._cap is None:
            raise RuntimeError("Video not opened. Call open() first.")
        return self._cap.read()

    def seek_to_frame(self, frame_idx: int) -> bool:
        if self._cap is None:
            raise RuntimeError("Video not opened. Call open() first.")
        return self._cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)

    def release(self):
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()
        return False
