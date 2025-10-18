import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import type { Patient, Message } from "./types"

// Initialize Google AI with API key from environment
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
    console.error(
        "❌ Google Generative AI API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file."
    )
}

export async function generatePatientResponse(
    patient: Patient,
    messages: Message[]
): Promise<string> {
    if (!apiKey) {
        throw new Error(
            "Google Generative AI API key is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file."
        )
    }

    const systemPrompt = `You are a patient in a medical simulation. Here are your details:

Demographics: ${patient.demographics}
Chief Complaint: ${patient.chiefComplaint}
Medical History: ${patient.medicalHistory.join(", ")}
Current Medications: ${patient.medications.join(", ")}
Personality: ${patient.personality}
Social History: ${patient.socialHistory}
Neurological Findings: ${patient.neurologicalFindings.join(", ")}
Non-Motor Symptoms: ${patient.nonMotorSymptoms.join(", ")}

You are in a medical appointment with a healthcare provider. Respond authentically as this patient would, staying true to your symptoms, medical history, and personality. Be natural and conversational. If the doctor asks about symptoms, describe them as you experience them. Show appropriate emotional responses to your condition.`

    const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
    }))

    const result = await generateText({
        model: google("gemini-2.0-flash", {
            apiKey: apiKey,
        }),
        system: systemPrompt,
        messages: conversationHistory,
    })

    return result.text
}
