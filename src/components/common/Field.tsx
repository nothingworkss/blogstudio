import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#30302d]">
        {label}
        {hint ? <span className="text-[11px] font-medium text-[#6f6f6a]">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
