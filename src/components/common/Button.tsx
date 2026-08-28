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
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-[13px] font-medium transition",
        "focus:outline-none focus:ring-2 focus:ring-[#f06d5f]/25 disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" &&
          "border-[#ef6759] bg-[#ef6759] text-white shadow-[0_8px_18px_rgba(239,103,89,0.16)] hover:bg-[#df5c50]",
        variant === "secondary" && "border-[#ded8ce] bg-white text-[#3a352e] hover:bg-[#faf6ef]",
        variant === "ghost" && "border-transparent bg-transparent text-[#6e675e] hover:bg-[#f6f0e8]",
        variant === "danger" && "border-[#f3b7ae] bg-[#fff4f1] text-[#d84e43] hover:bg-[#ffeae5]",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
