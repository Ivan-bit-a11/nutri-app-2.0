# NutriFlow — Como correr com Neon e publicar no Render

## Migração para Neon (PostgreSQL)

Este projecto **já não depende do Supabase Auth**.  
Usa **Neon** como base de dados e autenticação própria (email + password + cookie JWT).

### 1. Criar projecto no Neon

1. Vá a https://console.neon.tech e crie uma conta / projecto.
2. Escolha região próxima (ex.: `eu-central-1` ou `aws-eu-west`).
3. Em **Dashboard → Connection Details** copie a **connection string** (use a versão *pooled* / serverless se disponível).
   Formato:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Aplicar o schema

No **SQL Editor** do Neon (ou via `psql` / neonctl):

1. Abra o ficheiro `scripts/neon/001_schema.sql`
2. Cole e execute **tudo** de uma vez.

### 3. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
DATABASE_URL=postgresql://...sua-string-neon...
AUTH_SECRET=cole_aqui_um_segredo_gerado_com_openssl_rand_-base64_32
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Gere o secret:

```bash
openssl rand -base64 32
```

### 4. Instalar e criar Super Admin

```bash
npm install
DATABASE_URL="sua-string" node scripts/neon/seed-admin.mjs
```

Por defeito cria:
- email: `admin@nutriflow.local`
- password: `Admin123!`

Pode sobrescrever:

```bash
ADMIN_EMAIL=eu@exemplo.com ADMIN_PASSWORD='MinhaPass!' DATABASE_URL="..." node scripts/neon/seed-admin.mjs
```

### 5. Correr localmente

```bash
npm run dev
```

Abra http://localhost:3000 e faça login com o Super Admin.

---

## Render

1. **New → Web Service** → ligue o repositório GitHub
2. **Root Directory:** vazio
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. **Environment:**
   - `DATABASE_URL` = connection string do Neon
   - `AUTH_SECRET` = mesmo secret do `.env.local`
   - `NEXT_PUBLIC_SITE_URL` = URL pública do Render (ex. `https://nutriflow.onrender.com`)

---

## O que mudou vs Supabase

| Antes (Supabase)              | Agora (Neon)                                      |
|-------------------------------|---------------------------------------------------|
| Auth + Postgres + RLS         | Postgres no Neon + Auth próprio (JWT cookie)      |
| `auth.users`                  | tabela `public.users` com `password_hash`         |
| `@supabase/ssr` / service role| Drizzle ORM + `@neondatabase/serverless`          |
| Políticas RLS                 | Autorização na aplicação (`requireRole`)          |

### Ficheiros novos / principais

- `scripts/neon/001_schema.sql` — schema completo
- `scripts/neon/seed-admin.mjs` — cria super admin
- `lib/db/` — Drizzle + Neon
- `lib/auth/` — password (bcrypt) + sessão JWT
- `lib/actions/auth.ts` — login / register / logout reescritos
- `server/core/auth.ts` — `requireViewer` / `requireRole` sobre a nova sessão

### Trabalho ainda em curso (próximos passos)

Muitos *repositories* e *server actions* ainda usavam o cliente Supabase (`supabase.from(...)`).  
A autenticação e a BD já estão no Neon; as queries de pacientes, planos, consultas e pagamentos precisam de ser migradas para Drizzle (padrão igual ao de `lib/actions/auth.ts`).

Ordem sugerida:
1. `server/repositories/patients.repository.ts`
2. `lib/actions/patients.ts` + `consultations.ts` + `plan-delivery.ts`
3. `lib/actions/admin.ts`
4. Remover pasta `lib/supabase/` e dependências antigas quando tudo estiver migrado.

Se quiser, no próximo passo posso migrar os repositories de pacientes e consultas para Drizzle para o fluxo principal ficar 100% funcional.
