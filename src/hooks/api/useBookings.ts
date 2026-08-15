import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useBookings = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const useMemberBookings = (memberId?: string) => useQuery({
    queryKey: ['bookings', memberId],
    queryFn: async () => {
      const token = await getToken();
      if (!memberId || !token) return [];
      return api.bookings.getByMemberId(memberId, token);
    },
    enabled: !!memberId,
  });

  const useCreateBooking = () => useMutation({
    mutationFn: async (data: any) => api.bookings.create(data, await getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Booking confirmed successfully');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to confirm booking'),
  });

  const useCancelBooking = () => useMutation({
    mutationFn: async (bookingId: string) => api.bookings.cancel(bookingId, await getToken()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Booking cancelled');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to cancel booking'),
  });

  return {
    useMemberBookings,
    useCreateBooking,
    useCancelBooking,
  };
};
