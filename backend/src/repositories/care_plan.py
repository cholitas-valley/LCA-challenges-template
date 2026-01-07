"""Care plan repository."""
import json
from datetime import datetime

import asyncpg

from src.models.care_plan import CarePlan


async def get_care_plan(db: asyncpg.Connection, plant_id: str) -> CarePlan | None:
    """
    Get the stored care plan for a plant.

    Args:
        db: Database connection
        plant_id: Plant ID

    Returns:
        CarePlan if exists, None otherwise
    """
    row = await db.fetchrow(
        """
        SELECT plan_data, generated_at
        FROM care_plans
        WHERE plant_id = $1
        """,
        plant_id,
    )

    if not row:
        return None

    # Parse JSON data
    plan_data = json.loads(row["plan_data"])
    plan_data["generated_at"] = row["generated_at"]

    return CarePlan(**plan_data)


async def save_care_plan(
    db: asyncpg.Connection,
    plant_id: str,
    plan: CarePlan,
) -> None:
    """
    Save or update a care plan for a plant.

    Args:
        db: Database connection
        plant_id: Plant ID
        plan: Care plan to save
    """
    # Convert plan to JSON (excluding generated_at, we'll store separately)
    plan_dict = plan.model_dump()
    generated_at = plan_dict.pop("generated_at")
    plan_json = json.dumps(plan_dict)

    # Upsert care plan
    await db.execute(
        """
        INSERT INTO care_plans (plant_id, plan_data, generated_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (plant_id)
        DO UPDATE SET
            plan_data = EXCLUDED.plan_data,
            generated_at = EXCLUDED.generated_at
        """,
        plant_id,
        plan_json,
        generated_at,
    )


async def delete_care_plan(db: asyncpg.Connection, plant_id: str) -> bool:
    """
    Delete a care plan for a plant.

    Args:
        db: Database connection
        plant_id: Plant ID

    Returns:
        True if deleted, False if not found
    """
    result = await db.execute(
        "DELETE FROM care_plans WHERE plant_id = $1",
        plant_id,
    )

    # Check if any rows were deleted
    return result.split()[-1] != "0"
