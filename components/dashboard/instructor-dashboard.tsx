"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/context"
import type { Class, UserSession } from "@/lib/types"
import Link from "next/link"

export default function InstructorDashboard() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [studentSessions, setStudentSessions] = useState<UserSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return

      // Fetch instructor's classes
      const { data: classData } = await supabase
        .from("classes")
        .select(`
          *,
          class_enrollments (
            count
          )
        `)
        .eq("instructor_id", profile.id)

      if (classData) {
        setClasses(classData as Class[])
      }

      // Fetch recent student sessions from instructor's classes
      const { data: sessionData } = await supabase
        .from("user_sessions")
        .select(`
          *,
          profiles (
            full_name
          ),
          patient_cases (
            name
          )
        `)
        .in("class_id", classData?.map((c) => c.id) || [])
        .order("started_at", { ascending: false })
        .limit(10)

      if (sessionData) {
        setStudentSessions(sessionData as UserSession[])
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
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <p className="text-muted-foreground">Manage your classes and monitor student progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>{classes.length} active classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">Code: {cls.class_code}</p>
                  </div>
                  <Badge variant="outline">{cls.class_enrollments?.length || 0} students</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
            <CardDescription>Latest practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-2 border rounded">
                  <p className="font-medium">{session.profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{session.patient_cases?.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant={session.status === "completed" ? "default" : "secondary"}>{session.status}</Badge>
                    <p className="text-xs text-muted-foreground">{new Date(session.started_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/classes/create">
              <Button className="w-full">Create New Class</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
            <Link href="/cases">
              <Button variant="outline" className="w-full">
                Manage Cases
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
