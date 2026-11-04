/**
 * Cria o primeiro Super Admin no Neon.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/neon/seed-admin.mjs
 *
 * Ou com variáveis no ambiente / .env.local
 */

import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const email = process.env.ADMIN_EMAIL || "ivanmbalame@gmail.com"
const password = process.env.ADMIN_PASSWORD || "879855731!"
const fullName = process.env.ADMIN_NAME || "Super Admin"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error("Defina DATABASE_URL")
    process.exit(1)
  }

  const sql = neon(url)
  const hash = await bcrypt.hash(password, 12)

  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  if (existing.length > 0) {
    console.log(`Utilizador ${email} já existe (id=${existing[0].id}). A actualizar role para super_admin…`)
    await sql`
      UPDATE profiles
      SET role = 'super_admin', is_active = true, full_name = ${fullName}
      WHERE id = ${existing[0].id}
    `
    console.log("OK")
    return
  }

  const [user] = await sql`
    INSERT INTO users (email, password_hash, full_name)
    VALUES (${email}, ${hash}, ${fullName})
    RETURNING id
  `

  await sql`
    INSERT INTO profiles (id, full_name, email, role, is_active)
    VALUES (${user.id}, ${fullName}, ${email}, 'super_admin', true)
  `

  console.log("Super Admin criado:")
  console.log(`  email:    ${email}`)
  console.log(`  password: ${password}`)
  console.log(`  id:       ${user.id}`)
  console.log("Altere a password após o primeiro login.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
