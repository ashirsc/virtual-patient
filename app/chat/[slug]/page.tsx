import { notFound } from "next/navigation"
import { getPatientActorBySlug } from "@/lib/actions/patient-actors"
import { getSessionById } from "@/lib/actions/sessions"
import { getOptionalAuth } from "@/lib/auth-utils"
import PublicChatClient from "./page-client"
import type { Message } from "@/lib/types"

export default async function PublicChatPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ session?: string }>
}) {
    const { slug } = await params
    const { session: sessionId } = await searchParams
    
    const patientActor = await getPatientActorBySlug(slug)

    if (!patientActor) {
        notFound()
    }

    // Check if user is authenticated
    const user = await getOptionalAuth()
    const isAuthenticated = !!user

    // If a session ID is provided and user is authenticated, load the existing session
    let existingSession: {
        id: string
        messages: Message[]
        isSubmitted: boolean
    } | null = null

    if (sessionId && isAuthenticated) {
        const session = await getSessionById(sessionId)
        if (session && session.patientActor.id === patientActor.id) {
            existingSession = {
                id: session.id,
                messages: session.messages as Message[],
                isSubmitted: !!session.submittedSession,
            }
        }
    }

    return (
        <PublicChatClient 
            patientActor={patientActor} 
            isAuthenticated={isAuthenticated}
            existingSession={existingSession}
        />
    )
}
