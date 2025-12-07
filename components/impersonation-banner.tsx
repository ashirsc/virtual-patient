"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authClient, useSession } from "@/lib/auth-client"
import { toast } from "sonner"

export default function ImpersonationBanner() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isStopping, setIsStopping] = useState(false)

  // Check if this is an impersonation session
  // The session object has impersonatedBy when an admin is impersonating
  const isImpersonating = session?.session && 'impersonatedBy' in session.session && session.session.impersonatedBy

  if (!isImpersonating) {
    return null
  }

  const handleStopImpersonating = async () => {
    setIsStopping(true)
    try {
      const result = await authClient.admin.stopImpersonating()
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to stop impersonating")
      }
      
      toast.success("Stopped impersonating user")
      router.push("/admin/users")
      router.refresh()
    } catch (error) {
      console.error("Stop impersonating error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to stop impersonating")
    } finally {
      setIsStopping(false)
    }
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 sticky top-0 z-50">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium">
        You are viewing as <strong>{session?.user?.name || session?.user?.email}</strong>
      </span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 px-3 text-xs bg-amber-100 hover:bg-amber-200 text-amber-900"
        onClick={handleStopImpersonating}
        disabled={isStopping}
      >
        {isStopping ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Stopping...
          </>
        ) : (
          <>
            <X className="h-3 w-3 mr-1" />
            Stop Impersonating
          </>
        )}
      </Button>
    </div>
  )
}



