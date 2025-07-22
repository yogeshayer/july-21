import { signToken } from "@/lib/auth"
import type { Household, User } from "@/lib/models"
import { getDatabase } from "@/lib/mongodb"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword, accountType, invitationCode } = await request.json()

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const db = await getDatabase()

    // Check if email already exists
    const existingUser = await db.collection<User>("users").findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    let adminId = ""
    let status: "pending" | "approved" = "approved"
    let householdId = ""

    if (accountType === "roommate") {
      if (!invitationCode) {
        return NextResponse.json({ error: "Invitation code is required for roommates" }, { status: 400 })
      }

      // Find household with matching invitation code
      const household = await db.collection<Household>("households").findOne({
        invitationCode: invitationCode.trim().toUpperCase(), // Ensure consistent format
      })

      if (!household) {
        return NextResponse.json({ error: "Invalid invitation code. Please check the code and try again." }, { status: 400 })
      }

      adminId = household.adminId
      householdId = household.id
      status = "pending" // Roommates need approval
    }

    const userId = Date.now().toString()
    const newUser: User = {
      id: userId,
      name,
      email,
      password, // In production, hash this password
      isAdmin: accountType === "admin",
      avatar: "",
      adminId: adminId || undefined,
      status,
      requestedAt: accountType === "roommate" ? new Date().toISOString() : undefined,
      joinedAt: accountType === "admin" ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await db.collection<User>("users").insertOne(newUser)

    if (accountType === "admin") {
      // Create household for admin
      const invitationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const household: Household = {
        id: userId, // Use user ID as household ID for admin
        adminId: userId,
        invitationCode,
        name: `${name}'s Household`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await db.collection<Household>("households").insertOne(household)

      const token = signToken({
        userId: newUser.id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        adminId: newUser.adminId,
      })

      const response = NextResponse.json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
          avatar: newUser.avatar,
          adminId: newUser.adminId,
          status: newUser.status,
        },
        token,
        invitationCode,
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
      })

      return response
    } else {
      return NextResponse.json({
        message: "Registration successful! Waiting for admin approval.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          status: newUser.status,
        },
      })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
