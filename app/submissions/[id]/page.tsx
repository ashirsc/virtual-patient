import { requireAuth } from "@/lib/auth-utils"
import { redirect, notFound } from "next/navigation"
import SubmissionReviewClient from "./page-client"
import prisma from "@/lib/prisma"
import type { RubricCategory } from "@/lib/types/rubric"

interface SubmissionPageProps {
  params: Promise<{ id: string }>
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id } = await params

  try {
    const user = await requireAuth()

    // Look up the SubmittedSession first (the URL uses SubmittedSession.id)
    const submittedSession = await prisma.submittedSession.findUnique({
      where: { id },
      include: {
        chatSession: {
          include: {
            patientActor: {
              include: {
                gradingRubric: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!submittedSession) {
      notFound()
    }

    // Check if user is authorized to view this submission
    const isStudent = submittedSession.chatSession.userId === user.id
    const isInstructor = submittedSession.instructorId === user.id

    if (!isStudent && !isInstructor) {
      redirect("/")
    }

    // Get the grading rubric
    const gradingRubric = submittedSession.chatSession.patientActor.gradingRubric

    // Format session for client
    const session = {
      id: submittedSession.chatSession.id,
      patientActor: submittedSession.chatSession.patientActor,
      user: submittedSession.chatSession.user,
      messages: submittedSession.chatSession.messages,
      messageCount: submittedSession.chatSession.messageCount,
      startedAt: submittedSession.chatSession.startedAt,
      lastMessageAt: submittedSession.chatSession.lastMessageAt,
    }

    // Format submission for client (include AI grading fields)
    const fullSubmission = {
      id: submittedSession.id,
      status: submittedSession.status,
      grade: submittedSession.grade,
      feedback: submittedSession.feedback,
      submittedAt: submittedSession.submittedAt,
      reviewedAt: submittedSession.reviewedAt,
      rubricScores: submittedSession.rubricScores,
      aiGrades: submittedSession.aiGrades,
      requiresReview: submittedSession.requiresReview,
      autoGraded: submittedSession.autoGraded,
      aiGradedAt: submittedSession.aiGradedAt,
      instructor: submittedSession.instructor,
    }

    // Format rubric for client
    const rubricData = gradingRubric ? {
      id: gradingRubric.id,
      categories: gradingRubric.categories as unknown as RubricCategory[],
      totalPoints: gradingRubric.totalPoints,
      passingThreshold: gradingRubric.passingThreshold,
      autoGradeEnabled: gradingRubric.autoGradeEnabled,
    } : null

    return (
      <SubmissionReviewClient
        session={session}
        submittedSession={fullSubmission}
        isInstructor={isInstructor}
        rubric={rubricData}
      />
    )
  } catch (error) {
    console.error("Error loading submission:", error)
    redirect("/login")
  }
}
