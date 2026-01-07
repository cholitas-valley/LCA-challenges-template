import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceApi } from '../api/client';
import type { DeviceRegisterRequest, DeviceProvisionRequest } from '../types';

export function useDevices() {
  return useQuery({
    queryKey: ['devices'],
    queryFn: deviceApi.list,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useRegisterDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeviceRegisterRequest) => deviceApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

export function useProvisionDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, data }: { deviceId: string; data: DeviceProvisionRequest }) =>
      deviceApi.provision(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => deviceApi.delete(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
}
