import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SettingsForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your scraping preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input id="api-key" placeholder="Enter your API key" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-concurrency">Max Concurrency</Label>
          <Input id="max-concurrency" placeholder="Enter max concurrency" type="number" defaultValue={5} />
        </div>
        <Button>Save Settings</Button>
      </CardContent>
    </Card>
  )
}

