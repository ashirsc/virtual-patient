"use client"

import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { Plus, Trash2, Save, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import {
    getRubricByPatientActor,
    upsertRubric,
    deleteRubric,
} from "@/lib/actions/rubrics"
import {
    STANDARD_OSCE_RUBRIC,
    FPCC_COMPLETE_HISTORY_RUBRIC,
    type RubricCategory,
} from "@/lib/types/rubric"

interface PatientRubricEditorProps {
    patientActorId: string
    onSaveStateChange?: (isSaving: boolean, saveStatus: 'idle' | 'success' | 'error') => void
    onCategoriesChange?: (hasCategories: boolean) => void
}

export interface PatientRubricEditorRef {
    handleSave: () => Promise<void>
    handleDelete: () => Promise<void>
    isSaving: boolean
    saveStatus: 'idle' | 'success' | 'error'
    hasCategories: boolean
}

const PatientRubricEditor = forwardRef<PatientRubricEditorRef, PatientRubricEditorProps>(({ patientActorId, onSaveStateChange, onCategoriesChange }, ref) => {
    const [categories, setCategories] = useState<RubricCategory[]>([])
    const [passingThreshold, setPassingThreshold] = useState<number | undefined>(undefined)
    const [autoGradeEnabled, setAutoGradeEnabled] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

    // Notify parent of save state changes
    useEffect(() => {
        onSaveStateChange?.(isSaving, saveStatus)
    }, [isSaving, saveStatus, onSaveStateChange])

    // Notify parent when categories change
    useEffect(() => {
        onCategoriesChange?.(categories.length > 0)
    }, [categories.length, onCategoriesChange])

    // Load existing rubric
    useEffect(() => {
        loadRubric()
    }, [patientActorId])

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        handleSave,
        handleDelete,
        isSaving,
        saveStatus,
        hasCategories: categories.length > 0,
    }))

    const loadRubric = async () => {
        setIsLoading(true)
        try {
            const rubric = await getRubricByPatientActor(patientActorId)
            if (rubric) {
                setCategories(rubric.categories as unknown as RubricCategory[])
                setPassingThreshold(rubric.passingThreshold || undefined)
                setAutoGradeEnabled(rubric.autoGradeEnabled)
            }
        } catch (error) {
            console.error("Error loading rubric:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleLoadTemplate = (templateType: 'osce' | 'fpcc') => {
        if (templateType === 'osce') {
            setCategories(STANDARD_OSCE_RUBRIC)
            toast.success("Loaded standard OSCE template")
        } else {
            setCategories(FPCC_COMPLETE_HISTORY_RUBRIC)
            toast.success("Loaded FPCC Complete History template")
        }
    }

    const handleAddCategory = () => {
        setCategories([
            ...categories,
            {
                name: "",
                description: "",
                maxPoints: 10,
                criteria: ""
            }
        ])
    }

    const handleUpdateCategory = (index: number, updates: Partial<RubricCategory>) => {
        const newCategories = [...categories]
        newCategories[index] = { ...newCategories[index], ...updates }
        setCategories(newCategories)
    }

    const handleRemoveCategory = (index: number) => {
        setCategories(categories.filter((_, i) => i !== index))
    }

    const calculateTotalPoints = () => {
        return categories.reduce((sum, cat) => sum + (cat.maxPoints || 0), 0)
    }

    const handleSave = async () => {
        // Validation
        if (categories.length === 0) {
            toast.error("Please add at least one grading category")
            return
        }

        for (const cat of categories) {
            if (!cat.name || !cat.description || !cat.maxPoints) {
                toast.error("Please fill in all category fields")
                return
            }
        }

        setIsSaving(true)
        setSaveStatus('idle')

        try {
            await upsertRubric(patientActorId, {
                categories,
                totalPoints: calculateTotalPoints(),
                passingThreshold,
                autoGradeEnabled
            })

            setSaveStatus('success')
            toast.success("Rubric saved successfully!")
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            console.error("Error saving rubric:", error)
            setSaveStatus('error')
            toast.error("Failed to save rubric")
            setTimeout(() => setSaveStatus('idle'), 3000)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this rubric?")) return

        try {
            await deleteRubric(patientActorId)
            setCategories([])
            setPassingThreshold(undefined)
            setAutoGradeEnabled(true)
            toast.success("Rubric deleted successfully")
        } catch (error) {
            console.error("Error deleting rubric:", error)
            toast.error("Failed to delete rubric")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-white min-h-0">
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Template Selection */}
                    {categories.length === 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Get Started</CardTitle>
                                <CardDescription>
                                    Load a template or create your own rubric from scratch
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Choose a template:</p>
                                    <Button onClick={() => handleLoadTemplate('osce')} className="w-full">
                                        Load Standard OSCE Template (5 categories, 50 points)
                                    </Button>
                                    <Button onClick={() => handleLoadTemplate('fpcc')} className="w-full">
                                        Load FPCC Complete History Template (10 categories, 88 points)
                                    </Button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>
                                <Button onClick={handleAddCategory} variant="outline" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Start with Custom Rubric
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Grading Categories</h3>
                                    <p className="text-sm text-gray-600">
                                        Total: {calculateTotalPoints()} points
                                    </p>
                                </div>
                                <Button onClick={handleAddCategory} size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Category
                                </Button>
                            </div>

                            {categories.map((category, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Category {index + 1}</CardTitle>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleRemoveCategory(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Category Name</Label>
                                                <Input
                                                    value={category.name}
                                                    onChange={(e) => handleUpdateCategory(index, { name: e.target.value })}
                                                    placeholder="e.g., History Taking"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Max Points</Label>
                                                <Input
                                                    type="number"
                                                    value={category.maxPoints}
                                                    onChange={(e) => handleUpdateCategory(index, { maxPoints: parseInt(e.target.value) || 0 })}
                                                    min="1"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={category.description}
                                                onChange={(e) => handleUpdateCategory(index, { description: e.target.value })}
                                                placeholder="Brief description of what this category measures"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Grading Criteria</Label>
                                            <Textarea
                                                value={category.criteria}
                                                onChange={(e) => handleUpdateCategory(index, { criteria: e.target.value })}
                                                placeholder="Specific criteria the AI should evaluate..."
                                                rows={3}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rubric Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Passing Threshold (Optional)</Label>
                                        <Input
                                            type="number"
                                            value={passingThreshold || ''}
                                            onChange={(e) => setPassingThreshold(e.target.value ? parseInt(e.target.value) : undefined)}
                                            placeholder={`Minimum score to pass (out of ${calculateTotalPoints()})`}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Leave empty if not applicable
                                        </p>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="autoGrade"
                                            checked={autoGradeEnabled}
                                            onCheckedChange={(checked) => setAutoGradeEnabled(checked as boolean)}
                                        />
                                        <Label htmlFor="autoGrade" className="font-normal cursor-pointer">
                                            Enable AI auto-grading for submissions
                                        </Label>
                                    </div>
                                    <p className="text-xs text-gray-500 ml-6">
                                        When enabled, student submissions will be automatically graded by multiple AI models.
                                        If the models disagree significantly, the submission will be flagged for manual review.
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
})

PatientRubricEditor.displayName = 'PatientRubricEditor'

export default PatientRubricEditor
