import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { hashPassword, sanitizeCpf } from '@/lib/auth/passwords';
import { handleApiError, AppError } from '@/lib/errors';
import { createUserSchema } from '@/lib/validations/auth';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authUser = requireRole(req, [
      UserRole.ADM_GERAL,
      UserRole.ADM_CEI,
      UserRole.DIRETORA,
      UserRole.SECRETARIA,
    ]);

    const url = new URL(req.url);
    const targetCeiId = url.searchParams.get('ceiId');
    const roleFilter = url.searchParams.get('role') as UserRole | null;

    let whereClause: any = {};

    if (authUser.role === UserRole.ADM_GERAL) {
      if (targetCeiId) {
        whereClause.ceiId = targetCeiId;
      }
    } else {
      whereClause.ceiId = authUser.ceiId;
    }

    if (roleFilter && Object.values(UserRole).includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        role: true,
        ceiId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        cei: {
          select: {
            id: true,
            nomeFantasia: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireRole(req, [
      UserRole.ADM_GERAL,
      UserRole.ADM_CEI,
      UserRole.DIRETORA,
      UserRole.SECRETARIA,
    ]);

    const body = await req.json();
    const validated = createUserSchema.parse(body);

    const targetCeiId =
      authUser.role === UserRole.ADM_GERAL ? validated.ceiId || null : authUser.ceiId;

    // Regras de hierarquia de criação de usuários
    if (
      ([UserRole.ADM_GERAL, UserRole.ADM_CEI] as UserRole[]).includes(validated.role) &&
      authUser.role !== UserRole.ADM_GERAL
    ) {
      throw new AppError(
        'Apenas Administradores Gerais podem criar perfis ADM_GERAL ou ADM_CEI',
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    if (validated.role !== UserRole.ADM_GERAL && !targetCeiId) {
      throw new AppError(
        'É obrigatório vincular uma unidade (CEI) para este perfil',
        400,
        'CEI_REQUIRED'
      );
    }

    const cleanedCpf = validated.cpf ? sanitizeCpf(validated.cpf) : null;

    // Verifica unicidade de e-mail e CPF
    if (validated.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: validated.email.toLowerCase().trim() },
      });
      if (existingEmail) {
        throw new AppError('Este e-mail já está cadastrado no sistema', 409, 'EMAIL_EXISTS');
      }
    }

    if (cleanedCpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: cleanedCpf },
      });
      if (existingCpf) {
        throw new AppError('Este CPF já está cadastrado no sistema', 409, 'CPF_EXISTS');
      }
    }

    const passwordHash = await hashPassword(validated.password);

    const newUser = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email ? validated.email.toLowerCase().trim() : null,
        cpf: cleanedCpf,
        passwordHash,
        role: validated.role,
        ceiId: targetCeiId,
        phone: validated.phone || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        phone: true,
        role: true,
        ceiId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
