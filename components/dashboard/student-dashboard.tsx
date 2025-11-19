"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/context"
import { getStudentSessions } from "@/lib/actions/sessions"
import Link from "next/link"
import { Loader2, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react"

type SessionWithDetails = Awaited<ReturnType<typeof getStudentSessions>>[0]

export default function StudentDashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getStudentSessions()
        setSessions(data)
      } catch (error) {
        console.error("Failed to fetch sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSessions()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const submittedSessions = sessions.filter((s) => s.submittedSession)
  const recentSessions = sessions.slice(0, 5)
  const pendingReview = submittedSessions.filter((s) => s.submittedSession?.status === "pending")
  const gradedSessions = submittedSessions.filter((s) => s.submittedSession?.status === "graded")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || "Student"}</h1>
        <p className="text-muted-foreground">Continue your medical education journey</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReview.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedSessions.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Your latest practice sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{session.patientActor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.messageCount} messages • {new Date(session.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                    {session.submittedSession && (
                      <Badge
                        variant={
                          session.submittedSession.status === "graded"
                            ? "default"
                            : session.submittedSession.status === "reviewed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {session.submittedSession.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No sessions yet. Start a new conversation with a patient actor!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Submitted for grading</CardDescription>
          </CardHeader>
          <CardContent>
            {submittedSessions.length > 0 ? (
              <div className="space-y-3">
                {submittedSessions.slice(0, 5).map((session) => (
                  <Link key={session.id} href={`/submissions/${session.submittedSession!.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{session.patientActor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(session.submittedSession!.submittedAt).toLocaleDateString()}
                        </p>
                        {session.submittedSession!.grade && (
                          <p className="text-sm font-medium text-green-600">Grade: {session.submittedSession!.grade}</p>
                        )}
                      </div>
                      <Badge
                        variant={
                          session.submittedSession!.status === "graded"
                            ? "default"
                            : session.submittedSession!.status === "reviewed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {session.submittedSession!.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete a session and submit it for grading.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start practicing</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href="/">
            <Button>Browse Patient Actors</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
