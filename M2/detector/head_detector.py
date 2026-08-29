from __future__ import annotations
import sys
from pathlib import Path
import cv2
import numpy as np
import torch
from scipy.ndimage import maximum_filter

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from scripts.train_head_point_model import HeadUNet


class HeadDetector:
    def __init__(self, checkpoint: str | Path, threshold: float = 0.015, tile_size: int = 256, device: str | None = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.threshold = threshold
        self.tile_size = tile_size
        self.model = self._load_model(checkpoint)

    def _load_model(self, checkpoint: str | Path) -> HeadUNet:
        checkpoint_path = Path(checkpoint)
        if not checkpoint_path.exists():
            raise FileNotFoundError(f"Model checkpoint not found: {checkpoint_path}")
        state = torch.load(str(checkpoint_path), map_location=self.device, weights_only=True)
        model = HeadUNet()
        model.load_state_dict(state["model_state_dict"])
        model.to(self.device)
        model.eval()
        return model

    @torch.inference_mode()
    def detect(self, frame: np.ndarray) -> tuple[list[dict], np.ndarray, list[float]]:
        h, w = frame.shape[:2]
        size = self.tile_size
        stride = size // 2
        score = np.zeros((h, w), np.float32)
        weight = np.zeros((h, w), np.float32)

        for y in range(0, h, stride):
            for x in range(0, w, stride):
                y1 = min(h, y + size)
                x1 = min(w, x + size)
                patch = np.zeros((size, size, 3), np.uint8)
                patch[: y1 - y, : x1 - x] = frame[y:y1, x:x1]
                t = (
                    torch.from_numpy(cv2.cvtColor(patch, cv2.COLOR_BGR2RGB))
                    .permute(2, 0, 1)
                    .float()[None]
                    / 255
                )
                t = t.to(self.device)
                out = torch.sigmoid(self.model(t))[0, 0].cpu().numpy()
                score[y:y1, x:x1] += out[: y1 - y, : x1 - x]
                weight[y:y1, x:x1] += 1

        score /= np.maximum(weight, 1)
        peaks = (score == maximum_filter(score, size=7)) & (score >= self.threshold)
        ys, xs = np.where(peaks)

        points = []
        confs = []
        for idx, (px, py) in enumerate(zip(xs, ys), start=1):
            points.append({"id": idx, "x": int(px), "y": int(py)})
            confs.append(float(score[py, px]))

        overlay = frame.copy()
        for p in points:
            cv2.circle(overlay, (p["x"], p["y"]), 3, (0, 0, 255), -1)

        return points, overlay, confs

    @property
    def preliminary_count(self) -> int:
        return getattr(self, "_last_count", 0)

    def detect_with_count(self, frame: np.ndarray) -> tuple[int, list[dict], np.ndarray, list[float]]:
        points, overlay, confs = self.detect(frame)
        self._last_count = len(points)
        return len(points), points, overlay, confs
