import React, { useState, useEffect } from "react";
import { changelog } from "@/changelog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const CHANGELOG_KEY = "akita-last-seen-changelog";

export const ChangelogPopup = () => {
  const latest = changelog[0];
  const [open, setOpen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(CHANGELOG_KEY);
    if (!lastSeen || lastSeen !== latest.version) {
      setShowPrompt(true);
    }
  }, [latest.version]);

  const handleOpen = () => {
    setOpen(true);
    setShowPrompt(false);
    localStorage.setItem(CHANGELOG_KEY, latest.version);
  };

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-bounce">
          <span>Har du set de nyeste opdateringer?</span>
          <Button size="sm" variant="secondary" onClick={handleOpen}>
            Se changelog
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Seneste opdateringer</DialogTitle>
            <DialogDescription>
              Her kan du se de vigtigste ændringer og nye funktioner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[32rem] overflow-y-auto px-1">
            {changelog.map((entry) => (
              <div
                key={entry.version}
                className="border-b border-border pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {entry.version}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString("da-DK")}
                  </span>
                </div>

                <ul className="list-disc pl-6 space-y-2 text-[15px] leading-relaxed text-foreground">
                  {entry.changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
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
