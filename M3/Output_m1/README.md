# WariAI M1 CCTV Crowd Counting MVP

An anonymous, offline video-analysis MVP for estimating the number of people visible in CCTV-style video. It detects **only** the YOLO `person` class and uses ByteTrack to maintain temporary per-video tracking IDs. It does not detect faces, identify people, infer names, or classify anyone by affiliation.

## What it produces

After a run, `outputs/` contains:

- `annotated/<video>_annotated.mp4`: bounding boxes, temporary track IDs, live people count, and optional entry/exit totals.
- `crowd_counts.csv` and `crowd_counts.json`: one timestamped record per decoded frame, including `current_population`, `unique_people_observed`, `entry_count`, and `exit_count`.

`current_population` is the **instantaneous count**: the number of distinct active person tracks in that frame. `people_count` is retained as an identical backwards-compatible alias. Neither field must be summed across frames; for example, summing it measures person-frames, not the number of people in a video.

`unique_people_observed` is the cumulative number of distinct temporary ByteTrack IDs seen so far in the current video. It is intentionally separate from `current_population`, but remains an approximate tracking metric—not a verified count of real-world unique people—because tracks can fragment or occasionally switch.

The numeric `density` field is **people per megapixel of image area**. It is a simple screen-space indicator for comparing crowd load within the same camera view; it is not a real-world people-per-square-metre measurement.

`entry_count` and `exit_count` are cumulative line-crossing totals. They remain `0` unless you pass `--line`; their interpretation depends on the direction you draw the line. Crossing from the line's negative side to its positive side is treated as an entry.

## Windows setup

From PowerShell in this project folder:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks environment activation, run this for the current window first:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

## Run all source videos

```powershell
python src\detect_track.py --video-dir Videos --output-dir outputs
```

On first use, Ultralytics downloads the pretrained `yolo11n.pt` weights. For NVIDIA GPU inference, append `--device 0`; for predictable CPU-only use, append `--device cpu`.

To estimate directional flow through a virtual line in pixel coordinates (left-to-right here):

```powershell
python src\detect_track.py --line 640,0,640,720
```

The program reads `.mp4`, `.mov`, and compound names such as `.mp4.mov` automatically. It only reads `Videos/`; original video files are never changed.

## Validate selected frames manually

First open an annotated video, choose a few frame numbers, count people yourself, then run:

```powershell
python src\validate.py --csv outputs\crowd_counts.csv --video walking_front.mp4.mp4 --frames 100 300 500
```

It prompts for each ground-truth count and reports signed counting error and mean absolute error (MAE). If you omit `--frames`, it asks for them interactively.

## Dedicated top-view validation

Create exactly 20 evenly distributed review frames for `walking_top.mp4.mp4` without modifying the source video or crowd-count exports:

```powershell
python src\validate_top_view.py --prepare-only
```

The images go to `outputs\validation_frames\top_view\`, with the frame number and model's `current_population` visibly labelled. The companion CSV is ready for ground-truth entry. To enter all 20 counts interactively and calculate MAE, mean percentage error, and counting accuracy, run:

```powershell
python src\validate_top_view.py
```

## Notes

- ByteTrack IDs are temporary within a single video; they are not person identities and cannot be used across videos.
- Counts are approximate and can degrade with occlusion, camera angle, low light, or dense crowds. Tune `--confidence` (default `0.35`) if necessary.
- Re-running replaces the two aggregate exports and corresponding annotated filenames in `outputs/`, leaving source videos untouched.
