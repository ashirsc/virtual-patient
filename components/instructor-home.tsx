"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  FileText, 
  Clock, 
  GraduationCap,
  Stethoscope,
  ChevronRight,
  Plus,
  Loader2,
  AlertTriangle,
  UserCog
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signOut } from "@/lib/auth-client"
import type { PatientActor } from "@/lib/generated/client"

type SubmissionWithDetails = {
  id: string
  status: string
  grade: string | null
  feedback: string | null
  submittedAt: Date
  requiresReview: boolean
  autoGraded: boolean
  chatSession: {
    id: string
    messageCount: number
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
  }
}

interface InstructorHomeProps {
  patientActors: PatientActor[]
  submissions: SubmissionWithDetails[]
  userName: string | null
  isAdmin?: boolean
}

export default function InstructorHome({ patientActors, submissions, userName, isAdmin = false }: InstructorHomeProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleViewChange = (view: string) => {
    document.cookie = `adminView=${view}; path=/`
    router.refresh()
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  const pendingSubmissions = submissions.filter(s => s.status === "pending")
  const reviewedSubmissions = submissions.filter(s => s.status === "reviewed")
  const gradedSubmissions = submissions.filter(s => s.status === "graded")
  const flaggedSubmissions = submissions.filter(s => s.requiresReview)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string, requiresReview: boolean) => {
    if (requiresReview) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Needs Review</Badge>
    }
    switch (status) {
      case "graded":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Graded</Badge>
      case "reviewed":
        return <Badge variant="secondary">Reviewed</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instructor Dashboard</h1>
              <p className="text-sm text-gray-600">
                {userName ? `Welcome back, ${userName}` : 'Manage your patient actors and review submissions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Tabs defaultValue="instructor" onValueChange={handleViewChange}>
                  <TabsList>
                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                    <TabsTrigger value="student">Student</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {isAdmin && (
                <Link href="/admin/users">
                  <Button variant="outline" className="gap-2">
                    <UserCog className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patient Actors</CardTitle>
              <Stethoscope className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patientActors.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSubmissions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Graded</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradedSubmissions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Needs Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flaggedSubmissions.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Submissions - Priority */}
          <div className="lg:col-span-2 space-y-6">
            {/* Flagged Submissions */}
            {flaggedSubmissions.length > 0 && (
              <Card className="bg-red-50/70 backdrop-blur-sm border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Flagged for Review
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    AI grading disagreement - manual review recommended
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {flaggedSubmissions.slice(0, 3).map((submission) => (
                    <Link key={submission.id} href={`/submissions/${submission.id}`}>
                      <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {submission.chatSession.user?.name || "Unknown Student"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {submission.chatSession.patientActor.name} • {submission.chatSession.messageCount} messages
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <Button size="sm" variant="destructive">
                          Review
                        </Button>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Pending Submissions */}
            {pendingSubmissions.length > 0 && (
              <Card className="bg-amber-50/70 backdrop-blur-sm border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Clock className="h-5 w-5" />
                    Pending Submissions
                  </CardTitle>
                  <CardDescription className="text-amber-700">
                    {pendingSubmissions.length} submission{pendingSubmissions.length !== 1 ? 's' : ''} awaiting your review
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingSubmissions.slice(0, 5).map((submission) => (
                    <Link key={submission.id} href={`/submissions/${submission.id}`}>
                      <div className="flex items-center justify-between p-4 bg-white border border-amber-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {submission.chatSession.user?.name || "Unknown Student"}
                            </p>
                            {submission.autoGraded && (
                              <Badge variant="secondary" className="text-xs">AI Graded</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {submission.chatSession.patientActor.name} • {submission.chatSession.messageCount} messages
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </Link>
                  ))}
                  {pendingSubmissions.length > 5 && (
                    <p className="text-sm text-center text-amber-700 pt-2">
                      +{pendingSubmissions.length - 5} more pending
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Submissions */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>All student submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.slice(0, 10).map((submission) => (
                      <Link key={submission.id} href={`/submissions/${submission.id}`}>
                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">
                                {submission.chatSession.user?.name || "Unknown Student"}
                              </p>
                              {getStatusBadge(submission.status, submission.requiresReview)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {submission.chatSession.patientActor.name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-500">
                                {submission.chatSession.messageCount} messages
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(submission.submittedAt)}
                              </p>
                              {submission.grade && (
                                <p className="text-xs font-medium text-green-600">Grade: {submission.grade}</p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No submissions yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Student submissions will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/patient-actors" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Manage Patient Actors
                  </Button>
                </Link>
                <Link href="/patient-actors?create=true" className="block">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Patient Actor
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Patient Actors Summary */}
            <Card className="bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Your Patient Actors
                  <Link href="/patient-actors">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patientActors.length > 0 ? (
                  <div className="space-y-2">
                    {patientActors.slice(0, 5).map((pa) => (
                      <Link key={pa.id} href={`/patient-actors?id=${pa.id}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div>
                            <p className="font-medium text-sm">{pa.name}</p>
                            <p className="text-xs text-gray-500">Age {pa.age}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {pa.isPublic ? (
                              <Badge variant="secondary" className="text-xs">Public</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {patientActors.length > 5 && (
                      <p className="text-sm text-center text-gray-500 pt-2">
                        +{patientActors.length - 5} more
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">No patient actors yet</p>
                    <Link href="/patient-actors?create=true">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="h-4 w-4" />
                        Create One
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}






