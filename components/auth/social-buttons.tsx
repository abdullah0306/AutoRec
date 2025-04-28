import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        type="button"
        disabled
        className="h-11 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
      >
        <Icons.google className="mr-2 h-5 w-5" />
        Google
      </Button>
      <Button
        variant="outline"
        type="button"
        disabled
        className="h-11 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
      >
        <Icons.microsoft className="mr-2 h-5 w-5" />
        Microsoft
      </Button>
    </div>
  );
}
