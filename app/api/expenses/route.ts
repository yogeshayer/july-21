import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Expense } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const expenses = await db.collection<Expense>("expenses").find({ householdId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Get expenses error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const expenseData = await request.json()
    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const expenseId = Date.now().toString()
    const expense: Expense = {
      id: expenseId,
      ...expenseData,
      householdId,
      settled: false,
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection<Expense>("expenses").insertOne(expense)

    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Create expense error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
