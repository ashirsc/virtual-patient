import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current session in Server Actions or Server Components
 * Returns null if not authenticated
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Get the current user in Server Actions or Server Components
 * Throws an error if not authenticated (for use in Server Actions)
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

export async function requireInstructorAuth() {
  const user = await requireAuth();
  //TODO: Add instructor and admin check
  // if (user.role !== "instructor" && user.role !== "admin") {
  //   throw new Error("Unauthorized");
  // }
  return user;
}

/**
 * Require authentication in Server Components
 * Redirects to /login if not authenticated
 */
export async function requireAuthPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Get optional authentication - returns user if authenticated, null otherwise
 * Does not throw or redirect
 */
export async function getOptionalAuth() {
  const session = await getSession();
  return session?.user || null;
}
