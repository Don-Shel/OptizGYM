import { Response } from 'express';

export const successResponse = (res: Response, data: any, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
  });
};

export const errorResponse = (res: Response, message: string, status = 500, details?: any) => {
  return res.status(status).json({
    success: false,
    error: message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
  });
};
