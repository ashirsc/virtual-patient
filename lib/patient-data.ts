import type { Patient } from "./types"

export const patients: Patient[] = [
  {
    id: "PT-2023-0055",
    demographics: "55-year-old male",
    chiefComplaint: "Slowing down and resting tremor in both hands",
    medicalHistory: [
      "Hypertension (diagnosed 5 years ago)",
      "Sleep issues (REM sleep behavior disorder)",
      "Parkinsonian symptoms (onset 1 year ago)",
    ],
    medications: ["Amlodipine 5 mg daily", "Melatonin 3 mg at bedtime"],
    personality: "Soft-spoken, slightly withdrawn, occasionally frustrated by symptoms",
    socialHistory: "Lives with spouse, retired school teacher, previously active in community",
    neurologicalFindings: [
      "Bradykinesia (slowness of movement)",
      "Cogwheel rigidity in upper extremities",
      "Reduced arm swing while walking",
      "Resting tremor in both hands (right > left)",
    ],
    nonMotorSymptoms: [
      "REM sleep behavior disorder (acting out dreams)",
      "Constipation (3 years duration)",
      "Anosmia (loss of smell, 2 years duration)",
    ],
  },
  {
    id: "PT-2023-0108",
    demographics: "62-year-old female",
    chiefComplaint: "Memory loss and difficulty with daily tasks",
    medicalHistory: [
      "Type 2 Diabetes (10 years)",
      "Hypertension (8 years)",
      "History of depression (treated)",
    ],
    medications: ["Metformin 1000 mg twice daily", "Lisinopril 10 mg daily", "Sertraline 50 mg daily"],
    personality: "Worried, apologetic, sometimes repeats herself, concerned about independence",
    socialHistory: "Widow, lives alone, has two adult children nearby, enjoys gardening",
    neurologicalFindings: [
      "Mild cognitive impairment on screening",
      "Difficulty with executive function",
      "Normal gait and coordination",
    ],
    nonMotorSymptoms: [
      "Forgetfulness (misplacing items, forgetting appointments)",
      "Mood fluctuations",
      "Sleep disturbance",
    ],
  },
  {
    id: "PT-2023-0042",
    demographics: "48-year-old male",
    chiefComplaint: "Severe headaches and vision changes",
    medicalHistory: [
      "Migraines (since age 25)",
      "No prior head trauma",
      "Family history of stroke",
    ],
    medications: ["Sumatriptan as needed", "Propranolol 80 mg daily"],
    personality: "Anxious, detail-oriented, describes symptoms precisely, somewhat pessimistic",
    socialHistory: "Works in tech, high stress job, married with two children, exercises irregularly",
    neurologicalFindings: [
      "Photophobia during episodes",
      "Normal cranial nerves",
      "Neck stiffness not present",
    ],
    nonMotorSymptoms: [
      "Nausea and vomiting with headaches",
      "Aura (flashing lights) before onset",
      "Fatigue after episodes",
    ],
  },
  {
    id: "PT-2023-0076",
    demographics: "71-year-old female",
    chiefComplaint: "Weakness and difficulty walking",
    medicalHistory: [
      "Rheumatoid arthritis (20 years)",
      "Osteoporosis",
      "History of falls (2 times in past year)",
    ],
    medications: [
      "Methotrexate weekly",
      "Prednisone 5 mg daily",
      "Calcium and Vitamin D supplements",
      "Alendronate weekly",
    ],
    personality: "Determined, independent-minded, sometimes minimizes symptoms, has dry humor",
    socialHistory: "Active in church, volunteers at community center, lives with son",
    neurologicalFindings: [
      "Mild weakness in lower extremities",
      "Reduced balance and proprioception",
      "Slow gait with shortened stride",
    ],
    nonMotorSymptoms: [
      "Joint pain and stiffness",
      "Fatigue",
      "Occasional dizziness on standing",
    ],
  },
]

export function getPatientById(id: string): Patient | undefined {
  return patients.find((p) => p.id === id)
}
