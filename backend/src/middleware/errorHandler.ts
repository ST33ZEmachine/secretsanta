import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500) => {
  const error: any = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
};
