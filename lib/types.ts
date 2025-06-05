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

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: "student" | "instructor" | "admin"
  student_id: string | null
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  description: string | null
  instructor_id: string
  class_code: string
  created_at: string
  updated_at: string
  instructor_name?: string
  class_enrollments?: any[]
}

export interface ClassEnrollment {
  id: string
  class_id: string
  student_id: string
  enrolled_at: string
}

export interface PatientCase {
  id: string
  name: string
  description: string | null
  patient_data: any
  learning_objectives: string[]
  difficulty_level: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  case_id: string
  class_id: string | null
  status: "active" | "completed" | "paused"
  started_at: string
  completed_at: string | null
  total_duration: number
  objectives_completed: string[]
  conversation_data: any
  patient_cases?: PatientCase
  profiles?: Profile
}

export interface UserProgress {
  id: string
  user_id: string
  case_id: string
  session_id: string
  objective_id: string
  completed_at: string
}
