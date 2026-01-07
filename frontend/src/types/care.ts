export interface CarePlanWatering {
  frequency: string;
  amount: string;
  next_date: string | null;
}

export interface CarePlanMetric {
  current: string | number;
  ideal: string;
  recommendation: string;
}

export interface CarePlan {
  summary: string;
  watering: CarePlanWatering;
  light: CarePlanMetric;
  humidity: CarePlanMetric;
  temperature?: CarePlanMetric;
  alerts: string[];
  tips: string[];
  generated_at: string;
}

export interface CarePlanResponse {
  plant_id: string;
  plant_name: string;
  species: string | null;
  care_plan: CarePlan | null;
  last_generated: string | null;
}
