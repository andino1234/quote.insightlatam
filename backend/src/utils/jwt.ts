import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppRole } from '../models/security.models';

export interface ModulePermission {
  module: string;
  view: boolean;
}

export interface JwtPayload {
  userId: number;
  role: AppRole;
  permissions?: ModulePermission[];
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret) as JwtPayload;
}
