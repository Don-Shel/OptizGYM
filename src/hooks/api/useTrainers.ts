import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const TRAINERS_QUERY_KEY = ['admin', 'trainers'];

export const useTrainers = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateTrainers = () => {
    queryClient.invalidateQueries({ queryKey: TRAINERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['instructors'] });
    queryClient.invalidateQueries({ queryKey: ['classes'] });
  };

  const useAllTrainers = () => useQuery({
    queryKey: TRAINERS_QUERY_KEY,
    queryFn: async () => api.trainers.getAll(await getToken()),
  });

  const useCreateTrainer = () => useMutation({
    mutationFn: async (data: any) => api.trainers.create(data, await getToken()),
    onSuccess: () => {
      invalidateTrainers();
      toast.success('Trainer created successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to create trainer'),
  });

  const useUpdateTrainer = () => useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => api.trainers.update(id, data, await getToken()),
    onSuccess: () => {
      invalidateTrainers();
      toast.success('Trainer updated successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update trainer'),
  });

  const useDeleteTrainer = () => useMutation({
    mutationFn: async (id: string) => api.trainers.delete(id, await getToken()),
    onSuccess: () => {
      invalidateTrainers();
      toast.success('Trainer removed successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to remove trainer'),
  });

  return { useAllTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer };
};
