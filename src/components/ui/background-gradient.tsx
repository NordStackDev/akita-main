import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "motion/react";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
  colorClass = "bg-secondary", // fallback hvis ingen farve sendes
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
  colorClass?: string; // fx action.color
}) => {
  const variants = {
    initial: { backgroundPosition: "0 50%" },
    animate: { backgroundPosition: ["0, 50%", "100% 50%", "0 50%"] },
  };

  return (
    <div
      className={cn(
        "relative p-[4px] group rounded-3xl hover:akita-glow akita-transition overflow-hidden", // 👈 overflow-hidden fjerner hvide kanter
        containerClassName
      )}
    >
      {/* mørkt base layer (for at undgå hvid udtoning) */}
      <div className="absolute inset-0 rounded-3xl bg-neutral-900 z-[0]" />

      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? { duration: 6, repeat: Infinity, repeatType: "reverse" }
            : undefined
        }
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-40 group-hover:opacity-70 blur-xl transition duration-700",
          colorClass
        )}
      />

      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? { duration: 6, repeat: Infinity, repeatType: "reverse" }
            : undefined
        }
        className={cn(
          "absolute inset-0 rounded-3xl z-[2] opacity-20",
          colorClass
        )}
      />

      {/* content */}
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};