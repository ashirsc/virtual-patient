import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Medical Education Simulation",
  description: "Interactive patient simulation for medical education",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50">{children}</div>
        </AuthProvider>
      </body>
    </html>
  )
}
