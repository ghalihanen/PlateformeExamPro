import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">ExamPro</h1>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="outline">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button>S'inscrire</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Plateforme d'examens en ligne</h2>
          <p className="text-xl text-gray-600 mb-8">
            Une solution complète pour créer, gérer et passer des examens en ligne
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Commencer
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="px-8">
                En savoir plus
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Pour les enseignants</h3>
            <p className="text-gray-600">
              Créez facilement des examens, gérez vos étudiants et suivez leurs performances.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Pour les étudiants</h3>
            <p className="text-gray-600">
              Passez vos examens en ligne avec une interface intuitive et consultez vos résultats.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800">Pour les administrateurs</h3>
            <p className="text-gray-600">Gérez l'ensemble de la plateforme, les utilisateurs et les statistiques.</p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold mb-4">ExamPro</h2>
              <p className="text-gray-300">Plateforme d'examens en ligne</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Liens</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/about" className="text-gray-300 hover:text-white">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-300 hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-300 hover:text-white">
                    Conditions d'utilisation
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-400">
            &copy; {new Date().getFullYear()} ExamPro. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  )
}
