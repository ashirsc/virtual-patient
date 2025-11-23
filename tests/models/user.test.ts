import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import prisma from '@/lib/prisma'
import { cleanupTestDatabase } from '@/lib/test-helpers'

describe('User Model', () => {

  beforeEach(async () => {
    await cleanupTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  it('should create a user with default values', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.role).toBe('student') // default role
    expect(user.emailVerified).toBe(false) // default value
    expect(user.createdAt).toBeInstanceOf(Date)
    expect(user.updatedAt).toBeInstanceOf(Date)
  })

  it('should create a user with instructor role', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'instructor@example.com',
        name: 'Instructor User',
        role: 'instructor',
      },
    })

    expect(user.role).toBe('instructor')
  })

  it('should enforce email uniqueness', async () => {
    await prisma.user.create({
      data: {
        email: 'unique@example.com',
        name: 'First User',
      },
    })

    await expect(
      prisma.user.create({
        data: {
          email: 'unique@example.com',
          name: 'Second User',
        },
      })
    ).rejects.toThrow()
  })

  it('should update a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'update@example.com',
        name: 'Original Name',
      },
    })

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: 'Updated Name' },
    })

    expect(updatedUser.name).toBe('Updated Name')
  })

  it('should delete a user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'delete@example.com',
        name: 'Delete Me',
      },
    })

    await prisma.user.delete({
      where: { id: user.id },
    })

    const foundUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    expect(foundUser).toBeNull()
  })

  it('should filter users by role', async () => {
    await prisma.user.create({
      data: { email: 'student1@example.com', name: 'Student 1', role: 'student' },
    })
    await prisma.user.create({
      data: { email: 'instructor1@example.com', name: 'Instructor 1', role: 'instructor' },
    })
    await prisma.user.create({
      data: { email: 'student2@example.com', name: 'Student 2', role: 'student' },
    })

    const instructors = await prisma.user.findMany({
      where: { role: 'instructor' },
    })

    const students = await prisma.user.findMany({
      where: { role: 'student' },
    })

    expect(instructors).toHaveLength(1)
    expect(students).toHaveLength(2)
  })
})

