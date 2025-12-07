"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"
import type { UserRole } from "@/lib/generated/prisma"

/**
 * Require admin authentication
 * Throws an error if the user is not an admin
 */
export async function requireAdminAuth() {
  const authUser = await requireAuth()
  
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  })
  
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required")
  }
  
  return user
}

/**
 * Get all users for admin display
 * Only accessible by admins
 */
export async function getAllUsers() {
  await requireAdminAuth()
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  
  return users
}

/**
 * Update a user's role
 * Only accessible by admins. Admins cannot change their own role.
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  const admin = await requireAdminAuth()
  
  if (admin.id === userId) {
    throw new Error("Cannot change your own role")
  }
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })
}



