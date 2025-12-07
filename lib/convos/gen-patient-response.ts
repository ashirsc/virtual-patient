
import type { Message } from "../types"
import { generateVPSystemPrompt } from "./prompt-utils"
import type { StructuredPrompt } from "./prompt-utils"
import { MODELS } from "../llm/models"
import { generateText } from "../llm/ai-traced"



export interface PatientActor {
    name: string
    age: number
    demographics: string
    chiefComplaint: string
    medicalHistory: string
    medications: string
    socialHistory: string
    personality: string
    physicalFindings: string
    additionalSymptoms: string
    revelationLevel: string
    stayInCharacter: boolean
    avoidMedicalJargon: boolean
    provideFeedback: boolean
    customInstructions: string
    prompt?: string | null // Legacy field for backward compatibility
}

export async function generatePatientResponse(
    patient: PatientActor,
    messages: Message[]
): Promise<string> {


    // Build system prompt from structured fields
    const structuredData: StructuredPrompt = {
        name: patient.name,
        demographics: patient.demographics || '',
        chiefComplaint: patient.chiefComplaint || '',
        medicalHistory: patient.medicalHistory || '',
        medications: patient.medications || '',
        socialHistory: patient.socialHistory || '',
        personality: patient.personality || '',
        physicalFindings: patient.physicalFindings || '',
        additionalSymptoms: patient.additionalSymptoms || '',
        revelationLevel: (patient.revelationLevel as 'forthcoming' | 'moderate' | 'reserved') || 'moderate',
        stayInCharacter: patient.stayInCharacter ?? true,
        avoidMedicalJargon: patient.avoidMedicalJargon ?? true,
        provideFeedback: patient.provideFeedback ?? true,
        customInstructions: patient.customInstructions || '',
    }

    // Generate the system prompt dynamically
    const systemPrompt = generateVPSystemPrompt(structuredData)

    const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
    }))

    const result = await generateText({
        model: MODELS["gemini-2.5-flash"],
        system: systemPrompt,
        messages: conversationHistory,
    })

    return result.text
}
