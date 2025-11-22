import prisma from './prisma.js'

/**
 * Clean up test data by deleting all records from all tables.
 * Call this in beforeEach or afterEach to ensure test isolation.
 */
export async function cleanupTestDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.submittedSession.deleteMany()
  await prisma.gradingRubric.deleteMany()
  await prisma.chatSession.deleteMany()
  await prisma.patientActor.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
}


