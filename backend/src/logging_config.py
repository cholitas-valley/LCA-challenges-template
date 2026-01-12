"""Structured logging configuration using structlog."""
import logging

import structlog

from src.config import settings


def setup_logging() -> None:
    """
    Configure structlog for structured logging.

    Uses JSON format in production, colored console output in development.
    """
    log_level = getattr(logging, settings.log_level.upper())

    # Shared processors for all formats
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    # Format-specific renderer
    if settings.log_format == "json":
        final_processors = [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        final_processors = [structlog.dev.ConsoleRenderer(colors=True)]

    structlog.configure(
        processors=shared_processors + final_processors,
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Also configure standard logging
    logging.basicConfig(format="%(message)s", level=log_level)


def get_logger(name: str | None = None) -> structlog.BoundLogger:
    """Get a structlog logger instance."""
    return structlog.get_logger(name)
