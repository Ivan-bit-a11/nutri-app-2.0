import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Crie um projecto no Neon e cole a connection string no .env.local",
    )
  }
  return url
}

/** Cliente Drizzle (HTTP) — adequado a serverless / Next.js server components & actions */
export function getDb() {
  const sql = neon(getDatabaseUrl())
  return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof getDb>

export { schema }
