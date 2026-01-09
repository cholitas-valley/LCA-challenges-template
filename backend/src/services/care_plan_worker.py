"""Background worker for care plan generation."""
import asyncio
import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timedelta

from src.db.connection import get_pool
from src.repositories import care_plan as care_plan_repo
from src.repositories import settings as settings_repo
from src.repositories import telemetry as telemetry_repo
from src.services.encryption import EncryptionService
from src.services.llm import LLMService

logger = logging.getLogger(__name__)


@dataclass
class CarePlanGenerationRequest:
    """Request to generate a care plan for a plant."""

    plant_id: str
    plant_name: str
    species: str | None
    thresholds: dict | None


class CarePlanWorker:
    """Background worker that processes care plan generation requests."""

    def __init__(self, queue: asyncio.Queue):
        """
        Initialize care plan worker.

        Args:
            queue: Queue to receive generation requests from
        """
        self.queue = queue
        self._running = False

    async def run(self):
        """
        Process care plan generation requests from queue.

        Runs until cancelled. Requests are processed sequentially to avoid
        overwhelming LLM rate limits.
        """
        self._running = True
        logger.info("Care plan worker started")

        while self._running:
            try:
                # Wait for request from queue (with timeout to allow graceful shutdown)
                try:
                    request = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue

                if not isinstance(request, CarePlanGenerationRequest):
                    logger.warning(f"Unknown request type: {type(request)}")
                    self.queue.task_done()
                    continue

                # Process generation request
                try:
                    await self._generate_care_plan(request)
                except Exception as e:
                    logger.error(f"Failed to generate care plan for {request.plant_id}: {e}")
                finally:
                    self.queue.task_done()

            except asyncio.CancelledError:
                logger.info("Care plan worker cancelled")
                self._running = False
                break
            except Exception as e:
                logger.error(f"Error in care plan worker loop: {e}")

    async def _generate_care_plan(self, request: CarePlanGenerationRequest) -> None:
        """Generate care plan for a plant."""
        logger.info(f"Generating care plan for plant {request.plant_id}")

        pool = get_pool()
        async with pool.acquire() as conn:
            # Check if LLM is configured
            llm_config_str = await settings_repo.get_setting(conn, "llm_config")
            if not llm_config_str:
                logger.info(f"LLM not configured, skipping care plan for {request.plant_id}")
                return

            # Decrypt LLM config
            encryption_key = os.getenv("ENCRYPTION_KEY", "default-encryption-key-for-dev")
            encryption_service = EncryptionService(encryption_key)

            try:
                llm_config = json.loads(encryption_service.decrypt(llm_config_str))
            except Exception as e:
                logger.error(f"Failed to decrypt LLM config: {e}")
                return

            # Get current readings
            current_readings = {}
            latest_telemetry = await telemetry_repo.get_latest_by_plant(conn, request.plant_id)
            if latest_telemetry:
                for key in ["soil_moisture", "temperature", "humidity", "light_level"]:
                    if latest_telemetry.get(key) is not None:
                        current_readings[key] = latest_telemetry[key]

            # Get 24-hour history
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=24)
            history = await telemetry_repo.get_history(
                conn, request.plant_id, start_time, end_time, limit=10000
            )

            # Calculate history summary
            history_summary = self._calculate_history_summary(history)

            # Initialize LLM service
            try:
                llm_service = LLMService(
                    provider=llm_config["provider"],
                    api_key=llm_config["api_key"],
                    model=llm_config["model"],
                )
            except Exception as e:
                logger.error(f"Failed to initialize LLM service: {e}")
                return

            # Generate care plan
            try:
                care_plan = await llm_service.generate_care_plan(
                    plant_name=request.plant_name,
                    species=request.species,
                    current_readings=current_readings,
                    history_summary=history_summary,
                    thresholds=request.thresholds,
                )

                # Save care plan
                await care_plan_repo.save_care_plan(conn, request.plant_id, care_plan)
                logger.info(f"Care plan generated and saved for {request.plant_id}")

            except TimeoutError:
                logger.error(f"LLM request timed out for {request.plant_id}")
            except Exception as e:
                logger.error(f"Failed to generate care plan: {e}")

    def _calculate_history_summary(self, history: list[dict]) -> dict:
        """Calculate summary statistics from telemetry history."""
        summary = {}
        if not history:
            return summary

        metrics = [
            ("moisture", "soil_moisture"),
            ("temperature", "temperature"),
            ("humidity", "humidity"),
        ]

        for summary_key, db_key in metrics:
            values = [h[db_key] for h in history if h.get(db_key) is not None]
            if values:
                summary[summary_key] = {
                    "avg": round(sum(values) / len(values), 1),
                    "min": round(min(values), 1),
                    "max": round(max(values), 1),
                }

        return summary

    def stop(self):
        """Signal the worker to stop processing."""
        self._running = False
