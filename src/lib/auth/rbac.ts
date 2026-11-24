import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';
import { TokenPayload, verifyAccessToken } from './jwt';
import { AppError } from '../errors';
import { AUTH_COOKIE_NAME } from './session';

export function getAuthTokenFromRequest(req: Request | NextRequest): string | null {
  // 1. Tenta extrair do Header Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Tenta extrair dos cookies da requisição
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookiesList = cookieHeader.split(';').map((c) => c.trim());
    const authCookie = cookiesList.find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));
    if (authCookie) {
      return authCookie.split('=')[1];
    }
  }

  return null;
}

export function requireAuth(req: Request | NextRequest): TokenPayload {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    throw new AppError('Token de autenticação não fornecido', 401, 'UNAUTHORIZED');
  }

  try {
    return verifyAccessToken(token);
  } catch (err) {
    throw new AppError('Token de autenticação inválido ou expirado', 401, 'INVALID_TOKEN');
  }
}

export function requireRole(req: Request | NextRequest, allowedRoles: UserRole[]): TokenPayload {
  const user = requireAuth(req);

  if (!allowedRoles.includes(user.role)) {
    throw new AppError(
      `Acesso negado para o perfil ${user.role}. Permissão necessária: [${allowedRoles.join(', ')}]`,
      403,
      'FORBIDDEN'
    );
  }

  return user;
}

export function assertTenantAccess(user: TokenPayload, targetCeiId?: string | null): void {
  // ADM_GERAL possui acesso global multi-tenant
  if (user.role === UserRole.ADM_GERAL) {
    return;
  }

  if (!targetCeiId || user.ceiId !== targetCeiId) {
    throw new AppError(
      'Acesso negado: você não tem permissão para acessar os dados desta unidade/CEI',
      403,
      'TENANT_ACCESS_DENIED'
    );
  }
}
