import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  let dbStatus = 'disconnected';

  try {
    // Tenta uma consulta rápida ao banco
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'unreachable';
  }

  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    service: 'educa-nota-fiscal-back',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  });
}
