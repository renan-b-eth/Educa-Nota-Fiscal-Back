import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth/rbac';
import { handleApiError, AppError } from '@/lib/errors';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const createCeiSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ inválido'),
  razaoSocial: z.string().min(3, 'Razão social obrigatória'),
  nomeFantasia: z.string().min(3, 'Nome fantasia obrigatório'),
  endereco: z.string().min(5, 'Endereço obrigatório'),
  telefone: z.string().min(8, 'Telefone obrigatório'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  taxaComissao: z.number().min(0).max(100).default(10.0),
});

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);

    let whereClause: any = { isActive: true };

    if (authUser.role !== UserRole.ADM_GERAL) {
      if (!authUser.ceiId) {
        throw new AppError('Usuário não associado a uma unidade ativa', 403, 'NO_CEI_ASSOCIATED');
      }
      whereClause.id = authUser.ceiId;
    }

    const ceis = await prisma.cei.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            students: true,
            classrooms: true,
            users: true,
          },
        },
      },
      orderBy: { nomeFantasia: 'asc' },
    });

    return NextResponse.json({ ceis });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.ADM_GERAL]);

    const body = await req.json();
    const validated = createCeiSchema.parse(body);

    const existingCei = await prisma.cei.findUnique({
      where: { cnpj: validated.cnpj },
    });

    if (existingCei) {
      throw new AppError('Já existe um CEI/Associação cadastrado com este CNPJ', 409, 'CNPJ_EXISTS');
    }

    // Busca a organização master Educa Fora da Caixa
    const masterOrg = await prisma.organization.findFirst();

    const cei = await prisma.cei.create({
      data: {
        cnpj: validated.cnpj,
        razaoSocial: validated.razaoSocial,
        nomeFantasia: validated.nomeFantasia,
        endereco: validated.endereco,
        telefone: validated.telefone,
        email: validated.email,
        taxaComissao: validated.taxaComissao,
        orgId: masterOrg ? masterOrg.id : null,
      },
    });

    return NextResponse.json({ cei }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
