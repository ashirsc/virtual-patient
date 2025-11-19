"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateSubmissionFeedback } from "@/lib/actions/sessions"
import { Loader2, User, Bot, Calendar, MessageSquare, CheckCircle } from "lucide-react"
import Link from "next/link"
import type { Message } from "@/lib/types"

interface SubmissionReviewClientProps {
  session: {
    id: string
    patientActor: {
      id: string
      name: string
      age: number
    }
    user: {
      id: string
      name: string | null
      email: string
    } | null
    messages: any // JSON field
    messageCount: number
    startedAt: Date
    lastMessageAt: Date
  }
  submittedSession: {
    id: string
    status: string
    grade: string | null
    feedback: string | null
    submittedAt: Date
    reviewedAt: Date | null
    instructor: {
      id: string
      name: string | null
      email: string
    }
  }
  isInstructor: boolean
}

export default function SubmissionReviewClient({
  session,
  submittedSession,
  isInstructor,
}: SubmissionReviewClientProps) {
  const [feedback, setFeedback] = useState(submittedSession.feedback || "")
  const [grade, setGrade] = useState(submittedSession.grade || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const messages = session.messages as Message[]

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true)
    setSuccessMessage("")

    try {
      await updateSubmissionFeedback(submittedSession.id, feedback, grade || undefined)
      setSuccessMessage("Feedback saved successfully!")
      
      // Refresh the page after a delay to show the updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      alert(error instanceof Error ? error.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submission Review</h1>
              <p className="text-sm text-gray-600">
                {isInstructor ? "Review and grade student work" : "View your submission and feedback"}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Submission Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Submission Details</CardTitle>
                <CardDescription>
                  Patient Actor: {session.patientActor.name} (Age {session.patientActor.age})
                </CardDescription>
              </div>
              <Badge
                variant={
                  submittedSession.status === "graded"
                    ? "default"
                    : submittedSession.status === "reviewed"
                      ? "secondary"
                      : "outline"
                }
                className="text-lg px-4 py-1"
              >
                {submittedSession.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-medium">{session.user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-medium">{submittedSession.instructor.name || submittedSession.instructor.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{new Date(submittedSession.submittedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="font-medium">{session.messageCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Feedback Section (for instructors or to display existing feedback) */}
        {isInstructor ? (
          <Card>
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <CardDescription>Grade and provide comments on the student's performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade">Grade (Optional)</Label>
                <Input
                  id="grade"
                  placeholder="e.g., A, B+, 95%, Pass, etc."
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback on the student's interview technique, diagnostic approach, communication skills, etc."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={8}
                />
              </div>
              <Button onClick={handleSubmitFeedback} disabled={isSubmitting || !feedback.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Feedback"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          submittedSession.feedback && (
            <Card>
              <CardHeader>
                <CardTitle>Instructor Feedback</CardTitle>
                {submittedSession.grade && (
                  <div className="mt-2">
                    <Badge variant="default" className="text-lg px-4 py-1">
                      Grade: {submittedSession.grade}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{submittedSession.feedback}</p>
                {submittedSession.reviewedAt && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Reviewed on {new Date(submittedSession.reviewedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        )}

        {/* Conversation Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation Transcript
            </CardTitle>
            <CardDescription>
              Complete conversation between student and patient actor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.role === "user" ? "Student" : session.patientActor.name}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Session Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Session Started</p>
                <p className="font-medium">
                  {new Date(session.startedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Message</p>
                <p className="font-medium">
                  {new Date(session.lastMessageAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {Math.round(
                    (new Date(session.lastMessageAt).getTime() - new Date(session.startedAt).getTime()) /
                      60000
                  )}{" "}
                  minutes
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Exchanges</p>
                <p className="font-medium">{Math.floor(session.messageCount / 2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

