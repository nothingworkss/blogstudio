"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

export function Button({ className, variant = "secondary", icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border px-3.5 text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow] duration-200",
        "focus:outline-none focus-visible:ring-3 focus-visible:ring-[#c9364f]/15 disabled:cursor-not-allowed disabled:border-[#d9d8d3] disabled:bg-[#ecebe7] disabled:text-[#6f6f6a] disabled:shadow-none",
        variant === "primary" &&
          "border-[#c9364f] bg-[#c9364f] text-white shadow-[0_8px_20px_rgba(201,54,79,0.20)] hover:border-[#ad243d] hover:bg-[#ad243d]",
        variant === "secondary" && "border-[#d9d8d3] bg-white text-[#27272a] hover:border-[#bdbbb4] hover:bg-[#fafaf9]",
        variant === "ghost" && "border-transparent bg-transparent text-[#62625d] hover:bg-[#eeede9] hover:text-[#18181b]",
        variant === "danger" && "border-[#f1b4bc] bg-[#fff2f4] text-[#c93f51] hover:bg-[#ffe5e9]",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
