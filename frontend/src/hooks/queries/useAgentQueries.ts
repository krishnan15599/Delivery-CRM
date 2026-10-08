import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentService } from '../../services/agentService';
import type { AgentFilter, CreateAgentInput, UpdateAgentInput } from '../../types/agent';

export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filter: AgentFilter) => [...agentKeys.lists(), filter] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  deliveries: (id: string) => [...agentKeys.detail(id), 'deliveries'] as const,
  collections: (id: string) => [...agentKeys.detail(id), 'collections'] as const,
};

export const useAgents = (filter: AgentFilter = {}) => {
  return useQuery({
    queryKey: agentKeys.list(filter),
    queryFn: () => agentService.getAgents(filter),
    staleTime: 1000 * 30,
  });
};

export const useAgent = (id?: string) => {
  return useQuery({
    queryKey: agentKeys.detail(id || ''),
    queryFn: () => (id ? agentService.getAgentById(id) : null),
    enabled: Boolean(id),
  });
};

export const useAgentDeliveries = (agentId?: string) => {
  return useQuery({
    queryKey: agentKeys.deliveries(agentId || ''),
    queryFn: () => (agentId ? agentService.getAgentDeliveries(agentId) : []),
    enabled: Boolean(agentId),
  });
};

export const useAgentCollections = (agentId?: string) => {
  return useQuery({
    queryKey: agentKeys.collections(agentId || ''),
    queryFn: () => (agentId ? agentService.getAgentCollections(agentId) : []),
    enabled: Boolean(agentId),
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAgentInput) => agentService.createAgent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAgentInput }) =>
      agentService.updateAgent(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
    },
  });
};
