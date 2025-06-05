"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/context"
import type { Class, UserSession } from "@/lib/types"
import Link from "next/link"

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [recentSessions, setRecentSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return

      // Fetch enrolled classes
      const { data: classData } = await supabase
        .from("class_enrollments")
        .select(`
          classes (
            id,
            name,
            description,
            class_code,
            instructor_id,
            profiles!classes_instructor_id_fkey (
              full_name
            )
          )
        `)
        .eq("student_id", profile.id)

      if (classData) {
        setClasses(
          classData.map((item) => ({
            ...item.classes,
            instructor_name: item.classes.profiles?.full_name,
          })) as Class[],
        )
      }

      // Fetch recent sessions
      const { data: sessionData } = await supabase
        .from("user_sessions")
        .select(`
          *,
          patient_cases (
            name,
            description
          )
        `)
        .eq("user_id", profile.id)
        .order("started_at", { ascending: false })
        .limit(5)

      if (sessionData) {
        setRecentSessions(sessionData as UserSession[])
      }

      setLoading(false)
    }

    fetchData()
  }, [profile])

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name}</h1>
        <p className="text-muted-foreground">Continue your medical education journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enrolled Classes</CardTitle>
            <CardDescription>{classes.length} active classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">Instructor: {cls.instructor_name}</p>
                  </div>
                  <Badge variant="outline">{cls.class_code}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div key={session.id} className="p-2 border rounded">
                  <p className="font-medium">{session.patient_cases?.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant={session.status === "completed" ? "default" : "secondary"}>{session.status}</Badge>
                    <p className="text-sm text-muted-foreground">{new Date(session.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start practicing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/simulation">
              <Button className="w-full">Start New Session</Button>
            </Link>
            <Link href="/progress">
              <Button variant="outline" className="w-full">
                View Progress
              </Button>
            </Link>
            <Link href="/classes">
              <Button variant="outline" className="w-full">
                Browse Classes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
