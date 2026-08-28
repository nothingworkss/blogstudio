"use client";

import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-10 w-full rounded-md border border-[#ded8ce] bg-white px-3 text-[14px] text-[#292520] outline-none transition",
        "placeholder:text-[#aaa196] focus:border-[#ef6759] focus:ring-3 focus:ring-[#ef6759]/10",
        className,
      )}
      {...props}
    />
  );
}
