import { createClient } from "@/lib/supabase/client"
import type { UserSession, UserProgress } from "@/lib/types"

export class SessionService {
  private supabase = createClient()

  async startSession(userId: string, caseId: string, classId?: string): Promise<string> {
    const { data, error } = await this.supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        case_id: caseId,
        class_id: classId,
        status: "active",
        conversation_data: { messages: [] },
      })
      .select("id")
      .single()

    if (error) throw error
    return data.id
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>) {
    const { error } = await this.supabase.from("user_sessions").update(updates).eq("id", sessionId)

    if (error) throw error
  }

  async completeSession(sessionId: string, totalDuration: number) {
    const { error } = await this.supabase
      .from("user_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_duration: totalDuration,
      })
      .eq("id", sessionId)

    if (error) throw error
  }

  async saveConversation(sessionId: string, messages: any[]) {
    const { error } = await this.supabase
      .from("user_sessions")
      .update({
        conversation_data: { messages },
      })
      .eq("id", sessionId)

    if (error) throw error
  }

  async trackObjectiveCompletion(sessionId: string, userId: string, caseId: string, objectiveId: string) {
    // Add to user_progress table
    const { error: progressError } = await this.supabase.from("user_progress").insert({
      user_id: userId,
      case_id: caseId,
      session_id: sessionId,
      objective_id: objectiveId,
    })

    if (progressError && !progressError.message.includes("duplicate")) {
      throw progressError
    }

    // Update session objectives_completed array
    const { data: session } = await this.supabase
      .from("user_sessions")
      .select("objectives_completed")
      .eq("id", sessionId)
      .single()

    if (session) {
      const updatedObjectives = [...(session.objectives_completed || []), objectiveId]
      await this.updateSession(sessionId, {
        objectives_completed: updatedObjectives,
      })
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    const { data, error } = await this.supabase
      .from("user_sessions")
      .select(`
        *,
        patient_cases (
          name,
          description
        )
      `)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })

    if (error) throw error
    return data as UserSession[]
  }

  async getSessionProgress(sessionId: string): Promise<UserProgress[]> {
    const { data, error } = await this.supabase.from("user_progress").select("*").eq("session_id", sessionId)

    if (error) throw error
    return data as UserProgress[]
  }
}

export const sessionService = new SessionService()
