"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

export function SettingsDropdown() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      // Save any pending data before logout
      const currentUser = localStorage.getItem("currentUser")
      if (currentUser) {
        const userData = JSON.parse(currentUser)
        const userDataKey = userData.isAdmin ? `ChoreboardData_${userData.id}` : `ChoreboardData_${userData.adminId}`

        // Ensure data is saved
        const ChoreboardData = localStorage.getItem(userDataKey)
        if (ChoreboardData) {
          localStorage.setItem("ChoreboardData", ChoreboardData)
        }
      }

      // Clear session data
      localStorage.removeItem("currentUser")
      localStorage.removeItem("tempUserData")
      localStorage.removeItem("auth-token") // Clear the auth token
      localStorage.removeItem("sessionStart") // Clear session start time

      // Clear API client token
      const { apiClient } = await import("@/lib/api-client")
      apiClient.clearToken()

      // Clear any cached data
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("temp_") || key.startsWith("session_")) {
          localStorage.removeItem(key)
        }
      })

      toast.success("Logged out successfully")
      
      // Force page reload to clear React state and prevent redirect loops
      window.location.href = "/"
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error during logout, but you've been logged out")

      // Force logout even if there's an error
      localStorage.removeItem("currentUser")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User className="mr-2 h-4 w-4" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
