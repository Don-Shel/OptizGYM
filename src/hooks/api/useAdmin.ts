import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const { getToken, isSignedIn, isLoaded, user } = useAuth();

  const getAdminToken = async () => {
    let token = await getToken();
    if (!token) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      token = await getToken();
    }
    if (!token) throw new Error('Your admin session token is unavailable. Please sign in again.');
    return token;
  };

  const useStats = () => useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      return api.admin.getStats(await getAdminToken());
    },
    enabled: isLoaded && isSignedIn && user?.role === 'admin',
  });

  const useAnalytics = () => useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      return api.admin.getAnalytics(await getAdminToken());
    },
    enabled: isLoaded && isSignedIn && user?.role === 'admin',
  });

  return {
    useStats,
    useAnalytics,
  };
};
