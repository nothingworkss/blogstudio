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
        "inline-flex h-6 items-center rounded-md border px-2 text-[12px] font-semibold",
        tone === "neutral" && "border-[#ded8ce] bg-[#faf7f0] text-[#6c6257]",
        tone === "success" && "border-[#b9dec9] bg-[#edf8f0] text-[#348658]",
        tone === "warning" && "border-[#f3dfaa] bg-[#fff8df] text-[#9a7319]",
        tone === "danger" && "border-[#f4bbb5] bg-[#fff1ef] text-[#d8564a]",
      )}
    >
      {children}
    </span>
  );
}
