import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { requireAuthToken } from './requireAuthToken';

export const useClasses = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const useAllClasses = () => useQuery({
    queryKey: ['classes'],
    queryFn: api.classes.getAll,
  });

  const useInstructors = () => useQuery({
    queryKey: ['instructors'],
    queryFn: async () => api.classes.getInstructors(await getToken()),
  });

  const useCreateClass = () => useMutation({
    mutationFn: async (data: any) => {
      return api.classes.create(data, await requireAuthToken(getToken));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create class');
    },
  });

  const useUpdateClass = () => useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return api.classes.update(id, data, await requireAuthToken(getToken));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update class');
    },
  });

  const useDeleteClass = () => useMutation({
    mutationFn: async (id: string) => {
      return api.classes.delete(id, await requireAuthToken(getToken));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete class');
    },
  });

  return {
    useAllClasses,
    useInstructors,
    useCreateClass,
    useUpdateClass,
    useDeleteClass,
  };
};
