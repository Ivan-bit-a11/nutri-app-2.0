# Server Architecture

- `core/`: cross-cutting primitives (auth guards, validation, error/result contracts).
- `schemas/`: Zod schemas for all mutation boundaries.
- `repositories/`: persistence-only modules (Supabase table access, no business rules).
- `services/`: business logic orchestration (tenant checks, role checks, mutation workflows).

Key decision:
- Tenant safety is enforced twice: at service level (ownership checks before mutation) and at database level (`ensure_patient_belongs_to_nutritionist` trigger from `scripts/002_backend_hardening.sql`).
- Template version history uses snapshot records (`diet_template_versions.snapshot`) so editor structure can evolve without destructive schema rewrites.
