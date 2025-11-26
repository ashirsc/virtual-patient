"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { claimChatSession } from "@/lib/actions/sessions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Get sessionId and returnUrl from query params
  const sessionId = searchParams.get("sessionId")
  const returnUrl = searchParams.get("returnUrl") || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || "Failed to sign in")
      } else {
        // Successful login - claim session if sessionId exists
        if (sessionId) {
          try {
            await claimChatSession(sessionId)
            toast.success("Your conversation has been saved to your account!")
          } catch (claimError) {
            console.error("Failed to claim session:", claimError)
            // Still redirect even if claiming fails
            toast.error(
              claimError instanceof Error 
                ? claimError.message 
                : "Failed to claim session, but you can continue"
            )
          }
        }

        // Redirect to returnUrl with session query param if sessionId exists
        let redirectUrl = returnUrl
        if (sessionId) {
          const separator = returnUrl.includes('?') ? '&' : '?'
          redirectUrl = `${returnUrl}${separator}session=${sessionId}`
        }
        
        // Use window.location for reliable navigation after auth state change
        window.location.href = redirectUrl
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your email and password to access your patient actors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <Link 
              href={`/signup${sessionId || returnUrl !== '/' ? `?${new URLSearchParams({
                ...(returnUrl !== '/' && { returnUrl }),
                ...(sessionId && { sessionId }),
              }).toString()}` : ''}`}
              className="text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
