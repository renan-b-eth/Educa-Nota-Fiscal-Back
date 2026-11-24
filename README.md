# Educa Fora da Caixa — Nota Fiscal (Back-end & Painel Web)

Plataforma unificada de **API REST** e **Painel Web Administrativo** para o ecossistema **Educa Fora da Caixa – Nota Fiscal**, preparado para deploy na **Vercel** e integrado ao aplicativo móvel/tablet **`educa-nota-fiscal-app`** (Flutter, `br.com.educaforadacaixa`).

---

## 🚀 Stack Tecnológica

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) + TypeScript
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Paleta Growappy: Teal `#00838F`, Coral `#FF7043`, Dourado NFP `#FFB300`)
- **ORM & Banco:** [Prisma ORM](https://www.prisma.io/) + [PostgreSQL (Supabase)](https://supabase.com/)
- **Autenticação:** Híbrida (JWT Bearer para o App Flutter + Cookies HttpOnly/Secure para o Painel Web) com `bcryptjs` e `jsonwebtoken`
- **Validação de Dados:** [Zod](https://zod.dev/)
- **Deploy:** [Vercel](https://vercel.com/) com suporte a Transaction Pooling via PgBouncer

---

## 👥 Perfis de Acesso (RBAC Multi-Tenant)

O sistema implementa 6 papéis estritos com controle de escopo por unidade (`ceiId`):

1. **`ADM_GERAL`** *(Educa Fora da Caixa — acesso global multi-CEI)*:
   - Gestão de todas as associações/CEIs clientes, Datas Gancho da NFP, importação da planilha Excel da Receita Estadual, ranking de doadores, faturamento comissionado e exportação para Bling ERP.
2. **`ADM_CEI`** *(Administrador da Associação Mantenedora — acesso à sua unidade)*:
   - Gestão institucional do CEI, usuários da unidade, indicadores operacionais e repasses.
3. **`DIRETORA`** *(Diretoria e Coordenação do CEI)*:
   - Fila de ocorrências de entrada (até 09h), intercorrências de saúde (pós-09h), Livro de Ocorrências Digital, emissão de Autorização Excepcional de Retirada, monitor de fechamento (16h50/17h), busca ativa e relatórios gerenciais.
4. **`SECRETARIA`** *(Secretaria Escolar do CEI)*:
   - Matrículas (código EOL, fichas SME/PMSP, fichas de saúde, termos de imagem CEI/SME, Leve Leite), cadastro de responsáveis, alunos, vans escolares/transportadores, tablets, emissão de crachás/carteirinhas com QR Code (2 vias família + 1 via transporte) e contagem da cozinha das 08h40.
5. **`PROFESSORA`** *(Professora de Sala de Aula — App no Tablet)*:
   - Chamada diária com triagem (07h-07h30 / 08h), fechamento de chamada (08h10), check-out com QR Code (16h transportadores / 16h20 famílias), alertas de fechamento (16h50/17h) e envio de fotos com respeito ao consentimento de imagem.
6. **`RESPONSAVEL`** *(Responsável pelo Aluno — App Mobile)*:
   - Mural de fotos e comunicados, campanhas de Datas Gancho da NFP, timeline de entrada/saída em tempo real, crachá digital com QR Code e reporte de perda de carteirinha.

---

## 🔑 Credenciais Padrão de Teste (Seed)

Após rodar o seed, utilize a senha padrão documentada abaixo:

> **Senha padrão para todos os perfis:** `Educa@2026!`

| Perfil | E-mail de Teste | CPF de Teste | Escopo |
|---|---|---|---|
| **ADM_GERAL** | `adm.geral@educaforadacaixa.com.br` | `111.111.111-11` | Global Multi-CEI |
| **ADM_CEI** | `adm.cei@cas1.org.br` | `222.222.222-22` | CEI Caminhar com Amor I |
| **DIRETORA** | `diretora@cas1.org.br` | `333.333.333-33` | CEI Caminhar com Amor I |
| **SECRETARIA** | `secretaria@cas1.org.br` | `444.444.444-44` | CEI Caminhar com Amor I |
| **PROFESSORA** | `professora@cas1.org.br` | `555.555.555-55` | Turma Berçário II A |
| **RESPONSAVEL** | `responsavel@cas1.org.br` | `666.666.666-66` | Filho: Arthur Silva Santos |

---

## ☁️ Como Configurar e Subir o Banco no Supabase

Quando você criar o projeto no Supabase, pegue a connection string do banco e execute **apenas 3 comandos**:

```bash
# 1. Gerar os tipos do cliente Prisma
npx prisma generate

# 2. Criar as tabelas no PostgreSQL do Supabase via migrações
npx prisma migrate dev --name init_database

# 3. Popular o banco com a organização Educa Fora da Caixa, o CEI e os 6 usuários de teste
npx prisma db seed
```

---

## 🌐 Variáveis de Ambiente para a Vercel

Ao importar este repositório na **Vercel** (`Settings` -> `Environment Variables`), configure:

| Variável | Descrição / Exemplo |
|---|---|
| `DATABASE_URL` | String de conexão com **Transaction Pooler / PgBouncer** (Porta `6543`), terminando com `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | String de conexão **direta** do Supabase (Porta `5432`) usada para executar DDL e migrações |
| `JWT_SECRET` | Chave secreta segura para os Access Tokens (ex: `openssl rand -base64 32`) |
| `JWT_REFRESH_SECRET` | Chave secreta segura para os Refresh Tokens |
| `NEXT_PUBLIC_APP_URL` | URL de produção da Vercel (ex: `https://educa-nota-fiscal.vercel.app`) |
| `ALLOWED_ORIGINS` | Origens autorizadas para CORS (ex: `*` ou a lista de domínios) |
| `SUPABASE_URL` | *(Opcional)* URL da API do Supabase para Storage de fotos e crachás |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Opcional)* Chave de serviço do Supabase |

---

## 📱 Integração com o Flutter (`educa-nota-fiscal-app`)

Consulte o arquivo [API_CONTRACT.md](./API_CONTRACT.md) para todos os endpoints, DTOs e contratos de JSON consumidos pelo aplicativo mobile.
