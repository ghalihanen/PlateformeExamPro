"use server"

import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getCurrentUser } from "./auth"

const sql = neon(process.env.DATABASE_URL!)

// Récupérer les examens créés par un enseignant
export async function getExamsByTeacher(teacherId: number) {
  try {
    const exams = await sql`
      SELECT id, title, description, duration, category, is_published, is_active, created_at, updated_at
      FROM exams
      WHERE created_by = ${teacherId}
      ORDER BY created_at DESC
    `
    return exams
  } catch (error) {
    console.error("Erreur lors de la récupération des examens:", error)
    return []
  }
}

// Récupérer un examen par son ID
export async function getExamById(examId: number) {
  try {
    // Récupérer les informations de l'examen
    const exams = await sql`
      SELECT id, title, description, duration, category, created_by, is_published, is_active, created_at, updated_at
      FROM exams
      WHERE id = ${examId}
    `

    if (exams.length === 0) {
      return null
    }

    const exam = exams[0]

    // Récupérer les questions de l'examen
    const questions = await sql`
      SELECT id, question_text, question_type, points
      FROM questions
      WHERE exam_id = ${examId}
      ORDER BY id
    `

    // Pour chaque question, récupérer les options de réponse
    for (const question of questions) {
      const options = await sql`
        SELECT id, option_text, is_correct
        FROM answer_options
        WHERE question_id = ${question.id}
        ORDER BY id
      `
      question.options = options
    }

    return { ...exam, questions }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'examen:", error)
    return null
  }
}

// Créer un nouvel examen
export async function createExam(examData: {
  title: string
  description: string
  duration: number
  category: string
  questions: Array<{
    question_text: string
    question_type: string
    points: number
    options: Array<{
      text: string
      is_correct: boolean
    }>
  }>
}) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("Non authentifié")
    }

    if (user.role !== "enseignant" && user.role !== "admin") {
      throw new Error("Non autorisé")
    }

    // Créer l'examen
    const exams = await sql`
      INSERT INTO exams (title, description, duration, category, created_by)
      VALUES (${examData.title}, ${examData.description}, ${examData.duration}, ${examData.category}, ${user.id})
      RETURNING id, title, description, duration, category, created_by, is_published, is_active, created_at, updated_at
    `

    const exam = exams[0]

    // Créer les questions
    for (const questionData of examData.questions) {
      const questions = await sql`
        INSERT INTO questions (exam_id, question_text, question_type, points)
        VALUES (${exam.id}, ${questionData.question_text}, ${questionData.question_type}, ${questionData.points})
        RETURNING id
      `

      const questionId = questions[0].id

      // Créer les options de réponse pour cette question
      if (questionData.options && questionData.options.length > 0) {
        for (const optionData of questionData.options) {
          await sql`
            INSERT INTO answer_options (question_id, option_text, is_correct)
            VALUES (${questionId}, ${optionData.text}, ${optionData.is_correct})
          `
        }
      }
    }

    return exam
  } catch (error: any) {
    console.error("Erreur lors de la création de l'examen:", error)
    throw new Error(error.message || "Erreur lors de la création de l'examen")
  }
}

// Function to get user exams
export async function getUserExams() {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return []
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { id: number }

    const exams = await sql`
      SELECT id, title, description, duration, date FROM exams WHERE user_id = ${decoded.id}
    `
    return exams
  } catch (error) {
    console.error("Error fetching user exams:", error)
    return []
  }
}

// Function to get available exams
export async function getAvailableExams() {
  try {
    // Fetch available exams from the database
    const exams = await sql`
      SELECT id, title, description, duration, date FROM exams WHERE is_available = true
    `
    return exams
  } catch (error) {
    console.error("Error fetching available exams:", error)
    return []
  }
}

// Function to submit exam answers
export async function submitExamAnswers(examId: string, answers: any) {
  try {
    // Process and store the submitted answers
    console.log(`Submitting answers for exam ${examId}:`, answers)

    // Simulate storing the answers in the database
    await new Promise((resolve) => setTimeout(resolve, 500))

    return { success: true }
  } catch (error) {
    console.error("Error submitting exam answers:", error)
    return { success: false, error: "Failed to submit answers" }
  }
}
