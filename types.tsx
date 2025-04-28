export interface Website {
  id: string
  url: string
  status: "pending" | "scraping" | "completed" | "failed" | "paused" | "stopped"
  startTime: string
  endTime?: string
  batchId?: string
}