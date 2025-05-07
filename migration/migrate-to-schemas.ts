import { neon } from "@neondatabase/serverless"

// Fonction principale pour exécuter la migration
export async function migrateToSchemas() {
  const sql = neon(process.env.NEON_DATABASE_URL!)

  try {
    // Commencer une transaction
    await sql`BEGIN`

    console.log("Migration des tables vers les schémas spécifiques...")

    // 1. Migration des tables d'authentification
    console.log("Migration des tables d'authentification vers le schéma 'auth'...")

    // Créer les tables dans le schéma auth
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

    // Copier les données des tables existantes si elles existent
    const usersExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    )`

    if (usersExist[0].exists) {
      await sql`INSERT INTO auth.users SELECT * FROM public.users`
      console.log("Données de la table users migrées avec succès")
    }

    const teacherStudentExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'teacher_student'
    )`

    if (teacherStudentExist[0].exists) {
      await sql`INSERT INTO auth.teacher_student SELECT * FROM public.teacher_student`
      console.log("Données de la table teacher_student migrées avec succès")
    }

    // 2. Migration des tables d'examen
    console.log("Migration des tables d'examen vers le schéma 'exam'...")

    // Créer les tables dans le schéma exam
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

    // Copier les données des tables existantes
    const examsExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'exams'
    )`

    if (examsExist[0].exists) {
      await sql`INSERT INTO exam.exams SELECT * FROM public.exams`
      console.log("Données de la table exams migrées avec succès")
    }

    const questionsExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'questions'
    )`

    if (questionsExist[0].exists) {
      // Adapter les noms de colonnes si nécessaire
      await sql`
        INSERT INTO exam.questions (id, exam_id, question_text, question_type, points, created_at)
        SELECT id, exam_id, 
               CASE WHEN question_text IS NOT NULL THEN question_text ELSE text END,
               CASE WHEN question_type IS NOT NULL THEN question_type ELSE type END,
               points,
               CURRENT_TIMESTAMP
        FROM public.questions
      `
      console.log("Données de la table questions migrées avec succès")
    }

    const answerOptionsExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'answer_options'
    )`

    if (answerOptionsExist[0].exists) {
      await sql`INSERT INTO exam.answer_options SELECT * FROM public.answer_options`
      console.log("Données de la table answer_options migrées avec succès")
    }

    const examAssignmentsExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'exam_assignments'
    )`

    if (examAssignmentsExist[0].exists) {
      await sql`INSERT INTO exam.exam_assignments SELECT * FROM public.exam_assignments`
      console.log("Données de la table exam_assignments migrées avec succès")
    }

    const examResultsExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'exam_results'
    )`

    if (examResultsExist[0].exists) {
      await sql`INSERT INTO exam.exam_results SELECT * FROM public.exam_results`
      console.log("Données de la table exam_results migrées avec succès")
    }

    const studentAnswersExist = await sql`SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'student_answers'
    )`

    if (studentAnswersExist[0].exists) {
      await sql`INSERT INTO exam.student_answers SELECT * FROM public.student_answers`
      console.log("Données de la table student_answers migrées avec succès")
    }

    // Valider la transaction
    await sql`COMMIT`
    console.log("Migration terminée avec succès!")

    return { success: true, message: "Migration terminée avec succès!" }
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await sql`ROLLBACK`
    console.error("Erreur lors de la migration:", error)
    return { success: false, message: "Erreur lors de la migration", error }
  }
}
