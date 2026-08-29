"use client";

import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-11 w-full rounded-[10px] border border-[#deddd8] bg-white px-3 text-[14px] text-[#18181b] outline-none transition duration-200",
        "placeholder:text-[#9b9a94] hover:border-[#b9b7b0] focus:border-[#e85464] focus:ring-3 focus:ring-[#e85464]/10",
        className,
      )}
      {...props}
    />
  );
}
