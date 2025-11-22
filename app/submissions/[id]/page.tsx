import { requireAuth } from "@/lib/auth-utils"
import { getChatSession } from "@/lib/actions/sessions"
import { redirect } from "next/navigation"
import SubmissionReviewClient from "./page-client"

interface SubmissionPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id } = await params
  
  try {
    const user = await requireAuth()
    
    // Get the chat session with submission details
    const session = await getChatSession(id)
    
    if (!session.submittedSession) {
      redirect("/dashboard")
    }

    // Check if user is authorized to view this submission
    const isStudent = session.userId === user.id
    const isInstructor = session.submittedSession.instructorId === user.id

    if (!isStudent && !isInstructor) {
      redirect("/dashboard")
    }

    return (
      <SubmissionReviewClient
        session={session}
        submittedSession={session.submittedSession}
        isInstructor={isInstructor}
      />
    )
  } catch (error) {
    console.error("Error loading submission:", error)
    redirect("/login")
  }
}


