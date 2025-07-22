import { getUserFromRequest } from "@/lib/auth"
import type { Household } from "@/lib/models"
import { getDatabase } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

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

    return NextResponse.json({
      invitationCode: household.invitationCode,
      householdName: household.name,
    })
  } catch (error) {
    console.error("Get invitation code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const db = await getDatabase()

    // Generate new invitation code
    const newInvitationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Update household with new invitation code
    const result = await db.collection<Household>("households").updateOne(
      { adminId: user.userId },
      { 
        $set: { 
          invitationCode: newInvitationCode,
          updatedAt: new Date().toISOString()
        } 
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Household not found" }, { status: 404 })
    }

    return NextResponse.json({
      invitationCode: newInvitationCode,
      message: "New invitation code generated successfully"
    })
  } catch (error) {
    console.error("Generate invitation code error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 