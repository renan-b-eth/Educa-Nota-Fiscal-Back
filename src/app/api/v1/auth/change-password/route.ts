import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { comparePassword, hashPassword } from '@/lib/auth/passwords';
import { handleApiError, AppError } from '@/lib/errors';
import { changePasswordSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const tokenPayload = requireAuth(req);
    const body = await req.json();
    const validated = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.sub },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    const isCurrentValid = await comparePassword(validated.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new AppError('A senha atual fornecida está incorreta', 400, 'INCORRECT_CURRENT_PASSWORD');
    }

    const newHash = await hashPassword(validated.newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Revoga todos os refresh tokens anteriores do usuário por segurança
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({
      message: 'Senha alterada com sucesso. Sessões anteriores foram revogadas.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
