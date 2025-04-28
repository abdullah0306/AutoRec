"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import { useScrapingContext } from "@/contexts/scraping-context"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/file-upload"

interface ScrapingFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrapingForm({ className, ...props }: ScrapingFormProps) {
  const [url, setUrl] = useState("")
  const [bulkUrls, setBulkUrls] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const { isLoading, startScraping } = useScrapingContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let urls: string[] = []

      if (url) {
        urls = [url]
      } else if (bulkUrls) {
        urls = bulkUrls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
      } else if (file) {
        // Handle file upload
        const text = await file.text()
        urls = text
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean)
      }

      if (urls.length === 0) {
        toast({
          title: "No URLs",
          description: "Please provide at least one URL to scrape",
          variant: "destructive",
        })
        return
      }

      await startScraping(urls)
      
      // Clear form
      setUrl("")
      setBulkUrls("")
      setFile(null)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)} {...props}>
      <CardHeader className="space-y-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Start Scraping
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter URLs or upload a file to begin scraping
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium">Single URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-4 pr-4 py-2 h-11 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulkUrls" className="text-sm font-medium">Multiple URLs</Label>
            <Textarea
              id="bulkUrls"
              placeholder="Enter multiple URLs (one per line)"
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              className="min-h-[120px] resize-y transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload File</Label>
            <FileUpload
              onFileChange={setFile}
              accept=".csv,.txt,.xlsx"
              maxSize={5}
              className="min-h-[150px]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-11 text-base font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Start Scraping
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

