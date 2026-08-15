import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const { getToken } = useAuth();

  const useStats = () => useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const token = await getToken();
      return api.admin.getStats(token);
    },
  });

  return {
    useStats,
  };
};
