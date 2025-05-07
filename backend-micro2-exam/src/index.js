import express from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const app = express()
const PORT = process.env.PORT || 3003

// Connect to Neon PostgreSQL using serverless driver
const sql = neon(process.env.NEON_DATABASE_URL || "")

// Middleware
app.use(cors())
app.use(express.json())

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret")
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" })
  }
}

// Initialize database
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

    console.log("Exam database initialized")

    // Insert sample data if no exams exist
    const examsCount = await sql`SELECT COUNT(*) FROM exams`

    if (Number.parseInt(examsCount[0].count) === 0) {
      await insertSampleData()
    }
  } catch (error) {
    console.error("Error initializing exam database:", error)
  }
}

// Insert sample data
async function insertSampleData() {
  try {
    // Create a sample exam
    const examResult = await sql`
      INSERT INTO exams (title, description, duration, created_by)
      VALUES ('Introduction à JavaScript', 'Test de connaissances sur les bases de JavaScript', 60, 1)
      RETURNING id
    `

    const examId = examResult[0].id

    // Create sample questions
    const questions = [
      {
        text: "Quelle est la syntaxe correcte pour déclarer une variable en JavaScript?",
        type: "multiple-choice",
        options: JSON.stringify([
          { id: "a1", text: "var x = 5;" },
          { id: "a2", text: "variable x = 5;" },
          { id: "a3", text: "x = 5;" },
          { id: "a4", text: "int x = 5;" },
        ]),
        correct_answer: "a1",
      },
      {
        text: "Comment créer une fonction en JavaScript?",
        type: "multiple-choice",
        options: JSON.stringify([
          { id: "b1", text: "function myFunction() {}" },
          { id: "b2", text: "function:myFunction() {}" },
          { id: "b3", text: "function = myFunction() {}" },
          { id: "b4", text: "myFunction(): function {}" },
        ]),
        correct_answer: "b1",
      },
      {
        text: "Expliquez la différence entre let, const et var en JavaScript.",
        type: "essay",
        options: null,
        correct_answer: null,
      },
    ]

    for (const question of questions) {
      await sql`
        INSERT INTO questions (exam_id, text, type, options, correct_answer)
        VALUES (${examId}, ${question.text}, ${question.type}, ${question.options}, ${question.correct_answer})
      `
    }

    console.log("Sample data inserted")
  } catch (error) {
    console.error("Error inserting sample data:", error)
  }
}

// Call initDb on server start
initDb()

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Exam Service is running" })
})

// Get user's exams
app.get("/user", verifyToken, async (req, res) => {
  try {
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration, 
             COUNT(q.id) as question_count, 
             ea.status, ea.score, ea.started_at as date
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      LEFT JOIN exam_attempts ea ON e.id = ea.exam_id AND ea.user_id = ${req.userId}
      WHERE ea.id IS NOT NULL
      GROUP BY e.id, e.title, e.description, e.duration, ea.status, ea.score, ea.started_at
      ORDER BY ea.started_at DESC
    `

    res.json({ exams })
  } catch (error) {
    console.error("Get user exams error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get available exams
app.get("/available", verifyToken, async (req, res) => {
  try {
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration, 
             COUNT(q.id) as question_count, 
             e.created_at as date
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      LEFT JOIN (
        SELECT DISTINCT exam_id 
        FROM exam_attempts 
        WHERE user_id = ${req.userId} AND status = 'completed'
      ) ea ON e.id = ea.exam_id
      WHERE ea.exam_id IS NULL
      GROUP BY e.id, e.title, e.description, e.duration, e.created_at
      ORDER BY e.created_at DESC
    `

    res.json({ exams })
  } catch (error) {
    console.error("Get available exams error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get exam by ID
app.get("/:id", verifyToken, async (req, res) => {
  try {
    const examId = req.params.id

    // Get exam details
    const exams = await sql`
      SELECT e.id, e.title, e.description, e.duration
      FROM exams e
      WHERE e.id = ${examId}
    `

    if (exams.length === 0) {
      return res.status(404).json({ error: "Exam not found" })
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
      WHERE exam_id = ${examId} AND user_id = ${req.userId} AND status = 'completed'
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (attempts.length > 0) {
      // User has already completed this exam
      return res.status(400).json({ error: "Exam already completed" })
    }

    // Create or get in-progress attempt
    const inProgressAttempt = await sql`
      SELECT id
      FROM exam_attempts
      WHERE exam_id = ${examId} AND user_id = ${req.userId} AND status = 'in-progress'
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (inProgressAttempt.length === 0) {
      // Create a new attempt
      await sql`
        INSERT INTO exam_attempts (exam_id, user_id, status)
        VALUES (${examId}, ${req.userId}, 'in-progress')
      `
    }

    res.json({ exam })
  } catch (error) {
    console.error("Get exam by ID error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Submit exam
app.post("/:id/submit", verifyToken, async (req, res) => {
  try {
    const examId = req.params.id
    const { answers } = req.body

    // Get the current attempt
    const attempts = await sql`
      SELECT id
      FROM exam_attempts
      WHERE exam_id = ${examId} AND user_id = ${req.userId} AND status = 'in-progress'
      ORDER BY started_at DESC
      LIMIT  AND user_id = ${req.userId} AND status = 'in-progress'
      ORDER BY started_at DESC
      LIMIT 1
    `

    if (attempts.length === 0) {
      return res.status(400).json({ error: "No active exam attempt found" })
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

      totalPoints += question.points || 1
      if (isCorrect) {
        earnedPoints += question.points || 1
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

    res.json({
      result: {
        score,
        totalQuestions: questions.length,
        correctAnswers: questions.filter((q) => answers[q.id] === q.correct_answer).length,
      },
    })
  } catch (error) {
    console.error("Submit exam error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Exam Service running on port ${PORT}`)
})
