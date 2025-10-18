"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { Patient } from "@/lib/types"

interface PatientSidebarProps {
    patients: Patient[]
    selectedPatient: Patient | null
    onSelectPatient: (patient: Patient) => void
}

export default function PatientSidebar({
    patients,
    selectedPatient,
    onSelectPatient,
}: PatientSidebarProps) {
    return (
        <div className="flex flex-col h-full bg-white border-r">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Select Patient</h2>
                <p className="text-xs text-gray-500 mt-1">Choose a patient to diagnose</p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    {patients.map((patient) => (
                        <Button
                            key={patient.id}
                            onClick={() => onSelectPatient(patient)}
                            variant={selectedPatient?.id === patient.id ? "default" : "outline"}
                            className="w-full justify-start text-left h-auto py-3 px-3"
                        >
                            <div className="flex-1">
                                <div className="font-medium text-sm">{patient.demographics}</div>
                                <div className="text-xs text-gray-600 truncate">{patient.chiefComplaint}</div>
                            </div>
                        </Button>
                    ))}
                </div>
            </ScrollArea>

            {selectedPatient && (
                <>
                    <Separator />
                    <div className="p-4 border-t overflow-auto max-h-64">
                        <h3 className="font-semibold text-sm mb-3">Patient Details</h3>

                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-gray-600">ID:</span>
                                <Badge variant="outline" className="ml-2">
                                    {selectedPatient.id}
                                </Badge>
                            </div>

                            <div>
                                <span className="font-medium block mb-1">Chief Complaint:</span>
                                <p className="text-gray-700">{selectedPatient.chiefComplaint}</p>
                            </div>

                            <div>
                                <span className="font-medium block mb-1">Personality:</span>
                                <p className="text-gray-700">{selectedPatient.personality}</p>
                            </div>

                            <div>
                                <span className="font-medium block mb-1">Medical History:</span>
                                <ul className="list-disc pl-4 text-gray-700 space-y-1">
                                    {selectedPatient.medicalHistory.slice(0, 2).map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                    {selectedPatient.medicalHistory.length > 2 && <li>+{selectedPatient.medicalHistory.length - 2} more</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
