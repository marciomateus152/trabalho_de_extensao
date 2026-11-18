import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
      destructive: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]",
      outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 active:scale-[0.98]",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 active:scale-[0.98]",
      ghost: "hover:bg-slate-100 text-slate-900",
    }
    const sizes = {
      default: "h-11 px-4 py-2 text-sm",
      sm: "h-9 rounded-md px-3 text-xs",
      lg: "h-12 rounded-xl px-6 text-base",
      icon: "h-10 w-10",
    }
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
