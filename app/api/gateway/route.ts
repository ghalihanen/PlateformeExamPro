import { type NextRequest, NextResponse } from "next/server"

// API Gateway implementation
export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/gateway", "")

  // Route to appropriate microservice based on path
  if (path.startsWith("/auth")) {
    return handleAuthRequest(request, path)
  } else if (path.startsWith("/exams")) {
    return handleExamRequest(request, path)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/gateway", "")

  // Route to appropriate microservice based on path
  if (path.startsWith("/auth")) {
    return handleAuthRequest(request, path)
  } else if (path.startsWith("/exams")) {
    return handleExamRequest(request, path)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

// Forward request to Auth microservice
async function handleAuthRequest(request: NextRequest, path: string) {
  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001"
    const url = `${authServiceUrl}${path}`

    const headers = new Headers(request.headers)

    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Auth service error:", error)
    return NextResponse.json({ error: "Auth service unavailable" }, { status: 503 })
  }
}

// Forward request to Exam microservice
async function handleExamRequest(request: NextRequest, path: string) {
  try {
    const examServiceUrl = process.env.EXAM_SERVICE_URL || "http://localhost:3002"
    const url = `${examServiceUrl}${path}`

    const headers = new Headers(request.headers)

    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined,
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Exam service error:", error)
    return NextResponse.json({ error: "Exam service unavailable" }, { status: 503 })
  }
}
