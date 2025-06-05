"use client"

import { useState } from "react"
import LoginForm from "@/components/auth/login-form"
import RegisterForm from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Medical Education Platform</h1>
          <p className="text-muted-foreground mt-2">Interactive patient simulation for medical training</p>
        </div>

        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="text-center">
          <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
          </Button>
        </div>
      </div>
    </div>
  )
}
