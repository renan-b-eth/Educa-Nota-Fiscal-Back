import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Educa Fora da Caixa — Gestão Integrada & Nota Fiscal',
  description: 'Back-end e Painel Administrativo Integrado para CEIs, Creches e Campanhas da Nota Fiscal Paulista',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F6F8FA] text-[#263238] antialiased">
        {children}
      </body>
    </html>
  );
}
