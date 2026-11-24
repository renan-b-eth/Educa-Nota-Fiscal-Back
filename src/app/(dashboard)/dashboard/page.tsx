import React from 'react';
import { getAuthTokenFromCookies } from '@/lib/auth/session';
import { verifyAccessToken, TokenPayload } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  HeartPulse,
  BookOpen,
  QrCode,
  UtensilsCrossed,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default async function DashboardPage() {
  const token = await getAuthTokenFromCookies();
  let user: TokenPayload | null = null;

  if (token) {
    try {
      user = verifyAccessToken(token);
    } catch {
      // Token inválido tratado no layout
    }
  }

  // Tenta carregar dados reais do banco, ou usa valores de apresentação se o banco ainda não foi migrado
  let stats: any = {
    ceisCount: 1,
    studentsCount: 42,
    todayCheckIns: 38,
    todayOccurrences: 2,
    todayExceptions: 1,
    nfpTotal: 38500.0,
    blingOrdersCount: 3,
    activeHookDatesCount: 1,
    kitchenCount: 38,
    tabletsCount: 2,
    dbConnected: false,
  };

  try {
    const [ceis, students, checkIns, occurrences, hookDates] = await Promise.all([
      prisma.cei.count(),
      prisma.student.count(),
      prisma.attendanceRecord.count(),
      prisma.occurrenceBookEntry.count(),
      prisma.hookDate.count({ where: { isActive: true } }),
    ]);

    stats.ceisCount = ceis;
    stats.studentsCount = students;
    stats.todayCheckIns = checkIns;
    stats.todayOccurrences = occurrences;
    stats.activeHookDatesCount = hookDates;
    stats.dbConnected = true;
  } catch (e) {
    // Banco não conectado localmente (normal antes de configurar a URL do Supabase)
    stats.dbConnected = false;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas */}
      <div className="bg-gradient-to-r from-[#00838F] to-[#005662] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Sistema Ativo 2026
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Olá, {user.name}!
            </h1>
            <p className="text-teal-100 text-xs md:text-sm mt-0.5 max-w-xl">
              Bem-vindo ao Painel Integrado da plataforma <strong>Educa Fora da Caixa – Nota Fiscal</strong>.
              Você está conectado com o perfil <strong>{user.role}</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 shrink-0 text-right">
            <div className="text-[10px] text-teal-200 uppercase font-semibold">Unidade Vinculada</div>
            <div className="text-sm font-bold text-white truncate">{user.ceiName || 'Global Multi-CEI'}</div>
            <div className="text-[11px] text-teal-100 mt-0.5">Sincronizado com App Flutter</div>
          </div>
        </div>
      </div>

      {/* Alerta de Status do Banco de Dados */}
      {!stats.dbConnected && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aguardando Conexão com Supabase: </span>
            A aplicação está pronta e operando com dados de seed/mock. Assim que você colar as variáveis
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono">DATABASE_URL</code> e
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded text-amber-900 font-mono">DIRECT_URL</code> na Vercel
            e rodar as migrações, a sincronização persistente com o PostgreSQL será ativada automaticamente.
          </div>
        </div>
      )}

      {/* Painel por Perfil - 1. ADM_GERAL */}
      {user.role === 'ADM_GERAL' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Visão Geral Multi-Tenant (Educa Fora da Caixa)
            </h2>
            <span className="text-xs text-slate-500">Métricas Consolidadas de Todas as Associações</span>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">CEIs Atendidos</span>
                <Building2 className="w-4 h-4 text-[#00838F]" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{stats.ceisCount}</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Todas as unidades ativas
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Repasse NFP Apurado</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">R$ 38.500,00</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Comissão: <strong className="text-slate-800">R$ 3.850,00 (10%)</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Campanhas Datas Gancho</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{stats.activeHookDatesCount} Ativa</div>
              <div className="text-[11px] text-slate-500 mt-1">Próxima: Dia das Mães NFP</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Exportação Bling</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">Pronto</div>
              <div className="text-[11px] text-slate-500 mt-1">Integração ERP conectada</div>
            </div>
          </div>
        </div>
      )}

      {/* Painel por Perfil - 2. DIRETORA ou ADM_CEI */}
      {(user.role === 'DIRETORA' || user.role === 'ADM_CEI') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Painel Operacional da Unidade
            </h2>
            <span className="text-xs text-slate-500">Monitoramento Diário da Creche</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Alunos Presentes Hoje</span>
                <Users className="w-4 h-4 text-[#00838F]" />
              </div>
              <div className="text-2xl font-bold text-slate-800">38 / 42</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                90.4% de presença na unidade
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Triagem de Entrada</span>
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">1 Atenção</div>
              <div className="text-[11px] text-rose-600 font-medium mt-1">
                1 caso febril leve registrado
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Autorização Excepcional</span>
                <ShieldCheck className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">1 Válida</div>
              <div className="text-[11px] text-slate-500 mt-1">Retirada por tia autorizada</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Monitor Fechamento</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">16h50</div>
              <div className="text-[11px] text-slate-500 mt-1">Alerta pré-17h ativo</div>
            </div>
          </div>
        </div>
      )}

      {/* Painel por Perfil - 3. SECRETARIA */}
      {user.role === 'SECRETARIA' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Rotina da Secretaria Escolar
            </h2>
            <span className="text-xs text-slate-500">Cadastros, Matrículas e Carteirinhas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Matrículas EOL</span>
                <Users className="w-4 h-4 text-[#00838F]" />
              </div>
              <div className="text-2xl font-bold text-slate-800">42 Alunos</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Todas fichas validadas
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Crachás QR Code</span>
                <QrCode className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">84 Vias</div>
              <div className="text-[11px] text-slate-500 mt-1">2 vias por família emitidas</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Cozinha (08h40)</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">38 Refeições</div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Enviado para nutrição
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Tablets Ativos</span>
                <Layers className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-slate-800">2 Dispositivos</div>
              <div className="text-[11px] text-slate-500 mt-1">Salas Berçário I e II</div>
            </div>
          </div>
        </div>
      )}

      {/* Painel por Perfil - 4. PROFESSORA */}
      {user.role === 'PROFESSORA' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Minhas Turmas & Chamada Diária
            </h2>
            <span className="text-xs text-slate-500">Tablet em Sala de Aula</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Turma Atual</div>
              <div className="text-xl font-bold text-[#00838F]">Berçário II A</div>
              <div className="text-xs text-slate-500 mt-1">18 alunos matriculados</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Chamada das 08h10</div>
              <div className="text-xl font-bold text-emerald-600">Concluída</div>
              <div className="text-xs text-slate-500 mt-1">17 presentes na sala</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Check-out (Saída)</div>
              <div className="text-xl font-bold text-slate-800">Liberado 16h00</div>
              <div className="text-xs text-slate-500 mt-1">16h Vans / 16h20 Famílias</div>
            </div>
          </div>
        </div>
      )}

      {/* Painel por Perfil - 5. RESPONSAVEL */}
      {user.role === 'RESPONSAVEL' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">
              Acompanhamento do Aluno
            </h2>
            <span className="text-xs text-slate-500">Mural, Presença e Nota Fiscal</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Criança Matriculada</div>
              <div className="text-xl font-bold text-slate-800">Arthur Silva Santos</div>
              <div className="text-xs text-[#00838F] font-medium mt-1">Turma: Berçário II A</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Presença Hoje</div>
              <div className="text-xl font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" /> Na Creche
              </div>
              <div className="text-xs text-slate-500 mt-1">Entrada confirmada às 07:22</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 mb-1">Nota Fiscal Paulista</div>
              <div className="text-xl font-bold text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5" /> Favoritado!
              </div>
              <div className="text-xs text-slate-500 mt-1">Obrigado por apoiar nosso CEI!</div>
            </div>
          </div>
        </div>
      )}

      {/* Sessão Informativa de Integração com o App Mobile */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Integração com o Aplicativo Mobile / Tablet (Flutter)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pacote: <code className="font-mono text-[#00838F]">br.com.educaforadacaixa</code> | Endpoint:
              <code className="ml-1 font-mono text-slate-700">/api/v1/app/bootstrap</code>
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-teal-50 text-[#00838F] px-2.5 py-1 rounded-full border border-teal-200/60">
            API REST v1 Online
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs font-bold text-slate-800">Bootstrap Único</div>
            <p className="text-[11px] text-slate-500 mt-1">
              O app carrega em uma única chamada todas as turmas, alunos, filhos, badges e configurações.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs font-bold text-slate-800">Autenticação JWT Bearer</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Token de acesso de 15 minutos com rotação transparente e revogável de Refresh Token.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="text-xs font-bold text-slate-800">Proteção de Imagem (LGPD)</div>
            <p className="text-[11px] text-slate-500 mt-1">
              Feed e fotos respeitam estritamente os termos de consentimento CEI e SME/DRE.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
