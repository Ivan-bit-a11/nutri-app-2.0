# NutriFlow — Plataforma de Nutrição Clínica

**Copyright © Ivan Mbalame**

Sistema multi-perfil para nutricionistas e clientes: gestão clínica, pedidos de consulta, pagamentos manuais (transferência + SMS colado), planos alimentares em PDF.

## Perfis

| Perfil | Como entra | Funções principais |
|--------|------------|--------------------|
| **Super Admin** | Login (criado manualmente na BD) | Cadastra nutricionistas e clientes |
| **Nutricionista** | Apenas login (conta criada pelo Super Admin) | Pacientes, planos, avaliações, ver/confirmar pagamentos e aprovar consultas |
| **Cliente** | Registo público ou criado pelo Super Admin | Solicitar consulta (mesmo sem pagar), enviar comprovativo (colar SMS), ver e descarregar planos em PDF |

## Fluxo de pagamento e consulta

1. Cliente escolhe o nutricionista e **solicita consulta** (estado: `pending`).
2. Vê o **número de pagamento** e as instruções do nutricionista.
3. Faz a **transferência fora da app** (M-Pesa, banco, etc.).
4. **Copia o SMS** de confirmação e cola na área Pagamentos → envia ao nutricionista.
5. Nutricionista vê o comprovativo em **Dashboard → Pagamentos**, confirma ou rejeita.
6. Só depois do pagamento confirmado o nutricionista **aprova** a consulta.

## Assistente de IA

**Desactivado** nesta versão (sem chaves nem custos). Planos e templates são manuais.
Se no futuro quiser IA gratuita (ex.: Groq), ver `docs/IA-OPCIONAL.md`.

## Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui
- **Backend / BD:** Supabase (PostgreSQL + Auth + RLS)
- **i18n:** Português (pt-BR) por defeito
- **Deploy alvo:** Render (web service) + Supabase

## Base de dados (PostgreSQL)

Execute os scripts em ordem no SQL Editor do Supabase (ou `psql`):

1. `scripts/001_create_tables.sql`
2. `scripts/002_backend_hardening.sql`
3. `scripts/003_templates_module.sql`
4. `scripts/004_multi_role_payments.sql` ← roles, consultas, pagamentos
5. `scripts/005_plan_delivery.sql` ← envio individual de planos ao cliente

### Criar o primeiro Super Admin

1. Crie um utilizador no Auth do Supabase (ou registe-se temporariamente).
2. No SQL:

```sql
update public.profiles
set role = 'super_admin', full_name = 'Ivan Mbalame'
where email = 'seu-email@exemplo.com';
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # obrigatório para Super Admin criar contas
NEXT_PUBLIC_SITE_URL=https://seu-app.onrender.com
```

## Desenvolvimento local

```bash
npm ci
cp .env.example .env.local
# preencha as variáveis
npm run dev
```

## Entrega individual de planos

1. Cliente regista-se e solicita consulta; envia comprovativo (SMS).
2. Nutricionista **confirma o pagamento** em Dashboard → Pagamentos.
3. Na **ficha do paciente**, liga a conta do cliente pelo **email** (Conta do cliente).
4. Cria o **plano alimentar** associado a esse paciente.
5. No detalhe do plano, clica **Enviar ao cliente**.
6. Só essa conta vê o plano em `/cliente/planos` e descarrega o PDF.

Script SQL adicional: `scripts/005_plan_delivery.sql`

## Deploy no Render

1. **Supabase:** projecto criado, scripts SQL aplicados, Auth com email enabled.
2. **Render → New → Web Service**
   - Connect repositório Git (ou upload)
   - Runtime: **Node**
   - Build command: `npm ci && npm run build`
   - Start command: `npm start`
   - Instance: free ou paid
3. **Environment** no Render: as mesmas variáveis do `.env.example`.
   - `NEXT_PUBLIC_SITE_URL` = URL pública do serviço Render
4. No Supabase Auth → URL Configuration:
   - Site URL = URL do Render
   - Redirect URLs = `https://seu-app.onrender.com/**`
5. Deploy. Após o primeiro deploy, entre com a conta Super Admin em `/admin`.

### Notas Render + Next.js

- Use Node 20+.
- Se o build falhar por memória no free tier, reduza dependências ou use plano pago.
- Supabase continua a ser a BD (PostgreSQL); o Render só serve a app Next.js.

## Estrutura relevante (novidades)

```
app/admin/                 → Painel Super Admin
app/cliente/               → Portal do cliente (consultas, pagamentos, planos PDF)
app/(dashboard)/dashboard/pagamentos/  → Nutricionista: pagamentos e pedidos
lib/actions/admin.ts
lib/actions/consultations.ts
lib/supabase/admin.ts      → Service role
scripts/004_multi_role_payments.sql
```

## Licença / copyright

© Ivan Mbalame. Todos os direitos reservados.
