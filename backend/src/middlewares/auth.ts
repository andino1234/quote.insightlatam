import { NextFunction, Request, Response } from 'express';
import { AppRole } from '../models/security.models';
import { ApiError } from '../utils/ApiError';
import { JwtPayload, verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const normalizeModuleName = (moduleName: string) =>
  moduleName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();

export function hasModuleAccess(user: JwtPayload | undefined, moduleName: string) {
  if (!user) return false;
  if (user.role === 'ADMINISTRADOR') return true;

  const normalizedModule = normalizeModuleName(moduleName);
  return Boolean(
    user.permissions?.some(
      (permission) => normalizeModuleName(permission.module) === normalizedModule && Boolean(permission.view)
    )
  );
}

export function requireModuleAccess(moduleName: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!hasModuleAccess(req.user, moduleName)) {
      throw ApiError.forbidden(`No tienes acceso al módulo: ${moduleName}`);
    }
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized();
  }
  const token = header.substring('Bearer '.length);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    throw ApiError.unauthorized('Token inválido o expirado');
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const rawRole = req.user?.role as string | undefined;
    const effectiveRole: AppRole | undefined = rawRole === 'OPERATIVO' ? 'EJECUTIVO' : (rawRole as AppRole | undefined);

    if (!req.user || !effectiveRole || !roles.includes(effectiveRole)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
