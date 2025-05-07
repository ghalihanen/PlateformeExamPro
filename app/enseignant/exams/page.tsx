export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { getExamsByTeacher } from "@/lib/exams"
import DashboardHeader from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle } from "lucide-react"

export default async function EnseignantExams() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "enseignant") {
    redirect(`/${user.role}/dashboard`)
  }

  const exams = await getExamsByTeacher(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mes Examens</h1>
          <Button asChild>
            <Link href="/enseignant/exams/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer un examen
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des examens</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Titre</th>
                      <th className="text-left py-3 px-4">Catégorie</th>
                      <th className="text-left py-3 px-4">Durée</th>
                      <th className="text-left py-3 px-4">Statut</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{exam.title}</td>
                        <td className="py-3 px-4">{exam.category || "-"}</td>
                        <td className="py-3 px-4">{exam.duration} min</td>
                        <td className="py-3 px-4">
                          {exam.is_published ? (
                            <Badge className="bg-green-500">Publié</Badge>
                          ) : (
                            <Badge variant="outline">Brouillon</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/enseignant/exams/${exam.id}`}>Détails</Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/enseignant/exams/${exam.id}/edit`}>Modifier</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Vous n'avez pas encore créé d'examens</p>
                <Button asChild>
                  <Link href="/enseignant/exams/create">Créer un examen</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
