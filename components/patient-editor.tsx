"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Save, Loader2, Copy, Check, ExternalLink, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { updatePatientActor, deletePatientActor } from "@/lib/actions/patient-actors"
import { toast } from "sonner"
import { generateVPSystemPrompt, type StructuredPrompt } from "@/lib/convos/prompt-utils"
import { PatientActor } from "@prisma/client"

interface PatientEditorProps {
    patient: PatientActor
    onUpdate?: (patient: PatientActor) => void
    onDelete?: () => void
    onSaveStateChange?: (isSaving: boolean, saveStatus: 'idle' | 'success' | 'error') => void
}

export interface PatientEditorRef {
    handleSave: () => Promise<void>
    handleDelete: () => void
    handlePreview: () => void
    isSaving: boolean
    saveStatus: 'idle' | 'success' | 'error'
}

const PatientEditor = forwardRef<PatientEditorRef, PatientEditorProps>(({ patient, onUpdate, onDelete, onSaveStateChange }, ref) => {
    const [name, setName] = useState(patient.name)
    const [allowSubmissions, setAllowSubmissions] = useState(patient.allowSubmissions ?? true)
    const [structuredData, setStructuredData] = useState<StructuredPrompt>(() => ({
        demographics: patient.demographics || '',
        chiefComplaint: patient.chiefComplaint || '',
        medicalHistory: patient.medicalHistory || '',
        medications: patient.medications || '',
        socialHistory: patient.socialHistory || '',
        personality: patient.personality || '',
        physicalFindings: patient.physicalFindings || '',
        additionalSymptoms: patient.additionalSymptoms || '',
        revelationLevel: (patient.revelationLevel as 'forthcoming' | 'moderate' | 'reserved') || 'moderate',
        stayInCharacter: patient.stayInCharacter ?? true,
        avoidMedicalJargon: patient.avoidMedicalJargon ?? true,
        provideFeedback: patient.provideFeedback ?? true,
        customInstructions: patient.customInstructions || '',
    }))
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [copiedUrl, setCopiedUrl] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    // Notify parent of save state changes
    useEffect(() => {
        onSaveStateChange?.(isSaving, saveStatus)
    }, [isSaving, saveStatus, onSaveStateChange])

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        handleSave,
        handleDelete: () => setShowDeleteDialog(true),
        handlePreview: () => setShowPreview(true),
        isSaving,
        saveStatus,
    }))

    // Update state when patient changes
    useEffect(() => {
        setName(patient.name)
        setAllowSubmissions(patient.allowSubmissions ?? true)
        setStructuredData({
            demographics: patient.demographics || '',
            chiefComplaint: patient.chiefComplaint || '',
            medicalHistory: patient.medicalHistory || '',
            medications: patient.medications || '',
            socialHistory: patient.socialHistory || '',
            personality: patient.personality || '',
            physicalFindings: patient.physicalFindings || '',
            additionalSymptoms: patient.additionalSymptoms || '',
            revelationLevel: (patient.revelationLevel as 'forthcoming' | 'moderate' | 'reserved') || 'moderate',
            stayInCharacter: patient.stayInCharacter ?? true,
            avoidMedicalJargon: patient.avoidMedicalJargon ?? true,
            provideFeedback: patient.provideFeedback ?? true,
            customInstructions: patient.customInstructions || '',
        })
    }, [patient])







    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('idle')

        try {
            // Extract age from demographics if possible, otherwise default to current age
            const ageMatch = structuredData.demographics.match(/(\d+)[-\s]year/)
            const extractedAge = ageMatch ? parseInt(ageMatch[1]) : patient.age

            await updatePatientActor(patient.id, {
                name,
                age: extractedAge,
                allowSubmissions,
                // Save individual structured fields
                demographics: structuredData.demographics,
                chiefComplaint: structuredData.chiefComplaint,
                medicalHistory: structuredData.medicalHistory,
                medications: structuredData.medications,
                socialHistory: structuredData.socialHistory,
                personality: structuredData.personality,
                physicalFindings: structuredData.physicalFindings,
                additionalSymptoms: structuredData.additionalSymptoms,
                revelationLevel: structuredData.revelationLevel,
                stayInCharacter: structuredData.stayInCharacter,
                avoidMedicalJargon: structuredData.avoidMedicalJargon,
                provideFeedback: structuredData.provideFeedback,
                customInstructions: structuredData.customInstructions,
            })

            setSaveStatus('success')
            toast.success('Patient actor saved successfully!')
            setTimeout(() => setSaveStatus('idle'), 2000)

            if (onUpdate) {
                onUpdate({
                    ...patient,
                    name,
                    age: extractedAge,
                    ...structuredData
                })
            }
        } catch (error) {
            console.error('Error saving patient:', error)
            setSaveStatus('error')
            toast.error('Failed to save patient actor')
            setTimeout(() => setSaveStatus('idle'), 3000)
        } finally {
            setIsSaving(false)
        }
    }

    const updateStructuredData = (updates: Partial<StructuredPrompt>) => {
        setStructuredData(prev => ({ ...prev, ...updates }))
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deletePatientActor(patient.id)
            toast.success('Patient actor deleted successfully.')
            setShowDeleteDialog(false)
            if (onDelete) {
                onDelete()
            }
        } catch (error) {
            console.error('Error deleting patient:', error)
            toast.error('Failed to delete patient actor. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-white min-h-0">
            {/* Form Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Allow Submissions Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="allowSubmissions" className="text-base font-semibold text-gray-900">
                                Allow Student Submissions
                            </Label>
                            <p className="text-sm text-gray-600">
                                When enabled, students can submit their chat sessions for grading
                            </p>
                        </div>
                        <Switch
                            id="allowSubmissions"
                            checked={allowSubmissions}
                            onCheckedChange={setAllowSubmissions}
                        />
                    </div>

                    {/* Patient Profile Section */}
                    <div className="space-y-4">
                        <div className="pb-3 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Patient Profile</h3>
                            <p className="text-sm text-gray-600 mt-1">Basic patient information and demographics</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Patient Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Philip Walters"
                            />
                            <p className="text-xs text-gray-500">The name of the patient actor</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="demographics">Demographics</Label>
                            <Input
                                id="demographics"
                                value={structuredData.demographics}
                                onChange={(e) => updateStructuredData({ demographics: e.target.value })}
                                placeholder="e.g., 55-year-old male"
                            />
                            <p className="text-xs text-gray-500">Age, gender, occupation, etc.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                            <Textarea
                                id="chiefComplaint"
                                value={structuredData.chiefComplaint}
                                onChange={(e) => updateStructuredData({ chiefComplaint: e.target.value })}
                                placeholder="e.g., Slowing down and resting tremor in both hands"
                                rows={2}
                            />
                            <p className="text-xs text-gray-500">The main reason for the visit</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medicalHistory">Medical History</Label>
                            <Textarea
                                id="medicalHistory"
                                value={structuredData.medicalHistory}
                                onChange={(e) => updateStructuredData({ medicalHistory: e.target.value })}
                                placeholder="e.g., Hypertension (5 years), Sleep disturbances, Parkinsonian symptoms (1 year)"
                                rows={4}
                            />
                            <p className="text-xs text-gray-500">Past medical conditions, surgeries, family history</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="medications">Current Medications</Label>
                            <Textarea
                                id="medications"
                                value={structuredData.medications}
                                onChange={(e) => updateStructuredData({ medications: e.target.value })}
                                placeholder="e.g., Amlodipine 5 mg daily, Melatonin 3 mg at bedtime"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">Current medications and dosages</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="socialHistory">Social History</Label>
                            <Textarea
                                id="socialHistory"
                                value={structuredData.socialHistory}
                                onChange={(e) => updateStructuredData({ socialHistory: e.target.value })}
                                placeholder="e.g., Lives with spouse, retired school teacher, previously active in community"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">Living situation, occupation, social support, habits</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="personality">Personality & Demeanor</Label>
                            <Textarea
                                id="personality"
                                value={structuredData.personality}
                                onChange={(e) => updateStructuredData({ personality: e.target.value })}
                                placeholder="e.g., Soft-spoken, slightly withdrawn, occasionally frustrated by symptoms"
                                rows={3}
                            />
                            <p className="text-xs text-gray-500">How the patient communicates and behaves</p>
                        </div>
                    </div>

                    {/* Clinical Findings Section */}
                    <div className="space-y-4">
                        <div className="pb-3 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Clinical Findings</h3>
                            <p className="text-sm text-gray-600 mt-1">Physical exam findings and additional symptoms</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="physicalFindings">Physical/Neurological Findings</Label>
                            <Textarea
                                id="physicalFindings"
                                value={structuredData.physicalFindings}
                                onChange={(e) => updateStructuredData({ physicalFindings: e.target.value })}
                                placeholder="e.g., Bradykinesia, cogwheel rigidity in upper extremities, reduced arm swing, resting tremor (right > left)"
                                rows={8}
                            />
                            <p className="text-xs text-gray-500">
                                Physical exam findings, neurological signs. These will be provided when the student requests a physical exam.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="additionalSymptoms">Additional Symptoms</Label>
                            <Textarea
                                id="additionalSymptoms"
                                value={structuredData.additionalSymptoms}
                                onChange={(e) => updateStructuredData({ additionalSymptoms: e.target.value })}
                                placeholder="e.g., REM sleep behavior disorder, constipation (3 years), anosmia (2 years)"
                                rows={6}
                            />
                            <p className="text-xs text-gray-500">
                                Other symptoms that may be relevant but not immediately apparent
                            </p>
                        </div>
                    </div>

                    {/* Behavior Settings Section */}
                    <div className="space-y-6">
                        <div className="pb-3 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">Behavior Settings</h3>
                            <p className="text-sm text-gray-600 mt-1">Configure how the patient actor responds</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="revelationLevel">Information Revelation Level</Label>
                            <Select
                                value={structuredData.revelationLevel}
                                onValueChange={(value) =>
                                    updateStructuredData({
                                        revelationLevel: value as 'forthcoming' | 'moderate' | 'reserved'
                                    })
                                }
                            >
                                <SelectTrigger id="revelationLevel">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="forthcoming">
                                        Forthcoming - Readily shares detailed information
                                    </SelectItem>
                                    <SelectItem value="moderate">
                                        Moderate - Shares concisely, elaborates when asked
                                    </SelectItem>
                                    <SelectItem value="reserved">
                                        Reserved - Requires direct questions to reveal details
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Controls how much information the patient volunteers vs. requires prompting
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="stayInCharacter"
                                    checked={structuredData.stayInCharacter}
                                    onCheckedChange={(checked) =>
                                        updateStructuredData({ stayInCharacter: checked as boolean })
                                    }
                                />
                                <Label htmlFor="stayInCharacter" className="font-normal cursor-pointer">
                                    Stay in character throughout the encounter
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="avoidMedicalJargon"
                                    checked={structuredData.avoidMedicalJargon}
                                    onCheckedChange={(checked) =>
                                        updateStructuredData({ avoidMedicalJargon: checked as boolean })
                                    }
                                />
                                <Label htmlFor="avoidMedicalJargon" className="font-normal cursor-pointer">
                                    Avoid medical jargon (patient-appropriate language)
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="provideFeedback"
                                    checked={structuredData.provideFeedback}
                                    onCheckedChange={(checked) =>
                                        updateStructuredData({ provideFeedback: checked as boolean })
                                    }
                                />
                                <Label htmlFor="provideFeedback" className="font-normal cursor-pointer">
                                    Provide feedback at end of encounter
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                            <Textarea
                                id="customInstructions"
                                value={structuredData.customInstructions}
                                onChange={(e) => updateStructuredData({ customInstructions: e.target.value })}
                                placeholder="Add any additional custom instructions for the AI actor..."
                                rows={6}
                            />
                            <p className="text-xs text-gray-500">
                                Additional specific behaviors, constraints, or instructions not covered above
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Full Prompt Preview</DialogTitle>
                        <DialogDescription>
                            This is how your structured data will be formatted as a prompt for the AI
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <pre className="whitespace-pre-wrap text-sm">{generateVPSystemPrompt(structuredData)}</pre>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Patient Actor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{patient.name}</strong>? This action cannot be undone and will permanently delete this patient actor and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
})

PatientEditor.displayName = 'PatientEditor'

export default PatientEditor

