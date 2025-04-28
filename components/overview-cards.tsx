import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, FileSpreadsheet, Globe, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const overviewItems = [
  {
    title: "Total Websites Scraped",
    value: "1,234",
    icon: Globe,
    description: "10% increase from last month",
    trend: "increase",
    color: "blue",
  },
  {
    title: "Data Points Collected",
    value: "1.2M",
    icon: Database,
    description: "5% increase from last month",
    trend: "increase",
    color: "green",
  },
  {
    title: "Successful Scrapes",
    value: "98%",
    icon: FileSpreadsheet,
    description: "2% improvement from last month",
    trend: "increase",
    color: "purple",
  },
  {
    title: "Average Scrape Time",
    value: "2.5s",
    icon: Clock,
    description: "0.5s faster than last month",
    trend: "decrease",
    color: "orange",
  },
]

const colorVariants = {
  blue: "from-blue-500/20 to-blue-500/10 text-blue-600 dark:from-blue-500/10 dark:to-blue-500/5 dark:text-blue-400",
  green: "from-green-500/20 to-green-500/10 text-green-600 dark:from-green-500/10 dark:to-green-500/5 dark:text-green-400",
  purple: "from-purple-500/20 to-purple-500/10 text-purple-600 dark:from-purple-500/10 dark:to-purple-500/5 dark:text-purple-400",
  orange: "from-orange-500/20 to-orange-500/10 text-orange-600 dark:from-orange-500/10 dark:to-orange-500/5 dark:text-orange-400",
}

export function OverviewCards() {
  return (
    <>
      {overviewItems.map((item) => (
        <Card 
          key={item.title} 
          className={cn(
            "relative overflow-hidden transition-all hover:shadow-lg",
            "before:absolute before:inset-0 before:bg-gradient-to-br",
            colorVariants[item.color as keyof typeof colorVariants]
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {item.title}
            </CardTitle>
            <div className="p-2 bg-background/80 backdrop-blur-sm rounded-full">
              <item.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-1">
              <div className="text-2xl font-bold tracking-tight">
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className={cn(
                  "inline-block",
                  item.trend === "increase" ? "text-green-500" : "text-red-500"
                )}>
                  {item.trend === "increase" ? "↑" : "↓"}
                </span>
                {item.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

