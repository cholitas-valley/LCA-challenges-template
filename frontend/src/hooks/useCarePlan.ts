import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantApi } from '../api/client';

export function useCarePlan(plantId: string) {
  return useQuery({
    queryKey: ['plants', plantId, 'care-plan'],
    queryFn: () => plantApi.getCarePlan(plantId),
  });
}

export function useGenerateCarePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plantId: string) => plantApi.analyze(plantId),
    onSuccess: (_, plantId) => {
      queryClient.invalidateQueries({ queryKey: ['plants', plantId, 'care-plan'] });
    },
  });
}
