import { db } from './db';
import { activityLogs } from '../db/schema';
import { Request } from 'express';

export interface LogOptions {
  authUserId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
  req?: Request;
}

export const logActivity = async (options: LogOptions) => {
  const { authUserId, action, entityType, entityId, metadata, req } = options;

  try {
    await db.insert(activityLogs).values({
      authUserId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req?.ip || req?.headers['x-forwarded-for']?.toString() || null,
      userAgent: req?.headers['user-agent'] || null,
    });
    console.log(`[ACTIVITY] ✓ Logged: ${action} for user: ${authUserId}`);
  } catch (error) {
    console.error(`[ACTIVITY] ✗ Failed to log activity:`, error);
  }
};
