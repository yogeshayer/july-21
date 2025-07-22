"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TempHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ChoreBoard</CardTitle>
          <p>Temporary Simple Page</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>✅ If you can see this page, React/Next.js is working fine!</p>
          
          <div className="space-y-2">
            <Button 
              className="w-full"
              onClick={() => alert("Button works!")}
            >
              Test Button
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/api/test'}
            >
              Test API (Opens in new tab)
            </Button>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>• No redirect loops</p>
            <p>• No authentication checks</p>
            <p>• Just simple React components</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 