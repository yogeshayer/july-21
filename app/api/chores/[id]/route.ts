import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Chore } from "@/lib/models"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const choreData = await request.json()
    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const result = await db.collection<Chore>("chores").updateOne(
      { id: params.id, householdId },
      {
        $set: {
          ...choreData,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Chore updated successfully" })
  } catch (error) {
    console.error("Update chore error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const result = await db.collection<Chore>("chores").deleteOne({
      id: params.id,
      householdId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Chore deleted successfully" })
  } catch (error) {
    console.error("Delete chore error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
