"use client";

import type { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "min-h-24 w-full resize-y rounded-[10px] border border-[#deddd8] bg-white px-3 py-2.5 text-[14px] leading-6 text-[#18181b] outline-none transition duration-200",
        "placeholder:text-[#9b9a94] hover:border-[#b9b7b0] focus:border-[#e85464] focus:ring-3 focus:ring-[#e85464]/10",
        className,
      )}
      {...props}
    />
  );
}
