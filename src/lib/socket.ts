import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let socket: Socket | null = null;
let publicSocket: Socket | null = null;

export const getSocket = () => socket;
export const getPublicSocket = () => publicSocket;

export const connectSocket = (memberId: string, token: string) => {
  if (!token) return null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
  } else {
    socket.auth = { token };
  }

  const currentSocket = socket;
  if (!currentSocket.connected) {
    currentSocket.connect();
    currentSocket.once('connect', () => currentSocket.emit('join-member-room', memberId));
  }
  return currentSocket;
};

export const connectPublicSocket = () => {
  if (!publicSocket) {
    publicSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
    });
  } else if (!publicSocket.connected) {
    publicSocket.connect();
  }
  return publicSocket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const disconnectPublicSocket = () => {
  if (publicSocket) {
    publicSocket.disconnect();
    publicSocket = null;
  }
};
