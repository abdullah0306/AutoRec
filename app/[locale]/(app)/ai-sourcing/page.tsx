"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus, Shapes, MoreVertical, Edit, User, TrendingUp, RefreshCcw,
  Eye, EyeOff, BookmarkIcon, Loader2, ExternalLink
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AISourcePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");
  const [eyeStates, setEyeStates] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    // Initialize eye states for all candidates
    const initialEyeStates: Record<number, boolean> = {};
    candidateRecommendations.forEach((_, index) => {
      initialEyeStates[index] = true; // true means eye is open
    });
    setEyeStates(initialEyeStates);
  }, []);

  const toggleEye = (index: number) => {
    setEyeStates(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Navigation tabs removed as they were not functional

  // Define the candidate type
  type Candidate = {
    id: number;
    name: string;
    title: string;
    match: string;
    avatar: string;
    linkedInUrl?: string;
  };

  // Candidate recommendations - initialized as empty, will be populated from local storage
  const [candidateRecommendations, setCandidateRecommendations] = useState<Candidate[]>([]);

  // Load selected candidates from database
  useEffect(() => {
    const fetchSelectedCandidates = async () => {
      try {
        const email = localStorage.getItem('email');
        if (!email) {
          console.error('User not logged in');
          return;
        }

        const response = await fetch('/api/candidates/selected', {
          headers: {
            'Authorization': `Bearer ${email}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const data = await response.json();
        
        // Convert database candidates to the format used in the UI
        const formattedCandidates = data.map((candidate: any, index: number) => ({
          id: candidate.id,
          name: candidate.name,
          title: candidate.title || 'Professional',
          match: `${Math.round(candidate.matchPercentage)}%`,
          avatar: candidate.name.split(' ').map((n: string) => n[0]).join(''),
          linkedInUrl: candidate.linkedinProfileUrl
        }));

        setCandidateRecommendations(formattedCandidates.slice(0, 8)); // Limit to 8 candidates
      } catch (error) {
        console.error('Error fetching selected candidates:', error);
        toast.error('Failed to load recommended candidates');
      }
    };

    fetchSelectedCandidates();
  }, []);

  // Data sources
  const dataSources = [
    {
      name: "LinkedIn",
      connected: true,
      profiles: "5,432",
      lastUpdated: "Updated 2 min ago"
    },
    {
      name: "GitHub",
      connected: false,
      profiles: "0",
      lastUpdated: "Updated 0 min ago"
    },
    {
      name: "Stack Overflow",
      connected: false,
      profiles: "0",
      lastUpdated: "Updated 0 min ago"
    },
    {
      name: "Indeed",
      connected: false,
      profiles: "0",
      lastUpdated: "Updated 0 min ago"
    }
  ];

  // AI Sourcing preferences
  const [sourcingPreferences, setSourcingPreferences] = useState({
    skillsPriority: "",
    experienceLevel: "",
    locationPreferences: "",
    additionalNotes: ""
  });

  // Default values for reset
  const defaultPreferences = {
    skillsPriority: "JavaScript, React, Node.js, TypeScript, AWS",
    experienceLevel: "3-7",
    locationPreferences: "New York",
    additionalNotes: "Looking for candidates with experience in agile environments and strong communication skills."
  };

  // Handle form submission and navigate to results page
  const handleSubmitSearch = () => {
    // Validate inputs
    if (!sourcingPreferences.skillsPriority.trim()) {
      toast.error("Skills priority is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract the first location if multiple are provided
      const location = sourcingPreferences.locationPreferences.split(',')[0].trim();

      // Extract just the number from experience level
      const experienceMatch = sourcingPreferences.experienceLevel.match(/\d+/);
      const experience = experienceMatch ? experienceMatch[0] : '';

      // Navigate to results page with search parameters
      router.push(
        `/ai-sourcing/results?skills=${encodeURIComponent(sourcingPreferences.skillsPriority)}&location=${encodeURIComponent(location)}&experience=${encodeURIComponent(experience)}`
      );
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="mx-auto space-y-6 p-0 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">AI Sourcing System</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automate candidate discovery with AI-powered data collection and real-time recommendations
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Performance Metrics Card */}
          <Card className="rounded-3xl bg-[#1231AA0D] border-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col items-start">
                <div className="h-10 w-10 rounded-full bg-[#1231AA0D] flex items-center justify-center mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                </div>
                <CardTitle className="text-sm text-muted-foreground">PERFORMANCE</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-bold">Sourcing Metrics</h3>
              <p className="text-sm text-muted-foreground mt-2">
                AI has found 127 candidates matching your criteria this week, a 35% increase from last week.
              </p>
              <Button
                variant="default"
                size="sm"
                className="text-xs mt-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Details
              </Button>
            </CardContent>
          </Card>

          {/* System Status Card */}
          <Card className="rounded-3xl bg-[#1231AA0D] border-0 ">
            <CardHeader className="pb-2">
              <div className="flex flex-col items-start">
                <div className="h-10 w-10 rounded-full bg-[#1231AA0D] flex items-center justify-center mb-2">
                  <RefreshCcw className="h-4 w-4 text-blue-600 mr-2" />
                </div>
                <CardTitle className="text-sm text-muted-foreground">STATUS</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-bold">System Status</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Some data sources are disconnected. System is running. Last sync: today at 10:23 AM
              </p>
              <Button
                variant="default"
                size="sm"
                className="text-xs mt-4 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                Check Connections
              </Button>
            </CardContent>
          </Card>

          {/* Top Matches Card */}
          <Card className="rounded-3xl bg-[#1231AA0D] border-0">
            <CardHeader className="pb-2">
              <div className="flex flex-col items-start">
                <div className="h-10 w-10 rounded-full bg-[#1231AA0D] flex items-center justify-center mb-2">
                  <User className="h-4 w-4 text-blue-600 mr-2 items-center" />
                </div>
                <CardTitle className="text-sm text-muted-foreground">CANDIDATES</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-bold">Top Matches</h3>
              <p className="text-sm text-muted-foreground mt-2">
                15 high-quality candidates identified today that are based on your job requirements.
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs rounded-3xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Browse Candidates
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-3xl hover:bg-blue-700 hover:text-white"
                >
                  Adjust Criteria
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Data Sources */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Active Data Sources</h2>
          </div>
          <div className="space-y-3">
            {dataSources.map((source, index) => (
              <div key={index} className="flex items-center justify-between py-3 bg-card rounded-lg shadow-sm px-4">
                <div className="flex items-center gap-3 w-1/4">
                  <div className=" flex items-center justify-center">
                    <Shapes className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{source.name}</h4>
                  </div>
                </div>
                <div className="text-sm text-center w-1/4">
                  {source.connected ? (
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                      Disconnected
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground w-1/4 text-center">{source.profiles} profiles</div>
                <div className="text-sm text-muted-foreground w-1/4 text-right">{source.lastUpdated}</div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Button
              variant="default"
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Data Source
            </Button>
          </div>
        </div>

        {/* Recent Recommendations */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Recent Recommendations</h2>
          </div>
          <div className="space-y-3">
            {candidateRecommendations.map((candidate, index) => (
              <div key={index} className="flex items-center justify-between py-3 bg-card rounded-lg shadow-sm px-4">
                <div className="flex items-center gap-3 w-1/2">
                  <Avatar className="h-10 w-10 bg-blue-100 text-blue-700">
                    <AvatarFallback>{candidate.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-medium">{candidate.name}</h4>
                    <p className="text-xs text-muted-foreground">{candidate.title}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">{candidate.match} match</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleEye(index)}
                  >
                    {eyeStates[index] ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  {candidate.linkedInUrl && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => window.open(candidate.linkedInUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Button
              variant="default"
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
            >
              View All Recommendations
            </Button>
          </div>
        </div>

        {/* AI Sourcing Preferences */}
        {/* AI Sourcing Preferences */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">AI Sourcing Preferences</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* Skills Priority */}
            <div className="bg-card rounded-lg shadow-sm px-4 py-3">
              <h4 className="text-sm font-medium mb-2">Skills Priority</h4>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter skills (e.g., JavaScript, React, TypeScript)"
                  value={sourcingPreferences.skillsPriority}
                  onChange={(e) => setSourcingPreferences({ ...sourcingPreferences, skillsPriority: e.target.value })}
                  className="pr-8"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0 top-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Experience Level */}
            <div className="bg-card rounded-lg shadow-sm px-4 py-3">
              <h4 className="text-sm font-medium mb-2">Experience Level</h4>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter years of experience (e.g., 3-7)"
                  value={sourcingPreferences.experienceLevel}
                  onChange={(e) => setSourcingPreferences({ ...sourcingPreferences, experienceLevel: e.target.value })}
                  className="pr-8"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0 top-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Location Preferences */}
            <div className="bg-card rounded-lg shadow-sm px-4 py-3">
              <h4 className="text-sm font-medium mb-2">Location Preferences</h4>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter location (e.g., New York, London)"
                  value={sourcingPreferences.locationPreferences}
                  onChange={(e) => setSourcingPreferences({ ...sourcingPreferences, locationPreferences: e.target.value })}
                  className="pr-8"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-0 top-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Additional Notes as Textarea */}
            <div className="bg-card rounded-3xl shadow-sm px-4 py-3">
              <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
              <Textarea
                placeholder="Enter any additional requirements or notes"
                value={sourcingPreferences.additionalNotes}
                onChange={(e) => setSourcingPreferences({ ...sourcingPreferences, additionalNotes: e.target.value })}
                className="min-h-20 rounded-3xl"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
              onClick={handleSubmitSearch}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Find Candidates'
              )}
            </Button>
            <Button
              variant="outline"
              size="default"
              className="rounded-3xl hover:bg-blue-700 hover:text-white"
              onClick={() => setSourcingPreferences(defaultPreferences)}
              disabled={isSubmitting}
            >
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}