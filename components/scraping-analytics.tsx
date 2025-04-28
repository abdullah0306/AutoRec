"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp } from "lucide-react"

const dataTypeStats = [
  { name: "Emails", count: 150, growth: 12 },
  { name: "Phone Numbers", count: 100, growth: 8 },
  { name: "Addresses", count: 75, growth: -5 },
  { name: "Postal Codes", count: 80, growth: 15 },
]

const timeSeriesData = [
  { date: "2024-01", emails: 120, phones: 80, addresses: 60 },
  { date: "2024-02", emails: 140, phones: 90, addresses: 70 },
  { date: "2024-03", emails: 150, phones: 100, addresses: 75 },
]

const successRateData = [
  { name: "Successful", value: 85 },
  { name: "Failed", value: 15 },
]

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1']

interface ScrapingAnalyticsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrapingAnalytics({ className, ...props }: ScrapingAnalyticsProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className={className} {...props}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Scraping Analytics</CardTitle>
            <CardDescription>Detailed analysis of scraped data and performance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="7d">
              <SelectTrigger className="w-[130px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dataTypeStats.map((stat, index) => (
                <Card key={stat.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                      <span className={`text-sm ${stat.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.growth > 0 ? '+' : ''}{stat.growth}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{stat.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Data Collection Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="emails" stroke={COLORS[0]} />
                        <Line type="monotone" dataKey="phones" stroke={COLORS[2]} />
                        <Line type="monotone" dataKey="addresses" stroke={COLORS[3]} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={successRateData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {successRateData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends">
            {/* Additional trend analysis content */}
          </TabsContent>

          <TabsContent value="performance">
            {/* Performance metrics content */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

