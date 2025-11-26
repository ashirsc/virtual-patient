"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Save, X, Send as SendIcon, CheckCircle, MoreVertical, FileCheck } from "lucide-react"
import { generatePublicResponse } from "@/lib/actions/chat"
import { 
  createChatSession, 
  updateChatSession, 
  getInstructors, 
  submitSessionToInstructor,
  createAnonymousChatSession,
  updateAnonymousChatSession,
  claimChatSession
} from "@/lib/actions/sessions"
import type { Message as MessageType } from "@/lib/types"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ChatInterfaceProps {
  patientId: string
  patientName: string
  patientAge?: number
  isPublic?: boolean // If true, uses public access (no auth required)
  isTestMode?: boolean // If true, hides submission features
  initialSessionId?: string // Optional: load an existing session
  initialMessages?: MessageType[] // Optional: pre-populate messages
  isSubmitted?: boolean // Optional: whether this session has been submitted
}

export default function ChatInterface({ 
  patientId, 
  patientName, 
  patientAge, 
  isPublic = false, 
  isTestMode = false,
  initialSessionId,
  initialMessages,
  isSubmitted = false
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>(initialMessages || [])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const [isSaving, setIsSaving] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [selectedInstructor, setSelectedInstructor] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasBeenSubmitted, setHasBeenSubmitted] = useState(isSubmitted)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: session, isPending } = useSession()
  const isAuthenticated = !!session?.user
  const [previousAuthState, setPreviousAuthState] = useState<boolean | null>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Refocus input when loading completes
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus()
    }
  }, [isLoading])

  // Claim anonymous session when user logs in
  useEffect(() => {
    const handleSessionClaim = async () => {
      // Detect login transition (from not authenticated to authenticated)
      if (previousAuthState === false && isAuthenticated && sessionId && !initialSessionId) {
        try {
          await claimChatSession(sessionId)
          toast.success("Your conversation has been saved to your account!")
        } catch (error) {
          console.error("Failed to claim session:", error)
          // If claiming fails, create a new authenticated session
          try {
            const newSessionId = await createChatSession(patientId)
            setSessionId(newSessionId)
            toast.info("Started a new session with your messages")
          } catch (createError) {
            console.error("Failed to create new session:", createError)
          }
        }
      }
    }

    handleSessionClaim()
    setPreviousAuthState(isAuthenticated)
  }, [isAuthenticated, previousAuthState, sessionId, patientId, initialSessionId])

  // Auto-save messages (debounced)
  useEffect(() => {
    // Don't auto-save if this is a submitted session being viewed
    if (hasBeenSubmitted) return
    
    if (sessionId && messages.length > 0) {
      const timer = setTimeout(async () => {
        setIsSaving(true)
        try {
          if (isAuthenticated) {
            await updateChatSession(sessionId, messages)
          } else {
            try {
              await updateAnonymousChatSession(sessionId, messages)
            } catch (anonError) {
              // If anonymous update fails because session was claimed, try authenticated update
              if (anonError instanceof Error && anonError.message.includes("claimed")) {
                await updateChatSession(sessionId, messages)
              } else {
                throw anonError
              }
            }
          }
        } catch (error) {
          console.error("Failed to save session:", error)
        } finally {
          setIsSaving(false)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, sessionId, messages, hasBeenSubmitted])

  // Show login prompt for guests after 3+ exchanges
  useEffect(() => {
    if (!isAuthenticated && !isPending && messages.length >= 6) {
      setShowLoginPrompt(true)
    }
  }, [isAuthenticated, isPending, messages.length])

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || !patientId || hasBeenSubmitted) return

    // Create session on first message if needed
    if (!sessionId && messages.length === 0 && !initialSessionId) {
      try {
        const newSessionId = isAuthenticated
          ? await createChatSession(patientId)
          : await createAnonymousChatSession(patientId)
        setSessionId(newSessionId)
      } catch (error) {
        console.error("Failed to create session:", error)
        toast.error("Failed to start chat session")
        return
      }
    }

    const userMessage: MessageType = {
      role: "user",
      content: input,
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const response = await generatePublicResponse(patientId, updatedMessages)

      const assistantMessage: MessageType = {
        role: "assistant",
        content: response,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating response:", error)

      const errorMessage: MessageType = {
        role: "assistant",
        content:
          "I'm sorry, I'm not feeling well enough to respond right now. Could we continue this later?",
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSubmitDialog = async () => {
    try {
      const instructorList = await getInstructors()
      setInstructors(instructorList)
      setShowSubmitDialog(true)
    } catch (error) {
      console.error("Failed to load instructors:", error)
      toast.error("Failed to load instructors")
    }
  }

  const handleSubmit = async () => {
    if (!sessionId || !selectedInstructor) return

    setIsSubmitting(true)
    try {
      await submitSessionToInstructor(sessionId, selectedInstructor)
      setShowSubmitDialog(false)
      setHasBeenSubmitted(true)
      toast.success("Session submitted successfully!")
    } catch (error) {
      console.error("Failed to submit session:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit session")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-lg border min-h-0">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chat with {patientName}</h2>
            <p className="text-sm text-gray-600">
              {hasBeenSubmitted ? "This session has been submitted for grading" : "Begin the medical interview"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasBeenSubmitted ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Submitted</span>
              </div>
            ) : (
              <>
                {isSaving && sessionId && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Save className="h-4 w-4 animate-pulse" />
                    <span>Saving...</span>
                  </div>
                )}
                {!isSaving && sessionId && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Save className="h-4 w-4" />
                    <span>Saved</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt for Guests */}
      {!isTestMode && showLoginPrompt && !isAuthenticated && (
        <Alert className="m-4 border-blue-200 bg-blue-50 flex-shrink-0">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              <strong>Sign in</strong> to save your conversation and submit it for grading.
            </span>
            <div className="flex items-center gap-2">
              <Link href={(() => {
                const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/'
                const params = new URLSearchParams()
                params.set('returnUrl', returnUrl)
                if (sessionId) {
                  params.set('sessionId', sessionId)
                }
                return `/login?${params.toString()}`
              })()}>
                <Button size="sm" variant="default">
                  Sign In
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => setShowLoginPrompt(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">Start the conversation by asking the patient a question.</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Patient is responding...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50 flex-shrink-0 sticky bottom-0">
        {hasBeenSubmitted ? (
          <div className="text-center text-sm text-gray-500 py-2">
            This session has been submitted and cannot be edited.
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask the patient a question..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  const value = inputRef.current?.value || ""
                  if (inputRef.current) inputRef.current.value = ""
                  handleSendMessage(value)
                  inputRef.current?.focus()
                }
              }}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 bg-white"
            />
            <button
              onClick={() => {
                const value = inputRef.current?.value || ""
                if (inputRef.current) inputRef.current.value = ""
                handleSendMessage(value)
                inputRef.current?.focus()
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <SendIcon className="h-4 w-4" />
              Send
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleOpenSubmitDialog}
                  disabled={!isAuthenticated || !sessionId || messages.length < 2}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Submit for Grading
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit for Grading</DialogTitle>
            <DialogDescription>
              Select an instructor to submit your conversation transcript for grading.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.name || instructor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedInstructor || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
