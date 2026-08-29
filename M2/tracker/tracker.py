from __future__ import annotations
from dataclasses import dataclass, field
import numpy as np


@dataclass
class Track:
    track_id: int
    bbox: np.ndarray
    hits: int = 1
    age: int = 0
    time_since_update: int = 0

    @property
    def center(self) -> tuple[float, float]:
        x1, y1, x2, y2 = self.bbox
        return ((x1 + x2) / 2, (y1 + y2) / 2)


def iou(bbox_a: np.ndarray, bbox_b: np.ndarray) -> float:
    x1 = max(bbox_a[0], bbox_b[0])
    y1 = max(bbox_a[1], bbox_b[1])
    x2 = min(bbox_a[2], bbox_b[2])
    y2 = min(bbox_a[3], bbox_b[3])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    area_a = (bbox_a[2] - bbox_a[0]) * (bbox_a[3] - bbox_a[1])
    area_b = (bbox_b[2] - bbox_b[0]) * (bbox_b[3] - bbox_b[1])
    union = area_a + area_b - intersection

    if union <= 0:
        return 0.0
    return intersection / union


def linear_assignment(cost_matrix: np.ndarray) -> np.ndarray:
    if cost_matrix.size == 0:
        return np.empty((0, 2), dtype=int)

    rows, cols = cost_matrix.shape
    matches = []
    unmatched_rows = list(range(rows))
    unmatched_cols = list(range(cols))

    cost = cost_matrix.copy()
    while True:
        if cost.size == 0 or cost.min() == np.inf:
            break
        idx = np.unravel_index(cost.argmin(), cost.shape)
        r, c = idx
        if cost[r, c] == np.inf:
            break
        matches.append((r, c))
        cost[r, :] = np.inf
        cost[:, c] = np.inf
        if r in unmatched_rows:
            unmatched_rows.remove(r)
        if c in unmatched_cols:
            unmatched_cols.remove(c)

    matches_arr = np.array(matches, dtype=int) if matches else np.empty((0, 2), dtype=int)
    unmatched_rows_arr = np.array(unmatched_rows, dtype=int)
    unmatched_cols_arr = np.array(unmatched_cols, dtype=int)

    return matches_arr, unmatched_rows_arr, unmatched_cols_arr


class PersonTracker:
    def __init__(
        self,
        iou_threshold: float = 0.3,
        max_disappeared: int = 30,
        min_hits: int = 1,
        point_box_size: int = 20,
    ):
        self.iou_threshold = iou_threshold
        self.max_disappeared = max_disappeared
        self.min_hits = min_hits
        self.point_box_size = point_box_size
        self.tracks: dict[int, Track] = {}
        self.next_id: int = 1
        self.unique_ids: set[int] = set()
        self.entry_count: int = 0
        self.exit_count: int = 0

    def update(self, points: list[dict]) -> list[tuple[int, int]]:
        if not points:
            for track_id in list(self.tracks.keys()):
                self.tracks[track_id].time_since_update += 1
                if self.tracks[track_id].time_since_update > self.max_disappeared:
                    del self.tracks[track_id]
                    self.exit_count += 1
            return []

        detections = np.array(
            [
                [
                    p["x"] - self.point_box_size,
                    p["y"] - self.point_box_size,
                    p["x"] + self.point_box_size,
                    p["y"] + self.point_box_size,
                ]
                for p in points
            ],
            dtype=np.float32,
        )

        if not self.tracks:
            assigned = []
            for i in range(len(detections)):
                self._create_track(detections[i])
                assigned.append((i, self.next_id - 1))
            return assigned

        track_ids = list(self.tracks.keys())
        track_bboxes = np.array([self.tracks[tid].bbox for tid in track_ids], dtype=np.float32)

        cost_matrix = np.zeros((len(track_ids), len(detections)), dtype=np.float32)
        for t, tid in enumerate(track_ids):
            for d in range(len(detections)):
                cost_matrix[t, d] = 1 - iou(track_bboxes[t], detections[d])

        matches, unmatched_tracks, unmatched_detections = linear_assignment(cost_matrix)

        assigned = []
        matched_tracks = set()
        matched_detections = set()

        for t_idx, d_idx in matches:
            if cost_matrix[t_idx, d_idx] > 1 - self.iou_threshold:
                continue
            tid = track_ids[t_idx]
            self.tracks[tid].bbox = detections[d_idx]
            self.tracks[tid].hits += 1
            self.tracks[tid].time_since_update = 0
            matched_tracks.add(t_idx)
            matched_detections.add(d_idx)
            assigned.append((d_idx, tid))

        for t_idx in range(len(track_ids)):
            if t_idx in matched_tracks:
                continue
            tid = track_ids[t_idx]
            self.tracks[tid].time_since_update += 1
            self.tracks[tid].age += 1
            if self.tracks[tid].time_since_update > self.max_disappeared:
                del self.tracks[tid]
                self.exit_count += 1

        for d_idx in range(len(detections)):
            if d_idx in matched_detections:
                continue
            new_id = self._create_track(detections[d_idx])
            assigned.append((d_idx, new_id))

        return assigned

    def _create_track(self, bbox: np.ndarray) -> int:
        track_id = self.next_id
        self.next_id += 1
        self.tracks[track_id] = Track(track_id=track_id, bbox=bbox.copy())
        self.unique_ids.add(track_id)
        self.entry_count += 1
        return track_id

    @property
    def total_unique_people(self) -> int:
        return len(self.unique_ids)

    @property
    def active_tracks(self) -> int:
        return len(self.tracks)

    @property
    def active_track_ids(self) -> list[int]:
        return list(self.tracks.keys())
