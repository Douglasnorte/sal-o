# Salão — Agenda

Sistema de agenda para salão de beleza feminino: calendário multi-profissional, cadastro de
clientes e serviços, controle de status de atendimento e módulo financeiro (faturamento,
comissões e formas de pagamento).

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite (via `better-sqlite3` driver adapter)
- NextAuth (Credentials) para login
- Tailwind CSS

## Como rodar

```bash
npm install
cp .env.example .env   # ajuste os valores se necessário
npx prisma migrate dev
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

## Estrutura

```
prisma/schema.prisma        modelo de dados
src/lib/actions/*           server actions (mutações)
src/app/(dashboard)/*       páginas autenticadas (agenda, clientes, serviços, profissionais, financeiro)
src/app/login               tela de login
```
