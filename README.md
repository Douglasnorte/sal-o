# Amanda Cruz — Agenda

Sistema de agenda do salão Amanda Cruz: calendário multi-profissional, cadastro de
clientes e serviços, controle de status de atendimento e módulo financeiro (faturamento,
comissões e formas de pagamento).

## Stack

- Next.js (App Router) + TypeScript
- Prisma + Postgres/Supabase (via `pg` driver adapter)
- NextAuth (Credentials) para login
- Tailwind CSS

## Como rodar

```bash
npm install
cp .env.example .env   # preencha com as connection strings do seu projeto Supabase
npx prisma migrate deploy
npm run db:seed        # cria usuário admin + dados de exemplo
npm run dev
```

Acesse http://localhost:3000. Login de exemplo (definido em `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` no `.env`):

- **E-mail:** admin@salao.com
- **Senha:** admin123

## Funcionalidades

- **Agenda**: visão diária com uma coluna por profissional, criação de horários por clique,
  bloqueio de conflitos de horário e indicador de horário atual.
- **Clientes**: cadastro, busca e histórico de agendamentos.
- **Serviços**: nome, categoria, duração e preço, com ativação/desativação.
- **Profissionais**: cor de identificação, comissão (%) e horário de atendimento por dia da
  semana.
- **Status de atendimento**: agendado → confirmado → em atendimento → concluído (com registro
  de pagamento) / cancelado / faltou.
- **Financeiro**: faturamento por período, ticket médio, comissão por profissional,
  faturamento por forma de pagamento e por dia.
- **Agendamento público** (`/reservar`): clientes escolhem serviço, profissional, data e
  horário sem precisar de login, pagam um sinal (Pix/cartão, via Mercado Pago) e o
  agendamento só é confirmado na agenda após a aprovação do pagamento.

## Deploy (Supabase + Vercel)

1. **Supabase**: crie um projeto em [supabase.com](https://supabase.com) → Settings → Database.
   Copie duas connection strings:
   - **Connection pooling** (porta 6543, modo *Transaction*) → variável `DATABASE_URL`
   - **Direct connection** (porta 5432) → variável `DIRECT_URL` (usada só pelas migrations)
2. Rode as migrations contra o banco recém-criado (uma única vez, com `DIRECT_URL` configurada
   localmente): `npx prisma migrate deploy` e depois `npm run db:seed`.
3. **Vercel**: importe o repositório e configure as variáveis de ambiente do projeto:
   - `DATABASE_URL`, `DIRECT_URL` (do Supabase)
   - `AUTH_SECRET` (gere um valor aleatório, ex: `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (a URL pública do deploy, ex: `https://seu-app.vercel.app`)
4. Deploy. O `postinstall` do projeto já roda `prisma generate` automaticamente no build.

## Sinal via Mercado Pago

1. Crie/acesse uma conta em [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
   e crie uma aplicação.
2. Em **Suas integrações → (sua aplicação) → Credenciais de produção**, copie o **Access Token**.
3. Adicione `MERCADOPAGO_ACCESS_TOKEN` nas variáveis de ambiente (local e na Vercel — marque
   Production e Preview).
4. Não é preciso configurar o webhook manualmente no painel do Mercado Pago: a URL de
   notificação (`/api/webhooks/mercadopago`) é enviada automaticamente a cada cobrança criada.
5. O percentual do sinal é definido em `DEPOSIT_PERCENT` (`src/lib/constants.ts`), 30% por padrão.

## Estrutura

```
prisma/schema.prisma        modelo de dados
src/lib/actions/*           server actions (mutações)
src/app/(dashboard)/*       páginas autenticadas (agenda, clientes, serviços, profissionais, financeiro)
src/app/login               tela de login
```
