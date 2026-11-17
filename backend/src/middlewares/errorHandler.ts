import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Datos inválidos', errors: err.flatten() });
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ message: 'Error interno del servidor' });
}
