import type { JudgeGrade, AggregatedGrade, AggregatedCategoryScore } from "./types"

/**
 * Default threshold for disagreement detection (20%)
 */
export const DEFAULT_DISAGREEMENT_THRESHOLD = 0.2

/**
 * Calculate disagreement percentage between judges for a category
 * Returns the range (max - min) as a percentage of max points
 */
function calculateDisagreementPercent(
    scores: number[],
    maxPoints: number
): number {
    if (scores.length <= 1 || maxPoints === 0) return 0

    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const range = maxScore - minScore

    return range / maxPoints
}

/**
 * Aggregate scores from multiple judges
 */
export function aggregateGrades(
    judgeGrades: JudgeGrade[],
    threshold: number = DEFAULT_DISAGREEMENT_THRESHOLD
): AggregatedGrade {
    if (judgeGrades.length === 0) {
        throw new Error("Cannot aggregate empty judge grades")
    }

    // Get all unique category names from first judge (they should all have same categories)
    const categories = judgeGrades[0].categoryScores.map(cs => cs.category)
    const maxScore = judgeGrades[0].maxScore

    // Aggregate each category
    const averageScores: AggregatedCategoryScore[] = categories.map(category => {
        // Collect scores from all judges for this category
        const judgeScoresForCategory = judgeGrades.map(jg => {
            const catScore = jg.categoryScores.find(cs => cs.category === category)
            return {
                model: jg.model,
                score: catScore?.score ?? 0,
                reasoning: catScore?.reasoning ?? ""
            }
        })

        const scores = judgeScoresForCategory.map(js => js.score)
        const maxPoints = judgeGrades[0].categoryScores.find(cs => cs.category === category)?.maxPoints ?? 0

        // Calculate average
        const averageScore = scores.reduce((sum, s) => sum + s, 0) / scores.length

        // Calculate disagreement
        const disagreementPercent = calculateDisagreementPercent(scores, maxPoints)

        return {
            category,
            averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
            maxPoints,
            disagreementPercent: Math.round(disagreementPercent * 100) / 100,
            judgeScores: judgeScoresForCategory
        }
    })

    // Calculate total score
    const totalScore = averageScores.reduce((sum, cs) => sum + cs.averageScore, 0)
    const roundedTotalScore = Math.round(totalScore * 100) / 100

    // Find flagged categories (disagreement above threshold)
    const flaggedCategories = averageScores
        .filter(cs => cs.disagreementPercent > threshold)
        .map(cs => cs.category)

    // Determine if review is required
    const requiresReview = flaggedCategories.length > 0

    return {
        averageScores,
        totalScore: roundedTotalScore,
        maxScore,
        percentageScore: Math.round((roundedTotalScore / maxScore) * 100),
        requiresReview,
        flaggedCategories,
        judgeGrades,
        disagreementThreshold: threshold,
        gradedAt: new Date()
    }
}

/**
 * Get a summary of the grading result for display
 */
export function getGradingSummary(grade: AggregatedGrade): string {
    const { totalScore, maxScore, percentageScore, requiresReview, flaggedCategories } = grade

    let summary = `Score: ${totalScore}/${maxScore} (${percentageScore}%)`

    if (requiresReview) {
        summary += `\n⚠️ Requires Review - Judges disagreed on: ${flaggedCategories.join(", ")}`
    }

    return summary
}

