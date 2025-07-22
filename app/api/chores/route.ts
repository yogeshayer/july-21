import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Chore } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const chores = await db.collection<Chore>("chores").find({ householdId }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ chores })
  } catch (error) {
    console.error("Get chores error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const choreData = await request.json()
    const db = await getDatabase()
    const householdId = user.isAdmin ? user.userId : user.adminId!

    const choreId = Date.now().toString()
    const chore: Chore = {
      id: choreId,
      ...choreData,
      householdId,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection<Chore>("chores").insertOne(chore)

    return NextResponse.json({ chore })
  } catch (error) {
    console.error("Create chore error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
