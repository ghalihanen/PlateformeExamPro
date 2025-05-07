"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Fonction d'inscription
export async function register(name: string, email: string, cin: string, password: string, role: string) {
  try {
    // Vérifier si l'utilisateur existe déjà (email ou CIN)
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email} OR cin = ${cin}
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
      INSERT INTO users (name, email, cin, password, role)
      VALUES (${name}, ${email}, ${cin}, ${hashedPassword}, ${role})
      RETURNING id, name, email, cin, role
    `

    return result[0]
  } catch (error: any) {
    console.error("Erreur lors de l'inscription:", error)
    throw new Error(error.message || "Erreur lors de l'inscription")
  }
}

// Fonction de connexion
export async function login(cin: string, password: string) {
  try {
    // Rechercher l'utilisateur par CIN
    const users = await sql`
      SELECT * FROM users WHERE cin = ${cin}
    `

    if (users.length === 0) {
      throw new Error("CIN ou mot de passe incorrect")
    }

    const user = users[0]

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      throw new Error("CIN ou mot de passe incorrect")
    }

    // Créer le token JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "1d" })

    // Stocker le token dans un cookie
    cookies().set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 jour
      path: "/",
    })

    // Retourner les informations utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error)
    throw new Error(error.message || "Erreur lors de la connexion")
  }
}

// Fonction de déconnexion
export async function logout() {
  cookies().delete("auth_token")
  return { success: true }
}

// Fonction pour obtenir l'utilisateur actuel
export async function getCurrentUser() {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return null
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number }

    // Récupérer les informations utilisateur
    const users = await sql`
      SELECT id, name, email, cin, role FROM users WHERE id = ${decoded.id}
    `

    if (users.length === 0) {
      return null
    }

    return users[0]
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }
}
