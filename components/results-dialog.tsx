import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Hash } from "lucide-react";
import type { ScrapingResult } from "@/types/api";

interface ResultsDialogProps {
  result: ScrapingResult | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function ResultsDialog({ result, isOpen, onClose }: ResultsDialogProps) {
  if (!result) return null;

  const sections = [
    {
      title: "Emails",
      icon: Mail,
      items: result.emails,
      color: "text-blue-500",
    },
    {
      title: "Phone Numbers",
      icon: Phone,
      items: result.phones,
      color: "text-green-500",
    },
    {
      title: "Addresses",
      icon: MapPin,
      items: result.addresses,
      color: "text-purple-500",
    },
    {
      title: "Postal Codes",
      icon: Hash,
      items: result.postal_codes,
      color: "text-orange-500",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{result.url}</span>
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
