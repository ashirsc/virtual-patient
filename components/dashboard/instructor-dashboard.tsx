"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth/context"
import { getSubmittedSessions } from "@/lib/actions/sessions"
import Link from "next/link"
import { Loader2, FileText, Clock, CheckCircle, GraduationCap } from "lucide-react"

type SubmissionWithDetails = Awaited<ReturnType<typeof getSubmittedSessions>>[0]

export default function InstructorDashboard() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getSubmittedSessions()
        setSubmissions(data)
      } catch (error) {
        console.error("Failed to fetch submissions:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSubmissions()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "pending")
  const reviewedSubmissions = submissions.filter((s) => s.status === "reviewed")
  const gradedSubmissions = submissions.filter((s) => s.status === "graded")
  const recentSubmissions = submissions.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        <p className="text-muted-foreground">Manage your classes and monitor student progress</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewedSubmissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedSubmissions.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Pending Submissions - Priority */}
        {pendingSubmissions.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending Submissions
              </CardTitle>
              <CardDescription>These submissions need your review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingSubmissions.map((submission) => (
                  <Link key={submission.id} href={`/submissions/${submission.id}`}>
                    <div className="flex items-center justify-between p-4 bg-white border border-orange-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {submission.chatSession.user?.name || "Unknown Student"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {submission.chatSession.patientActor.name} •{" "}
                          {submission.chatSession.messageCount} messages
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {new Date(submission.submittedAt).toLocaleDateString()} at{" "}
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>All student submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <Link key={submission.id} href={`/submissions/${submission.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {submission.chatSession.user?.name || "Unknown Student"}
                          </p>
                          <Badge
                            variant={
                              submission.status === "graded"
                                ? "default"
                                : submission.status === "reviewed"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Patient: {submission.chatSession.patientActor.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {submission.chatSession.messageCount} messages
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                          {submission.grade && (
                            <p className="text-xs font-medium text-green-600">Grade: {submission.grade}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No submissions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Student submissions will appear here once they submit their sessions.
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
          <CardDescription>Manage patient actors and cases</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Link href="/">
            <Button>View Patient Actors</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
