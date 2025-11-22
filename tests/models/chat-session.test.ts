import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import prisma from '@/lib/prisma'
import { cleanupTestDatabase } from '@/lib/test-helpers'

describe('ChatSession Model', () => {
  let userId: string
  let patientActorId: string

  beforeEach(async () => {
    await cleanupTestDatabase()

    // Create a user
    const user = await prisma.user.create({
      data: {
        email: 'student@example.com',
        name: 'Student User',
        role: 'student',
      },
    })
    userId = user.id

    // Create an instructor for patient actor
    const instructor = await prisma.user.create({
      data: {
        email: 'instructor@example.com',
        name: 'Instructor User',
        role: 'instructor',
      },
    })

    // Create a patient actor
    const patientActor = await prisma.patientActor.create({
      data: {
        name: 'Test Patient',
        age: 45,
        slug: 'test-patient',
        ownerId: instructor.id,
      },
    })
    patientActorId = patientActor.id
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should create a chat session with messages', async () => {
    const messages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]

    const chatSession = await prisma.chatSession.create({
      data: {
        userId,
        patientActorId,
        messages: JSON.stringify(messages),
        messageCount: 2,
      },
    })

    expect(chatSession.id).toBeDefined()
    expect(chatSession.userId).toBe(userId)
    expect(chatSession.messageCount).toBe(2)
  })

  it('should create anonymous chat session', async () => {
    const messages = [{ role: 'user', content: 'Anonymous message' }]

    const chatSession = await prisma.chatSession.create({
      data: {
        patientActorId,
        messages: JSON.stringify(messages),
        messageCount: 1,
      },
    })

    expect(chatSession.userId).toBeNull()
  })

  it('should cascade delete when user is deleted', async () => {
    const chatSession = await prisma.chatSession.create({
      data: {
        userId,
        patientActorId,
        messages: JSON.stringify([{ role: 'user', content: 'Test' }]),
        messageCount: 1,
      },
    })

    await prisma.user.delete({
      where: { id: userId },
    })

    const foundSession = await prisma.chatSession.findUnique({
      where: { id: chatSession.id },
    })

    expect(foundSession).toBeNull()
  })
})

