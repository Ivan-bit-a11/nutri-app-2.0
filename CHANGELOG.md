## v1.2.1 — IA desactivada (Ivan Mbalame)

- Menu e API do AI Copilot desactivados (sem OPENAI_API_KEY)
- Documentação opcional em `docs/IA-OPCIONAL.md` (Groq gratuito)

# Changelog — NutriFlow

## v1.2.0 — Entrega individual de planos (Ivan Mbalame)

- Ligação paciente ↔ conta de cliente por email (ficha do paciente)
- Botão **Enviar ao cliente** no plano (só após pagamento confirmado)
- Cliente vê apenas planos publicados para a sua conta; PDF individual
- Script `005_plan_delivery.sql`

## v1.1.0 — Multi-perfil, pagamentos e PT (Ivan Mbalame)

### Adicionado
- Painel **Super Admin** (`/admin`): cadastrar nutricionistas e clientes, activar/desactivar contas.
- Portal do **Cliente** (`/cliente`): início, solicitar consulta, pagamentos (colar SMS), planos com download PDF.
- Área do **Nutricionista** → Pagamentos: ver quem pagou / quem pediu e ainda não pagou; confirmar comprovativos; aprovar consulta só após pagamento.
- Schema PostgreSQL `004_multi_role_payments.sql`: roles, consultation_requests, payments, RLS.
- Registo público **apenas para clientes**; nutricionistas só via Super Admin.
- Copyright e branding: **Ivan Mbalame**.
- Documentação de deploy no **Render** + Supabase.
- Idioma por defeito: **português (pt-BR)**.

### Fluxo de negócio
Cliente solicita consulta (pending) → transfere fora da app → cola SMS → nutricionista confirma → aprova consulta → atribui plano → cliente descarrega PDF.
