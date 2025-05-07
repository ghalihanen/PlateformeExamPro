import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, ClockIcon, BookOpenIcon } from "lucide-react"

interface ExamCardProps {
  exam: {
    id: string
    title: string
    description: string
    duration: number
    questionCount: number
    date: string
    status?: string
    score?: number
  }
  type: "user" | "available"
}

export default function ExamCard({ exam, type }: ExamCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Terminé</Badge>
      case "in-progress":
        return <Badge className="bg-yellow-500">En cours</Badge>
      case "upcoming":
        return <Badge className="bg-blue-500">À venir</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{exam.title}</CardTitle>
          {type === "user" && exam.status && getStatusBadge(exam.status)}
        </div>
        <CardDescription>{exam.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>Durée: {exam.duration} minutes</span>
          </div>
          <div className="flex items-center">
            <BookOpenIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>{exam.questionCount} questions</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
            <span>Date: {formatDate(exam.date)}</span>
          </div>
          {type === "user" && exam.status === "completed" && (
            <div className="mt-4">
              <div className="text-sm font-medium">
                Score: <span className="font-bold">{exam.score}%</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {type === "available" ? (
          <Button asChild className="w-full">
            <Link href={`/exams/${exam.id}`}>Commencer l'examen</Link>
          </Button>
        ) : (
          <>
            {exam.status === "completed" ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/exams/${exam.id}/results`}>Voir les résultats</Link>
              </Button>
            ) : exam.status === "in-progress" ? (
              <Button asChild className="w-full">
                <Link href={`/exams/${exam.id}`}>Continuer l'examen</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href={`/exams/${exam.id}`}>Commencer l'examen</Link>
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
