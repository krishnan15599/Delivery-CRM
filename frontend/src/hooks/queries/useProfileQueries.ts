import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type ProfileInput } from '../../services/profileService';

export const profileKeys = {
  all: ['profiles'] as const,
  current: ['profiles', 'current'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
};

export const useCurrentProfile = () => {
  return useQuery({
    queryKey: profileKeys.current,
    queryFn: () => profileService.getCurrentProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProfiles = () => {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: () => profileService.getProfiles(),
    staleTime: 1000 * 60,
  });
};

export const useProfile = (id?: string) => {
  return useQuery({
    queryKey: profileKeys.detail(id || ''),
    queryFn: () => (id ? profileService.getProfileById(id) : null),
    enabled: Boolean(id),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfileInput }) =>
      profileService.updateProfile(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.current });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
};

