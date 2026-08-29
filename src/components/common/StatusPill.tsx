import { clsx } from "clsx";

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold",
        tone === "neutral" && "border-[#ded8ce] bg-[#faf7f0] text-[#5f5f5a]",
        tone === "success" && "border-[#b9dec9] bg-[#edf8f0] text-[#236b44]",
        tone === "warning" && "border-[#f3dfaa] bg-[#fff8df] text-[#755700]",
        tone === "danger" && "border-[#f4bbb5] bg-[#fff1ef] text-[#b4233f]",
      )}
    >
      {children}
    </span>
  );
}
