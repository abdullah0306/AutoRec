"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Default colors for charts
const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1']

// Types for analytics data
interface DataTypeStat {
  name: string;
  count: number;
  growth: number;
}

interface TimeSeriesDataPoint {
  date: string;
  emails: number;
  phones: number;
  addresses: number;
}

interface SuccessRateDataPoint {
  name: string;
  value: number;
}

interface AnalyticsData {
  dataTypeStats: DataTypeStat[];
  timeSeriesData: TimeSeriesDataPoint[];
  successRateData: SuccessRateDataPoint[];
  totalScrapes: number;
  mostRecentScrape: string | null;
  mostSuccessfulDomain: string;
}

interface ScrapingAnalyticsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ScrapingAnalytics({ className, ...props }: ScrapingAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    dataTypeStats: [
      { name: "Emails", count: 0, growth: 0 },
      { name: "Phone Numbers", count: 0, growth: 0 },
      { name: "Addresses", count: 0, growth: 0 },
      { name: "Postal Codes", count: 0, growth: 0 },
    ],
    timeSeriesData: [
      { date: "", emails: 0, phones: 0, addresses: 0 },
    ],
    successRateData: [
      { name: "Successful", value: 0 },
      { name: "Failed", value: 0 },
    ],
    totalScrapes: 0,
    mostRecentScrape: null,
    mostSuccessfulDomain: "N/A"
  });
  
  const { toast } = useToast();
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setIsLoading(true);
        
        // Get email from localStorage for authentication
        const email = localStorage.getItem('email');
        if (!email) {
          toast({
            title: "Authentication Error",
            description: "Please log in to view analytics",
            variant: "error"
          });
          setIsLoading(false);
          return;
        }
        
        // Fetch analytics data from API
        const response = await fetch(`/api/analytics/contact-scraper?timeRange=${timeRange}`, {
          headers: {
            'Authorization': `Bearer ${email}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.status}`);
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "error"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeRange, toast]);
  
  // Custom tooltip for charts
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
  
  // Function to download analytics data as CSV
  const downloadAnalyticsData = () => {
    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Add header for summary data
      csvContent += "Summary Data\n";
      csvContent += "Total Scrapes,Last Scrape,Best Domain,Success Rate\n";
      
      // Calculate success rate
      const successRate = analyticsData.successRateData[0].value > 0 || analyticsData.successRateData[1].value > 0
        ? Math.round((analyticsData.successRateData[0].value / 
            (analyticsData.successRateData[0].value + analyticsData.successRateData[1].value)) * 100) + '%'
        : 'N/A';
      
      // Add summary data
      csvContent += `${analyticsData.totalScrapes},`;
      csvContent += `${analyticsData.mostRecentScrape ? new Date(analyticsData.mostRecentScrape).toLocaleDateString() : 'N/A'},`;
      csvContent += `${analyticsData.mostSuccessfulDomain},`;
      csvContent += `${successRate}\n\n`;
      
      // Add header for data type stats
      csvContent += "Data Type Statistics\n";
      csvContent += "Data Type,Count,Growth (%)\n";
      
      // Add data type stats
      analyticsData.dataTypeStats.forEach(stat => {
        csvContent += `${stat.name},${stat.count},${stat.growth}\n`;
      });
      csvContent += "\n";
      
      // Add header for time series data
      csvContent += "Time Series Data\n";
      csvContent += "Date,Emails,Phones,Addresses\n";
      
      // Add time series data
      analyticsData.timeSeriesData.forEach(point => {
        csvContent += `${point.date},${point.emails},${point.phones},${point.addresses}\n`;
      });
      csvContent += "\n";
      
      // Add header for success rate data
      csvContent += "Success Rate Data\n";
      csvContent += "Status,Value\n";
      
      // Add success rate data
      analyticsData.successRateData.forEach(point => {
        csvContent += `${point.name},${point.value}\n`;
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `contact-scraping-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Analytics data is being downloaded as CSV",
        variant: "success"
      });
    } catch (error) {
      console.error('Error downloading analytics data:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download analytics data",
        variant: "error"
      });
    }
  };

  return (
    <Card className={className} {...props}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Scraping Analytics</CardTitle>
            <CardDescription>Detailed analysis of scraped data and performance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={downloadAnalyticsData}
              disabled={isLoading}
              title="Download analytics data as CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px]">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Summary cards */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-muted-foreground">Total Scrapes</p>
                      <p className="text-2xl font-bold mt-2">{analyticsData.totalScrapes}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-muted-foreground">Last Scrape</p>
                      <p className="text-2xl font-bold mt-2">
                        {analyticsData.mostRecentScrape 
                          ? new Date(analyticsData.mostRecentScrape).toLocaleDateString() 
                          : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-muted-foreground">Best Domain</p>
                      <p className="text-xl font-bold mt-2 truncate">{analyticsData.mostSuccessfulDomain}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold mt-2">
                        {analyticsData.successRateData[0].value > 0 || analyticsData.successRateData[1].value > 0
                          ? Math.round((analyticsData.successRateData[0].value / 
                              (analyticsData.successRateData[0].value + analyticsData.successRateData[1].value)) * 100) + '%'
                          : 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Data type stats */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {analyticsData.dataTypeStats.map((stat, index) => (
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
                        <LineChart data={analyticsData.timeSeriesData}>
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
                            data={analyticsData.successRateData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.successRateData.map((_, index) => (
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

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Data Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="emails" fill={COLORS[0]} name="Emails" />
                        <Bar dataKey="phones" fill={COLORS[2]} name="Phones" />
                        <Bar dataKey="addresses" fill={COLORS[3]} name="Addresses" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Scraping Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.successRateData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData.successRateData.map((_, index) => (
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
                
                <Card>
                  <CardHeader>
                    <CardTitle>Most Successful Domains</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-center h-[300px]">
                    <div className="text-center">
                      <p className="text-2xl font-bold mb-2">{analyticsData.mostSuccessfulDomain}</p>
                      <p className="text-muted-foreground">Highest data yield</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

