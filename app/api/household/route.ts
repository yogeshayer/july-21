import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Household, User } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()

    // Get household info
    const household = await db.collection<Household>("households").findOne({
      adminId: user.userId,
    })

    if (!household) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    // Get pending requests
    const pendingRequests = await db
      .collection<User>("users")
      .find({ adminId: user.userId, status: "pending" })
      .toArray()

    // Remove passwords from response
    const safePendingRequests = pendingRequests.map(({ password, ...user }) => user)

    return NextResponse.json({
      household,
      pendingRequests: safePendingRequests,
    })
  } catch (error) {
    console.error("Get household error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
