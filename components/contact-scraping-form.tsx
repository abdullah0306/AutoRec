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
import { useContactScrapingContext } from "@/contexts/contact-scraping-context"
import { cn } from "@/lib/utils"
import { FileUpload } from "@/components/file-upload"
import { Slider } from "@/components/ui/slider"

interface ContactScrapingFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ContactScrapingForm({ className, ...props }: ContactScrapingFormProps) {
  const [url, setUrl] = useState("")
  const [bulkUrls, setBulkUrls] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [maxPages, setMaxPages] = useState(5)
  const [maxLinkDepth, setMaxLinkDepth] = useState(2)
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includePhone, setIncludePhone] = useState(true)
  const [includeSocial, setIncludeSocial] = useState(true)
  const { isLoading, startScraping } = useContactScrapingContext()

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
          variant: "error",
        })
        return
      }

      // Validate max pages and link depth
      if (maxPages <= 0 || maxPages > 30) {
        toast({
          title: "Invalid Max Pages",
          description: "Max pages must be between 1 and 30",
          variant: "error",
        })
        return
      }

      if (maxLinkDepth <= 0 || maxLinkDepth > 30) {
        toast({
          title: "Invalid Max Link Depth",
          description: "Max link depth must be between 1 and 30",
          variant: "error",
        })
        return
      }

      await startScraping(urls, {
        maxPages,
        maxLinkDepth,
        includeEmail,
        includePhone,
        includeSocial
      })
      
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
          Contact Scraping
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Extract contact information from websites
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
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="maxPages" className="text-sm font-medium">Max Pages (1-30)</Label>
              <span className="text-sm text-muted-foreground">{maxPages}</span>
            </div>
            <Slider
              id="maxPages"
              min={1}
              max={30}
              step={1}
              value={[maxPages]}
              onValueChange={(value) => setMaxPages(value[0])}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="maxLinkDepth" className="text-sm font-medium">Max Link Depth (1-30)</Label>
              <span className="text-sm text-muted-foreground">{maxLinkDepth}</span>
            </div>
            <Slider
              id="maxLinkDepth"
              min={1}
              max={30}
              step={1}
              value={[maxLinkDepth]}
              onValueChange={(value) => setMaxLinkDepth(value[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data to Extract</Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeEmail"
                  checked={includeEmail}
                  onChange={(e) => setIncludeEmail(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="includeEmail" className="text-sm">Email Addresses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includePhone"
                  checked={includePhone}
                  onChange={(e) => setIncludePhone(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="includePhone" className="text-sm">Phone Numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="includeSocial"
                  checked={includeSocial}
                  onChange={(e) => setIncludeSocial(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="includeSocial" className="text-sm">Social Media Profiles</Label>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full h-11 text-base font-medium transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Scraping Contacts...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Start Contact Scraping
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
