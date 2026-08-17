import { Request, Response } from 'express';
import { db } from '../utils/db';
import { members, notifications } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, desc, and, or, isNull } from 'drizzle-orm';
import { broadcastResourceChange, broadcastToMember } from '../utils/socket';

export const getMyNotifications = async (req: any, res: Response) => {
  const memberId = req.member?.id;
  if (!memberId) return errorResponse(res, 'Member profile not found', 404);

  try {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.memberId, memberId))
      .orderBy(desc(notifications.createdAt));

    return successResponse(res, userNotifications);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch notifications', 500, error);
  }
};

export const markAsRead = async (req: any, res: Response) => {
  const { id } = req.params;
  const memberId = req.member?.id;
  if (!memberId) return errorResponse(res, 'Member profile not found', 404);

  try {
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.id, id), eq(notifications.memberId, memberId)));
    broadcastResourceChange('notifications', 'updated', id);
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, 'Failed to update notification', 500, error);
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  const memberId = req.member?.id;
  if (!memberId) return errorResponse(res, 'Member profile not found', 404);

  try {
    await db.update(notifications)
      .set({ isRead: 1 })
      .where(and(eq(notifications.memberId, memberId), or(eq(notifications.isRead, 0), isNull(notifications.isRead))));
    broadcastResourceChange('notifications', 'read-all', memberId);
    broadcastToMember(memberId, 'notifications-read-all', { memberId });
    return successResponse(res, { success: true });
  } catch (error) {
    return errorResponse(res, 'Failed to mark notifications as read', 500, error);
  }
};

export const createNotification = async (memberId: string, title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') => {
  try {
    const [newNotification] = await db.insert(notifications).values({
      memberId,
      title,
      message,
      type,
      isRead: 0
    }).returning();

    broadcastToMember(memberId, 'new-notification', newNotification);
    broadcastResourceChange('notifications', 'created', newNotification.id);
    return newNotification;
  } catch (error) {
    console.error('[NOTIFICATION] ✗ Failed to create notification:', error);
  }
};

export const notifyAllActiveMembers = async (title: string, message: string, type: 'info' | 'warning' | 'success' = 'info') => {
  const activeMembers = await db.select({ id: members.id })
    .from(members)
    .where(and(isNull(members.deletedAt), eq(members.role, 'member')));

  await Promise.all(activeMembers.map((member) => createNotification(member.id, title, message, type)));
};
