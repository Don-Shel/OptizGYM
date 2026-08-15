import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const usePayments = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
  };

  const useMemberPayments = (memberId?: string) => useQuery({
    queryKey: ['payments', memberId],
    queryFn: async () => {
      const token = await getToken();
      if (!memberId || !token) return [];
      return api.payments.getByMemberId(memberId, token);
    },
    enabled: !!memberId,
  });

  const useCreatePayment = () => useMutation({
    mutationFn: async (data: any) => api.payments.create(data, await getToken()),
    onSuccess: invalidatePayments,
    onError: (error: any) => toast.error(error.message || 'Failed to process payment record'),
  });

  const useVerifyPayment = () => useMutation({
    mutationFn: async (data: any) => api.payments.verify(data, await getToken()),
    onSuccess: () => {
      invalidatePayments();
      toast.success('Payment verified and membership updated');
    },
    onError: (error: any) => toast.error(error.message || 'Payment verification failed'),
  });

  const useAdminPayments = () => useQuery({
    queryKey: ['payments', 'admin'],
    queryFn: async () => api.payments.getAdmin(await getToken()),
  });

  const useRetryPayment = () => useMutation({
    mutationFn: async (paymentId: string) => api.payments.retry(paymentId, await getToken()),
    onSuccess: (data: any) => {
      invalidatePayments();
      if (data?.authorizationUrl) window.open(data.authorizationUrl, '_blank', 'noopener,noreferrer');
      toast.success('Retry checkout opened');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to retry payment'),
  });

  const useRemindPayment = () => useMutation({
    mutationFn: async (paymentId: string) => api.payments.remind(paymentId, await getToken()),
    onSuccess: () => toast.success('Payment reminder sent'),
    onError: (error: any) => toast.error(error.message || 'Failed to send payment reminder'),
  });

  const useReceipt = (paymentId?: string) => useQuery({
    queryKey: ['payments', 'receipt', paymentId],
    queryFn: async () => {
      const token = await getToken();
      if (!paymentId || !token) return null;
      return api.payments.getReceipt(paymentId, token);
    },
    enabled: !!paymentId,
  });

  return {
    useMemberPayments,
    useCreatePayment,
    useVerifyPayment,
    useAdminPayments,
    useRetryPayment,
    useRemindPayment,
    useReceipt,
  };
};
