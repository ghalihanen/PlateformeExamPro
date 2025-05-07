import express from "express"
import cors from "cors"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const app = express()
const PORT = process.env.PORT || 3002

// Connect to Neon PostgreSQL using serverless driver
const sql = neon(process.env.NEON_DATABASE_URL || "")

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("Auth database initialized")
  } catch (error) {
    console.error("Error initializing auth database:", error)
  }
}

// Call initDb on server start
initDb()

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Auth Service is running" })
})

// Register endpoint
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" })
    }

    // Check if user already exists
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUsers = await sql`
      INSERT INTO users (name, email, password) 
      VALUES (${name}, ${email}, ${hashedPassword}) 
      RETURNING id, name, email
    `

    const newUser = newUsers[0]

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "7d",
    })

    // Return user data and token
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Login endpoint
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Find user by email
    const users = await sql`SELECT * FROM users WHERE email = ${email}`

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const user = users[0]

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "7d",
    })

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get current user endpoint
app.get("/me", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret")

    // Get user data
    const users = await sql`SELECT id, name, email FROM users WHERE id = ${decoded.userId}`

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = users[0]

    res.json({ user })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(401).json({ error: "Unauthorized" })
  }
})

// Logout endpoint
app.post("/logout", (req, res) => {
  // In a stateless JWT approach, the client is responsible for removing the token
  res.json({ success: true })
})

// Start server
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`)
})
