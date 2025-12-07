"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft,
  Loader2,
  Users,
  UserCog,
  Shield,
  GraduationCap,
  User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { signOut, authClient, useSession } from "@/lib/auth-client"
import { toast } from "sonner"
import type { UserRole } from "@/lib/generated/prisma"
import { updateUserRole } from "@/lib/actions/admin"

type UserData = {
  id: string
  name: string | null
  email: string
  role: UserRole
  createdAt: Date
}

interface UsersClientProps {
  users: UserData[]
  currentUserId: string
  adminName: string | null
}

export default function UsersClient({ users, currentUserId, adminName }: UsersClientProps) {
  const router = useRouter()
  const { refetch } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRoleUserId(userId)
    try {
      await updateUserRole(userId, newRole)
      toast.success("User role updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Role update error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user role")
    } finally {
      setUpdatingRoleUserId(null)
    }
  }

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

  const handleImpersonate = async (userId: string) => {
    setImpersonatingUserId(userId)
    try {
      const result = await authClient.admin.impersonateUser({
        userId,
      })
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to impersonate user")
      }
      
      toast.success("Now impersonating user")
      await refetch()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Impersonation error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to impersonate user")
    } finally {
      setImpersonatingUserId(null)
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        )
      case "instructor":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
            <GraduationCap className="h-3 w-3" />
            Instructor
          </Badge>
        )
      case "student":
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            Student
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const studentCount = users.filter(u => u.role === "student").length
  const instructorCount = users.filter(u => u.role === "instructor").length
  const adminCount = users.filter(u => u.role === "admin").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <UserCog className="h-6 w-6 text-purple-600" />
                  User Management
                </h1>
                <p className="text-sm text-gray-600">
                  {adminName ? `Admin: ${adminName}` : 'Manage all users in the system'}
                </p>
              </div>
            </div>
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
              <User className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Instructors</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instructorCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              View and manage all users. Use impersonation to view the app as any user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name || "—"}
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      {user.id === currentUserId ? (
                        getRoleBadge(user.role)
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                          disabled={updatingRoleUserId === user.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            {updatingRoleUserId === user.id ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Updating...</span>
                              </div>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Student
                              </div>
                            </SelectItem>
                            <SelectItem value="instructor">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-3 w-3 text-blue-600" />
                                Instructor
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-3 w-3 text-purple-600" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {user.id !== currentUserId ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(user.id)}
                          disabled={impersonatingUserId === user.id}
                        >
                          {impersonatingUserId === user.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Impersonating...
                            </>
                          ) : (
                            "Impersonate"
                          )}
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

