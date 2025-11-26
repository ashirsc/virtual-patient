import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquareOff } from "lucide-react"

export default function SubmissionNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <MessageSquareOff className="h-16 w-16 text-muted-foreground" />
            <h1 className="text-2xl font-semibold">Chat Not Found</h1>
            <p className="text-muted-foreground text-center max-w-md">
                The submission you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Button asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
        </div>
    )
}

