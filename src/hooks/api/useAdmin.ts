import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const { getToken, isSignedIn } = useAuth();

  const useStats = () => useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Your admin session is not ready. Please sign in again.');
      return api.admin.getStats(token);
    },
    enabled: isSignedIn,
  });

  const useAnalytics = () => useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Your admin session is not ready. Please sign in again.');
      return api.admin.getAnalytics(token);
    },
    enabled: isSignedIn,
  });

  return {
    useStats,
    useAnalytics,
  };
};
