import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';

export function useLLMSettings() {
  return useQuery({
    queryKey: ['settings', 'llm'],
    queryFn: settingsApi.getLLM,
  });
}

export function useUpdateLLMSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateLLM,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'llm'] });
    },
  });
}

export function useTestLLMSettings() {
  return useMutation({
    mutationFn: settingsApi.testLLM,
  });
}
