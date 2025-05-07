"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserExams, getAvailableExams } from "@/lib/exams"
import DashboardHeader from "@/components/dashboard-header"
import ExamCard from "@/components/exam-card"

export default function DashboardPage() {
  const [userExams, setUserExams] = useState([])
  const [availableExams, setAvailableExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userExamsData, availableExamsData] = await Promise.all([getUserExams(), getAvailableExams()])

        setUserExams(userExamsData)
        setAvailableExams(availableExamsData)
      } catch (error) {
        console.error("Error fetching exams:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

        <Tabs defaultValue="my-exams" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="my-exams">Mes examens</TabsTrigger>
            <TabsTrigger value="available-exams">Examens disponibles</TabsTrigger>
          </TabsList>

          <TabsContent value="my-exams">
            {loading ? (
              <div className="text-center py-12">Chargement...</div>
            ) : userExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} type="user" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500 mb-4">Vous n'avez pas encore d'examens</p>
                  <Link href="/exams">
                    <Button>Parcourir les examens disponibles</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="available-exams">
            {loading ? (
              <div className="text-center py-12">Chargement...</div>
            ) : availableExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableExams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} type="available" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">Aucun examen disponible pour le moment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
