"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useContactScrapingContext } from "@/contexts/contact-scraping-context"
import { useState } from "react"
import { ContactResultsDialog } from "@/components/contact-results-dialog"

export function ContactWebsiteList() {
  const { websites, results, allResults } = useContactScrapingContext()
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "scraping":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      case "paused":
        return "bg-orange-500"
      case "stopped":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedWebsite, setSelectedWebsite] = useState<string | null>(null)

  const openModal = (websiteUrl: string) => {
    setSelectedWebsite(websiteUrl)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedWebsite(null)
  }

  // Find the correct batch result for the selected website
  const findResultForWebsite = (websiteUrl: string) => {
    // First, try to find the result in allResults by matching the batchId with the website's batchId
    const website = websites.find(w => w.url === websiteUrl);
    if (website && website.batchId) {
      const matchingResult = allResults.find(r => r.batchId === website.batchId);
      if (matchingResult) {
        return matchingResult.contacts;
      }
    }
    
    // If not found or no batchId, try to find by URL in all results
    for (const result of allResults) {
      const matchingContacts = result.contacts.filter(contact => {
        if (!contact.source) return false;
        
        // Extract domain from both URLs for comparison
        const getHostname = (url: string) => {
          try {
            // Add protocol if missing
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            return new URL(fullUrl).hostname;
          } catch (e) {
            return url; // Return original if parsing fails
          }
        };
        
        const contactDomain = getHostname(contact.source);
        const selectedDomain = getHostname(websiteUrl);
        
        return contactDomain.includes(selectedDomain) || selectedDomain.includes(contactDomain);
      });
      
      if (matchingContacts.length > 0) {
        return matchingContacts;
      }
    }
    
    // Fallback to the current results if nothing found in allResults
    if (results) {
      return results.contacts.filter(contact => {
        if (!contact.source) return false;
        
        // Extract domain from both URLs for comparison
        const getHostname = (url: string) => {
          try {
            // Add protocol if missing
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            return new URL(fullUrl).hostname;
          } catch (e) {
            return url; // Return original if parsing fails
          }
        };
        
        const contactDomain = getHostname(contact.source);
        const selectedDomain = getHostname(websiteUrl);
        
        return contactDomain.includes(selectedDomain) || selectedDomain.includes(contactDomain);
      });
    }
    
    return null;
  };
  
  // Get contacts for the selected website
  const selectedContacts = selectedWebsite ? findResultForWebsite(selectedWebsite) : null

  return (
    <Card className="bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-800 dark:text-blue-200">Contact Scraping Status</CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-300">
          List of websites being scraped for contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-800 dark:text-blue-200">URL</TableHead>
                <TableHead className="text-blue-800 dark:text-blue-200">Status</TableHead>
                <TableHead className="text-blue-800 dark:text-blue-200">Contacts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    No websites added for contact scraping yet
                  </TableCell>
                </TableRow>
              ) : (
                websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium text-blue-700 dark:text-blue-300">{website.url}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(website.status)} text-white`}>{website.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {website.status === "completed" && results && (
                        <button
                          onClick={() => openModal(website.url)}
                          className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-blue-500 text-white hover:bg-blue-600"
                        >
                          View Contacts
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <ContactResultsDialog 
          contacts={selectedContacts}
          isOpen={isModalOpen}
          onClose={closeModal}
          websiteUrl={selectedWebsite || undefined}
        />
      </CardContent>
    </Card>
  )
}
