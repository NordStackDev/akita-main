import React from "react";
import { cn } from "@/lib/utils";

export function GradientStrokeBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-[2px] bg-gradient-to-r from-[#e70b0b] to-[#ff4b2b]",
        className
      )}
    >
      <div className="rounded-2xl bg-white dark:bg-background w-full h-full">
        {children}
      </div>
    </div>
  );
}
