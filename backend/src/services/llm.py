"""LLM service for generating plant care plans."""
import asyncio
import json
from datetime import datetime

from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from src.models.care_plan import CarePlan


class LLMService:
    """Service for LLM-powered care plan generation."""

    def __init__(self, provider: str, api_key: str, model: str):
        """
        Initialize LLM service.

        Args:
            provider: LLM provider ("anthropic" or "openai")
            api_key: API key for the provider
            model: Model name to use
        """
        self.provider = provider.lower()
        self.api_key = api_key
        self.model = model

        # Initialize client based on provider
        if self.provider == "anthropic":
            self.anthropic_client = AsyncAnthropic(api_key=api_key)
            self.openai_client = None
        elif self.provider == "openai":
            self.openai_client = AsyncOpenAI(api_key=api_key)
            self.anthropic_client = None
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def generate_care_plan(
        self,
        plant_name: str,
        species: str | None,
        current_readings: dict,
        history_summary: dict,
        thresholds: dict | None,
    ) -> CarePlan:
        """
        Generate care plan using LLM.

        Args:
            plant_name: Name of the plant
            species: Plant species (optional)
            current_readings: Current sensor readings
            history_summary: Summary of historical data
            thresholds: Plant threshold configuration (optional)

        Returns:
            Generated care plan

        Raises:
            ValueError: If LLM response is invalid
            TimeoutError: If LLM call exceeds timeout
            Exception: If LLM API call fails
        """
        # Build the prompt
        prompt = self._build_prompt(
            plant_name=plant_name,
            species=species,
            current_readings=current_readings,
            history_summary=history_summary,
            thresholds=thresholds,
        )

        # Call LLM with timeout
        try:
            response_text = await asyncio.wait_for(
                self._call_llm(prompt),
                timeout=30.0,
            )
        except asyncio.TimeoutError:
            raise TimeoutError("LLM request timed out after 30 seconds")

        # Parse response
        care_plan_data = self._parse_response(response_text)

        # Add generated_at timestamp
        care_plan_data["generated_at"] = datetime.now()

        # Convert to CarePlan model
        return CarePlan(**care_plan_data)

    def _build_prompt(
        self,
        plant_name: str,
        species: str | None,
        current_readings: dict,
        history_summary: dict,
        thresholds: dict | None,
    ) -> str:
        """Build the LLM prompt."""
        species_text = species if species else "Unknown"

        # Format current readings
        readings_lines = []
        if "soil_moisture" in current_readings:
            readings_lines.append(f"- Soil Moisture: {current_readings['soil_moisture']}%")
        if "temperature" in current_readings:
            readings_lines.append(f"- Temperature: {current_readings['temperature']}°C")
        if "humidity" in current_readings:
            readings_lines.append(f"- Humidity: {current_readings['humidity']}%")
        if "light_level" in current_readings:
            readings_lines.append(f"- Light Level: {current_readings['light_level']} lux")

        # Format history summary
        history_lines = []
        if "moisture" in history_summary:
            m = history_summary["moisture"]
            history_lines.append(f"- Moisture: avg={m.get('avg', 'N/A')}%, min={m.get('min', 'N/A')}%, max={m.get('max', 'N/A')}%")
        if "temperature" in history_summary:
            t = history_summary["temperature"]
            history_lines.append(f"- Temperature: avg={t.get('avg', 'N/A')}°C, min={t.get('min', 'N/A')}°C, max={t.get('max', 'N/A')}°C")
        if "humidity" in history_summary:
            h = history_summary["humidity"]
            history_lines.append(f"- Humidity: avg={h.get('avg', 'N/A')}%, min={h.get('min', 'N/A')}%, max={h.get('max', 'N/A')}%")

        # Format thresholds
        thresholds_text = "Not configured"
        if thresholds:
            threshold_lines = []
            if "soil_moisture" in thresholds:
                threshold_lines.append(f"- Soil Moisture: min={thresholds['soil_moisture'].get('min', 'N/A')}%, max={thresholds['soil_moisture'].get('max', 'N/A')}%")
            if "temperature" in thresholds:
                threshold_lines.append(f"- Temperature: min={thresholds['temperature'].get('min', 'N/A')}°C, max={thresholds['temperature'].get('max', 'N/A')}°C")
            if "humidity" in thresholds:
                threshold_lines.append(f"- Humidity: min={thresholds['humidity'].get('min', 'N/A')}%, max={thresholds['humidity'].get('max', 'N/A')}%")
            if threshold_lines:
                thresholds_text = "\n".join(threshold_lines)

        # JSON schema for response
        json_schema = """{
  "summary": "Brief 1-2 sentence assessment of plant health",
  "watering": {
    "frequency": "Description like 'Every 5-7 days'",
    "amount": "Description like 'Until water drains from bottom'",
    "next_date": "ISO date string or null"
  },
  "light": {
    "current": "Current light level (number or descriptive string)",
    "ideal": "Ideal light description",
    "recommendation": "Specific recommendation"
  },
  "humidity": {
    "current": "Current humidity level",
    "ideal": "Ideal humidity description",
    "recommendation": "Specific recommendation"
  },
  "temperature": {
    "current": "Current temperature",
    "ideal": "Ideal temperature description",
    "recommendation": "Specific recommendation"
  },
  "alerts": ["List of current issues requiring immediate attention"],
  "tips": ["List of general care tips for this plant"]
}"""

        prompt = f"""You are an expert plant care advisor. Analyze the following plant data and provide personalized care recommendations.

Plant: {plant_name}
Species: {species_text}

Current Readings:
{chr(10).join(readings_lines) if readings_lines else "No current readings available"}

24-Hour Trends:
{chr(10).join(history_lines) if history_lines else "No historical data available"}

Configured Thresholds:
{thresholds_text}

Please provide a comprehensive care plan in the following JSON format. Return ONLY valid JSON, no other text:
{json_schema}"""

        return prompt

    async def _call_llm(self, prompt: str) -> str:
        """Call the LLM API."""
        if self.provider == "anthropic":
            return await self._call_anthropic(prompt)
        elif self.provider == "openai":
            return await self._call_openai(prompt)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic API."""
        if not self.anthropic_client:
            raise ValueError("Anthropic client not initialized")

        message = await self.anthropic_client.messages.create(
            model=self.model,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract text from response
        if message.content and len(message.content) > 0:
            return message.content[0].text
        else:
            raise ValueError("Empty response from Anthropic API")

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API."""
        if not self.openai_client:
            raise ValueError("OpenAI client not initialized")

        response = await self.openai_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
        )

        # Extract text from response
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content or ""
        else:
            raise ValueError("Empty response from OpenAI API")

    def _parse_response(self, response_text: str) -> dict:
        """Parse LLM response as JSON."""
        try:
            # Try to extract JSON from response (LLM might wrap it in markdown)
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            data = json.loads(text)
            return data
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response from LLM: {e}")

    async def generate_health_recommendations(
        self,
        plant_name: str,
        species: str | None,
        issues: list[dict],
        current_readings: dict,
        trends: dict | None = None,
    ) -> list[dict]:
        """
        Generate health recommendations using LLM with trend analysis.

        Args:
            plant_name: Name of the plant
            species: Plant species (optional)
            issues: List of current health issues
            current_readings: Current sensor readings
            trends: 24-hour trend data for each metric

        Returns:
            List of recommendation dicts with priority and action
        """
        prompt = self._build_health_check_prompt(
            plant_name=plant_name,
            species=species,
            issues=issues,
            current_readings=current_readings,
            trends=trends,
        )

        try:
            response_text = await asyncio.wait_for(
                self._call_llm(prompt),
                timeout=15.0,
            )
            return self._parse_health_recommendations(response_text)
        except asyncio.TimeoutError:
            raise TimeoutError("Health check LLM request timed out after 15 seconds")

    def _build_health_check_prompt(
        self,
        plant_name: str,
        species: str | None,
        issues: list[dict],
        current_readings: dict,
        trends: dict | None = None,
    ) -> str:
        """Build prompt for health check with trend analysis."""
        species_text = species if species else "Unknown species"

        # Format issues
        issues_text = "\n".join([
            f"- {i['metric']}: {i['message']} (severity: {i['severity']})"
            for i in issues
        ]) if issues else "None"

        # Format 24-hour trends
        trend_lines = []
        if trends:
            for metric, data in trends.items():
                label = metric.replace("_", " ").title()
                unit = "%" if metric in ["soil_moisture", "humidity"] else "°C" if metric == "temperature" else " lux"
                direction = data.get("direction", "stable")
                change = data.get("change_percent", 0)
                avg = data.get("avg", 0)
                min_v = data.get("min", 0)
                max_v = data.get("max", 0)
                trend_lines.append(
                    f"- {label}: {direction} ({change:+.1f}%), "
                    f"range {min_v}-{max_v}{unit}, avg {avg}{unit}"
                )
        trends_text = "\n".join(trend_lines) if trend_lines else "Insufficient historical data"

        return f"""You are a plant care expert. Analyze this {species_text} and provide specific, actionable recommendations.

Plant: {plant_name} ({species_text})

24-Hour Trends:
{trends_text}

Threshold Violations:
{issues_text}

Based on the trends and your knowledge of {species_text} care requirements:
1. Identify any concerning patterns (e.g., soil drying too fast, temperature fluctuations)
2. Provide specific actions the owner should take
3. Consider the species' specific needs

RESPOND ONLY with a valid JSON array (no markdown, no explanation):

[
  {{"priority": "high", "action": "Specific action to take"}},
  {{"priority": "medium", "action": "Another specific action"}}
]

Priority: "high" = do now, "medium" = do soon, "low" = general tip"""

    def _parse_health_recommendations(self, response_text: str) -> list[dict]:
        """Parse health check LLM response."""
        try:
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            data = json.loads(text)

            # Validate structure
            if not isinstance(data, list):
                return []

            valid_recommendations = []
            for item in data:
                if isinstance(item, dict) and "priority" in item and "action" in item:
                    valid_recommendations.append({
                        "priority": item["priority"],
                        "action": item["action"],
                    })

            return valid_recommendations
        except json.JSONDecodeError:
            return []
