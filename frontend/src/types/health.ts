export type HealthStatus = 'optimal' | 'warning' | 'critical' | 'unknown';

export interface HealthIssue {
  metric: string;
  severity: string;
  current_value: number | null;
  threshold_violated: string | null;
  message: string;
}

export interface HealthRecommendation {
  priority: string;
  action: string;
}

export interface TrendSummary {
  metric: string;
  direction: string;
  change_percent: number;
  current: number;
  min_24h: number;
  max_24h: number;
  summary: string;
}

export interface PlantHealthCheckResponse {
  plant_id: string;
  plant_name: string;
  status: HealthStatus;
  issues: HealthIssue[];
  recommendations: HealthRecommendation[];
  trends: TrendSummary[];
  checked_at: string;
  has_care_plan: boolean;
  care_plan_age_hours: number | null;
}
