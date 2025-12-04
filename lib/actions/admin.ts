"use server"

import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

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


