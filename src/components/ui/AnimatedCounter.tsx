import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms
  className?: string;
}

// Smooth easeInOut cubic for a more natural, fluid animation
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1800,
  className,
}) => {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (prevValue.current === value) return;
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const linear = Math.min(elapsed / duration, 1);
      const progress = easeInOutCubic(linear);
      const current = Math.round(start + (end - start) * progress);
      setDisplay(current);
      if (linear < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setDisplay(end);
        prevValue.current = value;
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
};
