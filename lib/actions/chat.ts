"use server"

import { generatePatientResponse } from "@/lib/gemini"
import type { Patient, Message } from "@/lib/types"

export async function generateResponse(patient: Patient, messages: Message[]): Promise<string> {
    try {
        const response = await generatePatientResponse(patient, messages)
        return response
    } catch (error) {
        console.error("Error in generateResponse action:", error)
        throw new Error(
            error instanceof Error ? error.message : "Failed to generate patient response"
        )
    }
}

