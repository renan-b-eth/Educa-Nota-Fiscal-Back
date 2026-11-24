import { PrismaClient, UserRole, CardCopyType, CardStatus, AttendanceType, AttendanceMethod, PostType, PostScope, BillingStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do Educa-nota-fiscal-back...');

  const defaultPassword = 'Educa@2026!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Organização Master (Educa Fora da Caixa)
  const masterOrg = await prisma.organization.upsert({
    where: { cnpj: '46.461.030/0001-04' },
    update: {
      razaoSocial: 'EDUCA FORA DA CAIXA SERVICOS LTDA',
      nomeFantasia: 'Educa Fora da Caixa',
      endereco: 'R. Bragança Paulista, 231 - Vila Cruzeiro, São Paulo - SP, CEP 04727-000',
      telefone: '(11) 3743-0836',
      email: 'contato@educaforadacaixa.com.br',
    },
    create: {
      cnpj: '46.461.030/0001-04',
      razaoSocial: 'EDUCA FORA DA CAIXA SERVICOS LTDA',
      nomeFantasia: 'Educa Fora da Caixa',
      endereco: 'R. Bragança Paulista, 231 - Vila Cruzeiro, São Paulo - SP, CEP 04727-000',
      telefone: '(11) 3743-0836',
      email: 'contato@educaforadacaixa.com.br',
    },
  });
  console.log('✅ Organização Master registrada:', masterOrg.nomeFantasia);

  // 2. CEI Exemplo (CEI Caminhar com Amor I)
  const ceiExemplo = await prisma.cei.upsert({
    where: { cnpj: '03.456.789/0001-99' },
    update: {
      orgId: masterOrg.id,
      razaoSocial: 'ASSOCIACAO BENEFICENTE CAMINHAR COM AMOR',
      nomeFantasia: 'CEI Caminhar com Amor I',
      endereco: 'Rua Carlo Formes, 45 - Vila Império, São Paulo - SP, CEP 04431-010',
      telefone: '(11) 5621-7151',
      email: 'diretoria@cas1.org.br',
      taxaComissao: 10.0,
      isActive: true,
    },
    create: {
      orgId: masterOrg.id,
      cnpj: '03.456.789/0001-99',
      razaoSocial: 'ASSOCIACAO BENEFICENTE CAMINHAR COM AMOR',
      nomeFantasia: 'CEI Caminhar com Amor I',
      endereco: 'Rua Carlo Formes, 45 - Vila Império, São Paulo - SP, CEP 04431-010',
      telefone: '(11) 5621-7151',
      email: 'diretoria@cas1.org.br',
      taxaComissao: 10.0,
      isActive: true,
    },
  });
  console.log('✅ CEI Exemplo registrado:', ceiExemplo.nomeFantasia);

  // 3. Usuários dos 6 Perfis RBAC
  const usersToSeed = [
    {
      email: 'adm.geral@educaforadacaixa.com.br',
      cpf: '11111111111',
      name: 'Carlos Oliveira (Adm Geral)',
      role: UserRole.ADM_GERAL,
      ceiId: null, // Acesso Global Multi-CEI
      phone: '(11) 98765-4321',
    },
    {
      email: 'adm.cei@cas1.org.br',
      cpf: '22222222222',
      name: 'Marcos Vinicius (Adm Mantenedora)',
      role: UserRole.ADM_CEI,
      ceiId: ceiExemplo.id,
      phone: '(11) 97654-3210',
    },
    {
      email: 'diretora@cas1.org.br',
      cpf: '33333333333',
      name: 'Dra. Sandra Regina (Diretora)',
      role: UserRole.DIRETORA,
      ceiId: ceiExemplo.id,
      phone: '(11) 96543-2109',
    },
    {
      email: 'secretaria@cas1.org.br',
      cpf: '44444444444',
      name: 'Ana Paula Souza (Secretaria)',
      role: UserRole.SECRETARIA,
      ceiId: ceiExemplo.id,
      phone: '(11) 95432-1098',
    },
    {
      email: 'professora@cas1.org.br',
      cpf: '55555555555',
      name: 'Prof. Juliana Mendes',
      role: UserRole.PROFESSORA,
      ceiId: ceiExemplo.id,
      phone: '(11) 94321-0987',
    },
    {
      email: 'responsavel@cas1.org.br',
      cpf: '66666666666',
      name: 'Mariana Silva Santos (Mãe)',
      role: UserRole.RESPONSAVEL,
      ceiId: ceiExemplo.id,
      phone: '(11) 93210-9876',
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        cpf: u.cpf,
        passwordHash,
        role: u.role,
        ceiId: u.ceiId,
        phone: u.phone,
        isActive: true,
      },
      create: {
        email: u.email,
        cpf: u.cpf,
        name: u.name,
        passwordHash,
        role: u.role,
        ceiId: u.ceiId,
        phone: u.phone,
        isActive: true,
      },
    });
    seededUsers[u.role] = user;
    console.log(`👤 Usuário [${u.role}]: ${u.email} | Senha: ${defaultPassword}`);
  }

  // 4. Sala de Aula de Exemplo (Berçário II A)
  const classroom = await prisma.classroom.upsert({
    where: { id: 'sample-classroom-b2a' },
    update: {
      name: 'Berçário II A',
      code: 'B2-A',
      capacity: 18,
      ceiId: ceiExemplo.id,
    },
    create: {
      id: 'sample-classroom-b2a',
      ceiId: ceiExemplo.id,
      name: 'Berçário II A',
      code: 'B2-A',
      capacity: 18,
      schoolYear: '2026',
    },
  });

  // Vincular Professora à Sala
  await prisma.teacherClassroom.upsert({
    where: {
      userId_classroomId: {
        userId: seededUsers[UserRole.PROFESSORA].id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      userId: seededUsers[UserRole.PROFESSORA].id,
      classroomId: classroom.id,
    },
  });

  // 5. Tablet de Exemplo
  await prisma.tablet.upsert({
    where: {
      ceiId_code: {
        ceiId: ceiExemplo.id,
        code: 'TAB-001',
      },
    },
    update: {
      assignedClassroomId: classroom.id,
    },
    create: {
      ceiId: ceiExemplo.id,
      code: 'TAB-001',
      deviceType: 'Tablet Android',
      brandModel: 'Samsung Galaxy Tab A9',
      serialNumber: 'R52X100ABCD',
      imei: '864209048123456',
      assignedClassroomId: classroom.id,
      isActive: true,
    },
  });

  // 6. Aluno de Exemplo
  const student = await prisma.student.upsert({
    where: { id: 'sample-student-arthur' },
    update: {
      name: 'Arthur Silva Santos',
      classroomId: classroom.id,
      ceiId: ceiExemplo.id,
      motherName: 'Mariana Silva Santos',
      eolCode: 'EOL-8841920',
    },
    create: {
      id: 'sample-student-arthur',
      ceiId: ceiExemplo.id,
      classroomId: classroom.id,
      name: 'Arthur Silva Santos',
      birthDate: new Date('2024-04-15'),
      enrollmentDate: new Date('2025-02-01'),
      motherName: 'Mariana Silva Santos',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop',
      eolCode: 'EOL-8841920',
      isActive: true,
    },
  });

  // 7. Responsável Civil (Guardian)
  const guardian = await prisma.guardian.upsert({
    where: { cpf: '66666666666' },
    update: {
      userId: seededUsers[UserRole.RESPONSAVEL].id,
      name: 'Mariana Silva Santos',
      rg: '42.345.678-9',
      phone: '(11) 93210-9876',
      email: 'responsavel@cas1.org.br',
      address: 'Rua das Camélias, 120, Apto 42 - Jabaquara, São Paulo - SP',
      qrCodeToken: 'QR-TOKEN-MARIANA-2026',
      favoritouNfp: true,
    },
    create: {
      ceiId: ceiExemplo.id,
      userId: seededUsers[UserRole.RESPONSAVEL].id,
      name: 'Mariana Silva Santos',
      cpf: '66666666666',
      rg: '42.345.678-9',
      phone: '(11) 93210-9876',
      email: 'responsavel@cas1.org.br',
      address: 'Rua das Camélias, 120, Apto 42 - Jabaquara, São Paulo - SP',
      qrCodeToken: 'QR-TOKEN-MARIANA-2026',
      favoritouNfp: true,
    },
  });

  // Vincular Aluno ao Responsável
  await prisma.studentGuardian.upsert({
    where: {
      studentId_guardianId: {
        studentId: student.id,
        guardianId: guardian.id,
      },
    },
    update: {
      isPrimary: true,
      canPickup: true,
    },
    create: {
      studentId: student.id,
      guardianId: guardian.id,
      relationship: 'MÃE',
      isPrimary: true,
      canPickup: true,
    },
  });

  // 8. Matrícula, Ficha de Saúde e Crachá do Aluno
  await prisma.studentEnrollment.upsert({
    where: { studentId: student.id },
    update: {
      eolStatus: 'VALIDADO',
      imageConsentCei: true,
      imageConsentSme: true,
      leveLeite: true,
    },
    create: {
      studentId: student.id,
      eolStatus: 'VALIDADO',
      documentChecklist: {
        certidaoNascimento: true,
        carteiraVacinacao: true,
        comprovanteEndereco: true,
        documentoResponsavel: true,
      },
      imageConsentCei: true,
      imageConsentSme: true,
      leveLeite: true,
    },
  });

  await prisma.studentHealthRecord.upsert({
    where: { studentId: student.id },
    update: {
      allergies: ['Picada de abelha'],
      dietaryRestrictions: ['Intolerância leve à lactose'],
      vaccinesUpToDate: true,
      ubsReference: 'UBS Vila Império',
    },
    create: {
      studentId: student.id,
      allergies: ['Picada de abelha'],
      dietaryRestrictions: ['Intolerância leve à lactose'],
      cidList: [],
      chronicDiseases: [],
      vaccinesUpToDate: true,
      ubsReference: 'UBS Vila Império',
      healthInsurance: 'NotreDame Intermédica',
      notes: 'Medicamento antialérgico mantido na secretaria com receita médica vigente.',
    },
  });

  await prisma.studentCard.upsert({
    where: { qrCodeToken: 'QR-CARD-ARTHUR-01' },
    update: {
      status: CardStatus.ACTIVE,
    },
    create: {
      studentId: student.id,
      cardNumber: 'CR-2026-0042',
      copyType: CardCopyType.VIA_1_FAMILIA,
      qrCodeToken: 'QR-CARD-ARTHUR-01',
      status: CardStatus.ACTIVE,
    },
  });

  // 9. Datas Gancho e Campanhas NFP
  const hookDate = await prisma.hookDate.upsert({
    where: { id: 'hook-date-maes-2026' },
    update: {
      title: 'Dia das Mães - Multiplique o Amor na Nota Fiscal Paulista!',
      date: new Date('2026-05-10'),
      description: 'Campanha de incentivo ao pedido de CPF na NFP durante as compras de presentes de Dia das Mães.',
      pushTitle: '🎁 Dia das Mães: Peça CPF na Nota e ajude nosso CEI!',
      pushBody: 'Ao comprar o presente da mamãe, peça CPF na nota e ajude as crianças do CEI Caminhar com Amor I!',
    },
    create: {
      id: 'hook-date-maes-2026',
      title: 'Dia das Mães - Multiplique o Amor na Nota Fiscal Paulista!',
      date: new Date('2026-05-10'),
      description: 'Campanha de incentivo ao pedido de CPF na NFP durante as compras de presentes de Dia das Mães.',
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&fit=crop',
      pushTitle: '🎁 Dia das Mães: Peça CPF na Nota e ajude nosso CEI!',
      pushBody: 'Ao comprar o presente da mamãe, peça CPF na nota e ajude as crianças do CEI Caminhar com Amor I!',
      isActive: true,
    },
  });

  // Post no Feed do CEI
  await prisma.feedPost.upsert({
    where: { id: 'post-exemplo-01' },
    update: {},
    create: {
      id: 'post-exemplo-01',
      ceiId: ceiExemplo.id,
      authorId: seededUsers[UserRole.DIRETORA].id,
      authorName: 'Dra. Sandra Regina',
      authorRole: 'Diretora',
      type: PostType.HOOK_DATE_CAMPAIGN,
      title: 'Campanha Nota Fiscal Paulista: Juntos pelas nossas crianças!',
      content: 'Queridas famílias! Ao realizarem suas compras neste mês, lembrem-se de pedir o CPF na nota fiscal. Cada crédito ajuda a manter nossas oficinas e materiais pedagógicos!',
      targetScope: PostScope.ALL_TENANT,
      mediaUrls: ['https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&fit=crop'],
      isNfpCampaign: true,
      nfpActionUrl: 'https://www.nfp.fazenda.sp.gov.br/',
    },
  });

  // 10. Pedido de Faturamento Bling de Exemplo
  await prisma.billingOrder.upsert({
    where: { id: 'sample-billing-01' },
    update: {},
    create: {
      id: 'sample-billing-01',
      ceiId: ceiExemplo.id,
      period: '10/2026',
      nfpTotalReceived: 38500.0,
      commissionRate: 10.0,
      commissionAmount: 3850.0,
      status: BillingStatus.DRAFT,
    },
  });

  console.log('✨ Seed concluído com sucesso com todos os 6 perfis configurados!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
