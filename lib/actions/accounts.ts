'use server'

import { createStarterPatientActor } from "./patient-actors"
import { signUp } from "../auth-client"


export async function createAccount(email: string, password: string, name: string) {
    const result = await signUp.email({
        email,
        password,
        name,
    })

    if (result.error) {
        throw new Error(result.error.message || "Failed to sign up")
    }
    
    // Successful signup - create starter patient actor
    if (result.data?.user?.id) {
        try {
            await createStarterPatientActor(result.data.user.id)
            console.log('✅ Created starter patient actor')
        } catch (actorError) {
            console.error('Failed to create starter patient actor:', actorError)
            // Don't fail signup if patient creation fails
        }
    }

    // Return success - let the client handle the redirect
    return { success: true }
}