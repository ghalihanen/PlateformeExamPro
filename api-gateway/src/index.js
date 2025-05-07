import express from "express"
import cors from "cors"
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url}`)
  next()
})

// Routes
app.get("/", (req, res) => {
  res.json({ message: "API Gateway is running" })
})

// Proxy middleware for Auth Service
app.use(
  "/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
      "^/auth": "/",
    },
  }),
)

// Proxy middleware for Exam Service
app.use(
  "/exams",
  createProxyMiddleware({
    target: process.env.EXAM_SERVICE_URL || "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
      "^/exams": "/",
    },
  }),
)

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`)
})
