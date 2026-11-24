import React from 'react';
import { redirect } from 'next/navigation';
import { getAuthTokenFromCookies, clearAuthCookies } from '@/lib/auth/session';
import { verifyAccessToken, TokenPayload } from '@/lib/auth/jwt';
import {
  School,
  LayoutDashboard,
  Building2,
  Calendar,
  FileSpreadsheet,
  Receipt,
  Gift,
  Users,
  ClipboardList,
  HeartPulse,
  BookOpen,
  FileKey,
  Clock,
  Search,
  UserPlus,
  QrCode,
  UtensilsCrossed,
  Tablet,
  Camera,
  CheckCircle,
  AlertTriangle,
  Image,
  LogOut,
  Shield,
  Layers,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Módulo Geral / Comum
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADM_GERAL', 'ADM_CEI', 'DIRETORA', 'SECRETARIA', 'PROFESSORA', 'RESPONSAVEL'],
  },

  // 1. ADM_GERAL
  {
    label: 'Associações & CEIs',
    href: '/dashboard?tab=ceis',
    icon: Building2,
    roles: ['ADM_GERAL'],
  },
  {
    label: 'Datas Gancho NFP',
    href: '/dashboard?tab=datas-gancho',
    icon: Calendar,
    roles: ['ADM_GERAL'],
  },
  {
    label: 'Importação NFP & Ranking',
    href: '/dashboard?tab=nfp',
    icon: FileSpreadsheet,
    roles: ['ADM_GERAL'],
  },
  {
    label: 'Faturamento Bling',
    href: '/dashboard?tab=faturamento',
    icon: Receipt,
    roles: ['ADM_GERAL'],
  },
  {
    label: 'Sorteios de Incentivo',
    href: '/dashboard?tab=sorteios',
    icon: Gift,
    roles: ['ADM_GERAL'],
  },
  {
    label: 'Gestão de Usuários',
    href: '/dashboard?tab=usuarios',
    icon: Users,
    roles: ['ADM_GERAL', 'ADM_CEI'],
  },

  // 2. DIRETORA
  {
    label: 'Fila de Triagem (Até 09h)',
    href: '/dashboard?tab=triagem',
    icon: ClipboardList,
    roles: ['DIRETORA'],
  },
  {
    label: 'Intercorrências de Saúde',
    href: '/dashboard?tab=intercorrencias',
    icon: HeartPulse,
    roles: ['DIRETORA', 'PROFESSORA'],
  },
  {
    label: 'Livro de Ocorrências Digital',
    href: '/dashboard?tab=ocorrencias',
    icon: BookOpen,
    roles: ['DIRETORA', 'SECRETARIA'],
  },
  {
    label: 'Autorização Excepcional',
    href: '/dashboard?tab=autorizacao-excepcional',
    icon: FileKey,
    roles: ['DIRETORA', 'SECRETARIA'],
  },
  {
    label: 'Monitor de Fechamento',
    href: '/dashboard?tab=fechamento',
    icon: Clock,
    roles: ['DIRETORA'],
    badge: '16h50',
  },
  {
    label: 'Busca Ativa & Relatórios',
    href: '/dashboard?tab=busca-ativa',
    icon: Search,
    roles: ['DIRETORA'],
  },

  // 3. SECRETARIA
  {
    label: 'Matrícula & EOL',
    href: '/dashboard?tab=matriculas',
    icon: UserPlus,
    roles: ['SECRETARIA', 'ADM_CEI'],
  },
  {
    label: 'Salas & Alunos',
    href: '/dashboard?tab=salas',
    icon: Layers,
    roles: ['SECRETARIA', 'ADM_CEI'],
  },
  {
    label: 'Responsáveis & Transportes',
    href: '/dashboard?tab=responsaveis',
    icon: Users,
    roles: ['SECRETARIA'],
  },
  {
    label: 'Crachás & QR Codes',
    href: '/dashboard?tab=crachas',
    icon: QrCode,
    roles: ['SECRETARIA'],
  },
  {
    label: 'Cozinha (Contagem 08h40)',
    href: '/dashboard?tab=cozinha',
    icon: UtensilsCrossed,
    roles: ['SECRETARIA'],
  },
  {
    label: 'Controle de Tablets',
    href: '/dashboard?tab=tablets',
    icon: Tablet,
    roles: ['SECRETARIA'],
  },

  // 4. PROFESSORA
  {
    label: 'Chamada & Triagem',
    href: '/dashboard?tab=chamada',
    icon: CheckCircle,
    roles: ['PROFESSORA'],
  },
  {
    label: 'Check-out com QR Code',
    href: '/dashboard?tab=checkout-sala',
    icon: QrCode,
    roles: ['PROFESSORA'],
  },
  {
    label: 'Fotos com Consentimento',
    href: '/dashboard?tab=fotos',
    icon: Camera,
    roles: ['PROFESSORA'],
  },

  // 5. RESPONSAVEL
  {
    label: 'Mural & Avisos',
    href: '/dashboard?tab=mural',
    icon: Image,
    roles: ['RESPONSAVEL'],
  },
  {
    label: 'Timeline de Presença',
    href: '/dashboard?tab=timeline',
    icon: Clock,
    roles: ['RESPONSAVEL'],
  },
  {
    label: 'Crachá Digital',
    href: '/dashboard?tab=cracha-digital',
    icon: QrCode,
    roles: ['RESPONSAVEL'],
  },
];

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADM_GERAL: { label: 'Administrador Geral', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  ADM_CEI: { label: 'Administrador CEI', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  DIRETORA: { label: 'Diretora / Coordenação', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  SECRETARIA: { label: 'Secretaria Escolar', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  PROFESSORA: { label: 'Professora de Sala', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  RESPONSAVEL: { label: 'Responsável pelo Aluno', color: 'bg-amber-100 text-amber-800 border-amber-200' },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthTokenFromCookies();

  if (!token) {
    redirect('/login');
  }

  let user: TokenPayload;
  try {
    user = verifyAccessToken(token);
  } catch (err) {
    redirect('/login');
  }

  const roleInfo = ROLE_LABELS[user.role] || { label: user.role, color: 'bg-slate-100 text-slate-800' };
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  async function handleLogout() {
    'use server';
    await clearAuthCookies();
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-[#F6F8FA]">
      {/* Sidebar Lateral Dinâmica */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 shadow-sm">
        {/* Cabeçalho da Sidebar */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-[#00838F] text-white flex items-center justify-center font-bold shadow-sm">
            <School className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-slate-800 truncate leading-tight">
              Educa Fora da Caixa
            </h2>
            <p className="text-[11px] text-[#00838F] font-medium truncate">
              Nota Fiscal Paulista
            </p>
          </div>
        </div>

        {/* Informações da Unidade / CEI Ativo */}
        <div className="px-4 py-3 mx-3 my-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Unidade Ativa
          </div>
          <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
            {user.ceiName || 'Global Multi-CEI'}
          </div>
        </div>

        {/* Menu de Navegação Específico do Perfil */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Módulos Permitidos
          </div>
          {visibleNav.map((item, index) => {
            const Icon = item.icon;
            return (
              <a
                key={index}
                href={item.href}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#00838F] transition-colors" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar com Usuário e Logout */}
        <div className="p-3 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00838F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {user.email || user.cpf || 'Usuário'}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors text-xs font-medium flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair da Conta
            </button>
          </form>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Superior */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Módulo Operacional:</span>
            <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
              {user.ceiName ? `CEI: ${user.ceiName}` : 'Painel Geral Multi-Tenant'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800">{user.name}</div>
              <div className="text-[10px] text-slate-400">Sessão Segura JWT</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Área de Visualização */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
