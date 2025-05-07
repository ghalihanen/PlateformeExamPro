"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getExamById, submitExamAnswers } from "@/lib/exams"
import DashboardHeader from "@/components/dashboard-header"

export const dynamic = "force-dynamic"

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string

  const [exam, setExam] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const examData = await getExamById(examId)
        setExam(examData)
        setTimeLeft(examData.duration * 60) // Convert minutes to seconds

        // Initialize answers object
        const initialAnswers = {}
        examData.questions.forEach((q) => {
          initialAnswers[q.id] = ""
        })
        setAnswers(initialAnswers)
      } catch (error) {
        console.error("Error fetching exam:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId])

  // Timer effect
  useEffect(() => {
    if (!exam || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [exam, timeLeft])

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      await submitExamAnswers(examId, answers)
      router.push(`/exams/${examId}/results`)
    } catch (error) {
      console.error("Error submitting exam:", error)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-12 text-center">Chargement de l'examen...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-12 text-center">Examen non trouvé</div>
      </div>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIndex]
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <div className="text-xl font-semibold">
            Temps restant: <span className={timeLeft < 60 ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-3/4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Question {currentQuestionIndex + 1} sur {exam.questions.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-lg font-medium mb-4">{currentQuestion.text}</div>

                {currentQuestion.type === "multiple-choice" && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  >
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id}>{option.text}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === "essay" && (
                  <Textarea
                    placeholder="Votre réponse..."
                    value={answers[currentQuestion.id] || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="min-h-[200px]"
                  />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                  Précédent
                </Button>

                {currentQuestionIndex < exam.questions.length - 1 ? (
                  <Button onClick={handleNext}>Suivant</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Soumission..." : "Terminer l'examen"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={
                        index === currentQuestionIndex
                          ? "default"
                          : answers[exam.questions[index].id]
                            ? "outline"
                            : "ghost"
                      }
                      className="h-10 w-10"
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Soumission..." : "Terminer l'examen"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
