"""Correlation ID middleware for request tracing."""
import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    Middleware that adds correlation ID to each request.

    - Checks for X-Correlation-ID header
    - Generates new ID if not present
    - Adds to structlog context for all log messages
    - Adds to response headers
    """

    HEADER_NAME = "X-Correlation-ID"

    async def dispatch(self, request: Request, call_next):
        """Process request and add correlation ID."""
        # Get or generate correlation ID
        correlation_id = request.headers.get(self.HEADER_NAME)
        if not correlation_id:
            correlation_id = str(uuid.uuid4())

        # Bind to structlog context
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
        )

        # Process request
        response = await call_next(request)

        # Add correlation ID to response
        response.headers[self.HEADER_NAME] = correlation_id

        return response
