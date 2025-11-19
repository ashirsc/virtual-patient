export interface Patient {
  id: string
  demographics: string
  chiefComplaint: string
  medicalHistory: string[]
  medications: string[]
  personality: string
  socialHistory: string
  neurologicalFindings: string[]
  nonMotorSymptoms: string[]
}

export interface Message {
  role: "user" | "assistant"
  content: string
}

export type UserRole = "student" | "instructor" | "admin"
