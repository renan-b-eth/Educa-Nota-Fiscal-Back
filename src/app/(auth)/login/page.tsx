'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, School, ShieldCheck, UserCheck, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar. Verifique suas credenciais.');
      }

      // Redireciona para o dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setLogin(email);
    setPassword('Educa@2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-[#F6F8FA]">
      {/* Container Principal */}
      <div className="w-full max-w-md">
        {/* Cabeçalho da Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00838F] text-white shadow-lg shadow-teal-700/20 mb-3">
            <School className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#263238]">
            Educa Fora da Caixa
          </h1>
          <p className="text-sm font-medium text-[#00838F] mt-0.5">
            Gestão Escolar & Nota Fiscal Integrada
          </p>
          <p className="text-xs text-[#607D8B] mt-1">
            Painel Web Administrativo & API Multi-tenant
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h2 className="text-base font-semibold text-slate-800">
              Acesso ao Sistema
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" /> Conexão Segura
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                E-mail ou CPF
              </label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="ex: diretora@cas1.org.br ou CPF"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00838F] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Senha
                </label>
                <span className="text-[11px] text-[#00838F] cursor-pointer hover:underline">
                  Esqueceu a senha?
                </span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00838F] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#00838F] hover:bg-[#00695C] text-white font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Entrar no Painel
                </>
              )}
            </button>
          </form>

          {/* Atalhos Rápidos para Teste dos Perfis */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Acesso Rápido para Demonstração (Seed):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('adm.geral@educaforadacaixa.com.br')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Adm Geral</div>
                <div className="text-slate-500 truncate">Educa Fora Caixa</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('diretora@cas1.org.br')}
                className="text-left p-2 rounded-lg bg-teal-50/60 hover:bg-teal-50 border border-teal-200/60 transition-colors"
              >
                <div className="font-semibold text-[#00838F]">Diretora</div>
                <div className="text-slate-500 truncate">Sandra Regina</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('secretaria@cas1.org.br')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Secretaria</div>
                <div className="text-slate-500 truncate">Ana Paula</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('professora@cas1.org.br')}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="font-semibold text-slate-800">Professora</div>
                <div className="text-slate-500 truncate">Juliana Mendes</div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Senha padrão para todos os perfis: <span className="font-mono font-semibold">Educa@2026!</span>
            </p>
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>© 2026 Educa Fora da Caixa Serviços Ltda.</p>
          <p className="text-[11px] mt-0.5">Totalmente integrado ao app mobile/tablet</p>
        </div>
      </div>
    </div>
  );
}
