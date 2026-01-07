"""
Migration 006: Create care_plans table.
"""


async def up(conn):
    """
    Create the care_plans table for storing LLM-generated care recommendations.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS care_plans (
            id SERIAL PRIMARY KEY,
            plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE UNIQUE,
            plan_data JSONB NOT NULL,
            generated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
