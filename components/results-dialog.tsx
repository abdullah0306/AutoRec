import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Hash } from "lucide-react";

interface ResultsDialogProps {
  result: {
    url: string;
    startedAt: string;
    completedAt?: string;
    status: string;
    emails?: string[];
    phones?: string[];
    addresses?: string[];
    postalCodes?: string[];
    totalEmails?: number;
    totalPhones?: number;
    totalAddresses?: number;
    totalPostalCodes?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ResultsDialog({ result, isOpen, onClose }: ResultsDialogProps) {
  if (!result) return null;

  const sections = result ? [
    {
      title: "Emails",
      icon: Mail,
      items: result.emails || [],
      count: result.totalEmails || 0,
      color: "text-blue-500",
    },
    {
      title: "Phone Numbers",
      icon: Phone,
      items: result.phones || [],
      count: result.totalPhones || 0,
      color: "text-green-500",
    },
    {
      title: "Addresses",
      icon: MapPin,
      items: result.addresses || [],
      count: result.totalAddresses || 0,
      color: "text-purple-500",
    },
    {
      title: "Postal Codes",
      icon: Hash,
      items: result.postalCodes || [],
      count: result.totalPostalCodes || 0,
      color: "text-orange-500",
    },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="truncate block text-lg">{result.url}</span>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <span>Started: {new Date(result.startedAt).toLocaleString()}</span>
                {result.completedAt && (
                  <span>• Completed: {new Date(result.completedAt).toLocaleString()}</span>
                )}
              </div>
            </div>
            <Badge variant={result.status === "completed" ? "default" : "destructive"}>
              {result.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="mt-4 max-h-[60vh]">
          <div className="space-y-6">
            {sections.map(({ title, icon: Icon, items, color }) => (
              <div key={title} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <h4 className="font-medium">{title} ({items.length})</h4>
                </div>
                {items.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="bg-muted p-2 rounded-md text-sm break-all"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No {title.toLowerCase()} found</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
