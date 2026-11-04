/**
 * LEGADO — este projecto usa Neon + Drizzle.
 * Não importe este módulo. Use getDb() de @/lib/db e getSession() de @/lib/auth/session.
 */
export async function createClient(): Promise<never> {
  throw new Error(
    "Supabase foi removido. Configure DATABASE_URL (Neon) no .env.local e use getDb() / Auth JWT.",
  )
}