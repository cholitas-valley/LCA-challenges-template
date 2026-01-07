"""Custom exceptions for PlantOps application."""


class PlantOpsError(Exception):
    """Base exception for PlantOps application."""
    pass


class NotFoundError(PlantOpsError):
    """Resource not found exception."""
    pass


class ValidationError(PlantOpsError):
    """Validation failed exception."""
    pass


class AuthenticationError(PlantOpsError):
    """Authentication failed exception."""
    pass
