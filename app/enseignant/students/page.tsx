export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { getStudentsByTeacher } from "@/lib/teacher"
import DashboardHeader from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search } from "lucide-react"

export default async function EnseignantStudents() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "enseignant") {
    redirect(`/${user.role}/dashboard`)
  }

  const students = await getStudentsByTeacher(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Mes Étudiants</h1>
          <Button asChild>
            <Link href="/enseignant/students/add">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter des étudiants
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Rechercher des étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Rechercher par nom, email ou CIN..." className="pl-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nom</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">CIN</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{student.name}</td>
                        <td className="py-3 px-4">{student.email}</td>
                        <td className="py-3 px-4">{student.cin}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/enseignant/students/${student.id}`}>Détails</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Vous n'avez pas encore d'étudiants</p>
                <Button asChild>
                  <Link href="/enseignant/students/add">Ajouter des étudiants</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
