import { getDatabase } from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables
    const hasMongoUri = !!process.env.MONGODB_URI
    const hasJwtSecret = !!process.env.JWT_SECRET
    const nodeEnv = process.env.NODE_ENV
    
    console.log("Environment check:", { hasMongoUri, hasJwtSecret, nodeEnv })
    
    if (!hasMongoUri) {
      return NextResponse.json({ 
        error: "MONGODB_URI not found in environment variables",
        env: { hasMongoUri, hasJwtSecret, nodeEnv }
      }, { status: 500 })
    }

    // Test database connection
    const db = await getDatabase()
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({ 
      status: "success",
      message: "Database connection successful",
      env: { hasMongoUri, hasJwtSecret, nodeEnv },
      collections: collections.map(c => c.name)
    })
  } catch (error: any) {
    console.error("Test endpoint error:", error)
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack,
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
} 