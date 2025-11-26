import { generateObject } from "ai"
import { z } from "zod"
import { MODELS } from "../llm/models"
import { buildGradingMessages } from "./prompts"
import type { GradingInput, JudgeGrade, CategoryScore } from "./types"

/**
 * Schema for validating LLM grading response
 */
const gradingResponseSchema = z.object({
    categoryScores: z.array(z.object({
        category: z.string(),
        score: z.number(),
        maxPoints: z.number(),
        reasoning: z.string()
    })),
    totalScore: z.number(),
    overallFeedback: z.string()
})

type GradingResponse = z.infer<typeof gradingResponseSchema>

/**
 * Available grading models
 */
export const GRADING_MODELS = {
    "gemini-2.5-flash": MODELS["gemini-2.5-flash"],
    "gemini-2.5-pro": MODELS["gemini-2.5-pro"],
} as const

export type GradingModelName = keyof typeof GRADING_MODELS

/**
 * Default models to use for multi-judge grading
 */
export const DEFAULT_JUDGE_MODELS: GradingModelName[] = [
    "gemini-2.5-flash",
    "gemini-2.5-pro"
]

/**
 * Grade a session with a single model
 */
export async function gradeWithModel(
    modelName: GradingModelName,
    input: GradingInput
): Promise<JudgeGrade> {
    const model = GRADING_MODELS[modelName]
    const { system, user } = buildGradingMessages(input)

    const result = await generateObject({
        model,
        schema: gradingResponseSchema,
        system,
        prompt: user,
    })

    const response = result.object as GradingResponse

    // Calculate max score from rubric
    const maxScore = input.rubric.totalPoints

    // Ensure category scores match rubric categories
    const categoryScores: CategoryScore[] = input.rubric.categories.map(rubricCat => {
        const responseScore = response.categoryScores.find(
            s => s.category.toLowerCase() === rubricCat.name.toLowerCase()
        )

        return {
            category: rubricCat.name,
            score: responseScore?.score ?? 0,
            maxPoints: rubricCat.maxPoints,
            reasoning: responseScore?.reasoning ?? "No reasoning provided"
        }
    })

    // Recalculate total to ensure consistency
    const totalScore = categoryScores.reduce((sum, cat) => sum + cat.score, 0)

    return {
        model: modelName,
        categoryScores,
        totalScore,
        maxScore,
        overallFeedback: response.overallFeedback,
        gradedAt: new Date()
    }
}

/**
 * Run grading with multiple judge models in parallel
 */
export async function runAllJudges(
    input: GradingInput,
    models: GradingModelName[] = DEFAULT_JUDGE_MODELS
): Promise<JudgeGrade[]> {
    // Run all judges in parallel
    const gradingPromises = models.map(modelName =>
        gradeWithModel(modelName, input)
    )

    const results = await Promise.all(gradingPromises)
    return results
}

