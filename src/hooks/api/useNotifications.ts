import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { user, getToken } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => api.notifications.getMine(await getToken()),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => api.notifications.markRead(id, await getToken()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
    onError: (error: any) => toast.error(error.message || 'Failed to update notification'),
  });

  const notifications = (query.data || []) as Array<any>;
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return { ...query, notifications, unreadCount, markRead };
};
