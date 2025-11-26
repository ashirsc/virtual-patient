/**
 * Utility functions for parsing and generating patient actor prompts
 */

export interface StructuredPrompt {
    // Tab 1: Patient Profile
    demographics: string
    chiefComplaint: string
    medicalHistory: string
    medications: string
    socialHistory: string
    personality: string

    // Tab 2: Clinical Findings
    physicalFindings: string
    additionalSymptoms: string

    // Tab 3: Behavior Settings
    revelationLevel: 'forthcoming' | 'moderate' | 'reserved'
    stayInCharacter: boolean
    avoidMedicalJargon: boolean
    provideFeedback: boolean
    customInstructions: string
}

export const DEFAULT_STRUCTURED_PROMPT: StructuredPrompt = {
    demographics: '',
    chiefComplaint: '',
    medicalHistory: '',
    medications: '',
    socialHistory: '',
    personality: '',
    physicalFindings: '',
    additionalSymptoms: '',
    revelationLevel: 'moderate',
    stayInCharacter: true,
    avoidMedicalJargon: true,
    provideFeedback: true,
    customInstructions: '',
}

/**
 * Generate a complete prompt from structured data
 */
export function generateVPSystemPrompt(data: StructuredPrompt): string {
    const sections: string[] = []

    // Patient Profile Section
    if (data.demographics) {
        sections.push(`**Demographics:** ${data.demographics}`)
    }

    if (data.chiefComplaint) {
        sections.push(`**Chief Complaint:** "${data.chiefComplaint}"`)
    }

    if (data.medicalHistory) {
        sections.push(`**Medical History:** ${data.medicalHistory}`)
    }

    if (data.medications) {
        sections.push(`**Current Medications:** ${data.medications}`)
    }

    if (data.socialHistory) {
        sections.push(`**Social History:** ${data.socialHistory}`)
    }

    if (data.personality) {
        sections.push(`**Personality:** ${data.personality}`)
    }

    // Clinical Findings Section
    if (data.physicalFindings) {
        sections.push(`\n**Physical/Neurological Findings:**\n${data.physicalFindings}`)
    }

    if (data.additionalSymptoms) {
        sections.push(`**Additional Symptoms:**\n${data.additionalSymptoms}`)
    }

    // Behavior Instructions
    const behaviorInstructions: string[] = []

    // Revelation level instructions
    if (data.revelationLevel === 'forthcoming') {
        behaviorInstructions.push(
            'Provide detailed information readily when asked. Be open and communicative about symptoms and concerns.'
        )
    } else if (data.revelationLevel === 'reserved') {
        behaviorInstructions.push(
            'Only reveal information when directly asked specific questions. Provide brief, minimal responses initially. Require follow-up questions to elaborate on symptoms.'
        )
    } else { // moderate
        behaviorInstructions.push(
            'Provide concise responses initially. Offer more details when asked follow-up questions. Balance between being helpful and realistic.'
        )
    }

    if (data.stayInCharacter) {
        behaviorInstructions.push(
            'Stay in character at all times throughout the encounter.',
            'Respond only as the patient would, not as a medical professional.'
        )
    }

    if (data.avoidMedicalJargon) {
        behaviorInstructions.push(
            'Avoid using medical jargon unless it\'s plausible the patient has been told it by a doctor.',
            'Express confusion if asked about technical medical terms you wouldn\'t know.',
            'Ask the student to explain or clarify medical terms you don\'t understand.'
        )
    }

    behaviorInstructions.push(
        'Be consistent with your medical history and symptoms.',
        'If asked about symptoms not in your profile, politely indicate you don\'t have those symptoms.',
        'Keep responses conversational and natural (1-3 sentences typically).'
    )

    if (data.provideFeedback) {
        behaviorInstructions.push(
            '\n**End of Encounter Feedback:**',
            'If the user indicates the encounter is over, provide constructive feedback on:',
            '- History taking',
            '- Communication and interpersonal skills',
            '- Clinical reasoning and decision making',
            '- Explanation and patient education',
            '- Professionalism',
            '- Overall rating out of 10'
        )
    }

    if (behaviorInstructions.length > 0) {
        sections.push(`\n**Instructions for Interaction:**\n${behaviorInstructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`)
    }

    // Custom instructions
    if (data.customInstructions) {
        sections.push(`\n**Additional Instructions:**\n${data.customInstructions}`)
    }

    return sections.join('\n\n')
}


