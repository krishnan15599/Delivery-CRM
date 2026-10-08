import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../../services/deliveryService';
import type { DeliveryFilter, CreateDeliveryInput, UpdateDeliveryInput, DeliveryStatus } from '../../types/delivery';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  lists: () => [...deliveryKeys.all, 'list'] as const,
  list: (filter: DeliveryFilter) => [...deliveryKeys.lists(), filter] as const,
  details: () => [...deliveryKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
};

export const useDeliveries = (filter: DeliveryFilter = {}) => {
  return useQuery({
    queryKey: deliveryKeys.list(filter),
    queryFn: () => deliveryService.getDeliveries(filter),
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useDelivery = (id?: string) => {
  return useQuery({
    queryKey: deliveryKeys.detail(id || ''),
    queryFn: () => (id ? deliveryService.getDeliveryById(id) : null),
    enabled: Boolean(id),
  });
};

export const useCreateDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeliveryInput) => deliveryService.createDelivery(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDeliveryInput }) =>
      deliveryService.updateDelivery(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
    },
  });
};

export const useUpdateDeliveryStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: DeliveryStatus;
      note?: string;
    }) => deliveryService.updateDeliveryStatus(id, status, note),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useBulkAssignDeliveries = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryIds, agentId }: { deliveryIds: string[]; agentId: string }) =>
      deliveryService.bulkAssignDeliveries(deliveryIds, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};
