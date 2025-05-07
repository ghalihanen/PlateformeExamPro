export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import DashboardHeader from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EnseignantDashboard() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "enseignant") {
    redirect(`/${user.role}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord Enseignant</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mes Étudiants</CardTitle>
              <CardDescription>Gérez vos listes d'étudiants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">0</div>
                <Button asChild>
                  <Link href="/enseignant/students">Voir tous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Mes Examens</CardTitle>
              <CardDescription>Gérez vos examens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">0</div>
                <Button asChild>
                  <Link href="/enseignant/exams">Voir tous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Résultats Récents</CardTitle>
              <CardDescription>Consultez les derniers résultats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold">0</div>
                <Button asChild>
                  <Link href="/enseignant/results">Voir tous</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/enseignant/exams/create">Créer un nouvel examen</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/enseignant/students/add">Ajouter des étudiants</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Examens à venir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-4">Aucun examen à venir</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
