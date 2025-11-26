import { requireAuthPage } from "@/lib/auth-utils"
import { getMyPatientActors } from "@/lib/actions/patient-actors"
import { getSubmittedSessions } from "@/lib/actions/sessions"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import PatientActorsClient from "./page-client"

export default async function PatientActorsPage() {
  const authUser = await requireAuthPage()

  // Get full user from database to access role
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  })

  const userRole = user?.role || "student"

  // Only instructors and admins can access this page
  if (userRole === "student") {
    redirect("/")
  }

  const patientActors = await getMyPatientActors()

  // Get submissions for the workspace
  let submissions: any[] = []
  try {
    submissions = await getSubmittedSessions()
  } catch (error) {
    console.log("Error fetching submissions:", error)
  }

  return (
    <PatientActorsClient
      patientActors={patientActors}
      userName={authUser.name}
      userRole={userRole}
      submissions={submissions}
    />
  )
}

