import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useWorkouts = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const useMemberWorkouts = (memberId?: string) => useQuery({
    queryKey: ['workouts', memberId],
    queryFn: async () => {
      const token = await getToken();
      if (!memberId || !token) return [];
      return api.workouts.getByMemberId(memberId, token);
    },
    enabled: !!memberId,
  });

  const useCreateWorkout = () => useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      return api.workouts.create(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Workout logged successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to log workout');
    },
  });

  return {
    useMemberWorkouts,
    useCreateWorkout,
  };
};
