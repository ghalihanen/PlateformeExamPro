"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "./auth"

const sql = neon(process.env.DATABASE_URL!)

// Récupérer les examens assignés à un étudiant
export async function getAssignedExams(studentId: number) {
  try {
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration, e.category, ea.due_date
      FROM exams e
      JOIN exam_assignments ea ON e.id = ea.exam_id
      WHERE ea.student_id = ${studentId}
      AND ea.is_completed = false
      AND e.is_published = true
      AND e.is_active = true
      ORDER BY ea.due_date ASC NULLS LAST
    `
    return exams
  } catch (error) {
    console.error("Erreur lors de la récupération des examens assignés:", error)
    return []
  }
}

// Récupérer les examens complétés par un étudiant
export async function getCompletedExams(studentId: number) {
  try {
    const exams = await sql`
      SELECT er.id, e.title, er.score, er.max_score, er.completed_at
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = ${studentId}
      ORDER BY er.completed_at DESC
    `
    return exams
  } catch (error) {
    console.error("Erreur lors de la récupération des examens complétés:", error)
    return []
  }
}

// Récupérer les détails d'un résultat d'examen
export async function getExamResult(resultId: number) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("Non authentifié")
    }

    // Récupérer le résultat
    const results = await sql`
      SELECT er.*, e.title, e.description, e.duration
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.id = ${resultId}
      AND (
        er.student_id = ${user.id}
        OR e.created_by = ${user.id}
        OR ${user.role} = 'admin'
      )
    `

    if (results.length === 0) {
      return null
    }

    const result = results[0]

    // Récupérer les réponses de l'étudiant
    const answers = await sql`
      SELECT sa.*, q.question_text, q.question_type, q.points,
             ao.option_text as selected_option_text
      FROM student_answers sa
      JOIN questions q ON sa.question_id = q.id
      LEFT JOIN answer_options ao ON sa.answer_option_id = ao.id
      WHERE sa.result_id = ${resultId}
      ORDER BY q.id
    `

    return { ...result, answers }
  } catch (error) {
    console.error("Erreur lors de la récupération du résultat d'examen:", error)
    return null
  }
}
