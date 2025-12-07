import { cookies } from "next/headers"
import { requireAuthPage } from "@/lib/auth-utils"
import { getMyPatientActors } from "@/lib/actions/patient-actors"
import { getSubmittedSessions, getStudentSessions } from "@/lib/actions/sessions"
import prisma from "@/lib/prisma"
import StudentHome from "@/components/student-home"
import InstructorHome from "@/components/instructor-home"

export default async function Home() {
  const authUser = await requireAuthPage()

  // Get full user from database to access role
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  })

  const userRole = user?.role || "student"
  const adminView = (await cookies()).get("adminView")?.value

  // Render different views based on role
  if (userRole === "student" || (userRole === "admin" && adminView === "student")) {
    // Student view: show their conversation history
    const sessions = await getStudentSessions()

    return (
      <StudentHome
        sessions={sessions}
        userName={authUser.name}
        isAdmin={userRole === "admin"}
      />
    )
  }

  // Instructor/Admin view: show dashboard
  const patientActors = await getMyPatientActors()

  let submissions: any[] = []
  try {
    submissions = await getSubmittedSessions()
  } catch (error) {
    console.log("Error fetching submissions:", error)
  }

  return (
    <InstructorHome
      patientActors={patientActors}
      submissions={submissions}
      userName={authUser.name}
      isAdmin={userRole === "admin"}
    />
  )
}
