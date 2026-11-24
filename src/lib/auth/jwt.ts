import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_educa_jwt_secret_development_only';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_educa_refresh_jwt_secret_development_only';

export interface TokenPayload {
  sub: string; // userId
  name: string;
  email?: string | null;
  cpf?: string | null;
  role: UserRole;
  ceiId: string | null;
  ceiName?: string | null;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(payload: { sub: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '30d',
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };
}
