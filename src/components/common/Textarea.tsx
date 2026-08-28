"use client";

import type { TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "min-h-24 w-full resize-y rounded-md border border-[#ded8ce] bg-white px-3 py-2 text-[14px] leading-6 text-[#292520] outline-none transition",
        "placeholder:text-[#aaa196] focus:border-[#ef6759] focus:ring-3 focus:ring-[#ef6759]/10",
        className,
      )}
      {...props}
    />
  );
}
