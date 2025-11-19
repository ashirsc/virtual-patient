"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useSession, signOut as authSignOut } from "@/lib/auth-client"
import type { User } from "@/lib/generated/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  const handleSignOut = async () => {
    await authSignOut()
  }

  const value: AuthContextType = {
    user: session?.user as User | null,
    loading: isPending,
    signOut: handleSignOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
