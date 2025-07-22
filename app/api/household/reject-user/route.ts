import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId } = await request.json()
    const db = await getDatabase()

    // Delete the user instead of just marking as rejected
    const result = await db.collection<User>("users").deleteOne({
      id: userId,
      adminId: user.userId,
      status: "pending",
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found or already processed" }, { status: 404 })
    }

    return NextResponse.json({ message: "User rejected successfully" })
  } catch (error) {
    console.error("Reject user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
