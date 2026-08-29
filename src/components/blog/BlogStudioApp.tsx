"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  Image as ImageIcon,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { BlogDraftInput, BlogDraftOutput, BlogDraftRecord, DraftQualityCheck, PostType, ReferenceStyle, WordPressDraftOutput } from "@/types/blog";
import type { Brand, Product, ProductRecommendation } from "@/types/product";
import type { ImageObservation, UploadedImage } from "@/types/image";
import { Button } from "@/components/common/Button";
import { Field } from "@/components/common/Field";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Input } from "@/components/common/Input";
import { StatusPill } from "@/components/common/StatusPill";
import { Textarea } from "@/components/common/Textarea";
import { Header } from "@/components/layout/Header";
import { MobilePreview } from "@/components/layout/MobilePreview";
import { Sidebar, type StudioView } from "@/components/layout/Sidebar";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductForm } from "@/components/product/ProductForm";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
import { wordpressLayoutPrompt } from "@/lib/prompts/wordpress-layout";
import { WRITING_PROMPT_VERSION } from "@/lib/prompts/writing-standards";
import {
  applyEditorialProductSections,
  editorialQuestionFields,
  ensureRecommendationEditorialDefaults,
  formatProductSummaryBlock,
  getMissingEditorialInfo,
  hydrateRecommendation,
} from "@/lib/product/editorial";
import { getReferencePattern, referencePatternPayload, referenceStyles } from "@/lib/reference/blog-patterns";
import { formatImageGuide, formatMarkdownForWordPress, formatPlainTextForNaver, formatWordPressImageGuide, normalizeCheckBullets } from "@/lib/utils/copyFormat";
import { getSeoCheck } from "@/lib/utils/formatBlog";
import { applySeoSectionHeadings, buildSeoSectionHeadings, buildWordPressSectionHeadings } from "@/lib/utils/seoHeadings";
import { splitByComma } from "@/lib/utils/strings";
import { blogDraftOutputSchema } from "@/lib/validations/blog.schema";
import { CopyToNaverButton } from "./CopyToNaverButton";
import { FaqEditor } from "./FaqEditor";
import { HashtagBox } from "./HashtagBox";
import { SectionCard } from "./SectionCard";
import { TitleSelector } from "./TitleSelector";

const postTypes: PostType[] = ["답례품 판매형", "시즌 선물형", "작업일기형", "제품 소개형", "검색 유입 정보형"];

const starterTopics = ["퇴사 답례품", "어린이날 선물", "스승의 날 선물", "결혼 답례품"];

type GenerationMode = "auto" | "semi";
type WorkflowStep = "observe" | "select" | "generate" | "check";
type ManualPromptKind = "naver" | "wordpress";
type ManualCopyState = "idle" | "copying" | "copied" | "failed";
type ManualCopyStateMap = Record<ManualPromptKind, ManualCopyState>;

const modeButtonClass = "h-9 rounded-[8px] px-3 text-[12px] font-bold text-[#5f5f5a] transition-colors hover:bg-white hover:text-[#18181b]";
const modeButtonActiveClass = "h-9 rounded-[8px] bg-white px-3 text-[12px] font-bold text-[#b4233f] shadow-[0_1px_5px_rgba(24,24,27,0.08)]";
const idleManualCopyState: ManualCopyStateMap = { naver: "idle", wordpress: "idle" };

const defaultInput: BlogDraftInput = {
  topic: "퇴사 답례품",
  main_keyword: "퇴사 답례품",
  sub_keywords: ["회사 답례품", "육아휴직 답례품", "커스텀 쿠키"],
  situation: "회사 마지막 날 팀원들에게 나눠줄 쿠키를 소개하는 글",
  raw_memo: "문구를 넣을 수 있는 쿠키 답례품으로 소개하고 싶다.",
  post_type: "답례품 판매형",
  reference_style: "답례품 추천형",
  preferred_products: [],
  product_detail_answers: {},
  cta: "필요한 날짜와 수량만 먼저 알려주셔도 괜찮아요. 어떤 구성이 편할지 같이 정리해볼게요.",
  images: [],
};

const emptyInput: BlogDraftInput = {
  ...defaultInput,
  topic: "",
  main_keyword: "",
  sub_keywords: [],
  situation: "",
  raw_memo: "",
  preferred_products: [],
  product_detail_answers: {},
  images: [],
};

export function BlogStudioApp({
  initialView,
  initialProducts,
  initialDrafts,
  brand,
  isDemoMode,
}: {
  initialView: StudioView;
  initialProducts: Product[];
  initialDrafts: BlogDraftRecord[];
  brand: Brand;
  isDemoMode: boolean;
}) {
  const initialDraft = initialDrafts[0] ?? null;
  const initialOutput = initialDraft ? ensureOutputWordPress(inputFromDraft(initialDraft), initialDraft.content_json) : null;
  const [view, setView] = useState<StudioView>(initialView);
  const [products, setProducts] = useState(initialProducts);
  const [drafts, setDrafts] = useState(initialDrafts);
  const [currentDraft, setCurrentDraft] = useState<BlogDraftRecord | null>(initialDraft ? { ...initialDraft, content_json: initialOutput! } : null);
  const [output, setOutput] = useState<BlogDraftOutput | null>(initialOutput);
  const [input, setInput] = useState<BlogDraftInput>(defaultInput);
  const [isGenerating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [brandDraft, setBrandDraft] = useState(brand);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("auto");
  const [observations, setObservations] = useState<ImageObservation[]>(initialDrafts[0]?.image_observations ?? []);
  const [selectedProducts, setSelectedProducts] = useState<ProductRecommendation[]>(initialDrafts[0]?.selected_products ?? []);
  const [qualityCheck, setQualityCheck] = useState<DraftQualityCheck | null>(null);
  const [runningStep, setRunningStep] = useState<WorkflowStep | null>(null);
  const [manualJson, setManualJson] = useState("");
  const [manualCopyState, setManualCopyState] = useState<ManualCopyStateMap>(idleManualCopyState);

  const seoCheck = useMemo(() => (output ? getSeoCheck(output, input.main_keyword) : null), [output, input.main_keyword]);

  function navigate(next: StudioView) {
    setView(next);
  }

  function updateOutput(next: BlogDraftOutput) {
    const normalized = ensureOutputWordPress(input, next);
    const refreshed = {
      ...normalized,
      plain_text_for_naver: formatPlainTextForNaver(normalized),
      wordpress: {
        ...normalized.wordpress,
        markdown_for_wordpress: normalized.wordpress.markdown_for_wordpress
          ? normalizeCheckBullets(normalized.wordpress.markdown_for_wordpress)
          : formatMarkdownForWordPress(normalized.wordpress),
      },
    };
    setOutput(refreshed);
    setSelectedProducts(refreshed.selected_products);
    setQualityCheck(null);
    if (currentDraft) {
      setCurrentDraft({
        ...currentDraft,
        content_json: refreshed,
        title: refreshed.selected_title,
        selected_products: refreshed.selected_products,
        naver_plain_text: refreshed.plain_text_for_naver,
        wordpress_title: refreshed.wordpress.selected_title,
        wordpress_markdown: refreshed.wordpress.markdown_for_wordpress,
      });
    }
  }

  function openDraft(draft: BlogDraftRecord) {
    const draftInput = inputFromDraft(draft);
    const normalizedOutput = ensureOutputWordPress(draftInput, draft.content_json);
    setCurrentDraft({ ...draft, content_json: normalizedOutput });
    setOutput(normalizedOutput);
    setInput(draftInput);
    setObservations(draft.image_observations);
    setSelectedProducts(draft.selected_products);
    setQualityCheck(null);
    setView("editor");
  }

  async function observeImagesStep() {
    setRunningStep("observe");
    try {
      if (!input.images.length) {
        setObservations([]);
        setNotice("사진 없이 텍스트 기준으로 다음 단계에 진행할 수 있습니다.");
        return [];
      }

      setNotice("사진에서 보이는 제품, 포장, 색상, 문구만 관찰하는 중입니다.");
      const nextObservations = input.images.length
        ? await fetch("/api/observe-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image_urls: input.images.map((image) => image.url) }),
          })
            .then((response) => response.json())
            .then((data) => data.observations ?? [])
        : [];

      setObservations(nextObservations);
      setNotice(`사진 관찰 완료: ${nextObservations.length}개 결과를 반영했습니다.`);
      return nextObservations as ImageObservation[];
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "사진 관찰 중 문제가 생겼습니다.");
      throw error;
    } finally {
      setRunningStep(null);
    }
  }

  async function selectProductsStep(observationsOverride = observations) {
    setRunningStep("select");
    try {
      setNotice("주제와 메모에 맞는 nothingmatters 제품 2개를 고르는 중입니다.");
      const response = await fetch("/api/select-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, observations: observationsOverride }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "제품 추천에 실패했습니다.");

      setSelectedProducts(data.selected_products);
      setInput((prev) => ({
        ...prev,
        preferred_products: data.selected_products.map((product: ProductRecommendation) => product.product_name),
      }));
      setNotice("제품 2개를 골랐습니다. 이유와 각도를 확인한 뒤 본문을 생성하세요.");
      return data.selected_products as ProductRecommendation[];
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "제품 추천 중 문제가 생겼습니다.");
      throw error;
    } finally {
      setRunningStep(null);
    }
  }

  async function createDraft(observationsOverride: ImageObservation[], selectedProductsOverride: ProductRecommendation[]) {
    setRunningStep("generate");
    try {
      setNotice("선택한 제품 2개로 네이버 블로그 초안을 생성하는 중입니다.");
      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          observations: observationsOverride,
          selected_products: selectedProductsOverride,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "생성에 실패했습니다.");

      setOutput(data.output);
      setCurrentDraft(data.draft);
      setSelectedProducts(data.output.selected_products);
      setQualityCheck(null);
      setDrafts((prev) => [data.draft, ...prev.filter((draft) => draft.id !== data.draft.id)]);
      setView("editor");
      setNotice("초안이 생성되었습니다. 마음에 안 드는 섹션만 다시 다듬으면 됩니다.");
      return data.output as BlogDraftOutput;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "생성 중 문제가 생겼습니다.");
      throw error;
    } finally {
      setRunningStep(null);
    }
  }

  async function checkDraftStep(outputOverride = output) {
    if (!outputOverride) {
      setNotice("검수할 초안이 없습니다.");
      return null;
    }

    setRunningStep("check");
    try {
      setNotice("과장 표현, 없는 사실, 제품 수, 모바일 가독성을 검수하는 중입니다.");
      const response = await fetch("/api/check-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: outputOverride }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "검수에 실패했습니다.");

      setQualityCheck(data.check);
      setNotice(data.check.warnings.length ? "검수 완료: 확인할 문구가 있습니다." : "검수 완료: 큰 경고 없이 통과했습니다.");
      return data.check as DraftQualityCheck;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "검수 중 문제가 생겼습니다.");
      throw error;
    } finally {
      setRunningStep(null);
    }
  }

  async function generatePost() {
    setGenerating(true);
    setQualityCheck(null);
    try {
      const observed = generationMode === "semi" ? observations : await observeImagesStep();
      const picked = generationMode === "semi" && selectedProducts.length === 2
        ? selectedProducts
        : await selectProductsStep(observed);
      const generated = await createDraft(observed, picked);

      if (generationMode === "auto") {
        await checkDraftStep(generated);
      }
    } catch {
      // Step helpers already surface the useful message in the notice bar.
    } finally {
      setGenerating(false);
      setRunningStep(null);
    }
  }

  function setProductSlot(slot: 0 | 1, productName: string) {
    const names = [selectedProducts[0]?.product_name ?? "", selectedProducts[1]?.product_name ?? ""];
    names[slot] = productName;
    const uniqueNames = names.filter(Boolean).filter((name, index, values) => values.indexOf(name) === index).slice(0, 2);
    const nextProducts = uniqueNames.map((name, index) => {
      const product = products.find((item) => item.name === name);
      return product
        ? recommendationFromProduct(product, input, index)
        : ensureRecommendationEditorialDefaults({
            product_name: name,
            reason: `${input.topic} 상황에 맞춰 직접 선택한 제품입니다.`,
            angle: `${input.topic}에 맞는 추천 포인트`,
            main_points: ["상황에 맞는 구성", "문의 전 수량 확인", "문구와 포장 상담"],
            caution: "필요한 날짜와 수량은 주문 전 확인이 필요합니다.",
          } as ProductRecommendation, input);
    });

    setSelectedProducts(nextProducts);
    setInput((prev) => ({ ...prev, preferred_products: uniqueNames }));
    setQualityCheck(null);
    setManualCopyState(idleManualCopyState);
  }

  function clearProductSlots() {
    setSelectedProducts([]);
    setInput((prev) => ({ ...prev, preferred_products: [], product_detail_answers: {} }));
    setManualCopyState(idleManualCopyState);
  }

  function updateProductDetailAnswer(productName: string, field: string, value: string) {
    setInput((prev) => ({
      ...prev,
      product_detail_answers: {
        ...prev.product_detail_answers,
        [productName]: {
          ...(prev.product_detail_answers[productName] ?? {}),
          [field]: value,
        },
      },
    }));
    setQualityCheck(null);
    setManualCopyState(idleManualCopyState);
  }

  async function createManualPrompt(kind: ManualPromptKind) {
    if (selectedProducts.length !== 2) {
      setNotice("반자동 프롬프트를 만들려면 제품 2가지를 먼저 선택해 주세요.");
      setManualCopyState((prev) => ({ ...prev, [kind]: "failed" }));
      return;
    }

    setManualCopyState({ ...idleManualCopyState, [kind]: "copying" });
    const prompt = buildManualPrompt({ kind, input, brand: brandDraft, products, selectedProducts, observations });

    if (await copyTextToClipboard(prompt)) {
      setManualCopyState({ ...idleManualCopyState, [kind]: "copied" });
      setNotice(`${kind === "naver" ? "네이버" : "워드프레스"} 프롬프트를 생성하고 복사했습니다. GPT에 바로 붙여넣으면 됩니다.`);
      window.setTimeout(() => setManualCopyState(idleManualCopyState), 3200);
    } else {
      setManualCopyState({ ...idleManualCopyState, [kind]: "failed" });
      setNotice("프롬프트는 만들었지만 브라우저 복사 권한이 막혔습니다. 주소창 권한을 확인한 뒤 다시 눌러 주세요.");
    }
  }

  function resetNewPost() {
    setInput({ ...emptyInput, cta: brandDraft.default_cta || defaultInput.cta });
    setSelectedProducts([]);
    setObservations([]);
    setQualityCheck(null);
    setCurrentDraft(null);
    setOutput(null);
    setManualJson("");
    setManualCopyState(idleManualCopyState);
    setNotice("새 글 입력을 비웠습니다. 처음부터 다시 시작할 수 있습니다.");
    setView("new");
  }

  async function applyManualJson() {
    try {
      const jsonText = manualJson.trim();
      if (!jsonText) {
        setNotice("GPT가 출력한 JSON을 먼저 붙여넣어 주세요. 붙여넣은 뒤 버튼을 누르면 편집 화면으로 열립니다.");
        setView("new");
        return;
      }

      const parsedJson = parseJsonFromText(jsonText);
      const manualSelectedProducts = resolveManualSelectedProducts(parsedJson, input, selectedProducts, products, output);
      const normalized = normalizeManualPatch(parsedJson, input, manualSelectedProducts, output);
      const parsedOutput = blogDraftOutputSchema.parse(normalized);
      const response = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: brandDraft.id,
          title: parsedOutput.selected_title,
          main_keyword: input.main_keyword,
          sub_keywords: input.sub_keywords,
          topic: input.topic,
          situation: input.situation,
          raw_memo: input.raw_memo,
          post_type: input.post_type,
          status: "draft",
          selected_products: parsedOutput.selected_products,
          content_json: parsedOutput,
          image_observations: observations,
          naver_plain_text: parsedOutput.plain_text_for_naver,
          wordpress_title: parsedOutput.wordpress.selected_title,
          wordpress_markdown: parsedOutput.wordpress.markdown_for_wordpress,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "JSON 반영에 실패했습니다.");

      setOutput(parsedOutput);
      setCurrentDraft(data.draft);
      setSelectedProducts(parsedOutput.selected_products);
      setQualityCheck(null);
      setDrafts((prev) => [data.draft, ...prev.filter((draft) => draft.id !== data.draft.id)]);
      setView("editor");
      setNotice("붙여넣은 JSON을 초안으로 반영했습니다.");
    } catch (error) {
      setNotice(formatManualJsonError(error));
    }
  }

  async function regenerate(sectionName: string, instruction: string) {
    if (!output || !currentDraft) return;
    setNotice(`${sectionName} 섹션을 다시 다듬는 중입니다.`);
    const response = await fetch("/api/regenerate-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft_id: currentDraft.id,
        section_name: sectionName,
        instruction,
      }),
    });
    const data = await response.json();
    if (response.ok) {
      setCurrentDraft(data.draft);
      setOutput(data.draft.content_json);
      setSelectedProducts(data.draft.selected_products);
      setQualityCheck(null);
      setDrafts((prev) => [data.draft, ...prev.filter((draft) => draft.id !== data.draft.id)]);
      setNotice("섹션을 업데이트했습니다.");
    }
  }

  async function saveBrand() {
    const response = await fetch("/api/brand", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brandDraft),
    });
    setNotice(response.ok ? "브랜드 설정을 저장했습니다." : "브랜드 설정 저장에 실패했습니다.");
  }

  async function copyNaverDraft() {
    if (!output?.plain_text_for_naver) {
      setNotice("복사할 네이버 본문이 없습니다. 먼저 글을 생성해 주세요.");
      return;
    }

    const copied = await copyTextToClipboard(output.plain_text_for_naver);
    setNotice(copied ? "네이버 전체 본문을 클립보드에 복사했습니다." : "브라우저 복사 권한을 확인해 주세요.");
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#f6f5f2] text-[#18181b] lg:flex-row">
      <Sidebar activeView={view} onNavigate={navigate} />
      <div className="min-w-0 flex-1">
        <Header
          title={view === "dashboard" ? "대시보드" : view === "drafts" ? "글 보관함" : view === "products" ? "제품/브랜드 설정" : view === "editor" ? "글 편집" : "새 글 만들기"}
          isDemoMode={isDemoMode}
          showBack={view !== "dashboard"}
          showNew={view !== "new" && view !== "dashboard"}
          canPreview={Boolean(output) && view !== "editor"}
          canCopy={Boolean(output)}
          onBack={() => setView("dashboard")}
          onNew={resetNewPost}
          onPreview={() => setView("editor")}
          onCopy={() => void copyNaverDraft()}
        />
        <main
          className={[
            "mx-auto grid min-h-[calc(100vh-64px)] w-full min-w-0 max-w-[1600px] grid-cols-1 gap-5 overflow-x-hidden p-3 sm:p-5 lg:p-6",
            view === "editor" ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "",
          ].join(" ")}
        >
          <div className="ui-enter min-w-0">
            {notice ? (
              <div role="status" aria-live="polite" className="mb-4 rounded-[12px] border border-[#efdcaa] border-l-[3px] border-l-[#d6a62f] bg-[#fff9e8] px-4 py-3 text-[13px] font-medium text-[#755a1f] shadow-[0_4px_16px_rgba(24,24,27,0.03)]">
                {notice}
              </div>
            ) : null}
            {view === "dashboard" ? (
              <DashboardView
                drafts={drafts}
                products={products}
                onNew={(topic) => {
                  setInput((prev) => ({ ...prev, topic, main_keyword: topic }));
                  setView("new");
                }}
                onOpenDraft={openDraft}
              />
            ) : null}
            {view === "new" ? (
              <NewPostView
                input={input}
                products={products}
                images={input.images}
                isGenerating={isGenerating}
                mode={generationMode}
                observations={observations}
                selectedProducts={selectedProducts}
                qualityCheck={qualityCheck}
                runningStep={runningStep}
                manualJson={manualJson}
                manualCopyState={manualCopyState}
                onInput={setInput}
                onMode={setGenerationMode}
                onObserve={observeImagesStep}
                onSelectProducts={() => selectProductsStep()}
                onProductSlot={setProductSlot}
                onClearProducts={clearProductSlots}
                onProductDetailAnswer={updateProductDetailAnswer}
                onCreateManualPrompt={createManualPrompt}
                onManualJson={setManualJson}
                onApplyManualJson={() => void applyManualJson()}
                onGenerate={generatePost}
                onCheck={() => checkDraftStep()}
                onReset={resetNewPost}
              />
            ) : null}
            {view === "editor" ? (
              <EditorView
                input={input}
                output={output}
                onOutput={updateOutput}
                onRegenerate={regenerate}
                onCheck={() => checkDraftStep()}
                onNew={() => setView("new")}
              />
            ) : null}
            {view === "drafts" ? (
              <DraftArchiveView
                drafts={drafts}
                onOpen={openDraft}
                onClone={(draft) => {
                  setInput({
                    ...defaultInput,
                    topic: draft.topic,
                    main_keyword: draft.main_keyword,
                    sub_keywords: draft.sub_keywords,
                    situation: draft.situation,
                    raw_memo: draft.raw_memo,
                    post_type: draft.post_type,
                    reference_style: styleFromPostType(draft.post_type),
                  });
                  setView("new");
                }}
              />
            ) : null}
            {view === "products" ? (
              <ProductsView
                brand={brandDraft}
                products={products}
                onBrand={setBrandDraft}
                onSaveBrand={saveBrand}
                onProductSaved={(product) => setProducts((prev) => [product, ...prev.filter((item) => item.id !== product.id)])}
              />
            ) : null}
          </div>
          {view === "editor" ? (
            <RightRail
              output={output}
              seoCheck={seoCheck}
              qualityCheck={qualityCheck}
              isChecking={runningStep === "check"}
              onCheck={() => checkDraftStep()}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function DashboardView({
  drafts,
  products,
  onNew,
  onOpenDraft,
}: {
  drafts: BlogDraftRecord[];
  products: Product[];
  onNew: (topic: string) => void;
  onOpenDraft: (draft: BlogDraftRecord) => void;
}) {
  const keywords = drafts.flatMap((draft) => [draft.main_keyword, ...draft.sub_keywords]).filter(Boolean);
  const keywordSummary = Array.from(new Set(keywords)).slice(0, 8);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-[20px] bg-[#18181b] px-5 py-6 text-white shadow-[0_18px_50px_rgba(24,24,27,0.14)] sm:px-7 sm:py-8 lg:px-10 lg:py-9">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f09aa5]">Today&apos;s workspace</p>
            <h2 className="mt-3 text-[26px] font-black tracking-[-0.04em] sm:text-[34px]">오늘 만들 글, 바로 시작하세요.</h2>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#c8c8c4]">
              주제와 짧은 메모만 정하면 제품 선택부터 네이버·워드프레스 초안까지 한 흐름으로 완성됩니다.
            </p>
          </div>
          <Button type="button" variant="primary" className="h-11 w-full px-5 sm:w-auto" icon={<Plus className="size-4" />} onClick={() => onNew("퇴사 답례품")}>
            새 글 시작
          </Button>
        </div>
        <div className="mt-7 grid border-t border-white/15 sm:grid-cols-2 lg:grid-cols-4">
          {starterTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              className="group flex min-h-14 items-center justify-between border-b border-white/15 px-1 text-left text-[13px] font-semibold text-[#dededb] transition-colors hover:text-white sm:px-3 sm:[&:nth-child(even)]:border-l lg:border-b-0 lg:border-l lg:first:border-l-0"
              onClick={() => onNew(topic)}
            >
              {topic}
              <span aria-hidden className="text-[#f09aa5] transition-transform duration-200 group-hover:translate-x-1">→</span>
            </button>
          ))}
        </div>
      </section>
      <section aria-label="작업 현황" className="grid overflow-hidden rounded-[16px] border border-[#deddd8] bg-white sm:grid-cols-3 sm:divide-x sm:divide-[#e7e6e1]">
        <MetricCard icon={<FileText className="size-4" />} label="전체 초안" value={`${drafts.length}`} />
        <MetricCard icon={<CheckCircle2 className="size-4" />} label="활성 제품" value={`${products.filter((item) => item.is_active).length}`} />
        <MetricCard icon={<Hash className="size-4" />} label="자주 쓰는 키워드" value={`${keywordSummary.length || 6}`} />
      </section>
      <section className="rounded-[16px] border border-[#deddd8] bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em]">최근 초안</h2>
            <p className="mt-1 text-[12px] text-[#6f6f6a]">마지막으로 작업한 글부터 이어서 편집할 수 있습니다.</p>
          </div>
          <span className="text-[12px] font-semibold text-[#6f6f6a]">{drafts.length}개</span>
        </div>
        <div className="divide-y divide-[#e7e6e1] border-y border-[#e7e6e1]">
          {drafts.length ? drafts.map((draft) => (
            <button
              key={draft.id}
              type="button"
              className="group flex w-full items-center justify-between gap-4 px-1 py-4 text-left transition-colors hover:bg-[#fafaf8] sm:px-3"
              onClick={() => onOpenDraft(draft)}
            >
              <span className="min-w-0">
                <strong className="block truncate text-[14px] text-[#27272a]">{draft.title}</strong>
                <span className="mt-1 block truncate text-[12px] text-[#6f6f6a]">{draft.main_keyword} · {draft.post_type}</span>
              </span>
              <span aria-hidden className="shrink-0 text-[#aaa9a3] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#b4233f]">→</span>
            </button>
          )) : (
            <div className="flex flex-col items-start gap-3 px-1 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <p className="text-[13px] leading-6 text-[#6f6f6a]">아직 저장된 초안이 없습니다. 위 추천 주제로 첫 글을 시작해 보세요.</p>
              <Button type="button" variant="secondary" onClick={() => onNew("퇴사 답례품")}>첫 글 만들기</Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function NewPostView({
  input,
  products,
  images,
  isGenerating,
  mode,
  observations,
  selectedProducts,
  qualityCheck,
  runningStep,
  manualJson,
  manualCopyState,
  onInput,
  onMode,
  onObserve,
  onSelectProducts,
  onProductSlot,
  onClearProducts,
  onProductDetailAnswer,
  onCreateManualPrompt,
  onManualJson,
  onApplyManualJson,
  onGenerate,
  onCheck,
  onReset,
}: {
  input: BlogDraftInput;
  products: Product[];
  images: UploadedImage[];
  isGenerating: boolean;
  mode: GenerationMode;
  observations: ImageObservation[];
  selectedProducts: ProductRecommendation[];
  qualityCheck: DraftQualityCheck | null;
  runningStep: WorkflowStep | null;
  manualJson: string;
  manualCopyState: ManualCopyStateMap;
  onInput: (input: BlogDraftInput) => void;
  onMode: (mode: GenerationMode) => void;
  onObserve: () => void;
  onSelectProducts: () => void;
  onProductSlot: (slot: 0 | 1, productName: string) => void;
  onClearProducts: () => void;
  onProductDetailAnswer: (productName: string, field: string, value: string) => void;
  onCreateManualPrompt: (kind: ManualPromptKind) => void | Promise<void>;
  onManualJson: (value: string) => void;
  onApplyManualJson: () => void;
  onGenerate: () => void;
  onCheck: () => void;
  onReset: () => void;
}) {
  const isBusy = isGenerating || Boolean(runningStep);

  return (
    <div aria-busy={isBusy} className="grid w-full min-w-0 gap-5">
      <section className="rounded-[18px] border border-[#deddd8] bg-white p-5 sm:p-6">
        <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b4233f]">New article</p>
            <h2 className="mt-2 text-[24px] font-black tracking-[-0.04em] text-[#18181b] sm:text-[28px]">새 글의 기준을 정해 주세요.</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#70706a]">주제와 상황을 입력하고 제품 2개만 고르면 나머지는 생성 엔진이 이어서 정리합니다.</p>
          </div>
          <Button type="button" variant="ghost" className="shrink-0" onClick={onReset}>입력 비우기</Button>
        </div>
      </section>

      <section className="rounded-[16px] border border-[#deddd8] bg-white p-4 sm:p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <h3 className="text-[14px] font-bold text-[#27272a]">생성 방식</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#6f6f6a]">자동은 한 번에 완성하고, 반자동은 제품과 프롬프트를 단계별로 확인합니다.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 rounded-[10px] border border-[#deddd8] bg-[#f1f0ec] p-1">
            <button type="button" className={mode === "auto" ? modeButtonActiveClass : modeButtonClass} onClick={() => onMode("auto")}>자동</button>
            <button type="button" className={mode === "semi" ? modeButtonActiveClass : modeButtonClass} onClick={() => onMode("semi")}>반자동</button>
          </div>
        </div>
        {mode === "semi" ? (
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            <WorkflowButton
              step="1"
              label={images.length ? "사진 관찰" : "사진 없음"}
              detail={images.length ? `${observations.length}개 관찰` : "텍스트만 진행"}
              active={runningStep === "observe"}
              done={!images.length || observations.length > 0}
              disabled={isBusy}
              onClick={onObserve}
            />
            <WorkflowButton
              step="2"
              label="제품 2개 추천"
              detail={selectedProducts.length ? selectedProducts.map((item) => item.product_name).join(" · ") : "아직 선택 전"}
              active={runningStep === "select"}
              done={selectedProducts.length === 2}
              disabled={isBusy}
              onClick={onSelectProducts}
            />
            <WorkflowButton
              step="3"
              label="본문 생성"
              detail="제목/본문/FAQ/태그"
              active={runningStep === "generate" || isGenerating}
              done={false}
              disabled={isBusy || selectedProducts.length !== 2}
              onClick={onGenerate}
            />
            <WorkflowButton
              step="4"
              label="최종 검수"
              detail={qualityCheck ? `${qualityCheck.warnings.length}개 경고` : "생성 후 실행"}
              active={runningStep === "check"}
              done={Boolean(qualityCheck)}
              disabled={isBusy}
              onClick={onCheck}
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-[16px] border border-[#deddd8] bg-white p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#ecebe7] pb-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#27272a]">글 기본 정보</h3>
            <p className="mt-1 text-[12px] text-[#6f6f6a]">검색 주제와 실제 상황을 먼저 입력해 주세요.</p>
          </div>
          <StatusPill tone="success">필수</StatusPill>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="글 주제">
            <Input value={input.topic} placeholder="예: 퇴사 답례품" onChange={(event) => onInput({ ...input, topic: event.target.value })} />
          </Field>
          <Field label="메인 키워드" hint="본문 전체 3회 기준">
            <Input value={input.main_keyword} placeholder="예: 퇴사 답례품" onChange={(event) => onInput({ ...input, main_keyword: event.target.value })} />
          </Field>
          <Field label="서브 키워드" hint="쉼표로 구분">
            <Input value={input.sub_keywords.join(", ")} placeholder="회사 답례품, 커스텀 쿠키" onChange={(event) => onInput({ ...input, sub_keywords: splitByComma(event.target.value) })} />
          </Field>
          <Field label="글 타입">
            <select
              className="studio-select"
              value={input.post_type}
              onChange={(event) => {
                const postType = event.target.value as PostType;
                onInput({ ...input, post_type: postType, reference_style: styleFromPostType(postType) });
              }}
            >
              {postTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="상황 설명">
            <Textarea value={input.situation} placeholder="누구에게, 언제, 어떤 마음으로 전할 글인지 적어 주세요." onChange={(event) => onInput({ ...input, situation: event.target.value })} />
          </Field>
          <Field label="짧은 메모">
            <Textarea value={input.raw_memo} placeholder="글에 꼭 들어갔으면 하는 제품 특징이나 문장을 적어 주세요." onChange={(event) => onInput({ ...input, raw_memo: event.target.value })} />
          </Field>
        </div>
      </section>

      <ProductPairSelector
        products={products}
        selectedProducts={selectedProducts}
        isBusy={isBusy}
        onProductSlot={onProductSlot}
        onAutoSelect={onSelectProducts}
        onClear={onClearProducts}
      />

      <details className="group rounded-[16px] border border-[#deddd8] bg-white">
        <summary className="flex min-h-16 list-none items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <span>
            <strong className="block text-[14px] text-[#27272a]">고급 설정</strong>
            <span className="mt-1 block text-[12px] text-[#6f6f6a]">참고 스타일 · 제품 상세 · CTA · 사진</span>
          </span>
          <ChevronDown aria-hidden className="details-chevron size-4 shrink-0 text-[#6f6f6a]" />
        </summary>
        <div className="border-t border-[#ecebe7] p-4 sm:p-5">
          <ReferenceStyleSelector value={input.reference_style} onChange={(referenceStyle) => onInput({ ...input, reference_style: referenceStyle })} />
          <ProductDetailQuestionCard input={input} products={products} selectedProducts={selectedProducts} onAnswer={onProductDetailAnswer} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Field label="마무리 CTA" hint="선택 입력">
              <Textarea value={input.cta} onChange={(event) => onInput({ ...input, cta: event.target.value })} />
            </Field>
            <div className="grid gap-3">
              <Field label="사진 업로드" hint="선택 입력">
                <ImageUploader onUploaded={(image) => onInput({ ...input, images: [...input.images, image] })} />
              </Field>
              {images.length ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((image) => (
                    <span key={image.id} className="rounded-full border border-[#deddd8] bg-[#f7f6f3] px-2.5 py-1 text-[11px] text-[#62625d]">{image.name}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </details>

      {mode === "semi" ? (
        <SemiManualPanel
          canCreatePrompt={selectedProducts.length === 2}
          manualJson={manualJson}
          copyState={manualCopyState}
          onCreateManualPrompt={onCreateManualPrompt}
          onManualJson={onManualJson}
          onApplyManualJson={onApplyManualJson}
        />
      ) : null}

      <section className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-[16px] border border-[#d6d5cf] bg-white/94 p-3 shadow-[0_16px_40px_rgba(24,24,27,0.14)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="min-w-0">
          <strong className="block text-[13px] text-[#27272a]">{mode === "semi" ? `선택 제품 ${selectedProducts.length}/2` : "자동 생성 준비"}</strong>
          <span className="mt-0.5 block truncate text-[11px] text-[#6f6f6a]">{mode === "semi" ? "제품 2개를 선택하면 본문 생성을 시작할 수 있습니다." : "사진 관찰부터 최종 검수까지 한 번에 진행합니다."}</span>
        </div>
        <Button
          type="button"
          variant="primary"
          className="h-11 w-full shrink-0 px-5 sm:w-auto"
          icon={isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          onClick={onGenerate}
          disabled={isBusy || (mode === "semi" && selectedProducts.length !== 2)}
        >
          {mode === "semi" ? "선택값으로 본문 생성" : "자동으로 끝까지 생성"}
        </Button>
      </section>
    </div>
  );
}

function ReferenceStyleSelector({
  value,
  onChange,
}: {
  value: ReferenceStyle;
  onChange: (style: ReferenceStyle) => void;
}) {
  return (
    <section className="mb-5 w-full min-w-0 max-w-full overflow-hidden rounded-[12px] border border-[#e5e4df] bg-[#fafaf8] p-4">
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <h3 className="text-[14px] font-bold text-[#27272a]">참고 스타일</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#6f6f6a]">
            예제 글 원문은 쓰지 않고, 구조와 호흡만 패턴으로 반영합니다.
          </p>
        </div>
        <StatusPill tone="success">원문 미사용</StatusPill>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {referenceStyles.map((style) => {
          const pattern = getReferencePattern(style);
          const active = value === style;
          return (
            <button
              key={style}
              type="button"
              className={[
                "min-w-0 rounded-[10px] border px-3 py-3 text-left transition-colors duration-200",
                active
                  ? "border-[#c9364f] bg-[#fff1f3] text-[#3f2430] shadow-[0_1px_5px_rgba(24,24,27,0.06)]"
                  : "border-[#deddd8] bg-white text-[#62625d] hover:border-[#b9b7b0] hover:text-[#18181b]",
              ].join(" ")}
              onClick={() => onChange(style)}
            >
              <strong className="block truncate text-[12px]">{pattern.label}</strong>
              <span className="mt-1 line-clamp-2 block text-[11px] leading-4 text-[#6f6f6a]">{pattern.titlePattern}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ProductPairSelector({
  products,
  selectedProducts,
  isBusy,
  onProductSlot,
  onAutoSelect,
  onClear,
}: {
  products: Product[];
  selectedProducts: ProductRecommendation[];
  isBusy: boolean;
  onProductSlot: (slot: 0 | 1, productName: string) => void;
  onAutoSelect: () => void;
  onClear: () => void;
}) {
  const firstName = selectedProducts[0]?.product_name ?? "";
  const secondName = selectedProducts[1]?.product_name ?? "";

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[16px] border border-[#deddd8] bg-white p-4 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-[#ecebe7] pb-4">
        <div className="min-w-0 max-w-full">
          <h3 className="text-[16px] font-bold text-[#27272a]">소개할 제품 2개</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#6f6f6a]">
            한 글에는 제품 2개만 들어갑니다. 반자동 프롬프트도 여기서 고른 2개를 기준으로 만들어집니다.
          </p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" disabled={isBusy} onClick={onAutoSelect}>
            자동 추천 받기
          </Button>
          <Button type="button" variant="ghost" className="h-8 px-2 text-[12px]" disabled={isBusy} onClick={onClear}>
            초기화
          </Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="제품 A">
          <select
            className="studio-select"
            value={firstName}
            disabled={isBusy}
            onChange={(event) => onProductSlot(0, event.target.value)}
          >
            <option value="">제품 선택</option>
            {products.map((product) => (
              <option key={product.id} value={product.name} disabled={product.name === secondName}>
                {product.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제품 B">
          <select
            className="studio-select"
            value={secondName}
            disabled={isBusy}
            onChange={(event) => onProductSlot(1, event.target.value)}
          >
            <option value="">제품 선택</option>
            {products.map((product) => (
              <option key={product.id} value={product.name} disabled={product.name === firstName}>
                {product.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {selectedProducts.length ? (
        <div className="mt-4 divide-y divide-[#ecebe7] border-y border-[#ecebe7] md:grid md:grid-cols-2 md:divide-x md:divide-y-0">
          {selectedProducts.map((product, index) => (
            <div key={product.product_name} className="flex min-w-0 items-start gap-3 px-1 py-3 md:px-4">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#18181b] text-[11px] font-bold text-white">{index + 1}</span>
              <span className="min-w-0">
                <strong className="block truncate text-[12px] text-[#27272a]">{product.product_name}</strong>
                <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-[#6f6f6a]">{product.angle}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ProductDetailQuestionCard({
  input,
  products,
  selectedProducts,
  onAnswer,
}: {
  input: BlogDraftInput;
  products: Product[];
  selectedProducts: ProductRecommendation[];
  onAnswer: (productName: string, field: string, value: string) => void;
}) {
  if (selectedProducts.length !== 2) return null;

  const selectedProductModels = selectedProducts
    .map((selected) => products.find((product) => product.name === selected.product_name))
    .filter(Boolean) as Product[];
  const missingCount = selectedProductModels.reduce((sum, product) => sum + getMissingEditorialInfo(product, input).length, 0);

  return (
    <section className="mb-5 rounded-[12px] border border-[#e5e4df] bg-[#fafaf8] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-[#362f28]">자동 질문 카드</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#7b7166]">
            제품 운영표에 비어 있는 내용만 물어봅니다. 답변은 이번 글에만 반영됩니다.
          </p>
        </div>
        <StatusPill tone={missingCount ? "warning" : "success"}>
          {missingCount ? `${missingCount}개 필요` : "자료 충분"}
        </StatusPill>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {selectedProductModels.map((product) => {
          const missingLabels = getMissingEditorialInfo(product, input);
          const fields = editorialQuestionFields.filter((field) => missingLabels.includes(field.label)).slice(0, 4);
          const answers = input.product_detail_answers[product.name] ?? {};

          return (
            <article key={product.id} className="rounded-md border border-[#f0e8dd] bg-white p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <strong className="block text-[13px] text-[#332d27]">{product.name}</strong>
                  <span className="mt-1 block text-[11px] leading-4 text-[#81766b]">
                    {missingLabels.length ? "비어 있는 운영 정보를 채우면 제품 섹션이 덜 AI처럼 보입니다." : "요약과 코멘트 자료가 준비되어 있습니다."}
                  </span>
                </div>
                <StatusPill tone={missingLabels.length ? "warning" : "success"}>
                  {missingLabels.length ? "질문" : "완료"}
                </StatusPill>
              </div>
              {fields.length ? (
                <div className="grid gap-2">
                  {fields.map((field) => (
                    <Field key={field.key} label={field.label} hint="선택 입력">
                      <Textarea
                        value={answers[field.key] ?? ""}
                        placeholder={field.question}
                        className="min-h-16 text-[12px] leading-5"
                        onChange={(event) => onAnswer(product.name, field.key, event.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-[#edf8f0] px-3 py-2 text-[12px] leading-5 text-[#348658]">
                  이 제품은 정보요약과 사장님 코멘트를 바로 사용할 수 있습니다.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SemiManualPanel({
  canCreatePrompt,
  manualJson,
  copyState,
  onCreateManualPrompt,
  onManualJson,
  onApplyManualJson,
}: {
  canCreatePrompt: boolean;
  manualJson: string;
  copyState: ManualCopyStateMap;
  onCreateManualPrompt: (kind: ManualPromptKind) => void | Promise<void>;
  onManualJson: (value: string) => void;
  onApplyManualJson: () => void;
}) {
  const activeState = copyState.naver !== "idle" ? copyState.naver : copyState.wordpress;
  const isCopying = activeState === "copying";
  const isCopied = activeState === "copied";
  const isFailed = activeState === "failed";
  const hasManualJson = manualJson.trim().length > 0;

  return (
    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-[16px] border border-[#deddd8] bg-white p-4 sm:p-5">
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 max-w-full">
          <h3 className="text-[14px] font-bold text-[#362f28]">반자동 GPT 작업</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#7b7166]">
            프롬프트는 화면에 펼치지 않고 생성 즉시 복사합니다. GPT 결과 JSON만 아래에 붙여넣으면 됩니다.
          </p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {(["naver", "wordpress"] as const).map((kind) => (
            <ManualPromptButton
              key={kind}
              kind={kind}
              state={copyState[kind]}
              disabled={!canCreatePrompt || isCopying}
              onCreateManualPrompt={onCreateManualPrompt}
            />
          ))}
        </div>
        <div aria-live="polite" className="min-h-8">
          {activeState !== "idle" ? (
            <p
              className={[
                "rounded-md px-3 py-2 text-center text-[12px] font-bold transition-all duration-300",
                isCopied ? "bg-[#ecf8ef] text-[#287845]" : "",
                isCopying ? "bg-[#fff8df] text-[#8a6b1f]" : "",
                isFailed ? "bg-[#fff4f1] text-[#d84e43]" : "",
              ].join(" ")}
            >
              {isCopied ? "클립보드에 복사됐어요. 이제 GPT 입력창에 붙여넣으면 됩니다." : isCopying ? "프롬프트를 만들고 클립보드에 복사하는 중입니다." : "브라우저 복사 권한을 확인한 뒤 다시 눌러 주세요."}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
          <Field label="GPT JSON 출력 붙여넣기" hint="GPT가 출력한 JSON 전체를 붙여넣기">
            <div className="grid gap-2">
              <Textarea
                value={manualJson}
                placeholder="{ ... }"
                onChange={(event) => onManualJson(event.currentTarget.value)}
                onInput={(event) => onManualJson(event.currentTarget.value)}
                onPaste={(event) => {
                  const target = event.currentTarget;
                  const pastedText = event.clipboardData.getData("text");
                  window.setTimeout(() => onManualJson(target.value || pastedText), 0);
                }}
                className="min-h-16 border-[#eee7dd] bg-[#fffefd] font-mono text-[12px] leading-5"
                rows={2}
              />
              <p
                aria-live="polite"
                className={[
                  "rounded-md px-3 py-2 text-[12px] font-bold transition-all duration-200",
                  hasManualJson ? "bg-[#ecf8ef] text-[#287845]" : "bg-[#fff8df] text-[#8a6b1f]",
                ].join(" ")}
              >
                {hasManualJson ? "JSON 입력이 감지됐어요. 아래 버튼을 누르면 편집 화면에 바로 반영됩니다." : "아직 JSON이 비어 있어요. GPT 출력값을 붙여넣어 주세요."}
              </p>
            </div>
          </Field>
          <Button type="button" variant="secondary" className="h-10 px-2 text-[12px] sm:self-end" onClick={() => onManualJson("")}>
            JSON 비우기
          </Button>
        </div>
        <Button
          type="button"
          variant="primary"
          className="h-11 text-[13px] font-bold"
          icon={hasManualJson ? <CheckCircle2 className="size-4" /> : <FileText className="size-4" />}
          onClick={onApplyManualJson}
        >
          {hasManualJson ? "붙여넣은 JSON 반영해서 편집 화면 열기" : "JSON 붙여넣은 뒤 반영하기"}
        </Button>
      </div>
    </section>
  );
}

function ManualPromptButton({
  kind,
  state,
  disabled,
  onCreateManualPrompt,
}: {
  kind: ManualPromptKind;
  state: ManualCopyState;
  disabled: boolean;
  onCreateManualPrompt: (kind: ManualPromptKind) => void | Promise<void>;
}) {
  const isCopying = state === "copying";
  const isCopied = state === "copied";
  const isFailed = state === "failed";
  const labelPrefix = kind === "naver" ? "네이버" : "워드프레스";
  const promptButtonLabel = isCopying
    ? `${labelPrefix} 복사 중...`
    : isCopied
      ? `${labelPrefix} 복사 완료!`
      : isFailed
        ? `${labelPrefix} 복사 실패`
        : `${labelPrefix} 프롬프트 생성+복사`;
  const promptButtonIcon = isCopying ? (
    <Loader2 className="size-4 animate-spin" />
  ) : isCopied ? (
    <CheckCircle2 className="size-4" />
  ) : isFailed ? (
    <ShieldAlert className="size-4" />
  ) : (
    <WandSparkles className="size-4" />
  );
  const promptButtonClass = [
    "relative h-12 w-full overflow-hidden text-[13px] font-bold shadow-[0_10px_24px_rgba(24,24,27,0.10)] transition-all duration-300",
    isCopied ? "border-[#34a853] bg-[#34a853] text-white ring-3 ring-[#34a853]/15 hover:bg-[#2f9a4c]" : "",
    isFailed ? "ring-4 ring-[#d84e43]/15" : "",
    isCopying ? "opacity-80" : "",
  ].join(" ");

  return (
    <Button
      type="button"
      variant={isFailed ? "danger" : isCopied ? "secondary" : "primary"}
      className={promptButtonClass}
      icon={promptButtonIcon}
      disabled={disabled}
      onClick={() => void onCreateManualPrompt(kind)}
    >
      <span className="relative">{promptButtonLabel}</span>
    </Button>
  );
}

function WorkflowButton({
  step,
  label,
  detail,
  active,
  done,
  disabled,
  onClick,
}: {
  step: string;
  label: string;
  detail: string;
  active: boolean;
  done: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="min-w-0 rounded-[10px] border border-[#deddd8] bg-[#fafaf8] px-3 py-3 text-left transition-colors duration-200 hover:border-[#b9b7b0] hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="mb-2 flex items-center justify-between gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ecebe7] text-[12px] font-bold text-[#5f5f5a]">
          {active ? <Loader2 className="size-3.5 animate-spin" /> : step}
        </span>
        <StatusPill tone={done ? "success" : active ? "warning" : undefined}>{done ? "완료" : active ? "진행" : "대기"}</StatusPill>
      </span>
      <strong className="block truncate text-[13px] text-[#332d27]">{label}</strong>
      <span className="mt-1 block truncate text-[11px] text-[#81766b]">{detail}</span>
    </button>
  );
}

function buildTitleCandidates(input: BlogDraftInput, _output: BlogDraftOutput) {
  const keyword = input.main_keyword || input.topic || "쿠키 선물";
  const situation = compactSituationForTitle(input);

  return [
    `${keyword}, 수량과 문구를 어디까지 정하면 좋을까요?`,
    `${keyword} 쿠키, 너무 가볍지 않은 구성을 찾으시나요?`,
    `${keyword}, 포장과 전달 방식 때문에 고민되시나요?`,
    `${keyword}, ${situation}라면 어떻게 준비하면 좋을까요?`,
    `${keyword}, ${situation}라면 어떤 마음을 담으면 좋을까요?`,
  ];
}

function compactSituationForTitle(input: BlogDraftInput) {
  const fallback = input.topic || input.main_keyword || "선물 준비";
  return (input.situation || fallback)
    .replace(/을 소개하는 글|를 소개하는 글|하는 글/g, "")
    .replace(/[.。!?]+$/g, "")
    .trim()
    .slice(0, 42);
}

function buildFaq(input: BlogDraftInput, output: BlogDraftOutput) {
  const [firstProduct, secondProduct] = output.selected_products;
  const firstName = firstProduct?.product_name ?? "추천 제품";
  const secondName = secondProduct?.product_name ?? "다른 구성";

  return [
    {
      q: `${input.topic}으로 어떤 제품이 제일 잘 맞나요?`,
      a: `짧은 문구나 기념 포인트가 중요하면 ${firstName}, 조금 더 가볍게 전하고 싶다면 ${secondName}도 잘 어울립니다.`,
    },
    {
      q: "문구를 넣을 수 있나요?",
      a: "제품과 일정에 따라 달라질 수 있어요. 이름, 날짜, 짧은 감사 문구처럼 필요한 포인트를 먼저 알려주세요.",
    },
    {
      q: "소량이나 단체 주문도 가능한가요?",
      a: "구성에 따라 가능 여부가 달라질 수 있어요. 필요한 날짜와 예상 수량을 먼저 보내주시면 확인이 빠릅니다.",
    },
    {
      q: "배송도 가능한가요?",
      a: "배송 가능 여부를 단정하지 않고, 매장 픽업 또는 차량 퀵 기준으로 먼저 상담드리고 있습니다.",
    },
  ];
}

function buildRicherFaq(input: BlogDraftInput, output: BlogDraftOutput) {
  const [firstProduct, secondProduct] = output.selected_products;
  const firstName = firstProduct?.product_name ?? "추천 제품";
  const secondName = secondProduct?.product_name ?? "다른 구성";

  return [
    {
      q: `${input.main_keyword || input.topic}으로 ${firstName}와 ${secondName} 중 어떤 구성이 더 잘 맞나요?`,
      a: `문구나 기념 포인트가 중요하면 ${firstName}, 조금 더 가볍게 나누고 싶다면 ${secondName} 쪽으로 먼저 비교해보면 좋아요.`,
    },
    {
      q: "문의할 때 어떤 정보를 먼저 보내면 좋나요?",
      a: "필요한 날짜, 예상 수량, 원하는 문구, 포장 방식, 픽업 또는 차량 퀵 필요 여부를 먼저 알려주시면 확인이 빠릅니다.",
    },
    {
      q: "문구를 아직 정하지 못했어도 상담할 수 있나요?",
      a: "네. 행사 종류와 전하고 싶은 분위기를 먼저 알려주시면 짧고 깔끔한 방향으로 같이 정리해드릴 수 있어요.",
    },
    {
      q: "사진은 어떤 순서로 올리면 글이 자연스러울까요?",
      a: "대표 사진, 제품 디테일, 포장 사진, 여러 개를 함께 둔 수량감 사진 순서로 배치하면 모바일에서 보기 편합니다.",
    },
  ];
}

function buildExpandedImageGuide(input: BlogDraftInput, output: BlogDraftOutput) {
  const [firstProduct, secondProduct] = output.selected_products;
  return [
    {
      position: "도입부 바로 아래",
      image_type: "대표 구성 사진",
      caption: `${input.topic} 분위기가 한눈에 보이는 대표 사진을 먼저 배치하세요.`,
    },
    {
      position: "상황 공감 섹션 뒤",
      image_type: "포장 또는 수량감 사진",
      caption: "받는 사람 수와 전달 방식을 떠올릴 수 있는 사진이 좋습니다.",
    },
    {
      position: `${firstProduct?.product_name ?? "첫 번째 제품"} 소개 뒤`,
      image_type: "제품 디테일 사진",
      caption: `${firstProduct?.product_name ?? "첫 번째 제품"}의 문구, 표정, 질감이 보이는 컷을 사용하세요.`,
    },
    {
      position: `${secondProduct?.product_name ?? "두 번째 제품"} 소개 뒤`,
      image_type: "대안 제품 또는 개별 포장 사진",
      caption: `${secondProduct?.product_name ?? "두 번째 제품"}이 어떤 상황에 잘 맞는지 보여주는 사진을 넣습니다.`,
    },
    {
      position: "주문 전 체크포인트 앞",
      image_type: "전체 구성과 포장 방식",
      caption: "수량, 포장, 문구 확인이 필요한 지점을 사진으로 자연스럽게 연결하세요.",
    },
    {
      position: "마무리 CTA 앞",
      image_type: "완성 후 정돈된 사진",
      caption: "문의 전에 참고할 수 있는 완성 분위기를 차분하게 보여주세요.",
    },
  ];
}

function recommendationFromProduct(product: Product, input: BlogDraftInput, _index = 0): ProductRecommendation {
  return hydrateRecommendation(
    {
      product_name: product.name,
      reason: `${input.topic} 상황에서 ${product.category} 구성이 기준을 잡기 편해서 선택했습니다.`,
      angle: product.default_intro || `${input.topic}에 맞는 ${product.category} 추천 포인트`,
      main_points: product.strengths.slice(0, 3).length ? product.strengths.slice(0, 3) : ["상황에 맞는 구성", "선물감 있는 포장", "문의 전 일정 확인"],
      caution: product.cautions[0] || "필요한 날짜와 수량은 주문 전 확인이 필요합니다.",
      summary: {
        recommended_situation: "",
        one_line_point: "",
        message_point: "",
        packaging_mood: "",
        order_check: "",
      },
      owner_comment: "",
      missing_info: [],
    },
    product,
    input,
  );
}

function styleFromPostType(postType: PostType): ReferenceStyle {
  if (postType === "검색 유입 정보형") return "검색 유입 정보형";
  if (postType === "시즌 선물형") return "시즌 선물형";
  if (postType === "제품 소개형") return "제품 디테일형";
  if (postType === "작업일기형") return "작업일기형";
  return "답례품 추천형";
}

function buildManualPrompt({
  kind,
  input,
  brand,
  products,
  selectedProducts,
  observations,
}: {
  kind: ManualPromptKind;
  input: BlogDraftInput;
  brand: Brand;
  products: Product[];
  selectedProducts: ProductRecommendation[];
  observations: ImageObservation[];
}) {
  const selectedDetails = selectedProducts.map((selected) => {
    const product = products.find((item) => item.name === selected.product_name);
    return {
      selected,
      product_db: product
        ? {
            name: product.name,
            category: product.category,
            fit_situations: product.fit_situations,
            keywords: product.keywords,
            strengths: product.strengths,
            cautions: product.cautions,
            editorial_profile: product.editorial_profile,
            default_intro: product.default_intro,
            default_faq: product.default_faq,
          }
        : null,
      };
  });

  const promptInput = {
    topic: input.topic,
    main_keyword: input.main_keyword,
    sub_keywords: input.sub_keywords,
    situation: input.situation,
    raw_memo: input.raw_memo,
    post_type: input.post_type,
    reference_style: input.reference_style,
    product_detail_answers: input.product_detail_answers,
    cta: input.cta || brand.default_cta,
  };
  const brandPayload = {
    name: brand.name,
    tone: brand.tone,
    default_cta: brand.default_cta,
    forbidden_words: brand.forbidden_words,
  };
  const naverSectionHeadings = buildSeoSectionHeadings(input, selectedProducts);
  const wordpressSectionHeadings = buildWordPressSectionHeadings(input, selectedProducts);
  const commonData = `
프롬프트 버전: ${WRITING_PROMPT_VERSION}

사용자 입력:
${JSON.stringify(promptInput, null, 2)}

브랜드 설정:
${JSON.stringify(brandPayload, null, 2)}

선택된 제품 2개:
${JSON.stringify(selectedDetails, null, 2)}

사진 관찰 결과:
${JSON.stringify(observations, null, 2)}

원문 제거 참고 패턴:
${JSON.stringify(referencePatternPayload(input.reference_style), null, 2)}
`.trim();

  if (kind === "naver") {
    return `${blogLayoutPrompt}

아래 입력값으로 nothingmatters 네이버 블로그 초안만 작성해줘.

중요:
- 워드프레스 객체는 만들지 않는다.
- 제품은 아래 selected_products 2개만 소개한다.
- 없는 후기, 고객 반응, 전국 택배 가능, 과장 표현은 쓰지 않는다.
- 내부 예제 글 원문이나 다른 브랜드명은 절대 재사용하지 않는다.
- 출력은 설명 없이 JSON 객체만 작성한다.
- 마크다운 코드블록(\`\`\`) 없이 JSON만 출력한다.

${commonData}

반드시 아래 네이버 전용 JSON 구조로 출력:
{
  "title_candidates": ["제목 후보 1", "제목 후보 2", "제목 후보 3", "제목 후보 4", "제목 후보 5"],
  "selected_title": "최종 제목",
  "search_intent": "검색자의 의도",
  "selected_products": ${JSON.stringify(selectedProducts, null, 2)},
  "sections": [
    { "id": "intro", "type": "intro", "heading": "${naverSectionHeadings[0]}", "body": "본문" },
    { "id": "empathy", "type": "empathy", "heading": "${naverSectionHeadings[1]}", "body": "본문" },
    { "id": "product-1", "type": "product_recommendation", "heading": "${naverSectionHeadings[2]}", "body": "본문" },
    { "id": "product-2", "type": "product_recommendation", "heading": "${naverSectionHeadings[3]}", "body": "본문" },
    { "id": "recommend-list", "type": "recommend_list", "heading": "이런 분들께 좋아요", "body": "본문" },
    { "id": "order-checklist", "type": "order_checklist", "heading": "주문 전 체크포인트", "body": "본문" },
    { "id": "cta", "type": "cta", "heading": "마무리", "body": "본문" }
  ],
  "faq": [
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" }
  ],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5", "#태그6", "#태그7", "#태그8", "#태그9", "#태그10"],
  "image_guide": [
    { "position": "도입부 아래", "image_type": "대표 이미지", "caption": "사진 아래 문장" },
    { "position": "${selectedProducts[0]?.product_name ?? "첫 번째 제품"} 소개 뒤", "image_type": "제품 디테일", "caption": "사진 아래 문장" },
    { "position": "${selectedProducts[1]?.product_name ?? "두 번째 제품"} 소개 뒤", "image_type": "포장 사진", "caption": "사진 아래 문장" }
  ],
  "plain_text_for_naver": "네이버 블로그에 바로 붙여넣을 수 있는 완성형 본문"
}`;
  }

  return `${wordpressLayoutPrompt}

아래 입력값으로 nothingmatters 워드프레스 블로그 초안만 작성해줘.

중요:
- 네이버 본문 객체는 만들지 않는다.
- 제목 후보 5개와 최종 제목은 네이버 블로그 버전과 동일한 부드러운 질문형 규칙을 따른다.
- sections는 아래 wordpress_section_headings를 정확히 같은 순서와 문장으로 사용한다.
- 본문 문장은 네이버 글을 복사하지 말고 워드프레스용 사장님 정보형으로 새로 쓴다.
- 제품은 아래 selected_products 2개만 다룬다.
- 본문 끝에 해시태그를 붙이지 말고 tags와 categories 배열로 분리한다.
- 출력은 설명 없이 JSON 객체만 작성한다.
- 마크다운 코드블록(\`\`\`) 없이 JSON만 출력한다.

${commonData}

wordpress_section_headings:
${JSON.stringify(wordpressSectionHeadings, null, 2)}

반드시 아래 워드프레스 전용 JSON 구조로 출력:
{
  "title_candidates": ["질문형 제목 1", "질문형 제목 2", "질문형 제목 3", "질문형 제목 4", "질문형 제목 5"],
  "selected_title": "질문형 최종 제목",
  "slug": "english-lowercase-slug",
  "meta_description": "검색 결과에 보일 설명",
  "excerpt": "목록에 보일 짧은 요약",
  "focus_keyword": "${input.main_keyword || input.topic}",
  "secondary_keywords": ["보조 키워드"],
  "sections": [
    { "id": "wp-intro", "heading": "${wordpressSectionHeadings[0]}", "body": "본문" },
    { "id": "wp-empathy", "heading": "${wordpressSectionHeadings[1]}", "body": "본문" },
    { "id": "wp-product-1", "heading": "${wordpressSectionHeadings[2]}", "body": "본문" },
    { "id": "wp-product-2", "heading": "${wordpressSectionHeadings[3]}", "body": "본문" },
    { "id": "wp-recommend-list", "heading": "${wordpressSectionHeadings[4]}", "body": "본문" },
    { "id": "wp-order-checklist", "heading": "${wordpressSectionHeadings[5]}", "body": "본문" },
    { "id": "wp-cta", "heading": "${wordpressSectionHeadings[6]}", "body": "본문" }
  ],
  "faq": [
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" },
    { "q": "질문", "a": "답변" }
  ],
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"],
  "categories": ["브랜드 블로그", "답례품 가이드"],
  "image_guide": [
    { "position": "첫 문단 아래", "image_type": "대표 사진", "caption": "사진 설명", "alt_text": "이미지 ALT" },
    { "position": "${selectedProducts[0]?.product_name ?? "첫 번째 제품"} 소개 뒤", "image_type": "제품 디테일", "caption": "사진 설명", "alt_text": "이미지 ALT" },
    { "position": "${selectedProducts[1]?.product_name ?? "두 번째 제품"} 소개 뒤", "image_type": "포장 사진", "caption": "사진 설명", "alt_text": "이미지 ALT" }
  ],
  "markdown_for_wordpress": "# 질문형 최종 제목\\n\\n## ${wordpressSectionHeadings[0]}\\n\\n본문"
}`;
}

function parseJsonFromText(value: string) {
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON 객체를 찾을 수 없습니다.");
  }

  const jsonText = withoutFence.slice(start, end + 1);

  try {
    return JSON.parse(jsonText) as Record<string, unknown>;
  } catch (error) {
    const repairedJsonText = repairLooseJsonEscapes(jsonText);
    if (repairedJsonText !== jsonText) {
      try {
        return JSON.parse(repairedJsonText) as Record<string, unknown>;
      } catch {
        // Keep the original parser message below because it points to the user's pasted text.
      }
    }

    const message = error instanceof Error ? error.message : "JSON 형식 오류";
    throw new Error(`JSON을 읽을 수 없습니다. GPT 출력에 잘못된 escape 문자가 있는지 확인해 주세요. (${message})`);
  }
}

function repairLooseJsonEscapes(jsonText: string) {
  return jsonText.replace(/\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})/g, "\\\\");
}

function inputFromDraft(draft: BlogDraftRecord): BlogDraftInput {
  return {
    ...defaultInput,
    topic: draft.topic,
    main_keyword: draft.main_keyword,
    sub_keywords: draft.sub_keywords,
    situation: draft.situation,
    raw_memo: draft.raw_memo,
    post_type: draft.post_type,
    reference_style: styleFromPostType(draft.post_type),
    preferred_products: draft.selected_products.map((product) => product.product_name),
    product_detail_answers: {},
    images: [],
  };
}

function ensureOutputWordPress(input: BlogDraftInput, output: BlogDraftOutput): BlogDraftOutput {
  const fallback = buildDefaultWordPressOutput(input, output);
  const wordpress = output.wordpress
    ? normalizeWordPressDraft(output.wordpress as unknown as Record<string, unknown>, input, output)
    : fallback;
  return {
    ...output,
    wordpress: {
      ...wordpress,
      markdown_for_wordpress: wordpress.markdown_for_wordpress
        ? normalizeCheckBullets(wordpress.markdown_for_wordpress)
        : formatMarkdownForWordPress(wordpress),
    },
  };
}

async function copyTextToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the temporary textarea path below.
  }

  let textarea: HTMLTextAreaElement | null = null;

  try {
    textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea?.remove();
  }
}

function normalizeManualOutput(
  raw: Record<string, unknown>,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
): BlogDraftOutput {
  const normalizedProducts = normalizeRecommendations(raw.selected_products, input, selectedProducts);
  const baseForTitle: BlogDraftOutput = {
    title_candidates: [],
    selected_title: typeof raw.selected_title === "string" ? raw.selected_title : input.main_keyword,
    search_intent: typeof raw.search_intent === "string" ? raw.search_intent : `${input.main_keyword}를 찾는 사람의 선물 선택 의도`,
    selected_products: normalizedProducts,
    sections: [],
    faq: [],
    hashtags: [],
    image_guide: [],
    plain_text_for_naver: "",
    wordpress: buildDefaultWordPressOutput(input, {
      selected_title: typeof raw.selected_title === "string" ? raw.selected_title : input.main_keyword,
      selected_products: normalizedProducts,
      plain_text_for_naver: "",
    }),
  };
  const titleCandidates = normalizeStringArray(raw.title_candidates, 5, buildTitleCandidates(input, baseForTitle)).slice(0, 5);
  const faq = normalizeFaq(raw.faq, input, baseForTitle);
  const hashtags = normalizeHashtags(raw.hashtags, input, normalizedProducts);
  const imageGuide = normalizeImageGuide(raw.image_guide, normalizedProducts, input);
  const sections = normalizeSections(raw.sections, raw.blog_body, raw.plain_text_for_naver, input, normalizedProducts);

  const outputWithoutPlain = {
    title_candidates: titleCandidates,
    selected_title: typeof raw.selected_title === "string" ? raw.selected_title : titleCandidates[0],
    search_intent: baseForTitle.search_intent,
    selected_products: normalizedProducts,
    sections,
    faq,
    hashtags,
    image_guide: imageGuide,
  };

  const editorialOutput = applyEditorialProductSections({
    ...outputWithoutPlain,
    plain_text_for_naver: "",
    wordpress: buildDefaultWordPressOutput(input, {
      ...outputWithoutPlain,
      plain_text_for_naver: "",
    }),
  }, input);
  const seoOutput = applySeoSectionHeadings(editorialOutput, input);
  const wordpress = normalizeWordPressDraft(raw.wordpress, input, seoOutput);

  return {
    ...seoOutput,
    plain_text_for_naver: formatPlainTextForNaver(seoOutput),
    wordpress,
  };
}

function normalizeManualPatch(
  raw: Record<string, unknown>,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
  currentOutput: BlogDraftOutput | null,
): BlogDraftOutput {
  const isWordPressOnly = isWordPressManualPayload(raw) && !isNaverManualPayload(raw);
  if (isWordPressOnly) {
    const base = currentOutput ?? normalizeManualOutput({}, input, selectedProducts);
    const rawWordPress = raw.wordpress && typeof raw.wordpress === "object" ? raw.wordpress : raw;
    const wordpress = normalizeWordPressDraft(rawWordPress, input, base);
    return {
      ...base,
      wordpress,
    };
  }

  const naverOutput = normalizeManualOutput(raw, input, selectedProducts);
  return {
    ...naverOutput,
    wordpress: raw.wordpress || !currentOutput ? naverOutput.wordpress : currentOutput.wordpress,
  };
}

function resolveManualSelectedProducts(
  raw: Record<string, unknown>,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
  products: Product[],
  currentOutput: BlogDraftOutput | null,
) {
  const resolved: ProductRecommendation[] = [];
  const addRecommendation = (recommendation: ProductRecommendation | null | undefined) => {
    if (!recommendation) return;
    if (resolved.some((item) => item.product_name === recommendation.product_name)) return;
    resolved.push(recommendation);
  };

  selectedProducts.forEach(addRecommendation);
  currentOutput?.selected_products.forEach(addRecommendation);

  const rawText = JSON.stringify(raw);
  products
    .filter((product) => rawText.includes(product.name))
    .forEach((product) => addRecommendation(recommendationFromProduct(product, input)));

  input.preferred_products
    .map((name) => products.find((product) => product.name === name))
    .forEach((product) => addRecommendation(product ? recommendationFromProduct(product, input) : null));

  products
    .filter((product) => product.is_active !== false)
    .forEach((product) => {
      if (resolved.length < 2) addRecommendation(recommendationFromProduct(product, input));
    });

  return resolved.slice(0, 2);
}

function isWordPressManualPayload(raw: Record<string, unknown>) {
  return [
    "wordpress",
    "slug",
    "meta_description",
    "excerpt",
    "focus_keyword",
    "secondary_keywords",
    "tags",
    "categories",
    "markdown_for_wordpress",
  ].some((key) => key in raw);
}

function isNaverManualPayload(raw: Record<string, unknown>) {
  return [
    "search_intent",
    "selected_products",
    "hashtags",
    "plain_text_for_naver",
  ].some((key) => key in raw);
}

function buildDefaultWordPressOutput(
  input: BlogDraftInput,
  output: Pick<BlogDraftOutput, "selected_title" | "selected_products"> & Partial<Pick<BlogDraftOutput, "plain_text_for_naver">>,
): WordPressDraftOutput {
  const keyword = input.main_keyword || input.topic || "쿠키 선물";
  const [first, second] = output.selected_products;
  const firstName = first?.product_name ?? "첫 번째 쿠키";
  const secondName = second?.product_name ?? "두 번째 쿠키";
  const titleCandidates = buildWordPressTitleCandidates(input, output);
  const selectedTitle = titleCandidates.find((title) => title !== output.selected_title) ?? titleCandidates[0];
  const sectionHeadings = buildWordPressSectionHeadings(input, output.selected_products);
  const sections = [
    {
      id: "wp-intro",
      heading: sectionHeadings[0],
      body: `${keyword}을 준비할 때는 제품 이름보다 수량, 문구, 포장 방식처럼 실제로 정해야 하는 기준이 먼저 보여야 편해요.`,
    },
    {
      id: "wp-empathy",
      heading: sectionHeadings[1],
      body: "✅ 전달할 인원과 예상 수량\n✅ 짧은 문구나 이름이 필요한지\n✅ 개별 포장과 전달 방식\n✅ 행사일 또는 수령 희망일",
    },
    {
      id: "wp-product-1",
      heading: sectionHeadings[2],
      body: `문구나 기념 포인트가 중요하면 저는 <mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${firstName} 쪽으로 먼저 기준을 잡아요</mark>. 전달할 장면이 정해져 있으면 문구 길이와 날짜를 먼저 보는 편이 안전합니다.`,
    },
    {
      id: "wp-product-2",
      heading: sectionHeadings[3],
      body: `<mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${secondName}은 마음을 너무 무겁게 만들지 않고 전하고 싶을 때 보기 편해요</mark>. ${firstName}이 문구와 기념 포인트 쪽이라면, ${secondName}은 가볍게 나누는 기준으로 보면 좋습니다.`,
    },
    {
      id: "wp-recommend-list",
      heading: sectionHeadings[4],
      body: "✅ 답례품 기준이 아직 흐릿한 분\n✅ 수량, 문구, 포장을 한 번에 정리하고 싶은 분\n✅ 네이버와 다른 워드프레스용 정보 글이 필요한 분",
    },
    {
      id: "wp-order-checklist",
      heading: sectionHeadings[5],
      body: "✅ 필요한 날짜\n✅ 예상 수량\n✅ 넣고 싶은 문구\n✅ 포장 방식\n✅ 픽업 또는 차량 퀵 필요 여부",
    },
    {
      id: "wp-cta",
      heading: sectionHeadings[6],
      body: input.cta || "필요한 날짜와 수량만 먼저 알려주셔도 괜찮아요. 어떤 구성이 편할지는 그 기준을 보고 같이 좁혀볼게요.",
    },
  ];
  const wordpress: WordPressDraftOutput = {
    title_candidates: titleCandidates,
    selected_title: selectedTitle,
    slug: slugifyKoreanAware(keyword),
    meta_description: `${keyword}을 준비할 때 필요한 수량, 문구, 포장 기준과 ${firstName}, ${secondName} 선택 기준을 사장님 정보형으로 정리했습니다.`,
    excerpt: `${keyword}을 고를 때 제가 먼저 보는 기준을 워드프레스용 사장님 정보형 글로 정리했습니다.`,
    focus_keyword: keyword,
    secondary_keywords: [input.topic, ...input.sub_keywords, firstName, secondName].filter(Boolean).slice(0, 6),
    sections,
    faq: [
      {
        q: `${keyword}으로 어떤 구성을 먼저 보면 좋을까요?`,
        a: `문구와 기념 포인트가 중요하면 ${firstName}, 가볍게 나누는 기준이면 ${secondName}로 나눠 보면 편해요.`,
      },
      {
        q: "네이버 글과 같은 내용을 써도 괜찮나요?",
        a: "같은 제품을 다루더라도 제목, 도입부, 소제목, 문장 순서는 다르게 잡는 편이 좋아요.",
      },
      {
        q: "워드프레스 본문 끝에 해시태그를 넣어야 하나요?",
        a: "해시태그보다 태그와 카테고리를 따로 입력하는 편이 워드프레스 관리에 맞아요.",
      },
      {
        q: "이미지 ALT는 어떻게 쓰면 좋나요?",
        a: "제품명, 상황 키워드, 사진 유형을 넣고 사진에 보이지 않는 맛이나 반응은 쓰지 않아요.",
      },
    ],
    tags: [
      keyword,
      input.topic,
      ...input.sub_keywords,
      firstName,
      secondName,
      "쿠키답례품",
      "수제쿠키",
      "브랜드블로그",
      "nothingmatters",
    ].filter((tag, index, tags) => tag && tags.indexOf(tag) === index).slice(0, 15),
    categories: ["브랜드 블로그", "답례품 가이드"],
    image_guide: [
      {
        position: "첫 문단 아래",
        image_type: "대표 사진",
        caption: `${keyword} 기준을 보여주는 대표 사진`,
        alt_text: `${keyword} ${firstName} ${secondName} 대표 구성 사진`,
      },
      {
        position: `${firstName} 기준 설명 뒤`,
        image_type: "제품 디테일",
        caption: `${firstName}의 문구나 디테일이 보이는 사진`,
        alt_text: `${keyword} ${firstName} 제품 디테일 사진`,
      },
      {
        position: `${secondName} 기준 설명 뒤`,
        image_type: "포장 사진",
        caption: `${secondName}의 포장 분위기를 보여주는 사진`,
        alt_text: `${keyword} ${secondName} 포장 사진`,
      },
    ],
    markdown_for_wordpress: "",
  };

  return {
    ...wordpress,
    markdown_for_wordpress: formatMarkdownForWordPress(wordpress),
  };
}

function normalizeWordPressDraft(rawWordPress: unknown, input: BlogDraftInput, naverOutput: BlogDraftOutput): WordPressDraftOutput {
  const raw = rawWordPress && typeof rawWordPress === "object" ? rawWordPress as Record<string, unknown> : {};
  const fallback = buildDefaultWordPressOutput(input, naverOutput);
  const titleCandidates = normalizeStringArray(raw.title_candidates, 5, fallback.title_candidates)
    .map(ensureQuestionTitle)
    .filter((title) => title !== naverOutput.selected_title)
    .slice(0, 5);
  const selectedTitle =
    typeof raw.selected_title === "string" && raw.selected_title !== naverOutput.selected_title
      ? ensureQuestionTitle(raw.selected_title)
      : titleCandidates[0];
  const wordpress: WordPressDraftOutput = {
    title_candidates: titleCandidates.length === 5 ? titleCandidates : fallback.title_candidates,
    selected_title: selectedTitle,
    slug: typeof raw.slug === "string" && raw.slug ? raw.slug : fallback.slug,
    meta_description: typeof raw.meta_description === "string" && raw.meta_description ? raw.meta_description : fallback.meta_description,
    excerpt: typeof raw.excerpt === "string" && raw.excerpt ? raw.excerpt : fallback.excerpt,
    focus_keyword: typeof raw.focus_keyword === "string" && raw.focus_keyword ? raw.focus_keyword : fallback.focus_keyword,
    secondary_keywords: normalizeStringArray(raw.secondary_keywords, 0, fallback.secondary_keywords).slice(0, 6),
    sections: normalizeWordPressSections(raw.sections, fallback.sections, naverOutput.sections),
    faq: normalizeWordPressFaq(raw.faq, fallback.faq),
    tags: normalizeWordPressTags(raw.tags, fallback.tags, input, naverOutput.selected_products),
    categories: normalizeStringArray(raw.categories, 1, fallback.categories).slice(0, 5),
    image_guide: normalizeWordPressImageGuide(raw.image_guide, fallback.image_guide),
    markdown_for_wordpress: "",
  };
  return {
    ...wordpress,
    markdown_for_wordpress: formatMarkdownForWordPress(wordpress),
  };
}

function buildWordPressTitleCandidates(
  input: BlogDraftInput,
  output: Pick<BlogDraftOutput, "selected_title" | "selected_products">,
) {
  const keyword = input.main_keyword || input.topic || "쿠키 선물";
  const [first, second] = output.selected_products;
  const situation = compactSituationForTitle(input);
  const candidates = [
    `${keyword}, 수량과 문구를 먼저 보면 어떨까요?`,
    `${keyword} 쿠키, 너무 광고 같지 않게 준비하려면 좋을까요?`,
    `${keyword}, 포장과 전달 방식을 어디까지 확인하면 좋을까요?`,
    `${keyword}, ${situation}라면 어떤 기준으로 고르면 좋을까요?`,
    `${keyword}, ${first?.product_name ?? "쿠키"}와 ${second?.product_name ?? "쿠키"} 중 어떤 구성이 편할까요?`,
    `${keyword}, 워드프레스에는 어떤 기준으로 정리하면 좋을까요?`,
  ].map(ensureQuestionTitle).filter((title) => title !== output.selected_title);
  return candidates.slice(0, 5);
}

function ensureQuestionTitle(title: string) {
  const trimmed = title.trim().replace(/[.!。]+$/g, "");
  return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
}

function normalizeWordPressSections(
  rawSections: unknown,
  fallback: WordPressDraftOutput["sections"],
  naverSections: BlogDraftOutput["sections"],
) {
  const sectionCount = Math.max(naverSections.length, fallback.length, Array.isArray(rawSections) ? rawSections.length : 0);
  if (!Array.isArray(rawSections)) {
    return Array.from({ length: sectionCount }, (_, index) => ({
      id: fallback[index]?.id ?? `wp-section-${index + 1}`,
      heading: ensureWordPressSectionHeading(fallback[index]?.heading ?? `선택 기준 ${index + 1}`, index),
      body: fallback[index]?.body ?? "",
    }));
  }
  const parsed = rawSections
    .map((section, index) => {
      const raw = section as { id?: unknown; heading?: unknown; body?: unknown };
      return {
        id: typeof raw.id === "string" ? raw.id : fallback[index]?.id ?? `wp-section-${index + 1}`,
        heading: ensureWordPressSectionHeading(
          typeof raw.heading === "string" ? raw.heading : fallback[index]?.heading ?? `선택 기준 ${index + 1}`,
          index,
        ),
        body: typeof raw.body === "string" ? normalizeCheckBullets(raw.body) : (fallback[index]?.body ?? ""),
      };
    })
    .filter((section) => section.heading && section.body);
  const aligned = Array.from({ length: sectionCount }, (_, index) => ({
    id: parsed[index]?.id ?? fallback[index]?.id ?? `wp-section-${index + 1}`,
    heading: ensureWordPressSectionHeading(parsed[index]?.heading ?? fallback[index]?.heading ?? `선택 기준 ${index + 1}`, index),
    body: parsed[index]?.body ?? fallback[index]?.body ?? "",
  }));
  return aligned.length >= 5 ? aligned : fallback;
}

function ensureWordPressSectionHeading(heading: string, index: number) {
  const prefixes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
  const prefix = prefixes[index] ?? `${index + 1}.`;
  const cleanHeading = heading.replace(/^[1-7](?:️⃣|\.)\s*/, "").trim();
  return `${prefix} ${cleanHeading}`;
}

function normalizeWordPressFaq(rawFaq: unknown, fallback: WordPressDraftOutput["faq"]) {
  if (!Array.isArray(rawFaq)) return fallback;
  const parsed = rawFaq
    .map((item) => {
      const raw = item as { q?: unknown; a?: unknown };
      return typeof raw.q === "string" && typeof raw.a === "string" ? { q: raw.q, a: raw.a } : null;
    })
    .filter(Boolean) as WordPressDraftOutput["faq"];
  return [...parsed, ...fallback].slice(0, 4);
}

function normalizeWordPressTags(
  rawTags: unknown,
  fallback: string[],
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  return normalizeStringArray(rawTags, 5, [
    ...fallback,
    input.main_keyword,
    input.topic,
    ...input.sub_keywords,
    ...selectedProducts.map((product) => product.product_name),
    "쿠키답례품",
    "수제쿠키",
    "브랜드블로그",
    "nothingmatters",
  ])
    .filter((tag, index, tags) => tag && tags.indexOf(tag) === index)
    .slice(0, 15);
}

function normalizeWordPressImageGuide(rawGuide: unknown, fallback: WordPressDraftOutput["image_guide"]) {
  if (!Array.isArray(rawGuide)) return fallback;
  const parsed = rawGuide
    .map((item, index) => {
      const raw = item as { position?: unknown; image_type?: unknown; caption?: unknown; alt_text?: unknown };
      return {
        position: typeof raw.position === "string" ? raw.position : fallback[index]?.position ?? "본문 중간",
        image_type: typeof raw.image_type === "string" ? raw.image_type : fallback[index]?.image_type ?? "이미지",
        caption: typeof raw.caption === "string" ? raw.caption : fallback[index]?.caption ?? "",
        alt_text: typeof raw.alt_text === "string" ? raw.alt_text : fallback[index]?.alt_text ?? "",
      };
    })
    .filter((item) => item.position && item.image_type && item.alt_text);
  return parsed.length >= 3 ? parsed : fallback;
}

function slugifyKoreanAware(value: string) {
  const mapped = value
    .toLowerCase()
    .replace(/퇴사/g, "resignation")
    .replace(/답례품/g, "gift")
    .replace(/쿠키/g, "cookie")
    .replace(/결혼/g, "wedding")
    .replace(/어린이날/g, "childrens-day")
    .replace(/스승의 날|스승의날/g, "teacher-day")
    .replace(/선물/g, "present")
    .replace(/회사/g, "company")
    .replace(/커스텀/g, "custom");
  const slug = mapped
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "nothingmatters-blog-guide";
}

function normalizeRecommendations(rawProducts: unknown, input: BlogDraftInput, fallback: ProductRecommendation[]) {
  const source = Array.isArray(rawProducts) && rawProducts.length >= 2 ? rawProducts : fallback;
  const paddedSource = [...source];
  while (paddedSource.length < 2) {
    const index = paddedSource.length;
    paddedSource.push({
      product_name: input.preferred_products[index] || `추천 제품 ${index + 1}`,
      reason: `${input.topic || input.main_keyword} 상황에 맞춰 확인할 제품입니다.`,
      angle: `${input.topic || input.main_keyword}에 맞는 구성`,
      main_points: ["수량 확인", "문구 확인", "포장 방식 확인"],
      caution: "필요한 날짜와 수량을 먼저 확인합니다.",
    });
  }

  return paddedSource.slice(0, 2).map((item, index) => {
    const raw = item as Partial<ProductRecommendation>;
    const fallbackProduct = fallback[index];
    return ensureRecommendationEditorialDefaults(
      {
        product_name: String(raw.product_name || fallbackProduct?.product_name || `추천 제품 ${index + 1}`),
        reason: String(raw.reason || fallbackProduct?.reason || `${input.topic} 상황에 맞는 제품입니다.`),
        angle: String(raw.angle || fallbackProduct?.angle || `${input.topic}에 맞는 추천 각도`),
        main_points: normalizeStringArray(raw.main_points, 3, fallbackProduct?.main_points ?? ["상황에 맞는 구성", "선물감", "문의 전 일정 확인"]).slice(0, 5),
        caution: String(raw.caution || fallbackProduct?.caution || "필요한 날짜와 수량은 주문 전 확인이 필요합니다."),
        summary: normalizeRecommendationSummary(raw.summary, fallbackProduct?.summary, input),
        owner_comment: String(raw.owner_comment || fallbackProduct?.owner_comment || ""),
        missing_info: normalizeStringArray(raw.missing_info, 0, fallbackProduct?.missing_info ?? []),
      },
      input,
    );
  });
}

function normalizeRecommendationSummary(rawSummary: unknown, fallbackSummary: ProductRecommendation["summary"] | undefined, input: BlogDraftInput) {
  const raw = rawSummary && typeof rawSummary === "object" ? rawSummary as Partial<ProductRecommendation["summary"]> : {};
  return {
    recommended_situation: String(raw.recommended_situation || fallbackSummary?.recommended_situation || input.topic || ""),
    one_line_point: String(raw.one_line_point || fallbackSummary?.one_line_point || ""),
    message_point: String(raw.message_point || fallbackSummary?.message_point || "문구 적용 여부는 상담 시 확인이 필요합니다."),
    packaging_mood: String(raw.packaging_mood || fallbackSummary?.packaging_mood || "포장 방식은 수량과 전달 상황에 맞춰 상담이 필요합니다."),
    order_check: String(raw.order_check || fallbackSummary?.order_check || "필요한 날짜와 수량을 먼저 확인합니다."),
  };
}

function normalizeSections(
  rawSections: unknown,
  rawBlogBody: unknown,
  rawPlainText: unknown,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
) {
  const seoHeadings = buildSeoSectionHeadings(input, selectedProducts);
  if (Array.isArray(rawSections) && rawSections.length >= 6) {
    return rawSections.map((section, index) => {
      const raw = section as { id?: unknown; type?: unknown; heading?: unknown; body?: unknown };
      return {
        id: typeof raw.id === "string" ? raw.id : `section-${index + 1}`,
        type: isSectionType(raw.type) ? raw.type : sectionTypeByIndex(index),
        heading: seoHeadings[index] ?? (typeof raw.heading === "string" ? raw.heading : `섹션 ${index + 1}`),
        body: typeof raw.body === "string" ? normalizeCheckBullets(raw.body) : "",
      };
    });
  }

  const body = typeof rawBlogBody === "string" ? rawBlogBody : typeof rawPlainText === "string" ? rawPlainText : "";
  const paragraphs = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);

  return [
    {
      id: "intro",
      type: "intro" as const,
      heading: seoHeadings[0],
      body: paragraphs.slice(0, 2).join("\n\n") || `${input.topic}을 준비하는 분들이 참고하기 좋은 글입니다.`,
    },
    {
      id: "empathy",
      type: "empathy" as const,
      heading: seoHeadings[1],
      body: paragraphs.slice(2, 4).join("\n\n") || `${input.situation || input.raw_memo || "수량, 문구, 포장, 전달 방식을 함께 고민하게 되는 상황입니다."}`,
    },
    {
      id: "product-1",
      type: "product_recommendation" as const,
      heading: seoHeadings[2],
      body: selectedProducts[0]?.reason ?? "첫 번째 추천 제품 설명",
    },
    {
      id: "product-2",
      type: "product_recommendation" as const,
      heading: seoHeadings[3],
      body: selectedProducts[1]?.reason ?? "두 번째 추천 제품 설명",
    },
    {
      id: "recommend-list",
      type: "recommend_list" as const,
      heading: seoHeadings[4],
      body: "✅ 상황에 맞는 답례품을 찾는 분\n✅ 문구와 포장을 함께 고민하는 분\n✅ 여러 명에게 깔끔하게 나눠야 하는 분",
    },
    {
      id: "order-checklist",
      type: "order_checklist" as const,
      heading: seoHeadings[5],
      body: "✅ 필요한 날짜\n✅ 예상 수량\n✅ 원하는 문구\n✅ 포장 방식\n✅ 픽업 또는 차량 퀵 여부",
    },
    {
      id: "cta",
      type: "cta" as const,
      heading: seoHeadings[6],
      body: input.cta || "필요한 날짜와 수량만 먼저 알려주셔도 괜찮아요.",
    },
  ];
}

function normalizeFaq(rawFaq: unknown, input: BlogDraftInput, output: BlogDraftOutput) {
  const parsed = Array.isArray(rawFaq)
    ? rawFaq
        .map((item) => {
          const raw = item as { q?: unknown; a?: unknown };
          return typeof raw.q === "string" && typeof raw.a === "string" ? { q: raw.q, a: raw.a } : null;
        })
        .filter(Boolean)
    : [];
  return [...parsed, ...buildFaq(input, output)].slice(0, 4) as { q: string; a: string }[];
}

function normalizeHashtags(rawHashtags: unknown, input: BlogDraftInput, selectedProducts: ProductRecommendation[]) {
  const base = Array.isArray(rawHashtags) ? rawHashtags.map(String) : [];
  return [
    ...base,
    input.main_keyword,
    input.topic,
    ...input.sub_keywords,
    ...selectedProducts.map((product) => product.product_name),
    "답례품쿠키",
    "수제쿠키",
    "쿠키답례품",
    "회사답례품",
    "행사답례품",
    "커스텀쿠키",
    "브라우니쿠키",
    "수제쿠키선물",
    "nothingmatters",
    "낫띵메터스",
  ]
    .map((tag) => `#${tag.replace(/^#/, "").replace(/\s+/g, "")}`)
    .filter((tag, index, tags) => tag.length > 1 && tags.indexOf(tag) === index)
    .slice(0, 15);
}

function normalizeImageGuide(rawGuide: unknown, selectedProducts: ProductRecommendation[], input: BlogDraftInput) {
  const parsed = Array.isArray(rawGuide)
    ? rawGuide
        .map((item) => {
          const raw = item as { position?: unknown; image_type?: unknown; caption?: unknown };
          return typeof raw.position === "string" && typeof raw.image_type === "string" && typeof raw.caption === "string"
            ? { position: raw.position, image_type: raw.image_type, caption: raw.caption }
            : null;
        })
        .filter(Boolean)
    : [];

  return [
    ...parsed,
    { position: "도입부 아래", image_type: "대표 이미지", caption: `${input.topic}에 어울리는 대표 제품 사진` },
    { position: `${selectedProducts[0]?.product_name ?? "첫 번째 제품"} 소개 뒤`, image_type: "제품 디테일", caption: `${selectedProducts[0]?.product_name ?? "제품"} 디테일 사진` },
    { position: `${selectedProducts[1]?.product_name ?? "두 번째 제품"} 소개 뒤`, image_type: "포장 사진", caption: `${selectedProducts[1]?.product_name ?? "제품"} 포장 사진` },
  ].slice(0, Math.max(parsed.length, 3)) as BlogDraftOutput["image_guide"];
}

function normalizeStringArray(value: unknown, minLength: number, fallback: string[]) {
  const items = Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  return [...items, ...fallback].slice(0, Math.max(minLength, items.length || fallback.length));
}

function formatManualJsonError(error: unknown) {
  if (error && typeof error === "object" && "issues" in error && Array.isArray((error as { issues?: unknown[] }).issues)) {
    const issues = (error as { issues: Array<{ path?: Array<string | number>; message?: string }> }).issues;
    const labels = issues.map((issue) => issue.path?.join(".") || issue.message || "필수값").join(", ");
    return `JSON은 읽었지만 필수값 보정에 실패했습니다. 문제가 된 항목: ${labels}`;
  }

  return error instanceof Error ? error.message : "JSON을 읽을 수 없습니다. 중괄호 포함 전체 JSON을 붙여넣어 주세요.";
}

function isSectionType(value: unknown): value is BlogDraftOutput["sections"][number]["type"] {
  return (
    value === "intro" ||
    value === "empathy" ||
    value === "product_recommendation" ||
    value === "recommend_list" ||
    value === "order_checklist" ||
    value === "faq" ||
    value === "cta"
  );
}

function sectionTypeByIndex(index: number): BlogDraftOutput["sections"][number]["type"] {
  return (["intro", "empathy", "product_recommendation", "product_recommendation", "recommend_list", "order_checklist", "cta"] as const)[index] ?? "intro";
}

function EditorView({
  input,
  output,
  onOutput,
  onRegenerate,
  onCheck,
  onNew,
}: {
  input: BlogDraftInput;
  output: BlogDraftOutput | null;
  onOutput: (output: BlogDraftOutput) => void;
  onRegenerate: (sectionName: string, instruction: string) => void | Promise<void>;
  onCheck: () => void;
  onNew: () => void;
}) {
  const [activeEditorTab, setActiveEditorTab] = useState<"naver" | "wordpress">("naver");

  if (!output) {
    return (
      <section className="rounded-md border border-[#e5ddd2] bg-white p-8 text-center">
        <h2 className="text-[18px] font-bold">아직 생성된 초안이 없습니다.</h2>
        <p className="mt-2 text-[13px] text-[#7b7166]">새 글 만들기에서 주제와 메모를 넣고 생성해 주세요.</p>
        <Button type="button" variant="primary" className="mt-5" onClick={onNew}>
          새 글 만들기
        </Button>
      </section>
    );
  }

  const currentOutput = output;
  const productSectionIds = currentOutput.sections.filter((section) => section.type === "product_recommendation").map((section) => section.id);
  const editableSectionIds = currentOutput.sections.map((section) => section.id);

  async function regenerateSections(sectionIds: string[], instruction: string) {
    for (const sectionId of sectionIds) {
      await onRegenerate(sectionId, instruction);
    }
  }

  function refreshTitles() {
    const titleCandidates = buildTitleCandidates(input, currentOutput);
    onOutput({
      ...currentOutput,
      title_candidates: titleCandidates,
      selected_title: titleCandidates[0],
    });
  }

  function refreshFaq() {
    onOutput({
      ...currentOutput,
      faq: buildFaq(input, currentOutput),
    });
  }

  function enrichFaq() {
    onOutput({
      ...currentOutput,
      faq: buildRicherFaq(input, currentOutput),
    });
  }

  function expandImageGuide() {
    onOutput({
      ...currentOutput,
      image_guide: buildExpandedImageGuide(input, currentOutput),
    });
  }

  return (
    <div className="grid gap-3">
      <section className="sticky top-[84px] z-10 rounded-[14px] border border-[#deddd8] bg-white/94 p-2 shadow-[0_8px_24px_rgba(24,24,27,0.06)] backdrop-blur-xl sm:top-[77px]">
        <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-[#f1f0ec] p-1">
          <button
            type="button"
            className={activeEditorTab === "naver" ? modeButtonActiveClass : modeButtonClass}
            onClick={() => setActiveEditorTab("naver")}
          >
            네이버 블로그
          </button>
          <button
            type="button"
            className={activeEditorTab === "wordpress" ? modeButtonActiveClass : modeButtonClass}
            onClick={() => setActiveEditorTab("wordpress")}
          >
            워드프레스
          </button>
        </div>
      </section>
      <details className="rounded-[14px] border border-[#deddd8] bg-white xl:hidden">
        <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-4 text-[13px] font-bold text-[#27272a]">
          모바일 미리보기 열기
          <ChevronDown aria-hidden className="details-chevron size-4 text-[#6f6f6a]" />
        </summary>
        <div className="border-t border-[#ecebe7] p-3">
          <MobilePreview output={currentOutput} />
        </div>
      </details>
      {activeEditorTab === "naver" ? (
        <>
      <TitleSelector
        candidates={currentOutput.title_candidates}
        selectedTitle={currentOutput.selected_title}
        onSelect={(title) => onOutput({ ...currentOutput, selected_title: title })}
        onRefresh={refreshTitles}
      />
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <Field label="최종 제목" hint={`${currentOutput.selected_title.length} / 60`}>
          <Input
            value={currentOutput.selected_title}
            onChange={(event) => onOutput({ ...currentOutput, selected_title: event.target.value })}
          />
        </Field>
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#362f28]">프롬프트형 빠른 수정</h2>
            <p className="mt-1 text-[12px] text-[#7b7166]">마음에 안 드는 부분만 골라 다시 다듬을 수 있습니다.</p>
          </div>
          <StatusPill tone="success">부분 재생성</StatusPill>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={refreshTitles}>
            제목 다시
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={() => void regenerateSections(productSectionIds, "제품 추천만 다시 하기")}>
            제품 추천만 다시
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={refreshFaq}>
            FAQ만 다시
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={() => void regenerateSections(editableSectionIds, "광고 느낌 줄이기")}>
            광고 느낌 줄이기
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={() => void regenerateSections(editableSectionIds, "더 자연스럽게 바꾸기")}>
            더 자연스럽게
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={() => void regenerateSections(editableSectionIds, "사장님 말투로 바꾸기")}>
            사장님 말투
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={() => void regenerateSections(editableSectionIds, "모바일용 줄바꿈 적용")}>
            모바일 줄바꿈
          </Button>
          <Button type="button" variant="primary" className="h-8 px-2 text-[12px]" onClick={onCheck}>
            최종 검수
          </Button>
        </div>
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#362f28]">글 풍성하게</h2>
            <p className="mt-1 text-[12px] text-[#7b7166]">
              내부 예제에서 뽑은 패턴만 사용해 도입부, 기준, FAQ, CTA, 이미지 가이드를 보강합니다.
            </p>
          </div>
          <StatusPill>패턴 기반</StatusPill>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-2 text-[12px]"
            icon={<WandSparkles className="size-3.5" />}
            onClick={() => void regenerateSections(["intro"], "도입부에 독자가 실제로 고민할 만한 현실 질문을 2~3개 더 넣고 자연스럽게 시작하기")}
          >
            도입부 현실 고민
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-2 text-[12px]"
            onClick={() => void regenerateSections(["empathy"], "선택 기준 3개를 수량, 포장, 문구 중심으로 추가하기")}
          >
            선택 기준 3개
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={enrichFaq}>
            FAQ 현실적으로
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-8 px-2 text-[12px]"
            onClick={() => void regenerateSections(["cta"], "마무리 CTA를 더 부드럽고 부담 없는 사장님 말투로 바꾸기")}
          >
            CTA 부드럽게
          </Button>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={expandImageGuide}>
            이미지 배치 자세히
          </Button>
        </div>
      </section>
      {currentOutput.sections.map((section) => {
        const recommendation = productRecommendationForSection(section.id, currentOutput);
        return (
          <div key={section.id} className="grid gap-2">
            {recommendation ? <ProductSectionSummaryCard recommendation={recommendation} /> : null}
            <SectionCard
              section={section}
              onChange={(body) =>
                onOutput({
                  ...currentOutput,
                  sections: currentOutput.sections.map((item) => (item.id === section.id ? { ...item, body } : item)),
                })
              }
              onRegenerate={(instruction) => onRegenerate(section.id, instruction)}
            />
          </div>
        );
      })}
      <FaqEditor faq={currentOutput.faq} onChange={(faq) => onOutput({ ...currentOutput, faq })} />
      <HashtagBox hashtags={currentOutput.hashtags} onChange={(hashtags) => onOutput({ ...currentOutput, hashtags })} />
        </>
      ) : (
        <WordPressEditor output={currentOutput} onOutput={onOutput} />
      )}
    </div>
  );
}

function WordPressEditor({
  output,
  onOutput,
}: {
  output: BlogDraftOutput;
  onOutput: (output: BlogDraftOutput) => void;
}) {
  const wordpress = output.wordpress;

  function updateWordPress(next: WordPressDraftOutput) {
    onOutput({
      ...output,
      wordpress: next,
    });
  }

  function updateMarkdownFromSections() {
    updateWordPress({
      ...wordpress,
      markdown_for_wordpress: formatMarkdownForWordPress(wordpress),
    });
  }

  return (
    <div className="grid gap-3">
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[14px] font-bold text-[#362f28]">워드프레스 SEO 정보</h2>
            <p className="mt-1 text-[12px] text-[#7b7166]">네이버 글과 겹치지 않게 사장님 정보형 Markdown으로 운영합니다.</p>
          </div>
          <StatusPill tone="success">Markdown</StatusPill>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Field label="워드프레스 제목" hint={`${wordpress.selected_title.length}자`}>
            <Input
              value={wordpress.selected_title}
              onChange={(event) => updateWordPress({ ...wordpress, selected_title: event.target.value })}
            />
          </Field>
          <Field label="Slug">
            <Input
              value={wordpress.slug}
              onChange={(event) => updateWordPress({ ...wordpress, slug: event.target.value })}
            />
          </Field>
          <Field label="Focus keyword">
            <Input
              value={wordpress.focus_keyword}
              onChange={(event) => updateWordPress({ ...wordpress, focus_keyword: event.target.value })}
            />
          </Field>
          <Field label="보조 키워드" hint="쉼표로 구분">
            <Input
              value={wordpress.secondary_keywords.join(", ")}
              onChange={(event) => updateWordPress({ ...wordpress, secondary_keywords: splitByComma(event.target.value) })}
            />
          </Field>
          <Field label="Meta description" hint={`${wordpress.meta_description.length}자`}>
            <Textarea
              value={wordpress.meta_description}
              className="min-h-20"
              onChange={(event) => updateWordPress({ ...wordpress, meta_description: event.target.value })}
            />
          </Field>
          <Field label="Excerpt">
            <Textarea
              value={wordpress.excerpt}
              className="min-h-20"
              onChange={(event) => updateWordPress({ ...wordpress, excerpt: event.target.value })}
            />
          </Field>
          <Field label="Categories" hint="쉼표로 구분">
            <Input
              value={wordpress.categories.join(", ")}
              onChange={(event) => updateWordPress({ ...wordpress, categories: splitByComma(event.target.value) })}
            />
          </Field>
          <Field label="Tags" hint="쉼표로 구분">
            <Input
              value={wordpress.tags.join(", ")}
              onChange={(event) => updateWordPress({ ...wordpress, tags: splitByComma(event.target.value) })}
            />
          </Field>
        </div>
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold text-[#362f28]">워드프레스 본문 Markdown</h2>
          <Button type="button" variant="secondary" className="h-8 px-2 text-[12px]" onClick={updateMarkdownFromSections}>
            섹션 기준으로 Markdown 재구성
          </Button>
        </div>
        <Textarea
          value={wordpress.markdown_for_wordpress}
          className="min-h-[360px] font-mono text-[12px] leading-5"
          onChange={(event) => updateWordPress({ ...wordpress, markdown_for_wordpress: event.target.value })}
        />
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <h2 className="mb-3 text-[14px] font-bold text-[#362f28]">워드프레스 섹션 원본</h2>
        <div className="grid gap-3">
          {wordpress.sections.map((section, index) => (
            <article key={section.id} className="rounded-md border border-[#f0e8dd] bg-[#fffdf9] p-3">
              <Field label="H2 섹션 제목">
                <Input
                  value={section.heading}
                  onChange={(event) =>
                    updateWordPress({
                      ...wordpress,
                      sections: wordpress.sections.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, heading: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
              <Field label="본문">
                <Textarea
                  value={section.body}
                  className="min-h-24"
                  onChange={(event) =>
                    updateWordPress({
                      ...wordpress,
                      sections: wordpress.sections.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, body: event.target.value } : item,
                      ),
                    })
                  }
                />
              </Field>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <h2 className="mb-3 text-[14px] font-bold text-[#362f28]">워드프레스 복사</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <CopyToNaverButton label="WP 본문 Markdown" text={wordpress.markdown_for_wordpress} />
          <CopyToNaverButton label="WP 제목" text={wordpress.selected_title} />
          <CopyToNaverButton label="Meta description" text={wordpress.meta_description} />
          <CopyToNaverButton label="WP 태그" text={wordpress.tags.join(", ")} />
          <CopyToNaverButton label="WP 카테고리" text={wordpress.categories.join(", ")} />
          <CopyToNaverButton label="이미지 ALT" text={formatWordPressImageGuide(wordpress)} />
        </div>
      </section>
    </div>
  );
}

function ProductSectionSummaryCard({ recommendation }: { recommendation: ProductRecommendation }) {
  const missingInfo = recommendation.missing_info ?? [];
  const summaryLine = formatProductSummaryBlock(recommendation);

  return (
    <section className="rounded-md border border-[#eadfd2] bg-[#fffdf9] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-bold text-[#362f28]">{recommendation.product_name} 본문 요약</h3>
          <p className="mt-1 text-[12px] leading-5 text-[#7b7166]">본문 첫 줄은 직접 만드는 사람이 조용히 기준을 골라주듯 들어갑니다.</p>
        </div>
        <StatusPill tone={missingInfo.length ? "warning" : "success"}>
          {missingInfo.length ? "자료 보강 필요" : "요약 준비"}
        </StatusPill>
      </div>
      <div className="rounded-md border border-[#f0e8dd] bg-white p-3">
        <p className="whitespace-pre-line text-[12px] leading-5 text-[#3f372f]">{summaryLine}</p>
      </div>
      {missingInfo.length ? (
        <p className="mt-2 text-[12px] leading-5 text-[#9b6b25]">
          부족한 자료: {missingInfo.join(", ")}
        </p>
      ) : null}
    </section>
  );
}

function productRecommendationForSection(sectionId: string, output: BlogDraftOutput) {
  const productSections = output.sections.filter((section) => section.type === "product_recommendation");
  const productIndex = productSections.findIndex((section) => section.id === sectionId);
  return productIndex >= 0 ? output.selected_products[productIndex] : null;
}

function DraftArchiveView({
  drafts,
  onOpen,
  onClone,
}: {
  drafts: BlogDraftRecord[];
  onOpen: (draft: BlogDraftRecord) => void;
  onClone: (draft: BlogDraftRecord) => void;
}) {
  return (
    <section className="rounded-md border border-[#e5ddd2] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-bold">글 보관함</h2>
          <p className="mt-1 text-[13px] text-[#7b7166]">날짜, 키워드, 제품, 글 타입별로 재활용할 초안을 관리합니다.</p>
        </div>
        <div className="flex gap-2 text-[12px]">
          <StatusPill>날짜별</StatusPill>
          <StatusPill>키워드별</StatusPill>
          <StatusPill>제품별</StatusPill>
        </div>
      </div>
      <div className="grid gap-2">
        {drafts.length ? (
          drafts.map((draft) => (
            <article key={draft.id} className="flex items-center justify-between rounded-md border border-[#efe6db] p-3">
              <div>
                <h3 className="text-[14px] font-bold">{draft.title}</h3>
                <p className="mt-1 text-[12px] text-[#81766b]">
                  {draft.main_keyword} · {draft.post_type} · {draft.selected_products.map((item) => item.product_name).join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => onClone(draft)}>
                  복제
                </Button>
                <Button type="button" variant="primary" onClick={() => onOpen(draft)}>
                  열기
                </Button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md bg-[#fffaf2] p-5 text-[13px] text-[#776d62]">아직 저장된 초안이 없습니다.</p>
        )}
      </div>
    </section>
  );
}

function ProductsView({
  brand,
  products,
  onBrand,
  onSaveBrand,
  onProductSaved,
}: {
  brand: Brand;
  products: Product[];
  onBrand: (brand: Brand) => void;
  onSaveBrand: () => void;
  onProductSaved: (product: Product) => void;
}) {
  return (
    <div className="grid gap-4">
      <section className="rounded-md border border-[#e5ddd2] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold">브랜드 톤 설정</h2>
          <Button type="button" variant="primary" onClick={onSaveBrand}>
            저장
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="브랜드명">
            <Input value={brand.name} onChange={(event) => onBrand({ ...brand, name: event.target.value })} />
          </Field>
          <Field label="기본 CTA">
            <Input value={brand.default_cta} onChange={(event) => onBrand({ ...brand, default_cta: event.target.value })} />
          </Field>
          <Field label="브랜드 톤">
            <Textarea value={brand.tone} onChange={(event) => onBrand({ ...brand, tone: event.target.value })} />
          </Field>
          <Field label="금지 표현" hint="쉼표로 구분">
            <Textarea
              value={brand.forbidden_words.join(", ")}
              onChange={(event) => onBrand({ ...brand, forbidden_words: splitByComma(event.target.value) })}
            />
          </Field>
        </div>
      </section>
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <ProductForm onSaved={onProductSaved} />
        <section className="grid gap-3">
          <h2 className="text-[16px] font-bold">제품 DB</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onSaved={onProductSaved} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RightRail({
  output,
  seoCheck,
  qualityCheck,
  isChecking,
  onCheck,
}: {
  output: BlogDraftOutput | null;
  seoCheck: ReturnType<typeof getSeoCheck> | null;
  qualityCheck: DraftQualityCheck | null;
  isChecking: boolean;
  onCheck: () => void;
}) {
  return (
    <aside className="sticky top-[84px] hidden max-h-[calc(100vh-100px)] content-start gap-3 overflow-y-auto pb-6 [scrollbar-width:thin] xl:grid">
      <MobilePreview output={output} />
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[14px] font-bold">품질/SEO 체크</h2>
          <StatusPill tone={seoCheck?.warnings.length ? "warning" : "success"}>
            {seoCheck?.warnings.length ? "확인 필요" : "정상"}
          </StatusPill>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <RailStat icon={<Hash className="size-3.5" />} label="키워드 수" value={`${seoCheck?.keyword_count ?? 0}회`} />
          <RailStat icon={<BarChart3 className="size-3.5" />} label="본문 길이" value={`${seoCheck?.body_length ?? 0}자`} />
          <RailStat icon={<ShieldAlert className="size-3.5" />} label="광고 느낌" value={`${seoCheck?.ad_smell_score ?? 0}점`} />
          <RailStat icon={<ImageIcon className="size-3.5" />} label="이미지 수" value={`${output?.image_guide.length ?? 0}개`} />
          <RailStat icon={<Sparkles className="size-3.5" />} label="예제 패턴" value={`${seoCheck?.pattern_score ?? 0}점`} />
          <RailStat icon={<ShieldAlert className="size-3.5" />} label="후기 조작" value={`${seoCheck?.review_risk_score ?? 0}점`} />
          <RailStat icon={<FileText className="size-3.5" />} label="문단 호흡" value={`${seoCheck?.mobile_paragraph_score ?? 0}점`} />
        </div>
        {seoCheck?.warnings.length ? (
          <div className="mt-3 rounded-md bg-[#fff8df] p-2 text-[12px] leading-5 text-[#80642d]">
            {seoCheck.warnings.join(" ")}
          </div>
        ) : null}
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-[14px] font-bold">프롬프트 검수</h2>
          <Button
            type="button"
            variant="secondary"
            className="h-7 px-2 text-[12px]"
            icon={isChecking ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />}
            disabled={!output || isChecking}
            onClick={onCheck}
          >
            검수 실행
          </Button>
        </div>
        {qualityCheck ? (
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <RailStat icon={<ShieldAlert className="size-3.5" />} label="과장 표현" value={qualityCheck.exaggeration_found ? "확인" : "없음"} />
              <RailStat icon={<CheckCircle2 className="size-3.5" />} label="가독성" value={`${qualityCheck.mobile_readability_score}점`} />
            </div>
            {qualityCheck.warnings.length ? (
              <div className="grid gap-1">
                {qualityCheck.warnings.map((warning, index) => (
                  <p key={`${warning.message}-${index}`} className="rounded-md bg-[#fff8df] px-2 py-1.5 text-[12px] leading-5 text-[#80642d]">
                    {warning.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-[#edf8f0] px-2 py-1.5 text-[12px] leading-5 text-[#348658]">
                제품 2개, 과장 표현, 모바일 문단 기준을 통과했습니다.
              </p>
            )}
          </div>
        ) : (
          <p className="text-[12px] leading-5 text-[#81766b]">
            과장 표현, 없는 사실, 제품 수, 모바일 문단 길이를 생성 후 한 번 더 확인합니다.
          </p>
        )}
      </section>
      <section className="rounded-md border border-[#e5ddd2] bg-white p-3">
        <h2 className="mb-3 text-[14px] font-bold">선택된 제품</h2>
        <div className="grid gap-2">
          {(output?.selected_products ?? []).map((product) => (
            <div key={product.product_name} className="rounded-md border border-[#f0e8dd] p-2">
              <strong className="block text-[12px]">{product.product_name}</strong>
              <span className="text-[11px] text-[#7d7267]">{product.angle}</span>
            </div>
          ))}
          {!output ? <p className="text-[12px] text-[#81766b]">글을 생성하면 제품 2개가 표시됩니다.</p> : null}
        </div>
      </section>
      <details className="rounded-[14px] border border-[#deddd8] bg-white">
        <summary className="flex min-h-12 list-none items-center justify-between gap-3 px-3 text-[14px] font-bold">
          복사/내보내기
          <ChevronDown aria-hidden className="details-chevron size-4 text-[#6f6f6a]" />
        </summary>
        <div className="grid gap-2 border-t border-[#ecebe7] p-3">
          <CopyToNaverButton label="네이버 전체 본문" text={output?.plain_text_for_naver ?? ""} />
          <CopyToNaverButton label="네이버 제목" text={output?.selected_title ?? ""} />
          <CopyToNaverButton label="네이버 해시태그" text={output?.hashtags.join(" ") ?? ""} />
          <CopyToNaverButton label="네이버 FAQ" text={output?.faq.map((item) => `Q. ${item.q}\nA. ${item.a}`).join("\n\n") ?? ""} />
          <CopyToNaverButton label="네이버 이미지 가이드" text={output ? formatImageGuide(output) : ""} />
          <CopyToNaverButton label="WP Markdown" text={output?.wordpress.markdown_for_wordpress ?? ""} />
          <CopyToNaverButton label="WP 제목" text={output?.wordpress.selected_title ?? ""} />
          <CopyToNaverButton label="WP 메타 설명" text={output?.wordpress.meta_description ?? ""} />
          <CopyToNaverButton label="WP 태그" text={output?.wordpress.tags.join(", ") ?? ""} />
          <CopyToNaverButton label="WP 이미지 ALT" text={formatWordPressImageGuide(output?.wordpress)} />
        </div>
      </details>
      <details className="rounded-[14px] border border-[#deddd8] bg-white">
        <summary className="flex min-h-12 list-none items-center justify-between gap-3 px-3 text-[14px] font-bold">
          이미지 가이드
          <ChevronDown aria-hidden className="details-chevron size-4 text-[#6f6f6a]" />
        </summary>
        <div className="grid gap-2 border-t border-[#ecebe7] p-3">
          {(output?.image_guide ?? []).map((item, index) => (
            <div key={`${item.position}-${index}`} className="flex items-start justify-between gap-3 border-b border-[#f1e8dd] pb-2 text-[12px] last:border-b-0">
              <span>
                <strong className="block">{item.position}</strong>
                <span className="text-[#7d7267]">{item.image_type}</span>
              </span>
              <StatusPill tone="success">1 / 1</StatusPill>
            </div>
          ))}
          {!output ? <p className="text-[12px] text-[#81766b]">생성 후 이미지 배치 안내가 나옵니다.</p> : null}
        </div>
      </details>
    </aside>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e7e6e1] p-4 last:border-b-0 sm:border-b-0 sm:p-5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#f1f0ec] text-[#b4233f]">{icon}</div>
      <div>
        <div className="text-[22px] font-black tracking-[-0.03em] text-[#18181b]">{value}</div>
        <div className="text-[11px] font-medium text-[#6f6f6a]">{label}</div>
      </div>
    </div>
  );
}

function RailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#faf7f0] p-2">
      <div className="mb-1 flex items-center gap-1 text-[#8b8176]">
        {icon}
        {label}
      </div>
      <strong className="text-[#312b25]">{value}</strong>
    </div>
  );
}
