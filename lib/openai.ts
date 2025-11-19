import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import type { Message } from "./types"

export interface PatientActor {
    name: string
    age: number
    prompt: string
}

export async function generatePatientResponse(
    patient: PatientActor,
    messages: Message[]
): Promise<string> {
    // Use the prompt directly as the system prompt
    const systemPrompt = patient.prompt

    const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
    }))

    const result = await generateText({
        model: openai("gpt-4o") as any,
        system: systemPrompt,
        messages: conversationHistory,
    })

    return result.text
}
