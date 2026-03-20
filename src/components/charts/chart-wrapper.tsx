"use client";

import { ResponsiveContainer } from "recharts";

interface ChartWrapperProps {
  height?: number;
  children: React.ReactElement;
}

export function ChartWrapper({ height = 280, children }: ChartWrapperProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  );
}
