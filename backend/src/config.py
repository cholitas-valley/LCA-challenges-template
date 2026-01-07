"""Configuration management for PlantOps backend."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    database_url: str
    mqtt_host: str = "mosquitto"
    mqtt_port: int = 1883
    mqtt_passwd_file: str = "/mosquitto/passwd"
    discord_webhook_url: str | None = None
    encryption_key: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
