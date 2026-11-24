import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function jsonError(message: string, statusCode = 400, code = 'ERROR', details?: any) {
  return NextResponse.json(
    {
      error: message,
      code,
      details: details ?? null,
    },
    { status: statusCode }
  );
}

export function handleApiError(error: unknown) {
  console.error('[API Error]:', error);

  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode, error.code, error.details);
  }

  if (error instanceof ZodError) {
    return jsonError('Dados de requisição inválidos', 422, 'VALIDATION_ERROR', error.flatten());
  }

  const message = error instanceof Error ? error.message : 'Erro interno do servidor';
  return jsonError(message, 500, 'INTERNAL_SERVER_ERROR');
}
