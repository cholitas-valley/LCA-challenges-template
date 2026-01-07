"""PlantOps FastAPI application."""
from fastapi import FastAPI

app = FastAPI(
    title="PlantOps API",
    description="IoT plant monitoring and care advisor",
    version="0.1.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
