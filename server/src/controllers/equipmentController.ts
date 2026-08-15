import { Request, Response } from 'express';
import { db } from '../utils/db';
import { members, equipment, payments } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, count, sum, desc, isNull } from 'drizzle-orm';
import { getFromCache, setToCache, removeFromCache } from '../utils/cache';

const CACHE_KEY = 'all_equipment';

export const getAllEquipment = async (req: Request, res: Response) => {
  try {
    const cached = getFromCache(CACHE_KEY);
    if (cached) {
      console.log('[CACHE] ✓ Serving equipment from cache');
      return successResponse(res, cached);
    }

    const allEquipment = await db.select().from(equipment).where(isNull(equipment.deletedAt));

    setToCache(CACHE_KEY, allEquipment);
    return successResponse(res, allEquipment);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch equipment', 500, error);
  }
};

export const createEquipment = async (req: Request, res: Response) => {
  const { name, category, status, purchase_date: purchaseDate } = req.body;
  try {
    const [newItem] = await db.insert(equipment).values({
      name,
      category,
      status,
      purchaseDate
    }).returning();

    removeFromCache(CACHE_KEY);
    return successResponse(res, newItem, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to add equipment', 500, error);
  }
};
