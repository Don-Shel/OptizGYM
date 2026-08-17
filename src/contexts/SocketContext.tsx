import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectPublicSocket, connectSocket, disconnectPublicSocket, disconnectSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SocketContextType { socket: any; }
const SocketContext = createContext<SocketContextType | undefined>(undefined);

type RealtimeChangeEvent = {
  resource?: 'members' | 'classes' | 'trainers' | 'bookings' | 'payments' | 'notifications' | 'stats';
  action?: string;
  id?: string;
  timestamp?: string;
};

const invalidateResource = (queryClient: ReturnType<typeof useQueryClient>, event: RealtimeChangeEvent) => {
  switch (event.resource) {
    case 'members':
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      break;
    case 'classes':
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      break;
    case 'trainers':
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'trainers'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      break;
    case 'bookings':
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      break;
    case 'payments':
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      break;
    case 'notifications':
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      break;
    case 'stats':
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      break;
    default:
      queryClient.invalidateQueries();
  }
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    let socket: any = null;

    const start = async () => {
      if (isSignedIn && user?.id) {
        const token = await getToken();
        if (!active || !token) return;
        socket = connectSocket(user.id, token);
      } else {
        socket = connectPublicSocket();
      }

      if (!active || !socket) return;
      socketRef.current = socket;

      const onResourceChanged = (event: RealtimeChangeEvent) => {
        invalidateResource(queryClient, event);
      };
      const onClassCreated = (data: any) => {
        invalidateResource(queryClient, { resource: 'classes' });
        const name = data?.class?.name || data?.name;
        if (name && isSignedIn) toast.success(`New class added: ${name}`);
      };
      const onClassUpdated = (data: any) => {
        invalidateResource(queryClient, { resource: 'classes' });
        const name = data?.class?.name || data?.name;
        if (name && isSignedIn) toast.info(`Class updated: ${name}`);
      };
      const onClassDeleted = () => invalidateResource(queryClient, { resource: 'classes' });
      const onTrainerChanged = () => invalidateResource(queryClient, { resource: 'trainers' });
      const onMemberChanged = () => invalidateResource(queryClient, { resource: 'members' });
      const onBookingChanged = (data: any) => {
        invalidateResource(queryClient, { resource: 'bookings' });
        if (data?.className && isSignedIn) toast.info(`Booking updated for ${data.className}.`);
      };
      const onPaymentSuccess = (data: { plan: string; status: string }) => {
        if (isSignedIn) toast.success(`Payment successful! Your plan is now ${data.plan}.`);
        invalidateResource(queryClient, { resource: 'payments' });
        invalidateResource(queryClient, { resource: 'members' });
      };
      const onNotification = (notification: any) => {
        if (isSignedIn) toast.info(notification.title, { description: notification.message });
        invalidateResource(queryClient, { resource: 'notifications' });
      };
      const onSocketError = (error: any) => {
        if (isSignedIn) toast.error(error?.message || 'Realtime connection failed');
      };

      socket.on('resource-changed', onResourceChanged);
      socket.on('class-created', onClassCreated);
      socket.on('class-new', onClassCreated);
      socket.on('class-updated', onClassUpdated);
      socket.on('class-deleted', onClassDeleted);
      socket.on('class-removed', onClassDeleted);
      socket.on('trainer-created', onTrainerChanged);
      socket.on('trainer-updated', onTrainerChanged);
      socket.on('trainer-deleted', onTrainerChanged);
      socket.on('member-profile-updated', onMemberChanged);
      socket.on('membership-updated', onMemberChanged);
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
        socket.off('resource-changed');
        socket.off('class-created');
        socket.off('class-new');
        socket.off('class-updated');
        socket.off('class-deleted');
        socket.off('class-removed');
        socket.off('trainer-created');
        socket.off('trainer-updated');
        socket.off('trainer-deleted');
        socket.off('member-profile-updated');
        socket.off('membership-updated');
        socket.off('booking-confirmed');
        socket.off('booking-cancelled');
        socket.off('payment-success');
        socket.off('new-notification');
        socket.off('socket-error');
        socket.off('connect_error');
      }
      if (isSignedIn) disconnectSocket();
      else disconnectPublicSocket();
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
