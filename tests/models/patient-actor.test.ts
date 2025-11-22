import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import prisma from '@/lib/prisma'
import { cleanupTestDatabase } from '@/lib/test-helpers'

describe('PatientActor Model', () => {
  let ownerId: string

  beforeEach(async () => {
    await cleanupTestDatabase()

    // Create a user to own the patient actors
    const owner = await prisma.user.create({
      data: {
        email: 'owner@example.com',
        name: 'Owner User',
        role: 'instructor',
      },
    })
    ownerId = owner.id
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should create a patient actor with default values', async () => {
    const patientActor = await prisma.patientActor.create({
      data: {
        name: 'John Doe',
        age: 45,
        slug: 'john-doe',
        ownerId,
      },
    })

    expect(patientActor.id).toBeDefined()
    expect(patientActor.name).toBe('John Doe')
    expect(patientActor.age).toBe(45)
    expect(patientActor.slug).toBe('john-doe')
    expect(patientActor.isPublic).toBe(true) // default
    expect(patientActor.allowSubmissions).toBe(true) // default
    expect(patientActor.revelationLevel).toBe('moderate') // default
  })

  it('should create a patient actor with full structured data', async () => {
    const patientActor = await prisma.patientActor.create({
      data: {
        name: 'Jane Smith',
        age: 32,
        slug: 'jane-smith',
        ownerId,
        demographics: '32-year-old female',
        chiefComplaint: 'Chest pain',
        medicalHistory: 'Hypertension, diabetes',
        medications: 'Metformin, Lisinopril',
        revelationLevel: 'forthcoming',
      },
    })

    expect(patientActor.demographics).toBe('32-year-old female')
    expect(patientActor.chiefComplaint).toBe('Chest pain')
    expect(patientActor.revelationLevel).toBe('forthcoming')
  })

  it('should enforce slug uniqueness', async () => {
    await prisma.patientActor.create({
      data: {
        name: 'First Patient',
        age: 40,
        slug: 'unique-slug',
        ownerId,
      },
    })

    await expect(
      prisma.patientActor.create({
        data: {
          name: 'Second Patient',
          age: 35,
          slug: 'unique-slug',
          ownerId,
        },
      })
    ).rejects.toThrow()
  })

  it('should cascade delete when owner is deleted', async () => {
    const patientActor = await prisma.patientActor.create({
      data: {
        name: 'Cascade Test',
        age: 42,
        slug: 'cascade-test',
        ownerId,
      },
    })

    await prisma.user.delete({
      where: { id: ownerId },
    })

    const foundPatient = await prisma.patientActor.findUnique({
      where: { id: patientActor.id },
    })

    expect(foundPatient).toBeNull()
  })
})

