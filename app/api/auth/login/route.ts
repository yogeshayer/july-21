import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { signToken } from "@/lib/auth"
import type { User } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const user = await db.collection<User>("users").findOne({
      email,
      password, // In production, you should hash passwords
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (user.status === "pending") {
      return NextResponse.json({ error: "Your account is pending approval from the admin" }, { status: 403 })
    }

    if (user.status === "rejected") {
      return NextResponse.json({ error: "Your account has been rejected. Please contact the admin." }, { status: 403 })
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      adminId: user.adminId,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        adminId: user.adminId,
        status: user.status,
      },
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
