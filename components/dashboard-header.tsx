"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/lib/auth"

interface DashboardHeaderProps {
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoading(false)
    }
  }

  // Déterminer les liens de navigation en fonction du rôle
  const getNavLinks = () => {
    if (user.role === "admin") {
      return [
        { href: "/admin/dashboard", label: "Tableau de bord" },
        { href: "/admin/users", label: "Utilisateurs" },
        { href: "/admin/exams", label: "Examens" },
      ]
    } else if (user.role === "enseignant") {
      return [
        { href: "/enseignant/dashboard", label: "Tableau de bord" },
        { href: "/enseignant/students", label: "Étudiants" },
        { href: "/enseignant/exams", label: "Examens" },
        { href: "/enseignant/results", label: "Résultats" },
      ]
    } else {
      return [
        { href: "/etudiant/dashboard", label: "Tableau de bord" },
        { href: "/etudiant/exams", label: "Examens" },
        { href: "/etudiant/results", label: "Résultats" },
      ]
    }
  }

  const navLinks = getNavLinks()

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href={`/${user.role}/dashboard`} className="text-2xl font-bold text-gray-800">
          ExamPro
        </Link>

        <nav className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-600 hover:text-gray-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-xs text-gray-500">{user.role}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loading}>
              {loading ? "Déconnexion..." : "Se déconnecter"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
