import { NextRequest, NextResponse } from "next/server"
import { cleanupAbandonedEncounter } from "@/lib/actions/sessions"

/**
 * API endpoint to cleanup abandoned anonymous sessions
 * Protected by CRON_SECRET environment variable
 * 
 * Usage:
 * - Add CRON_SECRET to your environment variables
 * - Call this endpoint via cron job or scheduled task:
 *   curl -X POST https://your-domain.com/api/cleanup -H "Authorization: Bearer YOUR_CRON_SECRET"
 * 
 * Recommended: Run daily or weekly
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authorization
        const authHeader = request.headers.get("authorization")
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret) {
            console.error("CRON_SECRET not configured")
            return NextResponse.json(
                { error: "Cleanup endpoint not configured" },
                { status: 503 }
            )
        }

        if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Run cleanup
        const deletedCount = await cleanupAbandonedEncounter()

        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Successfully cleaned up ${deletedCount} abandoned sessions`,
        })
    } catch (error) {
        console.error("Error in cleanup endpoint:", error)
        return NextResponse.json(
            {
                error: "Cleanup failed",
                message: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
    return NextResponse.json({
        endpoint: "cleanup",
        description: "Cleans up abandoned anonymous chat sessions older than 7 days",
        method: "POST",
        auth: "Bearer token via Authorization header",
        cronSecret: process.env.CRON_SECRET ? "configured" : "not configured",
    })
}


