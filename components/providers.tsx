"use client"

import type React from "react"
import { Toaster } from "sonner"
import ImpersonationBanner from "./impersonation-banner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ImpersonationBanner />
      {children}
      <Toaster position="top-right" richColors />
    </>
  )
}



