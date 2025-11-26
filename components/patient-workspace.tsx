"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Copy, Check, ExternalLink, Save, Loader2, Trash2 } from "lucide-react"
import PatientEditor, { type PatientEditorRef } from "@/components/patient-editor"
import ChatInterface from "@/components/chat-interface"
import PatientRubricEditor, { type PatientRubricEditorRef } from "@/components/patient-rubric-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getSubmissionsByPatientActor } from "@/lib/actions/sessions"
import type { PatientActor } from "@/lib/generated/client"

interface PatientWorkspaceProps {
    patient: PatientActor
    userRole: string
    onUpdate?: (patient: PatientActor) => void
    onDelete?: () => void
}

export default function PatientWorkspace({
    patient,
    userRole,
    onUpdate,
    onDelete,
}: PatientWorkspaceProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("configure")
    const [submissions, setSubmissions] = useState<any[]>([])
    const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)
    const [copiedUrl, setCopiedUrl] = useState(false)
    const patientEditorRef = useRef<PatientEditorRef>(null)
    const rubricEditorRef = useRef<PatientRubricEditorRef>(null)

    // Track save state for buttons to trigger re-renders
    const [editorIsSaving, setEditorIsSaving] = useState(false)
    const [editorSaveStatus, setEditorSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [rubricIsSaving, setRubricIsSaving] = useState(false)
    const [rubricSaveStatus, setRubricSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [rubricHasCategories, setRubricHasCategories] = useState(false)

    // Load submissions when switching to data tab
    useEffect(() => {
        if (activeTab === "data" && (userRole === "instructor" || userRole === "admin")) {
            loadSubmissions()
        }
    }, [activeTab, userRole, patient.id])

    const loadSubmissions = async () => {
        setIsLoadingSubmissions(true)
        try {
            const data = await getSubmissionsByPatientActor(patient.id)
            setSubmissions(data)
        } catch (error) {
            console.error("Error loading submissions:", error)
            setSubmissions([])
        } finally {
            setIsLoadingSubmissions(false)
        }
    }

    const getShareableUrl = () => {
        if (typeof window === 'undefined') return ""
        if (!patient.slug) return ""
        return `${window.location.origin}/chat/${patient.slug}`
    }

    const copyShareableUrl = async () => {
        const url = getShareableUrl()
        if (!url) return
        try {
            await navigator.clipboard.writeText(url)
            setCopiedUrl(true)
            setTimeout(() => setCopiedUrl(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const openInNewTab = () => {
        const url = getShareableUrl()
        if (!url) return
        window.open(url, '_blank')
    }

    // Render actions based on active tab
    const renderTabActions = () => {
        if (activeTab === "configure") {
            return (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={copyShareableUrl}
                    >
                        {copiedUrl ? (
                            <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-1" />
                                Share Link
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => patientEditorRef.current?.handleSave()}
                        disabled={editorIsSaving}
                        className={
                            editorSaveStatus === 'success'
                                ? 'bg-green-600 hover:bg-green-700'
                                : editorSaveStatus === 'error'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : ''
                        }
                    >
                        {editorIsSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Saving...
                            </>
                        ) : editorSaveStatus === 'success' ? (
                            <>
                                <Check className="h-4 w-4 mr-1" />
                                Saved
                            </>
                        ) : editorSaveStatus === 'error' ? (
                            'Error'
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => patientEditorRef.current?.handleDelete()}
                    >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                    </Button>
                </>
            )
        } else if (activeTab === "test") {
            return (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={copyShareableUrl}
                    >
                        {copiedUrl ? (
                            <>
                                <Check className="h-4 w-4 mr-1" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4 mr-1" />
                                Copy Link
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        onClick={openInNewTab}
                    >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open in New Tab
                    </Button>
                </>
            )
        } else if (activeTab === "rubric") {
            return (
                <>
                    {rubricHasCategories && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rubricEditorRef.current?.handleDelete()}
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear Rubric
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => rubricEditorRef.current?.handleSave()}
                        disabled={rubricIsSaving || !rubricHasCategories}
                        className={
                            rubricSaveStatus === 'success'
                                ? 'bg-green-600 hover:bg-green-700'
                                : rubricSaveStatus === 'error'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : ''
                        }
                    >
                        {rubricIsSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Saving...
                            </>
                        ) : rubricSaveStatus === 'success' ? (
                            <>
                                <Check className="h-4 w-4 mr-1" />
                                Saved
                            </>
                        ) : rubricSaveStatus === 'error' ? (
                            'Error'
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1" />
                                Save Rubric
                            </>
                        )}
                    </Button>
                </>
            )
        }
        return null
    }

    // Get background color based on active tab
    const getHeaderColor = () => {
        switch (activeTab) {
            case "configure":
                return "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200"
            case "test":
                return "bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200"
            case "rubric":
                return "bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-200"
            case "data":
                return "bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200"
            default:
                return "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200"
        }
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Unified Header with Tabs and Actions */}
            <div className={getHeaderColor()}>
                <div className="flex items-center justify-between px-4 py-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList>
                            <TabsTrigger value="configure">Configure</TabsTrigger>
                            <TabsTrigger value="test">Test</TabsTrigger>
                            {(userRole === "instructor" || userRole === "admin") && (
                                <>
                                    <TabsTrigger value="rubric">Rubric</TabsTrigger>
                                    <TabsTrigger value="data">
                                        Submissions
                                        {submissions.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {submissions.length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>
                    </Tabs>
                    <div className="flex items-center gap-2 ml-4">
                        {renderTabActions()}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === "configure" && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <PatientEditor
                        ref={patientEditorRef}
                        patient={patient}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onSaveStateChange={(isSaving, saveStatus) => {
                            setEditorIsSaving(isSaving)
                            setEditorSaveStatus(saveStatus)
                        }}
                    />
                </div>
            )}

            {activeTab === "test" && (
                <div className="flex-1 min-h-0 flex flex-col">
                    <ChatInterface
                        patientId={patient.id}
                        patientName={patient.name}
                        patientAge={patient.age}
                        isTestMode={true}
                    />
                </div>
            )}

            {activeTab === "rubric" && (userRole === "instructor" || userRole === "admin") && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <PatientRubricEditor
                        ref={rubricEditorRef}
                        patientActorId={patient.id}
                        onSaveStateChange={(isSaving, saveStatus) => {
                            setRubricIsSaving(isSaving)
                            setRubricSaveStatus(saveStatus)
                        }}
                        onCategoriesChange={(hasCategories) => {
                            setRubricHasCategories(hasCategories)
                        }}
                    />
                </div>
            )}

            {activeTab === "data" && (userRole === "instructor" || userRole === "admin") && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 overflow-auto p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">Student Submissions</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Submissions for {patient.name}
                            </p>
                        </div>

                        {isLoadingSubmissions ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>Loading submissions...</p>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p className="text-lg font-medium">No submissions yet</p>
                                <p className="text-sm mt-2">
                                    Student submissions for this patient actor will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((submission) => (
                                    <div
                                        key={submission.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => router.push(`/submissions/${submission.id}`)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {submission.chatSession?.user?.name || "Anonymous"}
                                                    </h3>
                                                    <Badge
                                                        variant={
                                                            submission.status === "pending"
                                                                ? "default"
                                                                : submission.status === "reviewed"
                                                                    ? "secondary"
                                                                    : "outline"
                                                        }
                                                    >
                                                        {submission.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    {submission.chatSession?.messageCount || 0} messages
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                                </p>
                                                {submission.grade && (
                                                    <p className="text-sm font-medium text-green-600 mt-2">
                                                        Grade: {submission.grade}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
