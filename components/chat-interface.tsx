"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, X, Send as SendIcon } from "lucide-react"
import { generatePublicResponse } from "@/lib/actions/chat"
import { createChatSession, updateChatSession, getInstructors, submitSessionToInstructor } from "@/lib/actions/sessions"
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

interface ChatInterfaceProps {
  patientId: string
  patientName: string
  isPublic?: boolean // If true, uses public access (no auth required)
}

export default function ChatInterface({ patientId, patientName, isPublic = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string | null; email: string }>>([])
  const [selectedInstructor, setSelectedInstructor] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: session, isPending } = useSession()
  const isAuthenticated = !!session?.user

  // Auto-create session for authenticated users
  useEffect(() => {
    if (isAuthenticated && !sessionId && messages.length > 0) {
      createChatSession(patientId)
        .then((id) => {
          setSessionId(id)
        })
        .catch((error) => {
          console.error("Failed to create session:", error)
        })
    }
  }, [isAuthenticated, sessionId, patientId, messages.length])

  // Auto-save messages for authenticated users (debounced)
  useEffect(() => {
    if (isAuthenticated && sessionId && messages.length > 0) {
      const timer = setTimeout(() => {
        setIsSaving(true)
        updateChatSession(sessionId, messages)
          .then(() => {
            setIsSaving(false)
          })
          .catch((error) => {
            console.error("Failed to save session:", error)
            setIsSaving(false)
          })
      }, 1000) // Debounce for 1 second

      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, sessionId, messages])

  // Show login prompt for guests after 3+ messages
  useEffect(() => {
    if (!isAuthenticated && !isPending && messages.length >= 6) {
      // 6 messages = 3 exchanges
      setShowLoginPrompt(true)
    }
  }, [isAuthenticated, isPending, messages.length])

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || !patientId) return

    const userMessage: MessageType = {
      role: "user",
      content: input,
    }

    // Add user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      // Use public response (guests and authenticated users both allowed)
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
    }
  }

  const handleSubmit = async () => {
    if (!sessionId || !selectedInstructor) return

    setIsSubmitting(true)
    try {
      await submitSessionToInstructor(sessionId, selectedInstructor)
      setShowSubmitDialog(false)
      alert("Session submitted successfully!")
    } catch (error) {
      console.error("Failed to submit session:", error)
      alert(error instanceof Error ? error.message : "Failed to submit session")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Chat with {patientName}</h2>
            <p className="text-sm text-gray-600">Begin the medical interview</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && isSaving && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Save className="h-4 w-4 animate-pulse" />
                <span>Saving...</span>
              </div>
            )}
            {isAuthenticated && !isSaving && sessionId && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <Save className="h-4 w-4" />
                <span>Saved</span>
              </div>
            )}
            {isAuthenticated && messages.length >= 10 && sessionId && (
              <Button onClick={handleOpenSubmitDialog} size="sm" variant="outline">
                Submit for Grading
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Login Prompt for Guests */}
      {showLoginPrompt && !isAuthenticated && (
        <Alert className="m-4 border-blue-200 bg-blue-50">
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              <strong>Sign in</strong> to save your conversation and submit it for grading.
            </span>
            <div className="flex items-center gap-2">
              <Link href="/login">
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
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.role === "user"
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
            >
              <p className="text-sm">{message.content}</p>
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
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask the patient a question..."
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                const input = (e.target as HTMLInputElement).value
                handleSendMessage(input)
                  ; (e.target as HTMLInputElement).value = ""
              }
            }}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={() => {
              const input = document.querySelector("input") as HTMLInputElement
              if (input) {
                handleSendMessage(input.value)
                input.value = ""
              }
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <SendIcon className="h-4 w-4" />
            Send
          </button>
        </div>
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
