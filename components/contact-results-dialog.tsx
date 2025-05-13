"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Mail, Phone, Globe, MapPin, Copy } from "lucide-react"
import type { ContactProfile } from "@/lib/api/contact-scraper"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

interface ContactResultsDialogProps {
  isOpen: boolean
  onClose: () => void
  contacts: ContactProfile[] | null
  websiteUrl?: string
}

export function ContactResultsDialog({ isOpen, onClose, contacts, websiteUrl }: ContactResultsDialogProps) {
  // If there are no contacts, show a message dialog instead
  if (!contacts || contacts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {websiteUrl || 'Contact Information'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 text-center py-6">
            <p className="text-gray-600">No contact information was found on this website.</p>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Group data by type
  const emails = contacts.flatMap(contact => contact.email ? [contact.email] : [])
  const phones = contacts.flatMap(contact => contact.phone ? [contact.phone] : [])
  const addresses = contacts.flatMap(contact => {
    const addressParts = [contact.address, contact.city, contact.state, contact.country, contact.zipCode]
      .filter(Boolean)
    return addressParts.length > 0 ? [addressParts.join(', ')] : []
  })
  const postalCodes = contacts.flatMap(contact => contact.zipCode ? [contact.zipCode] : [])
  
  // Extract social media links
  const linkedIns = contacts.flatMap(contact => contact.linkedIn ? [contact.linkedIn] : [])
  const twitters = contacts.flatMap(contact => contact.twitter ? [contact.twitter] : [])
  const facebooks = contacts.flatMap(contact => contact.facebook ? [contact.facebook] : [])
  const instagrams = contacts.flatMap(contact => contact.instagram ? [contact.instagram] : [])

  // Remove duplicates
  const uniqueEmails = [...new Set(emails)]
  const uniquePhones = [...new Set(phones)]
  const uniqueAddresses = [...new Set(addresses)]
  const uniquePostalCodes = [...new Set(postalCodes)]
  const uniqueLinkedIns = [...new Set(linkedIns)]
  const uniqueTwitters = [...new Set(twitters)]
  const uniqueFacebooks = [...new Set(facebooks)]
  const uniqueInstagrams = [...new Set(instagrams)]

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
      variant: "success",
    })
  }

  const downloadCSV = () => {
    if (!contacts) return

    // Create CSV header
    const headers = [
      "Name",
      "Position",
      "Company",
      "Email",
      "Phone",
      "Website",
      "LinkedIn",
      "Twitter",
      "Facebook",
      "Instagram",
      "Address",
      "City",
      "State",
      "Country",
      "Zip Code",
      "Industry",
      "Company Size",
      "Founded Year",
      "Description",
      "Source"
    ]

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...contacts.map(contact => [
        `"${contact.name || ''}"`,
        `"${contact.position || ''}"`,
        `"${contact.company || ''}"`,
        `"${contact.email || ''}"`,
        `"${contact.phone || ''}"`,
        `"${contact.website || ''}"`,
        `"${contact.linkedIn || ''}"`,
        `"${contact.twitter || ''}"`,
        `"${contact.facebook || ''}"`,
        `"${contact.instagram || ''}"`,
        `"${contact.address || ''}"`,
        `"${contact.city || ''}"`,
        `"${contact.state || ''}"`,
        `"${contact.country || ''}"`,
        `"${contact.zipCode || ''}"`,
        `"${contact.industry || ''}"`,
        `"${contact.companySize || ''}"`,
        `"${contact.foundedYear || ''}"`,
        `"${contact.description || ''}"`,
        `"${contact.source || websiteUrl || ''}"`,
      ].join(","))
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `contacts-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex justify-between items-center">
            <span>{websiteUrl || 'Contact Information'}</span>
            <Button variant="outline" size="sm" onClick={downloadCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Emails Section */}
          {uniqueEmails.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold">Emails ({uniqueEmails.length})</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-7 px-2"
                  onClick={() => copyToClipboard(uniqueEmails.join('\n'), 'Emails')}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">Copy All</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {uniqueEmails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <a href={`mailto:${email}`} className="text-blue-600 hover:underline text-sm truncate">
                      {email}
                    </a>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(email, 'Email')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phone Numbers Section */}
          {uniquePhones.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-semibold">Phone Numbers ({uniquePhones.length})</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-7 px-2"
                  onClick={() => copyToClipboard(uniquePhones.join('\n'), 'Phone numbers')}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">Copy All</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {uniquePhones.map((phone, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <a href={`tel:${phone}`} className="text-green-600 hover:underline text-sm truncate">
                      {phone}
                    </a>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(phone, 'Phone number')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addresses Section */}
          {uniqueAddresses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-semibold">Addresses ({uniqueAddresses.length})</h3>
              </div>
              <div className="space-y-2">
                {uniqueAddresses.map((address, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded-md">
                    <p className="text-sm">{address}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Postal Codes Section */}
          {uniquePostalCodes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-semibold">Postal Codes ({uniquePostalCodes.length})</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto h-7 px-2"
                  onClick={() => copyToClipboard(uniquePostalCodes.join('\n'), 'Postal codes')}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="ml-1 text-xs">Copy All</span>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {uniquePostalCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                    <span className="text-sm truncate">{code}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(code, 'Postal code')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media Links Section */}
          {(uniqueLinkedIns.length > 0 || uniqueTwitters.length > 0 || uniqueFacebooks.length > 0 || uniqueInstagrams.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <h3 className="text-sm font-semibold">Social Media Links</h3>
              </div>
              
              {/* LinkedIn Links */}
              {uniqueLinkedIns.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500">LinkedIn ({uniqueLinkedIns.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {uniqueLinkedIns.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                          {link}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(link, 'LinkedIn link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Twitter Links */}
              {uniqueTwitters.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500">Twitter ({uniqueTwitters.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {uniqueTwitters.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                          {link}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(link, 'Twitter link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Facebook Links */}
              {uniqueFacebooks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500">Facebook ({uniqueFacebooks.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {uniqueFacebooks.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                          {link}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(link, 'Facebook link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Instagram Links */}
              {uniqueInstagrams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-500">Instagram ({uniqueInstagrams.length})</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {uniqueInstagrams.map((link, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm truncate">
                          {link}
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(link, 'Instagram link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
