import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from './db';
import { members } from '../db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { verifyNeonToken } from './neon';
import { getAllowedFrontendOrigins } from '../config/cors';
import logger from './logger';

let io: Server;

export type RealtimeResource = 'members' | 'classes' | 'trainers' | 'bookings' | 'payments' | 'notifications' | 'stats';
export type RealtimeAction = 'created' | 'updated' | 'deleted' | 'activated' | 'suspended' | 'cancelled' | 'read-all';

export interface RealtimeChangeEvent {
  resource: RealtimeResource;
  action: RealtimeAction;
  id?: string;
  timestamp: string;
}

const PUBLIC_RESOURCES = new Set<RealtimeResource>(['classes', 'trainers']);

export const broadcastResourceChange = (
  resource: RealtimeResource,
  action: RealtimeAction,
  id?: string,
) => {
  const event: RealtimeChangeEvent = {
    resource,
    action,
    ...(id ? { id } : {}),
    timestamp: new Date().toISOString(),
  };
  if (io) {
    const room = PUBLIC_RESOURCES.has(resource) ? 'public' : 'admins';
    io.to(room).emit('resource-changed', event);
  }
  return event;
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedFrontendOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      // Public sockets are deliberately limited to the public room and public resources.
      socket.data.isPublic = true;
      return next();
    }
    if (typeof token !== 'string') return next(new Error('Invalid socket authentication'));

    try {
      const claims = await verifyNeonToken(token);
      const [member] = await db.select({ id: members.id, role: members.role })
        .from(members)
        .where(and(eq(members.authUserId, claims.sub), isNull(members.deletedAt)))
        .limit(1);
      if (!member) return next(new Error('Member profile required'));

      socket.data.authUserId = claims.sub;
      socket.data.memberId = member.id;
      socket.data.role = member.role;
      return next();
    } catch (error) {
      logger.warn('[SOCKET] Authentication failed', {
        socketId: socket.id,
        reason: error instanceof Error ? error.message : String(error),
      });
      return next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.data.isPublic) {
      socket.join('public');
    } else {
      socket.join(`member-${socket.data.memberId}`);
      if (socket.data.role === 'admin') socket.join('admins');
      socket.join('public');
    }

    logger.info('[SOCKET] User connected', {
      socketId: socket.id,
      memberId: socket.data.memberId,
      role: socket.data.role,
      publicOnly: socket.data.isPublic === true,
    });

    socket.on('join-member-room', async (memberId: string) => {
      if (!memberId || typeof socket.data.authUserId !== 'string') return;
      const [member] = await db.select({ id: members.id })
        .from(members)
        .where(and(eq(members.authUserId, socket.data.authUserId), isNull(members.deletedAt)))
        .limit(1);
      if (!member || member.id !== memberId) {
        socket.emit('socket-error', { code: 'FORBIDDEN', message: 'You do not have permission to join this room.' });
        return;
      }
      socket.data.memberId = member.id;
      socket.join(`member-${member.id}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info('[SOCKET] User disconnected', { socketId: socket.id, reason });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const broadcastToMember = (memberId: string, event: string, data: unknown) => {
  if (io) io.to(`member-${memberId}`).emit(event, data);
};

/** Only use for intentionally public class/trainer events. */
export const broadcastToAll = (event: string, data: unknown) => {
  if (io) io.to('public').emit(event, data);
};
