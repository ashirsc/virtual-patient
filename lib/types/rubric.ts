export interface RubricCategory {
    name: string
    description: string
    maxPoints: number
    criteria: string
}

export interface RubricData {
    categories: RubricCategory[]
    totalPoints: number
    passingThreshold?: number
    autoGradeEnabled: boolean
}

/**
 * Standard OSCE rubric template
 */
export const STANDARD_OSCE_RUBRIC: RubricCategory[] = [
    {
        name: "History Taking",
        description: "Gathering relevant patient information",
        maxPoints: 10,
        criteria: "Asked appropriate questions, obtained comprehensive history, followed logical sequence"
    },
    {
        name: "Communication Skills",
        description: "Interpersonal and communication abilities",
        maxPoints: 10,
        criteria: "Clear communication, active listening, empathy, appropriate language level"
    },
    {
        name: "Clinical Reasoning",
        description: "Diagnostic thinking and problem-solving",
        maxPoints: 10,
        criteria: "Logical differential diagnosis, appropriate follow-up questions, clinical judgment"
    },
    {
        name: "Professionalism",
        description: "Professional behavior and ethics",
        maxPoints: 10,
        criteria: "Respectful manner, appropriate boundaries, ethical considerations"
    },
    {
        name: "Patient Education",
        description: "Explaining and educating the patient",
        maxPoints: 10,
        criteria: "Clear explanations, checked understanding, provided appropriate guidance"
    }
]

/**
 * FPCC Complete History rubric template
 * Based on Society Advisor Direct Observation Assessment
 * Scoring: ME (Meets Expectations) = 2pts, NI (Needs Improvement) = 1pt, DNM (Does Not Meet Expectations) = 0pt
 */
export const FPCC_COMPLETE_HISTORY_RUBRIC: RubricCategory[] = [
    {
        name: "Introduction",
        description: "Initial patient interaction and rapport building",
        maxPoints: 8,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Introduces self to patient
• Confirms how patient prefers to be addressed (i.e. first name, Mr/Mrs X)
• Asks patient's age
• If applicable: confirms patient's pronouns`
    },
    {
        name: "Chief Complaint",
        description: "Identifying the patient's primary concerns",
        maxPoints: 6,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Elicits a clear chief complaint
• Identifies other concerns by asking "what else?"
• Sets agenda for the visit`
    },
    {
        name: "History of Present Illness",
        description: "Detailed exploration of current symptoms (CLODIIERRS)",
        maxPoints: 22,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Assesses course, chronology (CLODIIERRS)
• Assesses location
• Assesses onset
• Assesses duration
• Assesses intensity/severity
• Assesses impact on lifestyle
• Assesses exacerbating factors
• Assesses relieving factors
• Assesses radiation
• Assesses associated symptoms
• May identify and ask PMH, FH, SH, and ROS relevant to CC and HPI`
    },
    {
        name: "Past Medical History",
        description: "Previous medical conditions and health maintenance",
        maxPoints: 14,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Identifies active medical problems
• Identifies former medical problems
• Identifies prior hospitalizations
• Identifies prior surgeries
• Identifies OB/Gyn history (if applicable): pregnancies, birth history
• Identifies pediatric history (if applicable): birth history, immunizations, developmental milestones
• Identifies relevant preventive topics (if applicable): cancer screenings, immunizations`
    },
    {
        name: "Medications",
        description: "Current medication use",
        maxPoints: 4,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Identifies all prescription medications with dose and frequency
• Identifies OTC and herbal medicines`
    },
    {
        name: "Allergies",
        description: "Drug allergies and relationship to medical history",
        maxPoints: 4,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Identifies all drug allergies and reactions
• Explores relationship between PMH and CC (Ex: have you had anything like this before? Do you think this is related to one of your chronic conditions?)`
    },
    {
        name: "Family History",
        description: "Hereditary and familial health patterns",
        maxPoints: 6,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Identifies medical conditions in first-degree relatives
• Explores important causes of mortality in US – heart disease, diabetes, cancer
• Identifies important familial risk factors related to CC/HPI (ex: Does anything like this run in your family?)`
    },
    {
        name: "Social History",
        description: "Lifestyle, habits, and social determinants of health",
        maxPoints: 16,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Quantify and detail use of alcohol
• Quantify and detail use of tobacco products
• Quantify and detail use of illicit drugs
• Asks about diet and exercise
• Elicits household composition
• Elicits sexual history and intimate partner violence
• Expanded social history which could include relationship status, housing, activities/hobbies, education, work, major stressors, sleep, travel history, religion/spirituality/culture, etc.
• Identifies important risk factors for the CC/HPI (ex: has anything in your daily routine changed that could be contributing to these symptoms?)`
    },
    {
        name: "Review of Systems",
        description: "Comprehensive systems review",
        maxPoints: 2,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Reflects on all relevant systems`
    },
    {
        name: "Conclusion",
        description: "Closing the interview and summarizing findings",
        maxPoints: 6,
        criteria: `Scoring: ME (2pts), NI (1pt), DNM (0pt) per item
• Invites questions and further comments
• Elicits patient's concerns or expectations about the visit
• Summarizes`
    }
]

