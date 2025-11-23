import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import prisma from '@/lib/prisma'
import { cleanupTestDatabase } from '@/lib/test-helpers'

describe('Full Workflow Integration', () => {
  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should complete a student-instructor workflow', async () => {
    // Create instructor
    const instructor = await prisma.user.create({
      data: {
        email: 'instructor@school.edu',
        name: 'Dr. Smith',
        role: 'instructor',
      },
    })

    // Create student
    const student = await prisma.user.create({
      data: {
        email: 'student@school.edu',
        name: 'John Student',
        role: 'student',
      },
    })

    // Instructor creates patient actor
    const patientActor = await prisma.patientActor.create({
      data: {
        name: 'Sarah Johnson',
        age: 35,
        slug: 'sarah-johnson-case',
        ownerId: instructor.id,
        chiefComplaint: 'Chest pain for 2 hours',
        demographics: '35-year-old female',
      },
    })

    // Create grading rubric
    const rubric = await prisma.gradingRubric.create({
      data: {
        patientActorId: patientActor.id,
        categories: JSON.stringify([
          { name: 'Communication', maxPoints: 10 },
          { name: 'Clinical Reasoning', maxPoints: 10 },
        ]),
        totalPoints: 20,
        passingThreshold: 14,
      },
    })

    // Student starts chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        userId: student.id,
        patientActorId: patientActor.id,
        messages: JSON.stringify([
          { role: 'assistant', content: 'Hello, I have chest pain.' },
          { role: 'user', content: 'When did it start?' },
        ]),
        messageCount: 2,
      },
    })

    // Submit for grading
    const submission = await prisma.submittedSession.create({
      data: {
        chatSessionId: chatSession.id,
        instructorId: instructor.id,
        status: 'pending',
      },
    })

    // Verify the complete workflow
    const result = await prisma.submittedSession.findUnique({
      where: { id: submission.id },
      include: {
        chatSession: {
          include: {
            user: true,
            patientActor: {
              include: {
                owner: true,
                gradingRubric: true,
              },
            },
          },
        },
        instructor: true,
      },
    })

    expect(result).not.toBeNull()
    expect(result?.chatSession.user?.email).toBe('student@school.edu')
    expect(result?.instructor.email).toBe('instructor@school.edu')
    expect(result?.chatSession.patientActor.gradingRubric?.totalPoints).toBe(20)
  })
})
