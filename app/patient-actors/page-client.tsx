"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels"
import { Plus, ArrowLeft, Loader2 } from "lucide-react"
import PatientWorkspace from "@/components/patient-workspace"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/auth-client"
import { createPatientActor } from "@/lib/actions/patient-actors"
import { toast } from "sonner"
import type { PatientActor } from "@/lib/generated/client"
import Link from "next/link"

interface PatientActorsClientProps {
  patientActors: PatientActor[]
  userName: string | null
  userRole: string
  submissions: any[]
}

export default function PatientActorsClient({ 
  patientActors, 
  userName, 
  userRole, 
  submissions 
}: PatientActorsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [patients, setPatients] = useState<PatientActor[]>(patientActors)
  const [isCreating, setIsCreating] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Find selected patient from URL or default to first
  const selectedId = searchParams.get('id')
  const initialPatient = selectedId 
    ? patients.find(p => p.id === selectedId) || patients[0] 
    : patients[0]
  const [selectedPatient, setSelectedPatient] = useState<PatientActor | null>(initialPatient || null)

  // Handle create param in URL
  useEffect(() => {
    if (searchParams.get('create') === 'true' && !isCreating) {
      handleCreatePatient()
    }
  }, [searchParams])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      router.push("/login")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  const handlePatientUpdate = (updatedPatient: PatientActor) => {
    setPatients(prev =>
      prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
    )
    if (selectedPatient?.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient)
    }
  }

  const handlePatientDelete = () => {
    if (!selectedPatient) return

    // Remove the deleted patient from the list
    const updatedPatients = patients.filter(p => p.id !== selectedPatient.id)
    setPatients(updatedPatients)

    // Select the next patient, or null if no patients left
    setSelectedPatient(updatedPatients.length > 0 ? updatedPatients[0] : null)
  }

  const handleCreatePatient = async () => {
    setIsCreating(true)
    try {
      const newPatient = await createPatientActor({
        name: "New Patient Actor",
        age: 50,
        prompt: "# Patient Actor Instructions\n\nEnter your patient actor's behavior and characteristics here...",
      })

      setPatients(prev => [newPatient, ...prev])
      setSelectedPatient(newPatient)
      toast.success("Patient actor created!")
      
      // Clear the create param from URL
      router.replace('/patient-actors')
    } catch (error) {
      console.error("Error creating patient:", error)
      toast.error("Failed to create patient actor")
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectPatient = (patient: PatientActor) => {
    setSelectedPatient(patient)
    // Update URL without full navigation
    router.replace(`/patient-actors?id=${patient.id}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patient Actors</h1>
              <p className="text-sm text-gray-600">Create and manage your virtual patients</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {userName && `Welcome, ${userName}`}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 flex flex-col min-h-0">
        {patients.length === 0 ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900">No patient actors yet</p>
              <p className="text-sm text-gray-600 mt-2 mb-4">
                Create your first patient actor to get started
              </p>
              <Button
                onClick={handleCreatePatient}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Patient Actor
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <PanelGroup direction="horizontal" className="flex-1 rounded-lg border bg-white">
            {/* Sidebar */}
            <Panel defaultSize={25} minSize={20} maxSize={35} className="h-full">
              <div className="h-full overflow-y-auto p-4 border-r flex flex-col">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold mb-3">Patient Actors</h2>
                  <Button
                    onClick={handleCreatePatient}
                    disabled={isCreating}
                    className="w-full"
                    size="sm"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Patient
                      </>
                    )}
                  </Button>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedPatient?.id === patient.id
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                        }`}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-gray-600">Age {patient.age}</div>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />

            {/* Workspace Area with Tabs */}
            <Panel defaultSize={75} minSize={65}>
              <div className="h-full">
                {selectedPatient ? (
                  <PatientWorkspace
                    key={selectedPatient.id}
                    patient={selectedPatient}
                    userRole={userRole}
                    onUpdate={handlePatientUpdate}
                    onDelete={handlePatientDelete}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg font-medium">Select a patient to work with</p>
                      <p className="text-sm">Choose from the list on the left to start</p>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </PanelGroup>
        )}
      </main>
    </div>
  )
}


