import { neon } from "@neondatabase/serverless"

// Fonction d'initialisation de la base de données pour le microservice Auth
export async function initAuthDb() {
  const sql = neon(process.env.NEON_DATABASE_URL!)

  try {
    // Vérifier si le schéma existe, sinon le créer
    await sql`CREATE SCHEMA IF NOT EXISTS auth`

    // Créer les tables du schéma auth
    await sql`
      -- Table des utilisateurs
      CREATE TABLE IF NOT EXISTS auth.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        cin VARCHAR(8) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Table de relation enseignant-étudiant
      CREATE TABLE IF NOT EXISTS auth.teacher_student (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, student_id)
      );
    `

    console.log("Base de données Auth initialisée avec succès")
    return true
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données Auth:", error)
    throw error
  }
}
