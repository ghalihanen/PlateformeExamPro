"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "./auth"

const sql = neon(process.env.DATABASE_URL!)

// Récupérer les étudiants d'un enseignant
export async function getStudentsByTeacher(teacherId: number) {
  try {
    const students = await sql`
      SELECT u.id, u.name, u.email, u.cin
      FROM users u
      JOIN teacher_student ts ON u.id = ts.student_id
      WHERE ts.teacher_id = ${teacherId}
      AND u.role = 'etudiant'
      ORDER BY u.name
    `
    return students
  } catch (error) {
    console.error("Erreur lors de la récupération des étudiants:", error)
    return []
  }
}

// Ajouter des étudiants par email
export async function addStudentsByEmail(emails: string[]) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "enseignant") {
      throw new Error("Non autorisé")
    }

    let added = 0
    let errors = 0

    // Récupérer les utilisateurs avec les emails fournis qui sont des étudiants
    const students = await sql`
      SELECT id FROM users 
      WHERE email IN ${sql(emails)} 
      AND role = 'etudiant'
    `

    // Pour chaque étudiant trouvé, créer une relation s'il n'en existe pas déjà une
    for (const student of students) {
      try {
        // Vérifier si la relation existe déjà
        const existingRelation = await sql`
          SELECT id FROM teacher_student 
          WHERE teacher_id = ${user.id} 
          AND student_id = ${student.id}
        `

        if (existingRelation.length === 0) {
          await sql`
            INSERT INTO teacher_student (teacher_id, student_id)
            VALUES (${user.id}, ${student.id})
          `
          added++
        }
      } catch (err) {
        errors++
      }
    }

    return { added, errors }
  } catch (error: any) {
    console.error("Erreur lors de l'ajout des étudiants:", error)
    throw new Error(error.message || "Erreur lors de l'ajout des étudiants")
  }
}

// Ajouter des étudiants par CIN
export async function addStudentsByCIN(cins: string[]) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "enseignant") {
      throw new Error("Non autorisé")
    }

    let added = 0
    let errors = 0

    // Récupérer les utilisateurs avec les CINs fournis qui sont des étudiants
    const students = await sql`
      SELECT id FROM users 
      WHERE cin IN ${sql(cins)} 
      AND role = 'etudiant'
    `

    // Pour chaque étudiant trouvé, créer une relation s'il n'en existe pas déjà une
    for (const student of students) {
      try {
        // Vérifier si la relation existe déjà
        const existingRelation = await sql`
          SELECT id FROM teacher_student 
          WHERE teacher_id = ${user.id} 
          AND student_id = ${student.id}
        `

        if (existingRelation.length === 0) {
          await sql`
            INSERT INTO teacher_student (teacher_id, student_id)
            VALUES (${user.id}, ${student.id})
          `
          added++
        }
      } catch (err) {
        errors++
      }
    }

    return { added, errors }
  } catch (error: any) {
    console.error("Erreur lors de l'ajout des étudiants:", error)
    throw new Error(error.message || "Erreur lors de l'ajout des étudiants")
  }
}
