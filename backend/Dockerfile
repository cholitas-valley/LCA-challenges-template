FROM python:3.11-slim

# Install mosquitto for mosquitto_passwd command
RUN apt-get update && apt-get install -y --no-install-recommends \
    mosquitto \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir -e .[dev]

COPY . .

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
