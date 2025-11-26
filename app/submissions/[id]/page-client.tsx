"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { updateSubmissionFeedback } from "@/lib/actions/sessions"
import { runAIGrading } from "@/lib/actions/grading"
import { 
  Loader2, User, Bot, MessageSquare, CheckCircle, 
  Brain, AlertTriangle, ChevronDown, ChevronRight, Sparkles 
} from "lucide-react"
import Link from "next/link"
import type { Message } from "@/lib/types"
import type { RubricCategory } from "@/lib/types/rubric"
import type { AggregatedGrade, AggregatedCategoryScore } from "@/lib/grading"
import { toast } from "sonner"

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
    rubricScores: any | null
    aiGrades: any | null
    requiresReview: boolean
    autoGraded: boolean
    aiGradedAt: Date | null
    instructor: {
      id: string
      name: string | null
      email: string
    }
  }
  isInstructor: boolean
  rubric: {
    id: string
    categories: RubricCategory[]
    totalPoints: number
    passingThreshold: number | null
    autoGradeEnabled: boolean
  } | null
}

export default function SubmissionReviewClient({
  session,
  submittedSession,
  isInstructor,
  rubric,
}: SubmissionReviewClientProps) {
  const [feedback, setFeedback] = useState(submittedSession.feedback || "")
  const [grade, setGrade] = useState(submittedSession.grade || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Parse AI grading results if available
  const [aiGradingResult, setAiGradingResult] = useState<AggregatedGrade | null>(() => {
    if (submittedSession.autoGraded && submittedSession.rubricScores && submittedSession.aiGrades) {
      const averageScores = submittedSession.rubricScores as AggregatedCategoryScore[]
      const judgeGrades = submittedSession.aiGrades as any[]
      const totalScore = averageScores.reduce((sum, cs) => sum + cs.averageScore, 0)
      const maxScore = averageScores.reduce((sum, cs) => sum + cs.maxPoints, 0)
      
      return {
        averageScores,
        totalScore: Math.round(totalScore * 100) / 100,
        maxScore,
        percentageScore: Math.round((totalScore / maxScore) * 100),
        requiresReview: submittedSession.requiresReview,
        flaggedCategories: averageScores
          .filter(cs => cs.disagreementPercent > 0.2)
          .map(cs => cs.category),
        judgeGrades,
        disagreementThreshold: 0.2,
        gradedAt: submittedSession.aiGradedAt ?? new Date(),
      }
    }
    return null
  })

  const messages = session.messages as Message[]

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true)
    setSuccessMessage("")

    try {
      await updateSubmissionFeedback(submittedSession.id, feedback, grade || undefined)
      setSuccessMessage("Feedback saved successfully!")
      toast.success("Feedback saved successfully!")
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Failed to submit feedback:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRunAIGrading = async () => {
    setIsGrading(true)
    try {
      const result = await runAIGrading(submittedSession.id)
      setAiGradingResult(result)
      toast.success("AI grading completed!")
    } catch (error) {
      console.error("Failed to run AI grading:", error)
      toast.error(error instanceof Error ? error.message : "Failed to run AI grading")
    } finally {
      setIsGrading(false)
    }
  }

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
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
            <Link href="/">
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
              <div className="flex items-center gap-2">
                {submittedSession.requiresReview && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Review
                  </Badge>
                )}
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

        {/* AI Grading Section (for instructors) */}
        {isInstructor && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Grading
                  </CardTitle>
                  <CardDescription>
                    {rubric 
                      ? "Use multiple AI judges to grade this submission against the rubric"
                      : "No rubric configured for this patient actor"
                    }
                  </CardDescription>
                </div>
                {rubric && (
                  <Button 
                    onClick={handleRunAIGrading} 
                    disabled={isGrading}
                    variant={aiGradingResult ? "outline" : "default"}
                  >
                    {isGrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Grading...
                      </>
                    ) : aiGradingResult ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Re-run AI Grading
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Run AI Grading
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            
            {/* AI Grading Results */}
            {aiGradingResult && (
              <CardContent className="space-y-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-gray-800">Overall Score</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {aiGradingResult.totalScore} / {aiGradingResult.maxScore}
                    </span>
                  </div>
                  <Progress value={aiGradingResult.percentageScore} className="h-3" />
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{aiGradingResult.percentageScore}%</span>
                    {rubric?.passingThreshold && (
                      <span>
                        {aiGradingResult.percentageScore >= (rubric.passingThreshold / rubric.totalPoints * 100) 
                          ? "✓ Passing" 
                          : "Below passing threshold"
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Disagreement Warning */}
                {aiGradingResult.requiresReview && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Review Required:</strong> AI judges disagreed significantly on: {aiGradingResult.flaggedCategories.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Category Scores */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Category Scores</h4>
                  {aiGradingResult.averageScores.map((categoryScore) => {
                    const isFlagged = aiGradingResult.flaggedCategories.includes(categoryScore.category)
                    const isExpanded = expandedCategories.has(categoryScore.category)
                    const percentage = (categoryScore.averageScore / categoryScore.maxPoints) * 100

                    return (
                      <Collapsible key={categoryScore.category} open={isExpanded}>
                        <div className={`rounded-lg border p-4 ${isFlagged ? 'border-amber-300 bg-amber-50' : 'bg-white'}`}>
                          <CollapsibleTrigger 
                            onClick={() => toggleCategoryExpanded(categoryScore.category)}
                            className="w-full"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <span className="font-medium">{categoryScore.category}</span>
                                {isFlagged && (
                                  <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                                    Disagreement
                                  </Badge>
                                )}
                              </div>
                              <span className="font-semibold">
                                {categoryScore.averageScore.toFixed(1)} / {categoryScore.maxPoints}
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          
                          <div className="mt-2">
                            <Progress value={percentage} className="h-2" />
                          </div>

                          <CollapsibleContent>
                            <div className="mt-4 space-y-3 border-t pt-4">
                              <p className="text-sm text-gray-500">
                                Disagreement: {(categoryScore.disagreementPercent * 100).toFixed(0)}%
                              </p>
                              {categoryScore.judgeScores.map((judgeScore, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-md p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">
                                      {judgeScore.model}
                                    </span>
                                    <span className="text-sm font-semibold">
                                      {judgeScore.score} / {categoryScore.maxPoints}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">{judgeScore.reasoning}</p>
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>

                {/* Judge Summary */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Graded by {aiGradingResult.judgeGrades.length} AI judges: {aiGradingResult.judgeGrades.map(j => j.model).join(", ")}
                  </p>
                  {submittedSession.aiGradedAt && (
                    <p className="text-sm text-gray-500">
                      AI graded on {new Date(submittedSession.aiGradedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Show AI Grading Results for Students (read-only) */}
        {!isInstructor && aiGradingResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Grading Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-gray-800">Overall Score</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {aiGradingResult.totalScore} / {aiGradingResult.maxScore}
                  </span>
                </div>
                <Progress value={aiGradingResult.percentageScore} className="h-3" />
                <p className="text-sm text-gray-600 mt-2">{aiGradingResult.percentageScore}%</p>
              </div>

              <div className="space-y-2">
                {aiGradingResult.averageScores.map((categoryScore) => (
                  <div key={categoryScore.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{categoryScore.category}</span>
                    <span className="text-sm font-medium">
                      {categoryScore.averageScore.toFixed(1)} / {categoryScore.maxPoints}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rubric Reference (for instructors) */}
        {isInstructor && rubric && (
          <Card>
            <CardHeader>
              <CardTitle>Grading Rubric Reference</CardTitle>
              <CardDescription>
                Total Points: {rubric.totalPoints}
                {rubric.passingThreshold && ` | Passing: ${rubric.passingThreshold} points`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rubric.categories.map((category, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{category.name}</h4>
                      <Badge variant="outline">{category.maxPoints} pts</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                    <p className="text-sm text-gray-500 whitespace-pre-wrap">{category.criteria}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
