import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.NEON_DATABASE_URL!)

export interface User {
  id: number
  name: string
  email: string
  cin: string
  role: string
  created_at: Date
}

export interface UserWithPassword extends User {
  password: string
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`
      SELECT id, name, email, cin, role, created_at
      FROM auth.users
      WHERE id = ${id}
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    throw error
  }
}

export async function getUserByCIN(cin: string): Promise<UserWithPassword | null> {
  try {
    const users = await sql`
      SELECT id, name, email, cin, password, role, created_at
      FROM auth.users
      WHERE cin = ${cin}
    `

    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    throw error
  }
}

export async function createUser(
  name: string,
  email: string,
  cin: string,
  password: string,
  role: string,
): Promise<User> {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await sql`
      SELECT * FROM auth.users WHERE email = ${email} OR cin = ${cin}
    `

    if (existingUser.length > 0) {
      if (existingUser[0].email === email) {
        throw new Error("Cet email est déjà utilisé")
      }
      if (existingUser[0].cin === cin) {
        throw new Error("Ce numéro de CIN est déjà utilisé")
      }
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Créer l'utilisateur
    const result = await sql`
      INSERT INTO auth.users (name, email, cin, password, role)
      VALUES (${name}, ${email}, ${cin}, ${hashedPassword}, ${role})
      RETURNING id, name, email, cin, role, created_at
    `

    return result[0]
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    throw error
  }
}
