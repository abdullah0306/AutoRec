"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Activity {
  id: number
  activity: string
  time: string
  source: "camera" | "game" | "app"
}

const initialActivities: Activity[] = [
  { id: 1, activity: "Sarah finished the 'Shape Sorting' game", time: "2 minutes ago", source: "game" },
  { id: 2, activity: "Alex got better at 'Counting Numbers'", time: "15 minutes ago", source: "app" },
  { id: 3, activity: "Emma joined 'Story Time'", time: "1 hour ago", source: "camera" },
  { id: 4, activity: "Noah helped lead a group game", time: "2 hours ago", source: "camera" },
  { id: 5, activity: "Olivia learned all her colors", time: "3 hours ago", source: "app" },
]

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new activity
      const newActivity: Activity = {
        id: Date.now(),
        activity: `New fun activity at ${new Date().toLocaleTimeString()}`,
        time: "Just now",
        source: ["camera", "game", "app"][Math.floor(Math.random() * 3)] as "camera" | "game" | "app",
      }
      setActivities(prev => [newActivity, ...prev.slice(0, 4)])
    }, 30000) // Add new activity every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">Recent Adventures</CardTitle>
        <CardDescription className="text-yellow-600">
          What our little explorers have been up to
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center">
              <div className={`mr-4 h-4 w-4 rounded-full ${
                activity.source === "camera" ? "bg-blue-500" :
                activity.source === "game" ? "bg-green-500" : "bg-yellow-500"
              }`} />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-yellow-900">{activity.activity}</p>
                <p className="text-sm text-yellow-700">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

