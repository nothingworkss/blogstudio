import { StatusPill } from "@/components/common/StatusPill";

export function ProductFitTags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 6).map((tag) => (
        <StatusPill key={tag}>{tag}</StatusPill>
      ))}
    </div>
  );
}
