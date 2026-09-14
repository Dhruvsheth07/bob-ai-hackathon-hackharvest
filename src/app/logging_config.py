"""
Structured logging configuration.

Sets up JSON-formatted logging for consistent, machine-readable output.
"""

import logging
import sys
from datetime import datetime, timezone


class JSONFormatter(logging.Formatter):
    """Produce structured JSON log lines."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)
        # Use compact repr — no indentation
        import json

        return json.dumps(log_entry, default=str)


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure the root logger with structured JSON output.

    Args:
        log_level: One of DEBUG, INFO, WARNING, ERROR, CRITICAL.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())

    # Remove any existing handlers to avoid duplicates
    root_logger.handlers.clear()

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)

    # Quieten noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if log_level.upper() == "DEBUG" else logging.WARNING
    )
