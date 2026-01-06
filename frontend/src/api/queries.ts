import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { PlantWithTelemetry, HistoryResponse, PlantConfigUpdate } from './types';

// Query Keys
export const queryKeys = {
  plants: ['plants'] as const,
  plantHistory: (id: string, hours: number) => ['plants', id, 'history', hours] as const,
};

// Get all plants with 5s refetch interval
export function usePlants() {
  return useQuery({
    queryKey: queryKeys.plants,
    queryFn: async () => {
      const { data } = await apiClient.get<PlantWithTelemetry[]>('/api/plants');
      return data;
    },
    refetchInterval: 5000, // 5 seconds
  });
}

// Get plant history
export function usePlantHistory(plantId: string, hours: number = 24) {
  return useQuery({
    queryKey: queryKeys.plantHistory(plantId, hours),
    queryFn: async () => {
      const { data } = await apiClient.get<HistoryResponse>(
        `/api/plants/${plantId}/history`,
        {
          params: { hours },
        }
      );
      return data;
    },
    enabled: !!plantId, // Only run if plantId is provided
  });
}

// Update plant configuration
export function useUpdatePlantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ plantId, config }: { plantId: string; config: PlantConfigUpdate }) => {
      const { data } = await apiClient.post<PlantWithTelemetry>(
        `/api/plants/${plantId}/config`,
        config
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate plants query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.plants });
    },
  });
}
