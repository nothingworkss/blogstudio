"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/common/Button";

export function CopyToNaverButton({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Button
      type="button"
      variant={copied ? "primary" : "secondary"}
      className="h-8 w-full justify-between px-2 text-[12px]"
      onClick={copy}
    >
      <span>{label}</span>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
