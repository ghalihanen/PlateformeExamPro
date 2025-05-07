import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export interface Exam {
  id: number
  title: string
  description: string | null
  duration: number
  category: string | null
  created_by: number
  is_published: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Question {
  id: number
  exam_id: number
  question_text: string
  question_type: string
  points: number
  created_at: Date
  options?: AnswerOption[]
}

export interface AnswerOption {
  id: number
  question_id: number
  option_text: string
  is_correct: boolean
}

export async function getExamsByTeacher(teacherId: number): Promise<Exam[]> {
  try {
    const exams = await sql`
      SELECT id, title, description, duration, category, is_published, is_active, created_at, updated_at
      FROM exam.exams
      WHERE created_by = ${teacherId}
      ORDER BY created_at DESC
    `
    return exams
  } catch (error) {
    console.error("Erreur lors de la récupération des examens:", error)
    throw error
  }
}

export async function getExamById(examId: number): Promise<Exam | null> {
  try {
    // Récupérer les informations de l'examen
    const exams = await sql`
      SELECT id, title, description, duration, category, created_by, is_published, is_active, created_at, updated_at
      FROM exam.exams
      WHERE id = ${examId}
    `

    if (exams.length === 0) {
      return null
    }

    return exams[0]
  } catch (error) {
    console.error("Erreur lors de la récupération de l'examen:", error)
    throw error
  }
}

export async function getExamWithQuestions(examId: number): Promise<(Exam & { questions: Question[] }) | null> {
  try {
    // Récupérer les informations de l'examen
    const exams = await sql`
      SELECT id, title, description, duration, category, created_by, is_published, is_active, created_at, updated_at
      FROM exam.exams
      WHERE id = ${examId}
    `

    if (exams.length === 0) {
      return null
    }

    const exam = exams[0]

    // Récupérer les questions de l'examen
    const questions = await sql`
      SELECT id, exam_id, question_text, question_type, points, created_at
      FROM exam.questions
      WHERE exam_id = ${examId}
      ORDER BY id
    `

    // Pour chaque question, récupérer les options de réponse
    for (const question of questions) {
      const options = await sql`
        SELECT id, question_id, option_text, is_correct
        FROM exam.answer_options
        WHERE question_id = ${question.id}
        ORDER BY id
      `
      question.options = options
    }

    return { ...exam, questions }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'examen:", error)
    throw error
  }
}

export async function createExam(examData: {
  title: string
  description: string
  duration: number
  category: string
  created_by: number
  questions: Array<{
    question_text: string
    question_type: string
    points: number
    options: Array<{
      text: string
      is_correct: boolean
    }>
  }>
}): Promise<Exam> {
  try {
    // Créer l'examen
    const exams = await sql`
      INSERT INTO exam.exams (title, description, duration, category, created_by)
      VALUES (${examData.title}, ${examData.description}, ${examData.duration}, ${examData.category}, ${examData.created_by})
      RETURNING id, title, description, duration, category, created_by, is_published, is_active, created_at, updated_at
    `

    const exam = exams[0]

    // Créer les questions
    for (const questionData of examData.questions) {
      const questions = await sql`
        INSERT INTO exam.questions (exam_id, question_text, question_type, points)
        VALUES (${exam.id}, ${questionData.question_text}, ${questionData.question_type}, ${questionData.points})
        RETURNING id
      `

      const questionId = questions[0].id

      // Créer les options de réponse pour cette question
      if (questionData.options && questionData.options.length > 0) {
        for (const optionData of questionData.options) {
          await sql`
            INSERT INTO exam.answer_options (question_id, option_text, is_correct)
            VALUES (${questionId}, ${optionData.text}, ${optionData.is_correct})
          `
        }
      }
    }

    return exam
  } catch (error) {
    console.error("Erreur lors de la création de l'examen:", error)
    throw error
  }
}
