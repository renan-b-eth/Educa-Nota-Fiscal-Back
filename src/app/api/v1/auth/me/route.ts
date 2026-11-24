import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError, AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const tokenPayload = requireAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        avatarUrl: true,
        role: true,
        ceiId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        cei: {
          select: {
            id: true,
            cnpj: true,
            razaoSocial: true,
            nomeFantasia: true,
            endereco: true,
            telefone: true,
            email: true,
            taxaComissao: true,
          },
        },
        teacherClassrooms: {
          include: {
            classroom: {
              select: {
                id: true,
                name: true,
                code: true,
                capacity: true,
              },
            },
          },
        },
        guardian: {
          select: {
            id: true,
            qrCodeToken: true,
            favoritouNfp: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        ceiId: user.ceiId,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
      },
      cei: user.cei,
      teacherClassrooms: user.teacherClassrooms.map((tc) => tc.classroom),
      guardian: user.guardian,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
