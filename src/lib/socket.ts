import { io, Socket } from 'socket.io-client';

const configuredSocketUrl = import.meta.env.VITE_API_URL?.trim();
const SOCKET_URL = configuredSocketUrl || (import.meta.env.DEV ? 'http://localhost:3001' : '');

if (!configuredSocketUrl && import.meta.env.PROD) {
  console.error('[SOCKET] VITE_API_URL is missing in the production bundle. Configure it with the public HTTPS API origin; realtime connections are disabled until then.');
}
let socket: Socket | null = null;
let publicSocket: Socket | null = null;

export const getSocket = () => socket;
export const getPublicSocket = () => publicSocket;

export const connectSocket = (memberId: string, token: string) => {
  if (!SOCKET_URL || !token) return null;
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
  if (!SOCKET_URL) return null;
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
