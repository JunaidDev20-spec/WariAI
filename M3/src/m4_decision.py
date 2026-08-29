"""
M4 Decision Module
==================
Consumes M3 dashboard JSON (real and/or synthetic).
Generates transparent, deterministic risk/decision output.

Risk classification rules (configurable thresholds):
  LOW      — forecast stays comfortably below threshold
  MODERATE — forecast approaches threshold
  HIGH     — forecast exceeds threshold
  CRITICAL — forecast substantially exceeds threshold

M4 does NOT invent population predictions. It receives predictions from M3
and applies risk logic.
"""

import json
from pathlib import Path

# ------------------------------------------------------------------
# CONFIGURATION — DEMO THRESHOLDS
# These thresholds are configurable but NOT scientifically validated.
# Replace with domain-validated values for production use.
# ------------------------------------------------------------------
RISK_THRESHOLDS = {
    "LOW": 0,
    "MODERATE": 100,
    "HIGH": 500,
    "CRITICAL": 1000,
}

DECISION_RULES = {
    "LOW": {
        "action": "PROCEED",
        "description": "Low occupancy expected. Normal operations.",
    },
    "MODERATE": {
        "action": "MONITOR",
        "description": "Moderate occupancy expected. Maintain awareness and have contingency ready.",
    },
    "HIGH": {
        "action": "PREPARE",
        "description": "High occupancy expected. Activate contingency measures and staff.",
    },
    "CRITICAL": {
        "action": "RESTRICT",
        "description": "Critical occupancy expected. Implement restrictions or alternate routing.",
    },
}

# ------------------------------------------------------------------
# INPUTS / OUTPUTS
# ------------------------------------------------------------------
REAL_DASHBOARD = Path("outputs/real/m3_dashboard.json")
SYNTHETIC_DASHBOARD = Path("outputs/synthetic_dashboard.json")
OUTPUT_DIR = Path("outputs")
M4_REAL_OUTPUT = OUTPUT_DIR / "real/m4_decision.json"
M4_SYNTHETIC_OUTPUT = OUTPUT_DIR / "synthetic/m4_decision.json"


def classify_risk(expected_peak):
    if expected_peak < RISK_THRESHOLDS["MODERATE"]:
        return "LOW"
    elif expected_peak < RISK_THRESHOLDS["HIGH"]:
        return "MODERATE"
    elif expected_peak < RISK_THRESHOLDS["CRITICAL"]:
        return "HIGH"
    else:
        return "CRITICAL"


def generate_decision(forecast):
    data_status = forecast.get("data_status", forecast.get("data_label", "UNKNOWN"))
    source = forecast.get("source", "UNKNOWN")
    zone = forecast.get("zone", forecast.get("zone_id", "UNKNOWN"))
    current_pop = forecast.get("current_population", 0)

    # Extract forecast values — handle both real and synthetic field names
    forecast_15min = forecast.get("forecast_15min", "N/A")
    forecast_30min = forecast.get("forecast_30min", "N/A")
    forecast_60min = forecast.get("forecast_60min", "N/A")
    expected_avg = forecast.get("expected_average_population_60min",
                     forecast.get("expected_average_population_60s", 0))
    expected_peak = forecast.get("expected_peak_population_60min",
                      forecast.get("expected_peak_population_60s", 0))

    confidence = forecast.get("confidence", "NOT_COMPUTED")
    validation_status = forecast.get("validation_status", "UNKNOWN")
    model = forecast.get("model", "UNKNOWN")
    metrics = forecast.get("metrics", {})

    # If forecast fields are strings (NOT VALIDATED), use current_pop for risk
    # rather than fabricating a numeric forecast
    if isinstance(forecast_15min, str) and "NOT VALIDATED" in forecast_15min:
        risk_population = current_pop
        forecast_note = "15/30/60-min forecasts NOT VALIDATED — using current_population for risk classification"
    else:
        risk_population = expected_peak
        forecast_note = "Using expected_peak_population_60min for risk classification"

    risk_level = classify_risk(risk_population)
    decision_rule = DECISION_RULES.get(risk_level, {})

    reasoning_parts = [
        f"source={source}",
        f"zone={zone}",
        f"current_population={current_pop}",
        f"forecast_15min={forecast_15min}",
        f"forecast_30min={forecast_30min}",
        f"forecast_60min={forecast_60min}",
        f"expected_avg_60min={expected_avg}",
        f"expected_peak_60min={expected_peak}",
        f"risk_population_used={risk_population}",
        f"confidence={confidence}",
        f"model={model}",
        f"validation_status={validation_status}",
        forecast_note,
    ]

    return {
        "data_status": data_status,
        "source": source,
        "zone": zone,
        "current_population": current_pop,
        "forecast_15min": forecast_15min,
        "forecast_30min": forecast_30min,
        "forecast_60min": forecast_60min,
        "expected_average_population": expected_avg,
        "expected_peak_population": expected_peak,
        "confidence": confidence,
        "prediction_interval": forecast.get("prediction_interval", {}),
        "model": model,
        "metrics": metrics,
        "validation_status": validation_status,
        "risk_level": risk_level,
        "decision": decision_rule.get("action", "UNKNOWN"),
        "reason": " | ".join(reasoning_parts),
        "risk_thresholds_used": RISK_THRESHOLDS,
        "note": "Thresholds are DEMO values. Real thresholds require domain expertise.",
        "m4_generated_at": "2026-08-29T08:00:00Z",
    }


def process_dashboard(dashboard_path, output_path, label):
    if not dashboard_path.exists():
        print(f"  WARNING: {dashboard_path} not found, skipping {label}.")
        return []

    with dashboard_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    forecasts = data.get("forecasts", [])
    decisions = []
    for forecast in forecasts:
        decision = generate_decision(forecast)
        decisions.append(decision)
        print(f"  {decision['zone']}: {decision['risk_level']} -> {decision['decision']}")

    output_data = {
        "m4_label": label,
        "total_forecasts": len(decisions),
        "risk_distribution": {
            "LOW": sum(1 for d in decisions if d["risk_level"] == "LOW"),
            "MODERATE": sum(1 for d in decisions if d["risk_level"] == "MODERATE"),
            "HIGH": sum(1 for d in decisions if d["risk_level"] == "HIGH"),
            "CRITICAL": sum(1 for d in decisions if d["risk_level"] == "CRITICAL"),
        },
        "action_distribution": {
            "PROCEED": sum(1 for d in decisions if d["decision"] == "PROCEED"),
            "MONITOR": sum(1 for d in decisions if d["decision"] == "MONITOR"),
            "PREPARE": sum(1 for d in decisions if d["decision"] == "PREPARE"),
            "RESTRICT": sum(1 for d in decisions if d["decision"] == "RESTRICT"),
        },
        "risk_thresholds_used": RISK_THRESHOLDS,
        "note": "Thresholds are DEMO values only and NOT scientifically validated.",
        "decisions": decisions,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

    print(f"  Saved {label} decisions to: {output_path}")
    return decisions


def main():
    print("=" * 70)
    print("M4 DECISION MODULE")
    print("=" * 70)

    all_decisions = []

    print("\n[1] Processing M3 REAL forecasts ...")
    real_decisions = process_dashboard(REAL_DASHBOARD, M4_REAL_OUTPUT, "REAL")
    all_decisions.extend(real_decisions)

    print("\n[2] Processing M3 SYNTHETIC forecasts ...")
    synth_decisions = process_dashboard(SYNTHETIC_DASHBOARD, M4_SYNTHETIC_OUTPUT, "SYNTHETIC_DEMO")
    all_decisions.extend(synth_decisions)

    print(f"\n[3] M4 Summary")
    print(f"    Total decisions: {len(all_decisions)}")
    print(f"    Real: {len(real_decisions)}")
    print(f"    Synthetic: {len(synth_decisions)}")

    for risk in ["LOW", "MODERATE", "HIGH", "CRITICAL"]:
        count = sum(1 for d in all_decisions if d["risk_level"] == risk)
        print(f"      {risk}: {count}")

    print("\n" + "=" * 70)
    print("M4 DECISION MODULE COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
