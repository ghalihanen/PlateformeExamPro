import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

// Connect to Neon PostgreSQL using serverless driver
const sql = neon(process.env.NEON_DATABASE_URL || "")

// Initialize database tables
async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS exams (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id),
        text TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        options JSONB,
        correct_answer TEXT,
        points INTEGER DEFAULT 1
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        exam_id INTEGER REFERENCES exams(id),
        user_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        score FLOAT,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        attempt_id INTEGER REFERENCES exam_attempts(id),
        question_id INTEGER REFERENCES questions(id),
        answer TEXT,
        is_correct BOOLEAN,
        points_awarded FLOAT
      )
    `

    console.log("Exam database tables initialized")
  } catch (error) {
    console.error("Error initializing exam database:", error)
  }
}

// Call initDb on server start
initDb()

// Middleware to verify JWT token
async function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { userId: number }
    return decoded.userId
  } catch (error) {
    throw new Error("Invalid token")
  }
}

// Exam microservice implementation
export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
  try {
    const userId = await verifyToken(request)
    const route = params.route.join("/")

    if (route === "user") {
      return getUserExams(userId)
    } else if (route === "available") {
      return getAvailableExams(userId)
    } else if (route.match(/^\d+$/)) {
      return getExamById(Number.parseInt(route), userId)
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 })
  } catch (error) {
    console.error("Exam GET error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
  try {
    const userId = await verifyToken(request)
    const route = params.route.join("/")

    if (route.includes("/submit")) {
      const examId = Number.parseInt(route.split("/")[0])
      return submitExam(examId, userId, request)
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 })
  } catch (error) {
    console.error("Exam POST error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// Get user's exams
async function getUserExams(userId: number) {
  try {
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration, 
             COUNT(q.id) as question_count, 
             ea.status, ea.score, ea.started_at as date
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.user_id = ${userId}
      GROUP BY e.id, e.title, e.description, e.duration, ea.status, ea.score, ea.started_at
      ORDER BY ea.started_at DESC
    `

    return NextResponse.json({ exams })
  } catch (error) {
    console.error("Get user exams error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get available exams
async function getAvailableExams(userId: number) {
  try {
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration, 
             COUNT(q.id) as question_count, 
             e.created_at as date
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.user_id = ${userId}
      WHERE ea.id IS NULL
      GROUP BY e.id, e.title, e.description, e.duration, e.created_at
      ORDER BY e.created_at DESC
    `

    return NextResponse.json({ exams })
  } catch (error) {
    console.error("Get available exams error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get exam by ID
async function getExamById(examId: number, userId: number) {
  try {
    // Get exam details
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration
      FROM exams e
      WHERE e.id = ${examId}
    `

    if (exams.length === 0) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 })
    }

    const exam = exams[0]

    // Get questions for the exam
    const questions = await sql`
      SELECT q.id, q.text, q.type, q.options
      FROM questions q
      WHERE q.exam_id = ${examId}
    `

    exam.questions = questions

    // Check if user has an attempt for this exam
    const attempts = await sql`
      SELECT id, status
      FROM exam_attempts
      WHERE exam_id = ${examId} AND user_id = ${userId}
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (attempts.length === 0) {
      // Create a new attempt
      await sql`
        INSERT INTO exam_attempts (exam_id, user_id, status)
        VALUES (${examId}, ${userId}, 'in-progress')
      `
    } else if (attempts[0].status === "completed") {
      // User has already completed this exam
      return NextResponse.json({ error: "Exam already completed" }, { status: 400 })
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error("Get exam by ID error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Submit exam
async function submitExam(examId: number, userId: number, request: NextRequest) {
  try {
    const { answers } = await request.json()

    // Get the current attempt
    const attempts = await sql`
      SELECT id
      FROM exam_attempts
      WHERE exam_id = ${examId} AND user_id = ${userId} AND status = 'in-progress'
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (attempts.length === 0) {
      return NextResponse.json({ error: "No active exam attempt found" }, { status: 400 })
    }

    const attemptId = attempts[0].id

    // Get questions and correct answers
    const questions = await sql`
      SELECT id, correct_answer, points
      FROM questions
      WHERE exam_id = ${examId}
    `

    let totalPoints = 0
    let earnedPoints = 0

    // Process each answer
    for (const question of questions) {
      const answer = answers[question.id]
      const isCorrect = answer === question.correct_answer

      // Save the answer
      await sql`
        INSERT INTO answers (attempt_id, question_id, answer, is_correct, points_awarded)
        VALUES (${attemptId}, ${question.id}, ${answer || ""}, ${isCorrect}, ${isCorrect ? question.points : 0})
      `

      totalPoints += question.points
      if (isCorrect) {
        earnedPoints += question.points
      }
    }

    // Calculate score as percentage
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

    // Update the attempt as completed
    await sql`
      UPDATE exam_attempts
      SET status = 'completed', score = ${score}, completed_at = CURRENT_TIMESTAMP
      WHERE id = ${attemptId}
    `

    return NextResponse.json({
      result: {
        score,
        totalQuestions: questions.length,
        correctAnswers: questions.filter((q) => answers[q.id] === q.correct_answer).length,
      },
    })
  } catch (error) {
    console.error("Submit exam error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
