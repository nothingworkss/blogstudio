"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";

export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (image: { id: string; url: string; name: string }) => void;
}) {
  const [isUploading, setUploading] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (response.ok) {
          onUploaded({
            id: data.image_id,
            url: data.image_url,
            name: file.name,
          });
        }
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-md border border-dashed border-[#d9d0c5] bg-[#fffdf9] p-4">
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => upload(event.target.files)}
      />
      <label htmlFor="image-upload" className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-3 text-[13px] text-[#6f675d]">
          <span className="grid size-9 place-items-center rounded-md bg-[#f6eee4] text-[#c95b4f]">
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          </span>
          완성품, 포장, 디테일, 제작 과정 사진을 올려주세요.
        </span>
        <Button type="button" variant="secondary" disabled={isUploading}>
          사진 선택
        </Button>
      </label>
    </div>
  );
}
