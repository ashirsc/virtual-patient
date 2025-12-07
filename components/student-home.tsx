"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronRight,
  Plus,
  User,
  Calendar,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signOut } from "@/lib/auth-client"

type SessionWithDetails = {
  id: string
  messageCount: number
  lastMessageAt: Date
  startedAt: Date
  patientActor: {
    id: string
    name: string
    age: number
    slug: string
  }
  submittedSession: {
    id: string
    status: string
    submittedAt: Date
    grade: string | null
    feedback: string | null
  } | null
}

interface StudentHomeProps {
  sessions: SessionWithDetails[]
  userName: string | null
  isAdmin?: boolean
}

// Group sessions by patient actor
function groupSessionsByPatient(sessions: SessionWithDetails[]) {
  const grouped = new Map<string, {
    patientActor: SessionWithDetails['patientActor']
    sessions: SessionWithDetails[]
  }>()

  for (const session of sessions) {
    const key = session.patientActor.id
    if (!grouped.has(key)) {
      grouped.set(key, {
        patientActor: session.patientActor,
        sessions: []
      })
    }
    grouped.get(key)!.sessions.push(session)
  }

  return Array.from(grouped.values())
}

export default function StudentHome({ sessions, userName, isAdmin = false }: StudentHomeProps) {
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

  const groupedSessions = groupSessionsByPatient(sessions)
  const submittedSessions = sessions.filter(s => s.submittedSession)
  const pendingReview = submittedSessions.filter(s => s.submittedSession?.status === "pending")
  const gradedSessions = submittedSessions.filter(s => s.submittedSession?.status === "graded")

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
              <p className="text-sm text-gray-600">
                {userName ? `Welcome back, ${userName}` : 'Your conversation history'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Tabs defaultValue="student" onValueChange={handleViewChange}>
                  <TabsList>
                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                    <TabsTrigger value="student">Student</TabsTrigger>
                  </TabsList>
                </Tabs>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Patient Actors</CardTitle>
              <User className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupedSessions.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingReview.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Graded</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradedSessions.length}</div>
            </CardContent>
          </Card>
        </div>

        {sessions.length === 0 ? (
          /* Empty State */
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-blue-100 p-4 mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-600 text-center max-w-md mb-4">
                Get started by visiting a patient actor link shared by your instructor.
                Your conversations will appear here automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Conversations grouped by Patient Actor */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversations</h2>
              <div className="space-y-4">
                {groupedSessions.map(({ patientActor, sessions: patientSessions }) => (
                  <Card key={patientActor.id} className="bg-white/70 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{patientActor.name}</CardTitle>
                          <CardDescription>Age {patientActor.age} • {patientSessions.length} session{patientSessions.length !== 1 ? 's' : ''}</CardDescription>
                        </div>
                        <Link href={`/chat/${patientActor.slug}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Plus className="h-4 w-4" />
                            New Session
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {patientSessions.map((session) => (
                          <Link
                            key={session.id}
                            href={`/chat/${patientActor.slug}?session=${session.id}`}
                            className="block"
                          >
                            <div className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {session.messageCount} messages
                                  </span>
                                  {session.submittedSession && getStatusBadge(session.submittedSession.status)}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Started {formatDate(session.startedAt)}
                                  </span>
                                  <span>
                                    Last activity {formatDate(session.lastMessageAt)}
                                  </span>
                                </div>
                                {session.submittedSession?.grade && (
                                  <p className="text-sm font-medium text-green-600 mt-1">
                                    Grade: {session.submittedSession.grade}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Graded Submissions */}
            {gradedSessions.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h2>
                <div className="space-y-3">
                  {gradedSessions.slice(0, 5).map((session) => (
                    <Link key={session.id} href={`/submissions/${session.submittedSession!.id}`}>
                      <Card className="bg-white/70 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{session.patientActor.name}</span>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Graded</Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {session.messageCount} messages • Graded {formatDate(session.submittedSession!.submittedAt)}
                              </p>
                              {session.submittedSession?.grade && (
                                <p className="text-sm font-semibold text-green-600 mt-1">
                                  Grade: {session.submittedSession.grade}
                                </p>
                              )}
                              {session.submittedSession?.feedback && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                  {session.submittedSession.feedback}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}





