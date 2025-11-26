/**
 * Score for a single rubric category from a judge
 */
export interface CategoryScore {
    category: string
    score: number
    maxPoints: number
    reasoning: string
}

/**
 * Complete grading result from a single LLM judge
 */
export interface JudgeGrade {
    model: string
    categoryScores: CategoryScore[]
    totalScore: number
    maxScore: number
    overallFeedback: string
    gradedAt: Date
}

/**
 * Averaged score for a single category across all judges
 */
export interface AggregatedCategoryScore {
    category: string
    averageScore: number
    maxPoints: number
    /** Percentage difference between highest and lowest judge scores */
    disagreementPercent: number
    /** Individual judge scores for this category */
    judgeScores: {
        model: string
        score: number
        reasoning: string
    }[]
}

/**
 * Final aggregated grading result combining all judges
 */
export interface AggregatedGrade {
    averageScores: AggregatedCategoryScore[]
    totalScore: number
    maxScore: number
    /** Percentage score (totalScore / maxScore * 100) */
    percentageScore: number
    /** True if any category has disagreement > threshold */
    requiresReview: boolean
    /** Categories that have significant judge disagreement */
    flaggedCategories: string[]
    /** Individual judge grades for reference */
    judgeGrades: JudgeGrade[]
    /** Threshold used for disagreement detection (e.g., 0.2 for 20%) */
    disagreementThreshold: number
    gradedAt: Date
}

/**
 * Input for grading: the transcript and rubric
 */
export interface GradingInput {
    transcript: {
        role: "user" | "assistant"
        content: string
    }[]
    rubric: {
        categories: {
            name: string
            description: string
            maxPoints: number
            criteria: string
        }[]
        totalPoints: number
        passingThreshold?: number
    }
    patientContext?: {
        name: string
        age: number
        chiefComplaint: string
    }
}

