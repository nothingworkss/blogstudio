"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import {
  editorialQuestionFields,
  editorialSummaryFields,
  getMissingEditorialInfo,
  normalizeEditorialProfile,
} from "@/lib/product/editorial";
import { splitByComma } from "@/lib/utils/strings";
import { ProductFitTags } from "./ProductFitTags";

export function ProductCard({
  product,
  onSaved,
}: {
  product: Product;
  onSaved?: (product: Product) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Product>({
    ...product,
    editorial_profile: normalizeEditorialProfile(product.editorial_profile),
  });
  const [saving, setSaving] = useState(false);
  const profile = normalizeEditorialProfile(draft.editorial_profile);
  const missingInfo = getMissingEditorialInfo(draft);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (response.ok) {
        onSaved?.(data.product);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-md border border-[#e5ddd2] bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold text-[#312b25]">{product.name}</h3>
          <p className="mt-1 text-[12px] text-[#8d8175]">{product.category}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-md bg-[#edf8f0] px-2 py-1 text-[11px] font-bold text-[#348658]">
            {product.is_active ? "활성" : "비활성"}
          </span>
          <Button type="button" variant="secondary" className="h-7 px-2 text-[12px]" onClick={() => setEditing((value) => !value)}>
            {editing ? "닫기" : "운영표 수정"}
          </Button>
        </div>
      </div>
      <p className="mb-3 text-[13px] leading-5 text-[#5f554b]">{product.short_description}</p>
      <ProductFitTags tags={product.fit_situations} />
      <div className="mt-3 border-t border-[#f0e8dd] pt-3 text-[12px] leading-5 text-[#6f6459]">
        {product.strengths.slice(0, 3).join(" · ")}
      </div>
      <div className="mt-3 rounded-md border border-[#f0e8dd] bg-[#fffdf9] p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-[12px] font-bold text-[#403a33]">정보요약</h4>
          <span className="text-[11px] text-[#9b6b58]">
            {missingInfo.length ? `${missingInfo.length}개 비어 있음` : "완료"}
          </span>
        </div>
        <div className="grid gap-1 text-[12px] leading-5 text-[#5f554b]">
          {editorialSummaryFields.map(({ key, label }) => (
            <p key={key}>
              <strong>{label}</strong> · {profile[key] || "입력 필요"}
            </p>
          ))}
        </div>
        {profile.owner_comment ? (
          <p className="mt-2 border-t border-[#f0e8dd] pt-2 text-[12px] leading-5 text-[#5f554b]">{profile.owner_comment}</p>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-3 grid gap-3 rounded-md border border-[#eadfd2] bg-[#fffaf4] p-3">
          <Field label="짧은 설명">
            <Input value={draft.short_description ?? ""} onChange={(event) => setDraft({ ...draft, short_description: event.target.value })} />
          </Field>
          <Field label="주의사항" hint="쉼표로 구분">
            <Textarea
              value={draft.cautions.join(", ")}
              onChange={(event) => setDraft({ ...draft, cautions: splitByComma(event.target.value) })}
              className="min-h-16"
            />
          </Field>
          <div className="grid gap-2">
            {editorialQuestionFields.map((field) => (
              <Field key={field.key} label={field.label}>
                <Textarea
                  value={profile[field.key]}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      editorial_profile: {
                        ...profile,
                        [field.key]: event.target.value,
                      },
                    })
                  }
                  placeholder={field.question}
                  className="min-h-14 text-[12px] leading-5"
                />
              </Field>
            ))}
          </div>
          <Button type="button" variant="primary" disabled={saving} onClick={() => void save()}>
            {saving ? "저장 중" : "운영표 저장"}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
