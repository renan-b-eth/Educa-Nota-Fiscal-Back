import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { clearAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/session';
import { handleApiError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    let tokenToRevoke: string | undefined;

    try {
      const body = await req.json();
      tokenToRevoke = body.refreshToken;
    } catch {
      // Sem body
    }

    if (!tokenToRevoke) {
      tokenToRevoke = await getRefreshTokenFromCookies();
    }

    if (tokenToRevoke) {
      await prisma.refreshToken.updateMany({
        where: { token: tokenToRevoke, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // Limpa cookies HttpOnly
    await clearAuthCookies();

    return NextResponse.json({
      message: 'Sessão encerrada com sucesso',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
