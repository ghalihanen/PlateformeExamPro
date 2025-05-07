import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

// Connect to Neon PostgreSQL using serverless driver
const sql = neon(process.env.NEON_DATABASE_URL || "")

// Initialize database tables
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
    console.log("Database tables initialized")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

// Call initDb on server start
initDb()

// Authentication microservice implementation
export async function GET(request: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route.join("/")

  if (route === "me") {
    return getCurrentUser(request)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest, { params }: { params: { route: string[] } }) {
  const route = params.route.join("/")

  if (route === "login") {
    return login(request)
  } else if (route === "register") {
    return register(request)
  } else if (route === "logout") {
    return logout(request)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

// Login handler
async function login(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const users = await sql`SELECT * FROM users WHERE email = ${email}`

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const user = users[0]

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "7d",
    })

    // Return user data and token
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Register handler
async function register(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
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
    return NextResponse.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Logout handler
async function logout(request: NextRequest) {
  // In a stateless JWT approach, the client is responsible for removing the token
  // The server doesn't need to do anything special
  return NextResponse.json({ success: true })
}

// Get current user handler
async function getCurrentUser(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { userId: number }

    // Get user data
    const users = await sql`SELECT id, name, email FROM users WHERE id = ${decoded.userId}`

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
