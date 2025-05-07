import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAssignedExams, getCompletedExams } from "@/lib/student"

export default async function EtudiantDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "etudiant") {
    redirect(`/${user.role}/dashboard`)
  }

  const assignedExams = await getAssignedExams(user.id)
  const completedExams = await getCompletedExams(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord Étudiant</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Examens à passer</CardTitle>
              <CardDescription>Examens qui vous ont été assignés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{assignedExams.length}</div>
                <Button asChild>
                  <Link href="/etudiant/exams">Voir tous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Examens complétés</CardTitle>
              <CardDescription>Examens que vous avez terminés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">{completedExams.length}</div>
                <Button asChild>
                  <Link href="/etudiant/results">Voir tous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Moyenne générale</CardTitle>
              <CardDescription>Votre score moyen sur tous les examens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completedExams.length > 0
                  ? `${Math.round(
                      completedExams.reduce((acc, exam) => acc + (exam.score / exam.max_score) * 100, 0) /
                        completedExams.length,
                    )}%`
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Examens à venir</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedExams.length > 0 ? (
                <div className="space-y-4">
                  {assignedExams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{exam.title}</h3>
                        <p className="text-sm text-gray-500">Durée: {exam.duration} min</p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/etudiant/exams/${exam.id}`}>Commencer</Link>
                      </Button>
                    </div>
                  ))}
                  {assignedExams.length > 3 && (
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link href="/etudiant/exams">Voir tous les examens</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun examen à venir</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Résultats récents</CardTitle>
            </CardHeader>
            <CardContent>
              {completedExams.length > 0 ? (
                <div className="space-y-4">
                  {completedExams.slice(0, 3).map((exam) => (
                    <div key={exam.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{exam.title}</h3>
                        <p className="text-sm text-gray-500">
                          Score: {Math.round((exam.score / exam.max_score) * 100)}%
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/etudiant/results/${exam.id}`}>Détails</Link>
                      </Button>
                    </div>
                  ))}
                  {completedExams.length > 3 && (
                    <Button asChild variant="outline" className="w-full mt-2">
                      <Link href="/etudiant/results">Voir tous les résultats</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun résultat récent</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
