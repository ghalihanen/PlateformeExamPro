"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createExam } from "@/lib/exams"
import { PlusCircle, Trash2 } from "lucide-react"

export default function CreateExam() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("60")
  const [category, setCategory] = useState("")
  const [questions, setQuestions] = useState([
    {
      question_text: "",
      question_type: "single_choice",
      points: 1,
      options: [
        { text: "", is_correct: true },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "single_choice",
        points: 1,
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      },
    ])
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    }
    setQuestions(newQuestions)
  }

  const handleCorrectOptionChange = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.map((option, i) => ({
      ...option,
      is_correct: i === optionIndex,
    }))
    setQuestions(newQuestions)
  }

  const handleAddOption = (questionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options.push({ text: "", is_correct: false })
    setQuestions(newQuestions)
  }

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions]
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex)
    setQuestions(newQuestions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validation
      if (!title) throw new Error("Le titre est requis")
      if (isNaN(Number.parseInt(duration)) || Number.parseInt(duration) <= 0) {
        throw new Error("La durée doit être un nombre positif")
      }

      // Valider les questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        if (!q.question_text) {
          throw new Error(`La question ${i + 1} n'a pas de texte`)
        }

        if (q.question_type === "single_choice" || q.question_type === "multiple_choice") {
          if (q.options.length < 2) {
            throw new Error(`La question ${i + 1} doit avoir au moins 2 options`)
          }

          if (!q.options.some((o) => o.is_correct)) {
            throw new Error(`La question ${i + 1} doit avoir au moins une option correcte`)
          }

          for (let j = 0; j < q.options.length; j++) {
            if (!q.options[j].text) {
              throw new Error(`L'option ${j + 1} de la question ${i + 1} n'a pas de texte`)
            }
          }
        }
      }

      const result = await createExam({
        title,
        description,
        duration: Number.parseInt(duration),
        category,
        questions,
      })

      router.push(`/enseignant/exams/${result.id}`)
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Créer un nouvel examen</h1>
        <Button variant="outline" asChild>
          <Link href="/enseignant/exams">Annuler</Link>
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-600">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'examen *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Introduction à JavaScript"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description de l'examen..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informatique">Informatique</SelectItem>
                      <SelectItem value="mathematiques">Mathématiques</SelectItem>
                      <SelectItem value="sciences">Sciences</SelectItem>
                      <SelectItem value="langues">Langues</SelectItem>
                      <SelectItem value="histoire">Histoire</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Question {qIndex + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      disabled={questions.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`question-${qIndex}`}>Texte de la question *</Label>
                    <Textarea
                      id={`question-${qIndex}`}
                      value={question.question_text}
                      onChange={(e) => handleQuestionChange(qIndex, "question_text", e.target.value)}
                      placeholder="Entrez votre question ici..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`question-type-${qIndex}`}>Type de question</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(value) => handleQuestionChange(qIndex, "question_type", value)}
                      >
                        <SelectTrigger id={`question-type-${qIndex}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single_choice">Choix unique</SelectItem>
                          <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                          <SelectItem value="text">Réponse textuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`question-points-${qIndex}`}>Points</Label>
                      <Input
                        id={`question-points-${qIndex}`}
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => handleQuestionChange(qIndex, "points", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  {(question.question_type === "single_choice" || question.question_type === "multiple_choice") && (
                    <div className="space-y-4">
                      <Label>Options de réponse</Label>
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center space-x-2">
                          <Input
                            value={option.text}
                            onChange={(e) => handleOptionChange(qIndex, oIndex, "text", e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                            className="flex-1"
                          />
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`option-correct-${qIndex}-${oIndex}`}
                              checked={option.is_correct}
                              onChange={() => handleCorrectOptionChange(qIndex, oIndex)}
                              className="h-4 w-4"
                            />
                            <Label htmlFor={`option-correct-${qIndex}-${oIndex}`} className="text-sm">
                              Correcte
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(qIndex, oIndex)}
                            disabled={question.options.length <= 2}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddOption(qIndex)}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Ajouter une option
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" />
                Ajouter une question
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" asChild>
            <Link href="/enseignant/exams">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Création en cours..." : "Créer l'examen"}
          </Button>
        </div>
      </form>
    </div>
  )
}
