import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { authClient } from '@/lib/neon';
import type { ProfilePreferences } from '@/types/profile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { requireAuthToken } from './requireAuthToken';

export const useMembers = () => {
  const { getToken, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const useAllMembers = () => useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      return api.members.getAll(await requireAuthToken(getToken));
    },
  });

  const useMe = () => useQuery({
    queryKey: ['members', 'me'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No auth token available');
      return api.members.getMe(token);
    },
  });

  const useCreateMemberAdmin = () => useMutation({
    mutationFn: async (data: any) => api.members.createAdmin(data, await requireAuthToken(getToken)),
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member profile created successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create member profile'),
  });

  const useCreateMember = () => useMutation({

    mutationFn: async (data: any) => {
      return api.members.create(data, await requireAuthToken(getToken));
    },
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member profile created successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create member'),
  });

  const useUpdateMember = () => useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.members.update(id, data, await requireAuthToken(getToken)),
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member updated successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update member'),
  });

  const useActivateMember = () => useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: any }) => api.members.activate(id, data, await requireAuthToken(getToken)),
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member profile activated');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to activate member profile'),
  });

  const useSuspendMember = () => useMutation({
    mutationFn: async (id: string) => api.members.suspend(id, await requireAuthToken(getToken)),
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member suspended');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to suspend member'),
  });

  const useRemoveMember = () => useMutation({
    mutationFn: async (id: string) => api.members.remove(id, await requireAuthToken(getToken)),
    onSuccess: () => {
      invalidateMembers();
      toast.success('Member removed');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to remove member'),
  });

  const useUpdateProfile = () => useMutation({
    mutationFn: async ({ fullName, phone, preferences }: { fullName: string; phone: string; preferences: ProfilePreferences }) => {
      const normalizedName = fullName.trim();
      if (normalizedName.length < 2) throw new Error('Full name must be at least 2 characters');

      await (authClient as any).updateUser({
        name: normalizedName,
        fetchOptions: { throw: true },
      });

      return api.members.updateProfile({ phone: phone.trim(), preferences }, await requireAuthToken(getToken));
    },
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update profile'),
  });

  const useUpdateMembership = () => useMutation({
    mutationFn: async (data: { action: 'cancel' | 'resume' | 'freeze' | 'unfreeze'; months?: number }) => api.members.updateMembership(data, await requireAuthToken(getToken)),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
      await refreshUser();
      toast.success('Membership settings updated');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update membership'),
  });

  const useSyncMember = () => useMutation({
    mutationFn: async () => api.sync(await requireAuthToken(getToken)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', 'me'] }),
  });

  return {
    useAllMembers,
    useMe,
    useCreateMember,
    useCreateMemberAdmin,
    useUpdateMember,
    useActivateMember,
    useSuspendMember,
    useRemoveMember,
    useUpdateMembership,
    useUpdateProfile,
    useSyncMember,
  };
};
