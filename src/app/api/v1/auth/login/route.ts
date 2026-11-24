import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, sanitizeCpf } from '@/lib/auth/passwords';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/session';
import { handleApiError, AppError } from '@/lib/errors';
import { loginSchema } from '@/lib/validations/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Normaliza os campos caso venha email ou cpf explicitamente
    const loginIdentifier = body.login || body.email || body.cpf;
    const password = body.password;

    const validated = loginSchema.parse({
      login: loginIdentifier,
      password,
    });

    const isCpfCandidate = /^[\d.-]+$/.test(validated.login);
    const cleanedCpf = isCpfCandidate ? sanitizeCpf(validated.login) : null;

    // Busca o usuário por E-mail ou por CPF
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: validated.login.toLowerCase().trim(), mode: 'insensitive' } },
          ...(cleanedCpf && cleanedCpf.length >= 11 ? [{ cpf: cleanedCpf }] : []),
        ],
      },
      include: {
        cei: {
          select: {
            id: true,
            razaoSocial: true,
            nomeFantasia: true,
            cnpj: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Credenciais inválidas. Verifique seu e-mail/CPF e senha.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Este usuário está inativo no sistema. Contate a administração.', 403, 'USER_INACTIVE');
    }

    const isPasswordValid = await comparePassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas. Verifique seu e-mail/CPF e senha.', 401, 'INVALID_CREDENTIALS');
    }

    // Gera os tokens
    const accessToken = generateAccessToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      role: user.role,
      ceiId: user.ceiId,
      ceiName: user.cei?.nomeFantasia || null,
    });

    const refreshToken = generateRefreshToken({ sub: user.id });

    // Registra o Refresh Token no banco com validade de 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const userAgent = req.headers.get('user-agent') || undefined;
    const ipAddress = req.headers.get('x-forwarded-for') || undefined;

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    // Atualiza o último login do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Configura cookies HttpOnly (para o Painel Web)
    await setAuthCookies(accessToken, refreshToken);

    const responsePayload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        ceiId: user.ceiId,
        ceiName: user.cei?.nomeFantasia || null,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
