import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { User } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    // Get all approved users in the household
    const users = await db
      .collection<User>("users")
      .find({
        $or: [
          { id: householdId }, // Admin
          { adminId: householdId, status: "approved" }, // Approved roommates
        ],
      })
      .toArray()

    // Remove password from response
    const safeUsers = users.map(({ password, ...user }) => user)

    return NextResponse.json({ users: safeUsers })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
