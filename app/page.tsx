"use client"

import { useState } from "react"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import PatientSidebar from "@/components/patient-sidebar"
import ChatInterface from "@/components/chat-interface"
import { patients } from "@/lib/patient-data"
import type { Patient } from "@/lib/types"

export default function Home() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0] || null)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Actor</h1>
            <p className="text-sm text-gray-600">Medical Diagnosis Training Simulation</p>
          </div>
          <div className="text-sm text-gray-600">
            {selectedPatient && `Selected: ${selectedPatient.demographics}`}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4">
        <PanelGroup direction="horizontal" className="rounded-lg border bg-white">
          {/* Sidebar */}
          <Panel defaultSize={25} minSize={20} maxSize={35}>
            <PatientSidebar
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
            />
          </Panel>

          <PanelResizeHandle />

          {/* Chat Area */}
          <Panel defaultSize={75} minSize={65}>
            {selectedPatient ? (
              <ChatInterface patient={selectedPatient} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium">Select a patient to begin</p>
                  <p className="text-sm">Choose from the list on the left to start the simulation</p>
                </div>
              </div>
            )}
          </Panel>
        </PanelGroup>
      </main>
    </div>
  )
}
