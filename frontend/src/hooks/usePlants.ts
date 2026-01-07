import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantApi } from '../api/client';
import type { PlantCreate, PlantUpdate } from '../types';

export function usePlants() {
  return useQuery({
    queryKey: ['plants'],
    queryFn: plantApi.list,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function usePlant(id: string) {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => plantApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlantCreate) => plantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function useUpdatePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlantUpdate }) =>
      plantApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      queryClient.invalidateQueries({ queryKey: ['plants', variables.id] });
    },
  });
}

export function useDeletePlant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function usePlantHistory(id: string, hours = 24) {
  return useQuery({
    queryKey: ['plants', id, 'history', hours],
    queryFn: () => plantApi.history(id, hours),
    enabled: !!id,
  });
}

export function usePlantDevices(id: string) {
  return useQuery({
    queryKey: ['plants', id, 'devices'],
    queryFn: () => plantApi.devices(id),
    enabled: !!id,
  });
}
