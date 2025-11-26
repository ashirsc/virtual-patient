import type { GradingInput } from "./types"

/**
 * Build the system prompt for grading a chat session
 */
export function buildGradingSystemPrompt(): string {
    return `You are an expert medical education evaluator. Your task is to grade a student's performance in a simulated patient interview based on a provided rubric.

## Your Role
- You are evaluating a medical student's interview with a simulated patient (virtual patient)
- The "user" messages are from the student conducting the interview
- The "assistant" messages are from the simulated patient responding

## Grading Guidelines
1. Evaluate ONLY the student's performance (user messages), not the patient's responses
2. For each rubric category, assess how well the student met the criteria
3. Provide specific evidence from the transcript to support your scores
4. Be fair but rigorous - students should demonstrate competency to earn full points
5. Consider both what was asked AND how it was asked (communication style, empathy, etc.)

## Scoring Scale
- For each category, score from 0 to the maximum points allowed
- 0 = Did not address this area at all
- 25% of max = Minimal attempt, significant gaps
- 50% of max = Partial completion, some important elements missing
- 75% of max = Good performance with minor gaps
- 100% of max = Excellent, comprehensive coverage

## Response Format
You must respond with valid JSON matching the exact structure requested. Do not include any text before or after the JSON.`
}

/**
 * Build the user prompt with the rubric and transcript
 */
export function buildGradingUserPrompt(input: GradingInput): string {
    const { transcript, rubric, patientContext } = input

    // Format the rubric categories
    const rubricSection = rubric.categories.map((cat, idx) =>
        `### Category ${idx + 1}: ${cat.name} (${cat.maxPoints} points)
**Description:** ${cat.description}
**Criteria:** ${cat.criteria}`
    ).join("\n\n")

    // Format the transcript
    const transcriptSection = transcript.map((msg, idx) => {
        const role = msg.role === "user" ? "STUDENT" : "PATIENT"
        return `[${role}]: ${msg.content}`
    }).join("\n\n")

    // Build patient context section if available
    const contextSection = patientContext
        ? `## Patient Context
- Name: ${patientContext.name}
- Age: ${patientContext.age}
- Chief Complaint: ${patientContext.chiefComplaint}

`
        : ""

    return `${contextSection}## Grading Rubric (Total: ${rubric.totalPoints} points)

${rubricSection}

## Chat Transcript to Evaluate

${transcriptSection}

## Your Task

Grade the student's performance in the above transcript according to each rubric category. For each category:
1. Assign a score from 0 to the maximum points
2. Provide specific reasoning with evidence from the transcript

Respond with a JSON object in this exact format:
{
  "categoryScores": [
    {
      "category": "Category Name",
      "score": <number>,
      "maxPoints": <number>,
      "reasoning": "Specific explanation with evidence from transcript"
    }
  ],
  "totalScore": <sum of all category scores>,
  "overallFeedback": "A 2-3 sentence summary of the student's overall performance"
}`
}

/**
 * Build complete messages array for the grading LLM call
 */
export function buildGradingMessages(input: GradingInput): {
    system: string
    user: string
} {
    return {
        system: buildGradingSystemPrompt(),
        user: buildGradingUserPrompt(input)
    }
}

