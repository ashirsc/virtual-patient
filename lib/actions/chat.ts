"use server"

import { generatePatientResponse } from "@/lib/convos/gen-patient-response"
import type { Message } from "@/lib/types"
import { requireAuth } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

/**
 * Generate response for authenticated users (owner of the patient actor)
 */
export async function generateResponse(patientId: string, messages: Message[]): Promise<string> {
    try {
        // Require authentication - throws if not logged in
        const user = await requireAuth()

        // Fetch patient actor and verify ownership
        const patientActor = await prisma.patientActor.findUnique({
            where: { id: patientId }
        })

        if (!patientActor) {
            throw new Error("Patient actor not found")
        }

        if (patientActor.ownerId !== user.id) {
            throw new Error("Unauthorized: You don't own this patient actor")
        }

        const response = await generatePatientResponse(patientActor, messages)
        return response
    } catch (error) {
        console.error("Error in generateResponse action:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to generate patient response"
        )
    }
}

/**
 * Generate response for public access (no authentication required)
 * Uses patient actor ID instead of slug for simplicity
 */
export async function generatePublicResponse(patientId: string, messages: Message[]): Promise<string> {
    try {
        // Fetch patient actor - no authentication required
        const patientActor = await prisma.patientActor.findUnique({
            where: { id: patientId }
        })

        if (!patientActor) {
            throw new Error("Patient actor not found")
        }

        // Check if patient is publicly accessible
        if (!patientActor.isPublic) {
            throw new Error("This patient actor is not publicly accessible")
        }

        const response = await generatePatientResponse(patientActor, messages)
        return response
    } catch (error) {
        console.error("Error in generatePublicResponse action:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to generate patient response"
        )
    }
}

