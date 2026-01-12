"""Custom exceptions for PlantOps application."""


class PlantOpsError(Exception):
    """Base exception for PlantOps application."""


class NotFoundError(PlantOpsError):
    """Resource not found exception."""


class ValidationError(PlantOpsError):
    """Validation failed exception."""


class AuthenticationError(PlantOpsError):
    """Authentication failed exception."""
