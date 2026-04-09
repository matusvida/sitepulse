"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-primary/90 bg-primary text-primary-foreground shadow-[0_14px_32px_-20px_rgba(29,95,209,0.95)] hover:bg-primary/92 hover:shadow-[0_20px_40px_-24px_rgba(29,95,209,0.95)]",
  secondary:
    "border border-transparent bg-accent text-foreground shadow-sm hover:bg-accent/80",
  ghost: "border border-transparent text-foreground hover:bg-accent/80",
  outline:
    "border border-border/80 bg-white/75 text-foreground shadow-sm hover:border-primary/30 hover:bg-white",
  destructive:
    "border border-destructive/80 bg-destructive text-white shadow-[0_14px_32px_-20px_rgba(239,68,68,0.9)] hover:bg-destructive/92",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
  icon: "h-10 w-10 p-0",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:translate-y-px",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
