import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocketContextType { socket: any; }
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    let socket: any = null;

    const start = async () => {
      if (!isSignedIn || !user?.id) return;
      const token = await getToken();
      if (!active || !token) return;

      socket = connectSocket(user.id, token);
      socketRef.current = socket;
      if (!socket) return;

      const invalidateLiveData = () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      };
      const onClassCreated = (data: any) => {
        invalidateLiveData();
        const name = data?.class?.name || data?.name;
        if (name) toast.success(`New class added: ${name}`);
      };
      const onClassUpdated = (data: any) => {
        invalidateLiveData();
        const name = data?.class?.name || data?.name;
        if (name) toast.info(`Class updated: ${name}`);
      };
      const onClassDeleted = () => invalidateLiveData();
      const onBookingChanged = (data: any) => {
        invalidateLiveData();
        if (data?.className) toast.info(`Booking updated for ${data.className}.`);
      };
      const onPaymentSuccess = (data: { plan: string; status: string }) => {
        toast.success(`Payment successful! Your plan is now ${data.plan}.`);
        queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['payments', user.id] });
        queryClient.invalidateQueries({ queryKey: ['payments', 'admin'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      };
      const onNotification = (notification: any) => {
        toast.info(notification.title, { description: notification.message });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };
      const onSocketError = (error: any) => toast.error(error?.message || 'Realtime connection failed');

      socket.on('class-created', onClassCreated);
      socket.on('class-new', onClassCreated);
      socket.on('class-updated', onClassUpdated);
      socket.on('class-deleted', onClassDeleted);
      socket.on('class-removed', onClassDeleted);
      socket.on('booking-confirmed', onBookingChanged);
      socket.on('booking-cancelled', onBookingChanged);
      socket.on('payment-success', onPaymentSuccess);
      socket.on('new-notification', onNotification);
      socket.on('socket-error', onSocketError);

      socket.on('connect_error', onSocketError);
    };

    start();
    return () => {
      active = false;
      if (socket) {
        socket.off('class-created', onClassCreated);
        socket.off('class-new', onClassCreated);
        socket.off('class-updated', onClassUpdated);
        socket.off('class-deleted', onClassDeleted);
        socket.off('class-removed', onClassDeleted);
        socket.off('booking-confirmed');
        socket.off('booking-cancelled');
        socket.off('payment-success');
        socket.off('new-notification');
        socket.off('socket-error');
        socket.off('connect_error');
      }
      disconnectSocket();
      socketRef.current = null;
    };
  }, [getToken, isSignedIn, queryClient, user?.id]);

  return <SocketContext.Provider value={{ socket: socketRef.current }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
