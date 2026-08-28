"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { editorialQuestionFields, emptyEditorialProfile } from "@/lib/product/editorial";
import { splitByComma } from "@/lib/utils/strings";

export function ProductForm({
  onSaved,
}: {
  onSaved: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [fit, setFit] = useState("");
  const [keywords, setKeywords] = useState("");
  const [strengths, setStrengths] = useState("");
  const [editorialProfile, setEditorialProfile] = useState(emptyEditorialProfile());

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        fit_situations: splitByComma(fit),
        keywords: splitByComma(keywords),
        strengths: splitByComma(strengths),
        cautions: [],
        editorial_profile: editorialProfile,
        default_faq: [],
        is_active: true,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      onSaved(data.product);
      setName("");
      setCategory("");
      setFit("");
      setKeywords("");
      setStrengths("");
      setEditorialProfile(emptyEditorialProfile());
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-md border border-[#e5ddd2] bg-white p-4">
      <h3 className="text-[15px] font-bold text-[#312b25]">제품 추가</h3>
      <Field label="제품명">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 커스텀형 브라우니쿠키" />
      </Field>
      <Field label="카테고리">
        <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="답례품 / 커스텀 쿠키" />
      </Field>
      <Field label="어울리는 상황" hint="쉼표로 구분">
        <Textarea value={fit} onChange={(event) => setFit(event.target.value)} className="min-h-16" />
      </Field>
      <Field label="추천 키워드" hint="쉼표로 구분">
        <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
      </Field>
      <Field label="강점" hint="쉼표로 구분">
        <Textarea value={strengths} onChange={(event) => setStrengths(event.target.value)} className="min-h-16" />
      </Field>
      <div className="rounded-md border border-[#efe6db] bg-[#fffdf9] p-3">
        <h4 className="mb-2 text-[13px] font-bold text-[#403a33]">제품 운영표</h4>
        <div className="grid gap-2">
          {editorialQuestionFields.map((field) => (
            <Field key={field.key} label={field.label}>
              <Textarea
                value={editorialProfile[field.key]}
                onChange={(event) => setEditorialProfile((prev) => ({ ...prev, [field.key]: event.target.value }))}
                placeholder={field.question}
                className="min-h-14 text-[12px] leading-5"
              />
            </Field>
          ))}
        </div>
      </div>
      <Button type="submit" variant="primary">
        제품 저장
      </Button>
    </form>
  );
}
