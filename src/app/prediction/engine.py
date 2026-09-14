"""
Prediction engine: defines the ABC interface and the v1 rule-based implementation.

Design: XGBoostEngine can be added as a second concrete subclass of
BasePredictionEngine without touching any callers.
"""

from abc import ABC, abstractmethod

from app.schemas.prediction import PredictionFeatures


class BasePredictionEngine(ABC):
    """Abstract base class for all prediction engines."""

    MODEL_VERSION: str = "unknown"

    @abstractmethod
    def predict(self, features: PredictionFeatures) -> tuple[float, str]:
        """
        Compute the congestion score and risk level.

        Args:
            features: Computed utilization features.

        Returns:
            (congestion_score, risk_level) — score in [0, 1], risk one of
            LOW / MEDIUM / HIGH / CRITICAL.
        """
        ...


class RuleBasedEngine(BasePredictionEngine):
    """
    Weighted-score rule-based baseline engine (v1).

    Formula:
        score = 0.35 * berth_utilization
              + 0.25 * arrival_pressure
              + 0.20 * crane_utilization
              + 0.20 * yard_utilization

    yard_utilization is deferred to a future phase; it is always supplied as
    0.0 so the weight is effectively redistributed across the other features.

    Risk bands:
        [0.00, 0.40) → LOW
        [0.40, 0.70) → MEDIUM
        [0.70, 0.85) → HIGH
        [0.85, 1.00] → CRITICAL
    """

    MODEL_VERSION = "rule_based_v1.0"

    # Configurable weights (must sum to 1.0)
    WEIGHTS: dict[str, float] = {
        "berth": 0.35,
        "arrival": 0.25,
        "crane": 0.20,
        "yard": 0.20,
    }

    # Risk band boundaries — (lower_inclusive, upper_exclusive) → label
    RISK_BANDS: list[tuple[float, float, str]] = [
        (0.0, 0.40, "LOW"),
        (0.40, 0.70, "MEDIUM"),
        (0.70, 0.85, "HIGH"),
        (0.85, 1.01, "CRITICAL"),  # 1.01 to catch exactly 1.0
    ]

    def predict(self, features: PredictionFeatures) -> tuple[float, str]:
        """Apply weighted formula and classify risk."""
        score = (
            self.WEIGHTS["berth"] * features.berth_utilization
            + self.WEIGHTS["arrival"] * features.arrival_pressure
            + self.WEIGHTS["crane"] * features.crane_utilization
            + self.WEIGHTS["yard"] * features.yard_utilization
        )
        # Clamp to [0, 1] to handle floating point edge cases
        score = max(0.0, min(1.0, score))
        risk = self._classify_risk(score)
        return round(score, 4), risk

    def _classify_risk(self, score: float) -> str:
        for lower, upper, label in self.RISK_BANDS:
            if lower <= score < upper:
                return label
        return "CRITICAL"  # fallback for score == 1.0


# ── Singleton instances ────────────────────────────────────────────────────────
# Import and use these in the service layer to avoid re-instantiation.

rule_based_engine = RuleBasedEngine()
