"use server"

import prisma from "@/lib/prisma"
import { requireAuth, requireInstructorAuth } from "@/lib/auth-utils"
import type { Message } from "@/lib/types"
import { revalidatePath } from "next/cache"

/**
 * Create a new chat session (requires authentication)
 */
export async function createChatSession(patientActorId: string): Promise<string> {
    try {
        const user = await requireAuth()

        const session = await prisma.chatSession.create({
            data: {
                userId: user.id,
                patientActorId,
                messages: [],
                messageCount: 0,
            },
        })

        return session.id
    } catch (error) {
        console.error("Error creating chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to create chat session"
        )
    }
}

/**
 * Update chat session with new messages (requires authentication)
 */
export async function updateChatSession(
    sessionId: string,
    messages: Message[]
): Promise<void> {
    try {
        const user = await requireAuth()

        // Verify the session belongs to the user
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
        })

        if (!session) {
            throw new Error("Session not found")
        }

        if (session.userId !== user.id) {
            throw new Error("Unauthorized: This session does not belong to you")
        }

        await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                messages: messages as any,
                messageCount: messages.length,
                lastMessageAt: new Date(),
            },
        })
    } catch (error) {
        console.error("Error updating chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to update chat session"
        )
    }
}

/**
 * Get all chat sessions for the current user
 */
export async function getStudentSessions() {
    try {
        const user = await requireAuth()

        const sessions = await prisma.chatSession.findMany({
            where: { userId: user.id },
            include: {
                patientActor: {
                    select: {
                        id: true,
                        name: true,
                        age: true,
                        slug: true,
                    },
                },
                submittedSession: {
                    select: {
                        id: true,
                        status: true,
                        submittedAt: true,
                        grade: true,
                        feedback: true,
                    },
                },
            },
            orderBy: { lastMessageAt: "desc" },
        })

        return sessions
    } catch (error) {
        console.error("Error fetching student sessions:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to fetch sessions"
        )
    }
}

/**
 * Get a specific chat session by ID
 */
export async function getChatSession(sessionId: string) {
    try {
        const user = await requireInstructorAuth()

        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                patientActor: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                submittedSession: {
                    include: {
                        instructor: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        })

        if (!session) {
            throw new Error("Session not found")
        }

        // Users can view their own sessions, instructors can view submitted sessions
        if (
            session.userId !== user.id &&
            (!session.submittedSession || session.submittedSession.instructorId !== user.id)
        ) {
            throw new Error("Unauthorized: You cannot view this session")
        }

        return session
    } catch (error) {
        console.error("Error fetching chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to fetch session"
        )
    }
}

/**
 * Submit a chat session to an instructor for grading
 */
export async function submitSessionToInstructor(
    sessionId: string,
    instructorId: string
): Promise<void> {
    try {
        const authUser = await requireAuth()

        // Get full user from database
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
        })

        if (!user) {
            throw new Error("User not found")
        }

        // Verify the session belongs to the user
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: { submittedSession: true },
        })

        if (!session) {
            throw new Error("Session not found")
        }

        if (session.userId !== user.id) {
            throw new Error("Unauthorized: This session does not belong to you")
        }

        if (session.submittedSession) {
            throw new Error("This session has already been submitted")
        }

        // Verify the instructor exists and is an instructor
        const instructor = await prisma.user.findUnique({
            where: { id: instructorId },
        })

        if (!instructor) {
            throw new Error("Instructor not found")
        }

        if (instructor.role !== "instructor" && instructor.role !== "admin") {
            throw new Error("The specified user is not an instructor")
        }

        // Create the submission
        await prisma.submittedSession.create({
            data: {
                chatSessionId: sessionId,
                instructorId,
                status: "pending",
            },
        })

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("Error submitting session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to submit session"
        )
    }
}

/**
 * Get all submitted sessions for an instructor
 */
export async function getSubmittedSessions() {
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
            throw new Error("Only instructors can view submitted sessions")
        }

        const submissions = await prisma.submittedSession.findMany({
            where: { instructorId: user.id },
            include: {
                chatSession: {
                    include: {
                        patientActor: {
                            select: {
                                id: true,
                                name: true,
                                age: true,
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
            },
            orderBy: { submittedAt: "desc" },
        })

        return submissions
    } catch (error) {
        console.error("Error fetching submitted sessions:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to fetch submissions"
        )
    }
}

/**
 * Get submissions for a specific patient actor (instructor only)
 */
export async function getSubmissionsByPatientActor(patientActorId: string) {
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
            throw new Error("Only instructors can view submitted sessions")
        }

        const submissions = await prisma.submittedSession.findMany({
            where: {
                instructorId: user.id,
                chatSession: {
                    patientActorId: patientActorId,
                },
            },
            include: {
                chatSession: {
                    include: {
                        patientActor: {
                            select: {
                                id: true,
                                name: true,
                                age: true,
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
            },
            orderBy: { submittedAt: "desc" },
        })

        return submissions
    } catch (error) {
        console.error("Error fetching submissions by patient actor:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to fetch submissions"
        )
    }
}

/**
 * Update submission feedback and grade (instructor only)
 */
export async function updateSubmissionFeedback(
    submissionId: string,
    feedback: string,
    grade?: string
): Promise<void> {
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
            throw new Error("Only instructors can provide feedback")
        }

        // Verify the submission belongs to this instructor
        const submission = await prisma.submittedSession.findUnique({
            where: { id: submissionId },
        })

        if (!submission) {
            throw new Error("Submission not found")
        }

        if (submission.instructorId !== user.id) {
            throw new Error("Unauthorized: This submission is not assigned to you")
        }

        await prisma.submittedSession.update({
            where: { id: submissionId },
            data: {
                feedback,
                grade: grade || null,
                status: grade ? "graded" : "reviewed",
                reviewedAt: new Date(),
            },
        })

        revalidatePath("/dashboard")
        revalidatePath(`/submissions/${submissionId}`)
    } catch (error) {
        console.error("Error updating submission feedback:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to update feedback"
        )
    }
}

/**
 * Get a list of instructors for submission selection
 */
export async function getInstructors() {
    try {
        await requireAuth()

        const instructors = await prisma.user.findMany({
            where: {
                OR: [{ role: "instructor" }, { role: "admin" }],
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: { name: "asc" },
        })

        return instructors
    } catch (error) {
        console.error("Error fetching instructors:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to fetch instructors"
        )
    }
}

/**
 * Create an anonymous chat session (no authentication required)
 * Used when guests start chatting before logging in
 */
export async function createAnonymousChatSession(patientActorId: string): Promise<string> {
    try {
        const session = await prisma.chatSession.create({
            data: {
                userId: null,
                patientActorId,
                messages: [],
                messageCount: 0,
            },
        })

        return session.id
    } catch (error) {
        console.error("Error creating anonymous chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to create anonymous chat session"
        )
    }
}

/**
 * Update an anonymous chat session with new messages (no authentication required)
 * Only works on unclaimed sessions (userId = null)
 */
export async function updateAnonymousChatSession(
    sessionId: string,
    messages: Message[]
): Promise<void> {
    try {
        // Verify the session exists and is unclaimed
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
        })

        if (!session) {
            throw new Error("Session not found")
        }

        if (session.userId !== null) {
            throw new Error("Cannot update claimed session anonymously")
        }

        await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                messages: messages as any,
                messageCount: messages.length,
                lastMessageAt: new Date(),
            },
        })
    } catch (error) {
        console.error("Error updating anonymous chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to update anonymous chat session"
        )
    }
}

/**
 * Claim an anonymous chat session (requires authentication)
 * Assigns the session to the authenticated user
 */
export async function claimChatSession(sessionId: string): Promise<void> {
    try {
        const user = await requireAuth()

        // Verify the session exists and is unclaimed
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
        })

        if (!session) {
            throw new Error("Session not found")
        }

        if (session.userId !== null) {
            // Session already claimed
            if (session.userId === user.id) {
                // Already claimed by this user, silently succeed
                return
            }
            throw new Error("Session has already been claimed by another user")
        }

        // Claim the session
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                userId: user.id,
            },
        })
    } catch (error) {
        console.error("Error claiming chat session:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to claim chat session"
        )
    }
}

/**
 * Get a session by ID for the current user (authenticated)
 * Returns session with messages if user owns it
 */
export async function getSessionById(sessionId: string) {
    try {
        const user = await requireAuth()

        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                patientActor: {
                    select: {
                        id: true,
                        name: true,
                        age: true,
                        slug: true,
                    },
                },
                submittedSession: {
                    select: {
                        id: true,
                        status: true,
                    },
                },
            },
        })

        if (!session) {
            return null
        }

        // Only return if user owns the session
        if (session.userId !== user.id) {
            return null
        }

        return session
    } catch (error) {
        console.error("Error fetching session by ID:", error)
        return null
    }
}

/**
 * Get an unclaimed session by ID (no authentication required)
 * Used to verify a session is claimable before login
 */
export async function getUnclaimedSessionById(sessionId: string) {
    try {
        const session = await prisma.chatSession.findUnique({
            where: { id: sessionId },
            include: {
                patientActor: {
                    select: {
                        id: true,
                        name: true,
                        age: true,
                    },
                },
            },
        })

        if (!session) {
            return null
        }

        // Only return if unclaimed
        if (session.userId !== null) {
            return null
        }

        return session
    } catch (error) {
        console.error("Error fetching unclaimed session:", error)
        return null
    }
}

/**
 * Cleanup abandoned anonymous sessions (older than 7 days)
 * Should be called periodically via cron job
 */
export async function cleanupAbandonedEncounter(): Promise<number> {
    try {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const result = await prisma.chatSession.deleteMany({
            where: {
                userId: null,
                lastMessageAt: {
                    lt: sevenDaysAgo,
                },
            },
        })

        console.log(`Cleaned up ${result.count} abandoned anonymous sessions`)
        return result.count
    } catch (error) {
        console.error("Error cleaning up abandoned sessions:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to cleanup abandoned sessions"
        )
    }
}

