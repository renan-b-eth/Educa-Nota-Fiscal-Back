import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/rbac';
import { handleApiError, AppError } from '@/lib/errors';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);

    // Carrega dados completos do usuário
    const user = await prisma.user.findUnique({
      where: { id: authUser.sub },
      include: {
        cei: true,
        guardian: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let roleData: any = {};

    // 1. DADOS ESPECÍFICOS PARA PROFESSORA
    if (user.role === UserRole.PROFESSORA && user.ceiId) {
      const teacherClassrooms = await prisma.teacherClassroom.findMany({
        where: { userId: user.id },
        include: {
          classroom: {
            include: {
              students: {
                where: { isActive: true },
                select: {
                  id: true,
                  name: true,
                  birthDate: true,
                  motherName: true,
                  photoUrl: true,
                  enrollment: {
                    select: {
                      imageConsentCei: true,
                    },
                  },
                  healthRecord: {
                    select: {
                      allergies: true,
                      dietaryRestrictions: true,
                    },
                  },
                  attendanceRecords: {
                    where: {
                      timestamp: { gte: todayStart, lte: todayEnd },
                    },
                    orderBy: { timestamp: 'desc' },
                  },
                },
              },
            },
          },
        },
      });

      roleData.classrooms = teacherClassrooms.map((tc) => ({
        id: tc.classroom.id,
        name: tc.classroom.name,
        code: tc.classroom.code,
        capacity: tc.classroom.capacity,
        studentsCount: tc.classroom.students.length,
        students: tc.classroom.students.map((s) => {
          const lastAttendance = s.attendanceRecords[0] || null;
          return {
            id: s.id,
            name: s.name,
            birthDate: s.birthDate,
            motherName: s.motherName,
            photoUrl: s.photoUrl,
            imageConsent: s.enrollment?.imageConsentCei ?? true,
            hasSpecialDiet: (s.healthRecord?.dietaryRestrictions?.length || 0) > 0,
            hasAllergies: (s.healthRecord?.allergies?.length || 0) > 0,
            statusToday: lastAttendance ? lastAttendance.type : 'AUSENTE',
            lastAttendanceAt: lastAttendance ? lastAttendance.timestamp : null,
          };
        }),
      }));
    }

    // 2. DADOS ESPECÍFICOS PARA RESPONSÁVEL
    if (user.role === UserRole.RESPONSAVEL) {
      const guardian = user.guardian;
      let children: any[] = [];

      if (guardian) {
        const studentGuardians = await prisma.studentGuardian.findMany({
          where: { guardianId: guardian.id },
          include: {
            student: {
              include: {
                classroom: {
                  select: { id: true, name: true, code: true },
                },
                cards: {
                  where: { status: 'ACTIVE' },
                  orderBy: { issuedAt: 'desc' },
                  take: 1,
                },
                attendanceRecords: {
                  where: {
                    timestamp: { gte: todayStart, lte: todayEnd },
                  },
                  orderBy: { timestamp: 'asc' },
                },
              },
            },
          },
        });

        children = studentGuardians.map((sg) => ({
          studentId: sg.student.id,
          name: sg.student.name,
          classroomName: sg.student.classroom.name,
          classroomCode: sg.student.classroom.code,
          photoUrl: sg.student.photoUrl,
          activeCard: sg.student.cards[0]
            ? {
                cardNumber: sg.student.cards[0].cardNumber,
                qrCodeToken: sg.student.cards[0].qrCodeToken,
              }
            : null,
          relationship: sg.relationship,
          isPrimary: sg.isPrimary,
          todayTimeline: sg.student.attendanceRecords.map((att) => ({
            type: att.type,
            method: att.method,
            time: att.timestamp,
            triageStatus: att.triageStatus,
          })),
        }));
      }

      roleData.guardian = guardian
        ? {
            id: guardian.id,
            qrCodeToken: guardian.qrCodeToken,
            favoritouNfp: guardian.favoritouNfp,
          }
        : null;
      roleData.children = children;
    }

    // 3. DADOS ESPECÍFICOS PARA SECRETARIA, DIRETORA OU ADM_CEI
    if (
      ([UserRole.SECRETARIA, UserRole.DIRETORA, UserRole.ADM_CEI] as UserRole[]).includes(user.role) &&
      user.ceiId
    ) {
      const [totalStudents, todayCheckIns, todayOccurrences, pendingExceptions] = await Promise.all([
        prisma.student.count({ where: { ceiId: user.ceiId, isActive: true } }),
        prisma.attendanceRecord.count({
          where: {
            ceiId: user.ceiId,
            type: 'CHECK_IN',
            timestamp: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.occurrenceBookEntry.count({
          where: {
            ceiId: user.ceiId,
            reportedAt: { gte: todayStart, lte: todayEnd },
          },
        }),
        prisma.exceptionalAuthorization.count({
          where: {
            ceiId: user.ceiId,
            validDate: { gte: todayStart, lte: todayEnd },
          },
        }),
      ]);

      roleData.metrics = {
        totalStudents,
        todayCheckIns,
        todayOccurrences,
        pendingExceptions,
      };
    }

    // 4. CAMPANHA NFP E DATAS GANCHO ATIVAS
    const activeHookDate = await prisma.hookDate.findFirst({
      where: {
        isActive: true,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // até 7 dias passados
      },
      orderBy: { date: 'asc' },
    });

    // 5. POSTS RECENTES DO FEED
    const recentPosts = await prisma.feedPost.findMany({
      where: {
        OR: [
          ...(user.ceiId ? [{ ceiId: user.ceiId }] : []),
          { targetScope: 'ALL_PLATFORM' },
        ],
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        authorName: true,
        authorRole: true,
        mediaUrls: true,
        isNfpCampaign: true,
        nfpActionUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      tenant: user.cei
        ? {
            id: user.cei.id,
            cnpj: user.cei.cnpj,
            razaoSocial: user.cei.razaoSocial,
            nomeFantasia: user.cei.nomeFantasia,
            endereco: user.cei.endereco,
            telefone: user.cei.telefone,
            taxaComissao: user.cei.taxaComissao,
          }
        : null,
      roleData,
      activeCampaign: activeHookDate
        ? {
            id: activeHookDate.id,
            title: activeHookDate.title,
            date: activeHookDate.date,
            description: activeHookDate.description,
            bannerUrl: activeHookDate.bannerUrl,
            pushTitle: activeHookDate.pushTitle,
            pushBody: activeHookDate.pushBody,
          }
        : null,
      recentPosts,
      appConfig: {
        appName: 'Educa Fora da Caixa - Nota Fiscal',
        platformVersion: '1.0.0',
        nfpSupportEnabled: true,
        controlIdIntegrated: true,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
