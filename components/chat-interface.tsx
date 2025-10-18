"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { generateResponse } from "@/lib/actions/chat"
import type { Patient, Message as MessageType } from "@/lib/types"

interface ChatInterfaceProps {
  patient: Patient
}

export default function ChatInterface({ patient }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize with greeting message
  useEffect(() => {
    if (!initialized && patient) {
      const greeting: MessageType = {
        role: "assistant",
        content: `Hello, I'm here for my appointment. I've been experiencing ${patient.chiefComplaint.toLowerCase()}. What would you like to know?`,
      }
      setMessages([greeting])
      setInitialized(true)
    }
  }, [patient, initialized])

  const handleSendMessage = async (input: string) => {
    if (!input.trim() || !patient) return

    const userMessage: MessageType = {
      role: "user",
      content: input,
    }

    // Add user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      // Call server action to generate patient response
      const response = await generateResponse(patient, updatedMessages)

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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <h2 className="text-lg font-semibold">Chat with {patient.demographics}</h2>
        <p className="text-sm text-gray-600">Chief Complaint: {patient.chiefComplaint}</p>
      </div>

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
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
