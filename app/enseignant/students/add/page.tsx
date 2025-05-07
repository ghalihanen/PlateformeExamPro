"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addStudentsByEmail, addStudentsByCIN } from "@/lib/teacher"

export default function AddStudents() {
  const [emails, setEmails] = useState("")
  const [cins, setCins] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleAddByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const emailList = emails
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email !== "")

      if (emailList.length === 0) {
        throw new Error("Veuillez entrer au moins une adresse email")
      }

      const result = await addStudentsByEmail(emailList)
      setSuccess(`${result.added} étudiant(s) ajouté(s) avec succès`)
      setEmails("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  const handleAddByCIN = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const cinList = cins
        .split("\n")
        .map((cin) => cin.trim())
        .filter((cin) => cin !== "")

      if (cinList.length === 0) {
        throw new Error("Veuillez entrer au moins un numéro CIN")
      }

      const result = await addStudentsByCIN(cinList)
      setSuccess(`${result.added} étudiant(s) ajouté(s) avec succès`)
      setCins("")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Ajouter des étudiants</h1>
        <Button variant="outline" asChild>
          <Link href="/enseignant/students">Retour</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter des étudiants à votre liste</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 border-red-200 text-red-600">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200 text-green-600">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email">
            <TabsList className="mb-4">
              <TabsTrigger value="email">Par Email</TabsTrigger>
              <TabsTrigger value="cin">Par CIN</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleAddByEmail}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emails">Adresses email des étudiants</Label>
                    <Textarea
                      id="emails"
                      placeholder="Entrez les adresses email (une par ligne)"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      rows={8}
                    />
                    <p className="text-sm text-gray-500">
                      Entrez une adresse email par ligne. Les étudiants doivent déjà être inscrits sur la plateforme.
                    </p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Ajout en cours..." : "Ajouter les étudiants"}
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="cin">
              <form onSubmit={handleAddByCIN}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cins">Numéros CIN des étudiants</Label>
                    <Textarea
                      id="cins"
                      placeholder="Entrez les numéros CIN (un par ligne)"
                      value={cins}
                      onChange={(e) => setCins(e.target.value)}
                      rows={8}
                    />
                    <p className="text-sm text-gray-500">
                      Entrez un numéro CIN par ligne. Les étudiants doivent déjà être inscrits sur la plateforme.
                    </p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Ajout en cours..." : "Ajouter les étudiants"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
