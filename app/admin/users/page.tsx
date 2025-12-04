import { requireAuthPage } from "@/lib/auth-utils"
import { getAllUsers } from "@/lib/actions/admin"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import UsersClient from "./page-client"

export default async function AdminUsersPage() {
  const authUser = await requireAuthPage()

  // Get full user from database to access role
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
  })

  // Only admins can access this page
  if (!user || user.role !== "admin") {
    redirect("/")
  }

  const users = await getAllUsers()

  return (
    <UsersClient
      users={users}
      currentUserId={authUser.id}
      adminName={authUser.name}
    />
  )
}


