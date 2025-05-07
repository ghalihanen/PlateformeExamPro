import { neon } from "@neondatabase/serverless"

// Fonction d'initialisation de la base de données pour le microservice Exam
export async function initExamDb() {
  const sql = neon(process.env.NEON_DATABASE_URL!)

  try {
    // Vérifier si le schéma existe, sinon le créer
    await sql`CREATE SCHEMA IF NOT EXISTS exam`

    // Créer les tables du schéma exam
    await sql`
      -- Table des examens
      CREATE TABLE IF NOT EXISTS exam.exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        category VARCHAR(100),
        created_by INTEGER NOT NULL,
        is_published BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Table des questions
      CREATE TABLE IF NOT EXISTS exam.questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(50) NOT NULL,
        points INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Table des options de réponse
      CREATE TABLE IF NOT EXISTS exam.answer_options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT false
      );
      
      -- Table des assignations d'examen
      CREATE TABLE IF NOT EXISTS exam.exam_assignments (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP
      );
      
      -- Table des résultats d'examen
      CREATE TABLE IF NOT EXISTS exam.exam_results (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        score NUMERIC NOT NULL,
        max_score NUMERIC NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Table des réponses des étudiants
      CREATE TABLE IF NOT EXISTS exam.student_answers (
        id SERIAL PRIMARY KEY,
        result_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        answer_option_id INTEGER,
        text_answer TEXT,
        is_correct BOOLEAN,
        points_awarded NUMERIC DEFAULT 0
      );
    `

    console.log("Base de données Exam initialisée avec succès")
    return true
  } catch (error) {
    console.error("Erreur lors de l'initialisation de la base de données Exam:", error)
    throw error
  }
}
