import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionService } from '../../services/collectionService';
import type { CollectionFilter, SettleCollectionInput } from '../../types/collection';

export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (filter: CollectionFilter) => [...collectionKeys.lists(), filter] as const,
  summary: () => [...collectionKeys.all, 'summary'] as const,
  detail: (id: string) => [...collectionKeys.all, 'detail', id] as const,
};

export const useCollections = (filter: CollectionFilter = {}) => {
  return useQuery({
    queryKey: collectionKeys.list(filter),
    queryFn: () => collectionService.getCollections(filter),
    staleTime: 1000 * 30,
  });
};

export const useCollectionSummary = () => {
  return useQuery({
    queryKey: collectionKeys.summary(),
    queryFn: () => collectionService.getCollectionSummary(),
    staleTime: 1000 * 30,
  });
};

export const useSettleCollections = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SettleCollectionInput) => collectionService.settleCollections(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
