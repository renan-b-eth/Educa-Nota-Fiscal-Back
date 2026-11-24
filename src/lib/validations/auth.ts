import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const loginSchema = z.object({
  // Aceita tanto e-mail quanto CPF (com ou sem pontuação) no mesmo campo ou em campos separados
  login: z.string().min(3, 'Informe seu e-mail ou CPF'),
  password: z.string().min(4, 'A senha deve conter ao menos 4 caracteres'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  cpf: z.string().min(11, 'CPF inválido').optional().nullable(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  role: z.nativeEnum(UserRole),
  ceiId: z.string().uuid().optional().nullable(),
  phone: z.string().optional().nullable(),
});
