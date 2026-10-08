import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../../services/customerService';
import type { CustomerFilter, CreateCustomerInput, UpdateCustomerInput } from '../../types/customer';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filter: CustomerFilter) => [...customerKeys.lists(), filter] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  deliveries: (id: string) => [...customerKeys.detail(id), 'deliveries'] as const,
};

export const useCustomers = (filter: CustomerFilter = {}) => {
  return useQuery({
    queryKey: customerKeys.list(filter),
    queryFn: () => customerService.getCustomers(filter),
    staleTime: 1000 * 30,
  });
};

export const useCustomer = (id?: string) => {
  return useQuery({
    queryKey: customerKeys.detail(id || ''),
    queryFn: () => (id ? customerService.getCustomerById(id) : null),
    enabled: Boolean(id),
  });
};

export const useCustomerDeliveries = (customerId?: string) => {
  return useQuery({
    queryKey: customerKeys.deliveries(customerId || ''),
    queryFn: () => (customerId ? customerService.getCustomerDeliveries(customerId) : []),
    enabled: Boolean(customerId),
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customerService.createCustomer(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCustomerInput }) =>
      customerService.updateCustomer(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};
