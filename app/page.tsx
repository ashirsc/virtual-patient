"use client"

import { useAuth } from "@/lib/auth/context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import StudentDashboard from "@/components/dashboard/student-dashboard"
import InstructorDashboard from "@/components/dashboard/instructor-dashboard"
import PatientProfile from "@/components/patient-profile"
import ChatInterface from "@/components/chat-interface"
import ObjectivesPanel from "@/components/objectives-panel"
import { patientData } from "@/lib/patient-data"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Medical Education Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.full_name} ({profile.role})
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {profile.role === "student" && <StudentDashboard />}
        {profile.role === "instructor" && <InstructorDashboard />}

        {/* Show simulation interface if accessing directly */}
        {typeof window !== "undefined" && window.location.pathname === "/simulation" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-1">
              <PatientProfile patient={patientData} />
              <ObjectivesPanel className="mt-6" />
            </div>
            <div className="lg:col-span-2">
              <ChatInterface />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
