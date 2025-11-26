"use client"

import { ArrowLeft, Home } from "lucide-react"
import ChatInterface from "@/components/chat-interface"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { PatientActor } from "@/lib/generated/client"
import type { Message } from "@/lib/types"

interface PublicChatClientProps {
    patientActor: PatientActor
    isAuthenticated?: boolean
    existingSession?: {
        id: string
        messages: Message[]
        isSubmitted: boolean
    } | null
}

export default function PublicChatClient({ 
    patientActor, 
    isAuthenticated = false,
    existingSession = null 
}: PublicChatClientProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {isAuthenticated && (
                            <>
                                <Link href="/">
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        My Sessions
                                    </Button>
                                </Link>
                                <div className="h-6 w-px bg-gray-300" />
                            </>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Patient Actor Simulation</h1>
                            <p className="text-sm text-gray-600">
                                Training simulation with {patientActor.name}
                            </p>
                        </div>
                    </div>
                    {!isAuthenticated && (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="outline" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm">
                                    Sign Up
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full">
                    <ChatInterface
                        patientId={patientActor.id}
                        patientName={patientActor.name}
                        isPublic={true}
                        initialSessionId={existingSession?.id}
                        initialMessages={existingSession?.messages}
                        isSubmitted={existingSession?.isSubmitted}
                    />
                </div>
            </main>
        </div>
    )
}
