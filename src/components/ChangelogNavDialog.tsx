import { useState } from "react";
import { ScrollText } from "lucide-react";
import { changelog } from "@/changelog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ChangelogNavDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="w-full flex gap-2 justify-start"
        onClick={() => setOpen(true)}
        aria-label="Se changelog"
      >
        <ScrollText className="w-4 h-4" />
        <span>Changelog</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seneste opdateringer</DialogTitle>
            <DialogDescription>
              Hold dig opdateret på de nyeste ændringer og funktioner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
            {changelog.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("da-DK")}
                  </span>
                </div>

                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {entry.changes.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>

                <hr className="border-border/40 mt-3" />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} autoFocus>
              Luk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
