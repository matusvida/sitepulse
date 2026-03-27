"use client";

import { useRef, useState, useEffect } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartWrapperProps {
  height?: number;
  children: React.ReactElement;
}

export function ChartWrapper({ height = 280, children }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Wait one frame so the container has a measured width before
  // ResponsiveContainer initialises — fixes the recharts v3 issue
  // where the chart renders at 0×0 on first paint in Next.js.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height }}>
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
