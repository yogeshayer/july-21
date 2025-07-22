import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Expense } from "@/lib/models"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expenseData = await request.json()
    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const result = await db.collection<Expense>("expenses").updateOne(
      { id: params.id, householdId },
      {
        $set: {
          ...expenseData,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Expense updated successfully" })
  } catch (error) {
    console.error("Update expense error:", error)
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

    const result = await db.collection<Expense>("expenses").deleteOne({
      id: params.id,
      householdId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error) {
    console.error("Delete expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
