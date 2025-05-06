"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, EyeOff, Search, ExternalLink, Check, X, Bell, 
  Briefcase, GraduationCap, User, BookmarkIcon, Filter, Sparkles,
  BarChart3, RefreshCw, Puzzle
} from "lucide-react";
import { searchCandidates } from "@/lib/api/linkedin-scraper";

import type { CandidateProfile } from '@/lib/api/linkedin-scraper';
import { toast } from "sonner";
import axios from "axios";

interface AcceptedCandidate extends CandidateProfile {
  matchPercentage: string;
}

export default function AISourceResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("To Review");
  const [eyeStates, setEyeStates] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [candidatesPerSearch, setCandidatesPerSearch] = useState(0);
  const searchInProgress = useRef(false);
  
  // Tab options for candidate status
  const tabOptions = ["To Review", "Snoozed", "Rejected", "Added to Projects"];

  // Get search parameters from URL
  const skills = searchParams.get("skills") || "";
  const location = searchParams.get("location") || "";
  const experience = searchParams.get("experience") || "";

  useEffect(() => {
    const fetchCandidates = async () => {
      // Skip if already searching
      if (searchInProgress.current) {
        return;
      }

      if (!skills) {
        setIsLoading(false);
        setError("No search criteria provided");
        return;
      }

      const email = localStorage.getItem('email');
      if (!email) {
        setError("Please log in to search for candidates.");
        setIsLoading(false);
        return;
      }

      try {
        searchInProgress.current = true;
        setIsLoading(true);
        
        // Search for candidates and update usage in a single transaction
        const result = await searchCandidates(
          {
            skills,
            location,
            experience
          },
          email
        );
        
        // Update the local state with the results
        setCandidates(result.candidates);
        setTotalResults(result.pagination.totalResults);
        setCandidatesPerSearch(result.candidatesPerSearch);
        
        // Initialize eye states
        const initialEyeStates: Record<number, boolean> = {};
        result.candidates.forEach((_, index) => {
          initialEyeStates[index] = true;
        });
        setEyeStates(initialEyeStates);
        
        setIsLoading(false);
      } catch (error: any) {
        console.error("Error fetching candidates:", error);
        setIsLoading(false);

        // Handle specific error cases
        if (error.message === 'Not authenticated') {
          setError("Please log in to search for candidates.");
          return;
        }

        if (error.message === 'Not enough candidate profile credits remaining') {
          setError("You've reached your monthly candidate profile limit. Please upgrade your plan to continue searching.");
          return;
        }

        if (error.response?.data?.error === 'No active subscription') {
          setError("You need an active subscription to search for candidates. Please subscribe to a plan.");
          return;
        }

        setError("Failed to fetch candidates. Please try again.");
      } finally {
        searchInProgress.current = false;
      }
    };

    fetchCandidates();
  }, [skills, location, experience]);

  const toggleEye = (index: number) => {
    setEyeStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const tabs = ["To Review", "Snoozed", "Rejected", "Added to Projects"];

  // Filtered candidates based on search
  const filteredCandidates = candidates.filter(candidate => 
    candidate.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (candidate["Most Recent Experience"] && candidate["Most Recent Experience"].toLowerCase().includes(searchQuery.toLowerCase())) ||
    (candidate.Headline && candidate.Headline.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle candidate actions
  const handleAcceptCandidate = async (candidate: CandidateProfile) => {
    try {
      // Save candidate to database
      const email = localStorage.getItem('email');
    if (!email) {
      toast.error('Please log in to save candidates');
      return;
    }

    const response = await axios.post('/api/candidates/selected', {
        linkedinProfileUrl: candidate["LinkedIn Profile Link"],
        Name: candidate.Name,
        title: candidate["Most Recent Experience"] || '',
        Location: candidate.Location,
        Experience: candidate.Experience,
        Education: candidate.Education,
        Skills: candidate.Skills,
        About: candidate.About,
        matchPercentage: 85 // You can calculate this based on your matching algorithm
    }, {
      headers: {
        'Authorization': `Bearer ${email}`
      }
      });

      const data = response.data;
      if (data.success) {
        toast.success(`Candidate ${candidate.Name} accepted and saved`);
        
        // Remove candidate from current list
        setCandidates(prevCandidates => 
          prevCandidates.filter(c => c["LinkedIn Profile Link"] !== candidate["LinkedIn Profile Link"])
        );
        
        // Update total results count
        setTotalResults(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(data.error || 'Failed to save candidate');
      }
    } catch (error) {
      console.error("Error accepting candidate:", error);
      toast.error("Failed to accept candidate");
    }
    
    toast.success(`${candidate.Name} has been added to recommendations`);
  };
  
  const handleRejectCandidate = (candidate: CandidateProfile) => {
    // Remove from current list
    const updatedCandidates = [...candidates];
    const candidateIndex = candidates.findIndex(c => c.Name === candidate.Name);
    if (candidateIndex !== -1) {
      updatedCandidates.splice(candidateIndex, 1);
      setCandidates(updatedCandidates);
    }
    
    toast.info(`${candidate.Name} has been rejected`);
  };
  
  const handleNotifyCandidate = (candidate: CandidateProfile) => {
    toast.success(`Notification sent to ${candidate.Name}`);
  };

  return (
    <DashboardShell>
      <div className="mx-auto space-y-6 p-0 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">AI Sourcing</h1>
          <p className="text-xl text-muted-foreground mt-1">
            {skills || "Senior Engineers"}
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b mb-6">
          <div className="flex space-x-8">
            {tabOptions.map((tab) => (
              <div key={tab} className="relative pb-2">
                <Button
                  variant="ghost"
                  className={`px-0 font-medium ${activeTab === tab ? 'text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search candidates..."
              className="pl-9 pr-4 py-2 rounded-full bg-gray-100 border-0 w-full text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-full bg-blue-700 text-white border-0 px-6 py-2 text-sm font-medium hover:bg-blue-800">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Button variant="default" className="gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" /> AI Suggestions
          </Button>
        </div>
        
        {/* Candidates Count */}
        <div className="mb-6">
          <h2 className="text-lg font-medium">Candidates ({totalResults || candidates.length})</h2>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Candidates List */}
        <div className="space-y-4">
          {!loading && filteredCandidates.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No candidates found</p>
            </div>
          ) : (
            !loading && 
            filteredCandidates.map((candidate, index) => (
              <div key={index} className="border rounded-lg p-4 mb-4 shadow-sm">
                {/* Header with name and actions */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border bg-gray-100">
                      <AvatarFallback>{candidate.Name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{candidate.Name}</h3>
                      {candidate.Headline && (
                        <span className="text-muted-foreground"> • {candidate.Headline}</span>
                      )}
                      <p className="text-sm text-muted-foreground">{candidate.Location} • {candidate.Experience?.[0]?.duration || '8 years experience'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-green-50"
                      onClick={() => handleAcceptCandidate(candidate)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-red-50"
                      onClick={() => handleRejectCandidate(candidate)}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-amber-50"
                      onClick={() => handleNotifyCandidate(candidate)}
                    >
                      <Bell className="h-4 w-4 text-amber-600" />
                    </Button>
                  </div>
                </div>
                
                {/* Current Position */}
                <div className="flex items-start gap-3 mt-4">
                  <div className="mt-1 h-8 w-8 flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{candidate.Experience?.[0]?.title || 'Senior Frontend Engineer'}</h4>
                    <p className="text-xs text-muted-foreground">{candidate.Experience?.[0]?.company || 'TechCorp Inc.'}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {candidate.Experience?.[0]?.duration || '2019 - Present'}
                  </div>
                </div>
                <hr className="my-2 border-gray-200" />
                  
                {/* Education section */}
                <div className="flex items-start gap-3 mt-2">
                  <div className="mt-1 h-8 w-8 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{candidate.Education?.[0]?.degree || 'Bachelor of Science in Computer Science'}</h4>
                    <p className="text-xs text-muted-foreground">{candidate.Education?.[0]?.school || 'Stanford University'}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {candidate.Education?.[0]?.duration || '2011 - 2015'}
                  </div>
                </div>
                <hr className="my-2 border-gray-200" />
                  
                {/* LinkedIn Profile section */}
                <div className="flex items-start gap-3 mt-2 mb-2">
                  <div className="mt-1 h-8 w-8 flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">LinkedIn Profile</p>
                  </div>
                  <div>
                    <a 
                      href={candidate["LinkedIn Profile Link"]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats and Integration Cards */}
        <div className="mt-12 mb-6">
          <h2 className="text-lg font-medium mb-4">Integrations & Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Sourcing Stats Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">AI Sourcing Stats</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                5 candidates sourced this week, 1 added to projects, 65% match rate
              </p>
              <div className="flex justify-center">
                <Button variant="outline" size="sm" className="w-full justify-center">
                  View Details
                </Button>
              </div>
            </div>

            {/* CRM Sync Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">CRM Sync</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Automatically sync approved candidates with your CRM system
              </p>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Configure
                </Button>
                <Button variant="outline" size="sm">
                  Learn More
                </Button>
              </div>
            </div>

            {/* LinkedIn Extension Card */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-blue-100 p-2 rounded">
                  <Puzzle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-medium">LinkedIn Extension</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Source talent directly from LinkedIn with our browser extension
              </p>
              <div className="flex gap-2">
                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Install
                </Button>
                <Button variant="outline" size="sm">
                  How it works
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
