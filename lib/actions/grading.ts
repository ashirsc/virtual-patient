"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { runAllJudges, aggregateGrades } from "@/lib/grading"
import type { GradingInput, AggregatedGrade } from "@/lib/grading"
import type { Message } from "@/lib/types"
import type { RubricCategory } from "@/lib/types/rubric"

/**
 * Run AI grading on a submitted session
 * Requires instructor authorization
 */
export async function runAIGrading(submittedSessionId: string): Promise<AggregatedGrade> {
    try {
        const authUser = await requireAuth()

        // Get full user from database to check role
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
        })

        if (!user) {
            throw new Error("User not found")
        }

        if (user.role !== "instructor" && user.role !== "admin") {
            throw new Error("Only instructors can run AI grading")
        }

        // Get the submission with all related data
        const submission = await prisma.submittedSession.findUnique({
            where: { id: submittedSessionId },
            include: {
                chatSession: {
                    include: {
                        patientActor: {
                            include: {
                                gradingRubric: true,
                            },
                        },
                    },
                },
            },
        })

        if (!submission) {
            throw new Error("Submission not found")
        }

        if (submission.instructorId !== user.id) {
            throw new Error("Unauthorized: This submission is not assigned to you")
        }

        const { chatSession } = submission
        const { patientActor } = chatSession
        const { gradingRubric } = patientActor

        if (!gradingRubric) {
            throw new Error("No grading rubric configured for this patient actor")
        }

        // Prepare grading input
        const messages = chatSession.messages as unknown as Message[]
        const rubricCategories = gradingRubric.categories as unknown as RubricCategory[]

        const gradingInput: GradingInput = {
            transcript: messages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })),
            rubric: {
                categories: rubricCategories.map(cat => ({
                    name: cat.name,
                    description: cat.description,
                    maxPoints: cat.maxPoints,
                    criteria: cat.criteria,
                })),
                totalPoints: gradingRubric.totalPoints,
                passingThreshold: gradingRubric.passingThreshold ?? undefined,
            },
            patientContext: {
                name: patientActor.name,
                age: patientActor.age,
                chiefComplaint: patientActor.chiefComplaint,
            },
        }

        // Run multi-judge grading
        const judgeGrades = await runAllJudges(gradingInput)

        // Aggregate results
        const aggregatedGrade = aggregateGrades(judgeGrades)

        // Save results to database
        await prisma.submittedSession.update({
            where: { id: submittedSessionId },
            data: {
                rubricScores: aggregatedGrade.averageScores as any,
                aiGrades: aggregatedGrade.judgeGrades as any,
                requiresReview: aggregatedGrade.requiresReview,
                autoGraded: true,
                aiGradedAt: new Date(),
                // Set status to indicate AI grading was done
                status: aggregatedGrade.requiresReview ? "pending" : "reviewed",
            },
        })

        revalidatePath(`/submissions/${chatSession.id}`)
        revalidatePath("/dashboard")

        return aggregatedGrade
    } catch (error) {
        console.error("Error running AI grading:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to run AI grading"
        )
    }
}

/**
 * Get AI grading results for a submitted session
 */
export async function getAIGradingResults(submittedSessionId: string): Promise<AggregatedGrade | null> {
    try {
        const authUser = await requireAuth()

        const submission = await prisma.submittedSession.findUnique({
            where: { id: submittedSessionId },
            include: {
                chatSession: {
                    select: { userId: true }
                }
            }
        })

        if (!submission) {
            throw new Error("Submission not found")
        }

        // Allow access for instructor or the student who submitted
        if (submission.instructorId !== authUser.id && submission.chatSession.userId !== authUser.id) {
            throw new Error("Unauthorized: You cannot view this grading result")
        }

        if (!submission.autoGraded || !submission.rubricScores || !submission.aiGrades) {
            return null
        }

        // Reconstruct the aggregated grade from stored data
        const judgeGrades = submission.aiGrades as any[]
        const averageScores = submission.rubricScores as any[]

        // Calculate totals from stored data
        const totalScore = averageScores.reduce((sum: number, cs: any) => sum + cs.averageScore, 0)
        const maxScore = averageScores.reduce((sum: number, cs: any) => sum + cs.maxPoints, 0)

        const aggregatedGrade: AggregatedGrade = {
            averageScores,
            totalScore: Math.round(totalScore * 100) / 100,
            maxScore,
            percentageScore: Math.round((totalScore / maxScore) * 100),
            requiresReview: submission.requiresReview,
            flaggedCategories: averageScores
                .filter((cs: any) => cs.disagreementPercent > 0.2)
                .map((cs: any) => cs.category),
            judgeGrades,
            disagreementThreshold: 0.2,
            gradedAt: submission.aiGradedAt ?? new Date(),
        }

        return aggregatedGrade
    } catch (error) {
        console.error("Error getting AI grading results:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to get grading results"
        )
    }
}

/**
 * Check if a patient actor has a grading rubric configured
 */
export async function hasGradingRubric(patientActorId: string): Promise<boolean> {
    try {
        const rubric = await prisma.gradingRubric.findUnique({
            where: { patientActorId },
        })
        return rubric !== null
    } catch (error) {
        console.error("Error checking grading rubric:", error)
        return false
    }
}

