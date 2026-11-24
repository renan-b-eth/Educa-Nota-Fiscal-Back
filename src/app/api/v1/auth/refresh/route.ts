import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth/jwt';
import { setAuthCookies, getRefreshTokenFromCookies } from '@/lib/auth/session';
import { handleApiError, AppError } from '@/lib/errors';
import { refreshSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    let tokenToVerify: string | undefined;

    // 1. Tenta obter do corpo JSON
    try {
      const body = await req.json();
      const validated = refreshSchema.safeParse(body);
      if (validated.success && validated.data.refreshToken) {
        tokenToVerify = validated.data.refreshToken;
      }
    } catch {
      // Body vazio ou não JSON, prossegue para verificação por cookie
    }

    // 2. Se não veio no body, busca no cookie
    if (!tokenToVerify) {
      tokenToVerify = await getRefreshTokenFromCookies();
    }

    if (!tokenToVerify) {
      throw new AppError('Refresh token não informado', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    // Valida criptograficamente o JWT
    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(tokenToVerify);
    } catch {
      throw new AppError('Refresh token inválido ou expirado', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Verifica se o token existe no banco e não foi revogado
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: tokenToVerify },
      include: {
        user: {
          include: {
            cei: {
              select: {
                id: true,
                nomeFantasia: true,
              },
            },
          },
        },
      },
    });

    if (!dbToken || dbToken.revokedAt !== null || dbToken.expiresAt < new Date()) {
      throw new AppError('Sessão revogada ou expirada. Faça login novamente.', 401, 'SESSION_EXPIRED');
    }

    const user = dbToken.user;
    if (!user.isActive) {
      throw new AppError('Usuário inativo no sistema', 403, 'USER_INACTIVE');
    }

    // Emite novo Access Token
    const newAccessToken = generateAccessToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      ceiId: user.ceiId,
      ceiName: user.cei?.nomeFantasia || null,
    });

    // Atualiza cookie HttpOnly
    await setAuthCookies(newAccessToken);

    return NextResponse.json({
      accessToken: newAccessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        ceiId: user.ceiId,
        ceiName: user.cei?.nomeFantasia || null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
