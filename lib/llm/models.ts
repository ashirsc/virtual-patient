import { google } from "@ai-sdk/google";


// Initialize Google AI with API key from environment
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

if (!apiKey) {
    console.error(
        "❌ Google Generative AI API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file."
    )
}


export const MODELS = {
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
}