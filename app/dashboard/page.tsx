export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!user) {
    redirect("/login")
  }

  // Rediriger vers le tableau de bord spécifique au rôle
  if (user.role === "enseignant") {
    redirect("/enseignant/dashboard")
  } else if (user.role === "etudiant") {
    redirect("/etudiant/dashboard")
  } else if (user.role === "admin") {
    redirect("/admin/dashboard")
  }

  // Cette partie ne devrait jamais être exécutée grâce aux redirections ci-dessus
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 text-center">Redirection...</div>
    </div>
  )
}
