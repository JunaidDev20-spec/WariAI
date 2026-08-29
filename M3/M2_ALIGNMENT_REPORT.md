# M2 Data Alignment Report

## Files Inspected

| File | Rows | Columns |
|------|------|---------|
| `Output_m2/test_population.csv` | 6,092 | video_name, timestamp, frame, current_population, unique_people_observed, people_count, entry_count, exit_count, density, confidence |
| `Output_m2/test_crowd_counts.csv` | 6,092 | frame_number, people_count |

## Compatibility Assessment: NOT POSSIBLE

### test_crowd_counts.csv
- Contains only `frame_number` and `people_count`.
- No timestamps in a format mappable to M1 session times.
- No `video_name` or session identifiers.
- Cannot determine which M1 session (if any) these frames belong to.
- No metadata bridges the 30 FPS frame sequence to M1's variable-frame-rate timestamps.

### test_population.csv
- Contains timestamps in `HH:MM:SS.mmm` format and a `video_name` field set to `test.mp4`.
- `test.mp4` does not match any M1 session video filename.
- The README in `Output_m2/` describes a completely different project: *GeoAI Physical Occupancy and Gathering-Zone Detection*, which uses GeoTIFFs, GeoJSON, Leaflet maps, and semantic land-cover classification.
- There is no evidence that `test.mp4` is one of the Wari CCTV videos processed by M1.

## Conclusion

**M2 data is NOT integrated into M3.**

Do not force a merge. The columns, project context, and video sources do not align with M1.

## What Was Done Instead

- M3 uses only `Output_m1/crowd_counts.csv` for real forecasting.
- M2 files were inspected and documented here.
- M3 dashboard JSON explicitly states M2 non-integration.
