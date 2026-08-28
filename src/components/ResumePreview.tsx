import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useResumeStore, MAX_PHOTO_BYTES, ACCEPTED_PHOTO_TYPES } from "@/store/useResumeStore";
import { renderMarkdown } from "@/utils/markdown";
import { X, AlertCircle, ImagePlus } from "lucide-react";
import PhotoCropper from "@/components/PhotoCropper";

/** Target photo-frame aspect ratio = 30mm (w) / 42mm (h). */
const PHOTO_ASPECT = 30 / 42;
/** If the user-uploaded image differs from PHOTO_ASPECT by more than this ratio, show cropper. */
const ASPECT_TOLERANCE = 0.08;

const UI_TEXT = {
  zh: {
    title: "简历预览 · A4",
    subtitle: "所见即所得",
    photoHint: "点击上传照片",
    photoHint2: "≤ 3MB · JPG/PNG/WebP",
    removePhoto: "移除照片",
    sizeError: "图片超过 3MB",
    typeError: "不支持的图片格式",
    uploadPhoto: "上传照片",
    changePhoto: "更换照片",
  },
  en: {
    title: "Resume Preview · A4",
    subtitle: "What you see is what you get",
    photoHint: "Click to upload photo",
    photoHint2: "≤ 3MB · JPG/PNG/WebP",
    removePhoto: "Remove photo",
    sizeError: "Photo must be under 3MB",
    typeError: "Unsupported image type",
    uploadPhoto: "Upload Photo",
    changePhoto: "Change Photo",
  },
};

const STYLE_NONCE = "resume-custom-style";

const hexToRgbStr = (hex: string): string => {
  const m = hex.replace("#", "").trim();
  const full =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m.length === 8
        ? m.slice(0, 6)
        : m;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return "37, 99, 235";
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `${r}, ${g}, ${b}`;
};

const darken = (hex: string, amount: number): string => {
  const m = hex.replace("#", "").trim();
  const full =
    m.length === 3
      ? m.split("").map((c) => c + c).join("")
      : m.length === 8
        ? m.slice(0, 6)
        : m;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.round(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 - amount))));
  return (
    "#" +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
};

export const ResumePreview = () => {
  const {
    content,
    customCSS,
    language,
    settings,
    photoDataUrl,
    photoError,
    setPhotoDataUrl,
    clearPhotoError,
  } = useResumeStore();
  const t = UI_TEXT[language];
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoHover, setPhotoHover] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  const handleFilesChosen = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    clearPhotoError();
    const MSGS = {
      zh: {
        size: `图片大小不能超过 3MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
        type: "仅支持 JPG / PNG / WebP / GIF / BMP 格式的图片",
      },
      en: {
        size: `Photo must be under 3 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        type: "Only JPG / PNG / WebP / GIF / BMP images are supported",
      },
    };
    const m = MSGS[language];
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      useResumeStore.setState({ photoError: { type: "type", message: m.type } });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      useResumeStore.setState({ photoError: { type: "size", message: m.size } });
      return;
    }
    // Read to dataURL
    const reader = new FileReader();
    await new Promise<void>((res, rej) => {
      reader.onload = () => res();
      reader.onerror = () => rej(reader.error);
      reader.readAsDataURL(file);
    });
    const url = reader.result as string;
    // Measure natural dimensions
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.onerror = () => res();
      img.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) {
      setPhotoDataUrl(url);
      return;
    }
    const aspect = w / h;
    const ratio = Math.max(aspect, PHOTO_ASPECT) / Math.min(aspect, PHOTO_ASPECT);
    // Decide: open cropper only when (1) aspect differs beyond tolerance OR
    // (2) image is so large that it can be safely cropped to a reasonable selection.
    // We skip the cropper only if the aspect ratio is very close AND image roughly fits frame pixel density.
    const needsCrop = ratio > 1 + ASPECT_TOLERANCE;
    if (needsCrop) {
      setCropImageUrl(url);
      setCropOpen(true);
    } else {
      setPhotoDataUrl(url);
    }
  };

  const [html, setHtml] = useState<string>("");
  const [transitionKey, setTransitionKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const task = async () => {
      const result = await renderMarkdown(content);
      if (!cancelled) {
        setHtml(result);
        setTransitionKey((k) => (k + 1) % 100000);
      }
    };
    task();
    return () => {
      cancelled = true;
    };
  }, [content]);

  useEffect(() => {
    setTransitionKey((k) => (k + 1) % 100000);
  }, [customCSS, settings]);

  const containerClass = useMemo(() => {
    return "fade-transition";
  }, [transitionKey]);

  const accentSoft = useMemo(() => {
    const rgb = hexToRgbStr(settings.accentColor);
    return `rgba(${rgb}, 0.1)`;
  }, [settings.accentColor]);

  const accentMixed30 = useMemo(() => {
    const rgb = hexToRgbStr(settings.accentColor);
    return `rgba(${rgb}, 0.3)`;
  }, [settings.accentColor]);

  const accentMixed55 = useMemo(() => {
    const rgb = hexToRgbStr(settings.accentColor);
    return `rgba(${rgb}, 0.55)`;
  }, [settings.accentColor]);

  const headingDark = useMemo(
    () => darken(settings.headingColor, 0.1),
    [settings.headingColor]
  );

  const contactLayoutCSS = useMemo(() => {
    if (settings.contactLayout === "inline") {
      return `
/* ===== Contact Info: INLINE (horizontal with pipe separators) ===== */
/* Align the name (h1) and the entire contact row to center */
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] > h1:first-child,
.resume-page.contact-inline #resume-preview h1:first-of-type {
  text-align: center !important;
  margin-bottom: 10px !important;
}
/* Wrap row: make the header items sit side by side */
.resume-page.contact-inline #resume-preview .resume-header-item {
  display: inline !important;
  line-height: 1.55 !important;
  white-space: nowrap !important;
  text-align: center !important;
}
/* Place contact-info items in a centered "virtual row" */
.resume-page.contact-inline #resume-preview
  [data-scope="vue-smart-pages"]
  > .resume-header-item:first-of-type {
  display: inline-block !important;
}
.resume-page.contact-inline #resume-preview
  [data-scope="vue-smart-pages"]
  > .resume-header-item:first-of-type::before {
  content: "" !important;
  display: block !important;
  width: 100% !important;
  text-align: center !important;
}
/* Force inline with center alignment using text-align on a pseudo wrapping */
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] > h1:first-child + .resume-header-item,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] > h1:first-child + * + .resume-header-item,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] > h1:first-child + *,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] > *:nth-child(2) {
  display: inline !important;
  /* Trigger a centered block context */
}
/* Centering approach: wrap the contact items area through a CSS hack using the page alignment
   Since there is no wrapper div, center h1 AND set an inline-block context via text-align */
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"][data-part="page"] {
  text-align: center !important;
}
/* Reset alignment for everything after the contact items (after first <hr>) */
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] hr ~ *,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] h2,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] h3,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] p,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] ul,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] ol,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] .row,
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] hr {
  text-align: justify !important;
}
.resume-page.contact-inline #resume-preview [data-scope="vue-smart-pages"] .row .right {
  text-align: right !important;
}
.resume-page.contact-inline #resume-preview .resume-header-item:not(.no-separator)::after {
  content: " ｜ " !important;
  color: ${settings.accentColor} !important;
  margin: 0 4px 0 6px !important;
  font-weight: 300 !important;
  opacity: 0.9 !important;
}
.resume-page.contact-inline #resume-preview .resume-header-item.no-separator::after {
  content: none !important;
}
@media (max-width: 180mm) {
  .resume-page.contact-inline #resume-preview .resume-header-item {
    white-space: normal !important;
  }
}
`;
    }
    return `
/* ===== Contact Info: STACKED (each item on its own line — keep default template behavior) ===== */
.resume-page.contact-stacked #resume-preview .resume-header-item {
  display: block !important;
  line-height: 1.7 !important;
}
.resume-page.contact-stacked #resume-preview [data-scope="vue-smart-pages"][data-part="page"] {
  text-align: justify !important;
}
`;
  }, [settings.contactLayout, settings.accentColor]);

  const overrideCSS = useMemo(() => {
    return `
${contactLayoutCSS}
/* ===== Settings-driven color override (applied AFTER custom CSS) ===== */
:root,
html body .resume-page,
.resume-page #resume-preview,
.resume-page #resume-preview * {
  --accent: ${settings.accentColor} !important;
  --accent-soft: ${accentSoft} !important;
  --accent-soft-30: ${accentMixed30} !important;
  --accent-mix-55: ${accentMixed55} !important;
  --heading: ${settings.headingColor} !important;
  --heading-dark: ${headingDark} !important;
  --text: ${settings.textColor} !important;
}
/* Patch default-template selectors — higher specificity + !important to win over user custom CSS */
.resume-page #resume-preview h2 {
  border-bottom-color: ${settings.accentColor} !important;
  color: ${settings.headingColor} !important;
}
.resume-page #resume-preview .resume-header {
  border-bottom-color: ${settings.accentColor} !important;
}
.resume-page #resume-preview .resume-header h1 {
  color: ${settings.headingColor} !important;
}
.resume-page #resume-preview h1 {
  color: ${settings.headingColor} !important;
}
.resume-page #resume-preview h3 {
  color: ${settings.headingColor} !important;
}
.resume-page #resume-preview .resume-header-item:not(.no-separator)::after {
  color: ${settings.accentColor} !important;
}
.resume-page #resume-preview ul li::marker,
.resume-page #resume-preview ol li::marker {
  color: ${settings.accentColor} !important;
}
.resume-page #resume-preview .row .right {
  color: ${settings.accentColor} !important;
}
.resume-page #resume-preview .row .left {
  color: ${settings.headingColor} !important;
}
.resume-page #resume-preview hr {
  border-top-color: ${accentMixed30} !important;
}
.resume-page #resume-preview code {
  background: ${accentSoft} !important;
  color: ${settings.accentColor} !important;
}
.resume-page #resume-preview blockquote {
  border-left-color: ${settings.accentColor} !important;
  background: ${accentSoft} !important;
}
.resume-page #resume-preview a {
  color: ${settings.accentColor} !important;
  border-bottom-color: ${accentMixed55} !important;
}
.resume-page #resume-preview strong,
.resume-page #resume-preview b {
  color: ${headingDark} !important;
}
`;
  }, [
    settings.accentColor,
    settings.headingColor,
    settings.textColor,
    accentSoft,
    accentMixed30,
    accentMixed55,
    headingDark,
    contactLayoutCSS,
  ]);

  const pageStyle = useMemo<React.CSSProperties>(
    () => ({
      ["--rm-margin-x" as string]: `${settings.marginX}mm`,
      ["--rm-margin-y" as string]: `${settings.marginY}mm`,
      ["--rm-accent" as string]: settings.accentColor,
      ["--rm-heading-color" as string]: settings.headingColor,
      ["--rm-text-color" as string]: settings.textColor,
      ["--rm-font-zh" as string]: settings.zhFont,
      ["--rm-font-en" as string]: settings.enFont,
      ["--rm-font-size" as string]: `${settings.fontSize}px`,
      ["--rm-heading-scale" as string]: settings.headingScale,
      ["--rm-para-spacing" as string]: settings.paragraphSpacing,
      ["--rm-line-height" as string]: settings.lineHeight,
      ["--rm-section-spacing" as string]: settings.sectionSpacing,
    }),
    [settings]
  );

  const contactLayoutClass =
    settings.contactLayout === "inline"
      ? "contact-inline"
      : "contact-stacked";

  // ============= Multi-page pagination =============
  const measurerRef = useRef<HTMLDivElement>(null);
  const [pageHTMLs, setPageHTMLs] = useState<string[]>([]);

  // Convert mm to px at 96 DPI (1mm = 96/25.4 ≈ 3.7795px)
  const MM_TO_PX = 96 / 25.4;
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  const contentWidthPx = useMemo(() => {
    return (A4_WIDTH_MM - 2 * settings.marginX) * MM_TO_PX;
  }, [settings.marginX]);

  const availableHeightPx = useMemo(() => {
    return (A4_HEIGHT_MM - 2 * settings.marginY) * MM_TO_PX;
  }, [settings.marginY]);

  const measurerStyle = useMemo<React.CSSProperties>(() => ({
    position: "absolute",
    visibility: "hidden",
    top: "-99999px",
    left: 0,
    width: `${contentWidthPx}px`,
    height: "auto",
    boxSizing: "border-box",
    padding: 0,
    margin: 0,
    border: 0,
    fontFamily: `var(--rm-font-zh, "PingFang SC"), var(--rm-font-en, "Helvetica Neue"), Helvetica, Arial, sans-serif`,
    fontSize: `${settings.fontSize}px`,
    lineHeight: String(settings.lineHeight),
    color: settings.textColor,
    pointerEvents: "none",
    overflow: "visible",
    whiteSpace: "normal",
  }), [contentWidthPx, settings.fontSize, settings.lineHeight, settings.textColor]);

  useLayoutEffect(() => {
    const measurer = measurerRef.current;
    if (!measurer) {
      setPageHTMLs([html]);
      return;
    }
    // Wrap content in a .resume-preview div so CSS selectors match exactly like real render
    // Also strip height:100% from the vue-smart-pages wrapper to avoid issues in measurer
    const cleanedHtml = html.replace(/style="width:100%;height:100%;"/g, 'style="width:100%;height:auto;"');
    measurer.innerHTML = `<div class="resume-preview" style="width:100%;height:auto;">${cleanedHtml}</div>`;
    // Apply CSS variables to measurer so they inherit like on real pages
    const cssVars = {
      "--rm-font-zh": settings.zhFont,
      "--rm-font-en": settings.enFont,
      "--rm-font-size": `${settings.fontSize}px`,
      "--rm-heading-scale": String(settings.headingScale),
      "--rm-line-height": String(settings.lineHeight),
      "--rm-margin-x": `${settings.marginX}mm`,
      "--rm-margin-y": `${settings.marginY}mm`,
      "--rm-accent": settings.accentColor,
      "--rm-heading-color": settings.headingColor,
      "--rm-text-color": settings.textColor,
    };
    for (const [k, v] of Object.entries(cssVars)) {
      measurer.style.setProperty(k, v);
    }
    void measurer.offsetHeight;

    // Unwrap: drill into .resume-preview > [data-scope] wrapper to get actual content blocks
    let blocksParent: HTMLElement = measurer;
    // First level: .resume-preview that we just added
    if (blocksParent.children.length === 1 && blocksParent.children[0].classList.contains("resume-preview")) {
      blocksParent = blocksParent.children[0] as HTMLElement;
    }
    // Second level: vue-smart-pages wrapper from renderMarkdown
    if (blocksParent.children.length === 1) {
      const child = blocksParent.children[0] as HTMLElement;
      if (child.dataset?.scope === "vue-smart-pages" && child.dataset?.part === "page") {
        blocksParent = child;
      }
    }

    const children = Array.from(blocksParent.children) as HTMLElement[];
    if (children.length === 0) {
      setPageHTMLs([html]);
      return;
    }

    // Safety margin: leave 12px at bottom to avoid overflow from sub-pixel rounding
    const SAFETY_MARGIN = 12;
    const pageCapacity = availableHeightPx - SAFETY_MARGIN;
    const ORPHAN_HEADING_THRESHOLD = 100; // Heading needs at least 100px for following content

    // Phase 1: measure all blocks' position relative to blocksParent top (ONE pass)
    const parentRect = blocksParent.getBoundingClientRect();
    type Block = {
      el: HTMLElement;
      top: number;
      bottom: number;
      tag: string;
      cls: string;
      height: number;
    };
    const blocks: Block[] = children.map((el) => {
      const r = el.getBoundingClientRect();
      const cls = typeof el.className === "string" ? el.className : "";
      return {
        el,
        top: r.top - parentRect.top,
        bottom: r.bottom - parentRect.top,
        tag: el.tagName.toLowerCase(),
        cls,
        height: r.height,
      };
    });

    const hasClass = (b: Block, name: string) =>
      b.cls.split(/\s+/).includes(name);
    const isSectionHeading = (b: Block) => b.tag === "h2";
    const isHeading = (b: Block) => b.tag === "h1" || b.tag === "h2" || b.tag === "h3";
    const isList = (b: Block) => b.tag === "ul" || b.tag === "ol";
    const isRow = (b: Block) => b.tag === "div" && hasClass(b, "row");
    const isHr = (b: Block) => b.tag === "hr";

    // Phase 2: greedy pagination with widow/orphan protection
    const pages: string[] = [];
    let i = 0;

    while (i < blocks.length) {
      const pageStart = blocks[i].top;
      // Find the last block that physically fits on this page
      let j = i;
      while (j < blocks.length && blocks[j].bottom - pageStart <= pageCapacity) {
        j++;
      }
      let lastIdx = Math.max(i, j - 1);

      // ---- Widow/Orphan protection (iterate until stable) ----
      let adjusted = true;
      while (adjusted) {
        adjusted = false;

        // Rule 1: Don't end page on a section heading (h2) — push it to next page
        // unless it's the first element on the page
        if (lastIdx > i && isSectionHeading(blocks[lastIdx])) {
          lastIdx--;
          adjusted = true;
          continue;
        }

        // Rule 2: Don't end page right after a .row (job/school title) if the next block is a list
        // (job title should stay with its bullet points)
        if (lastIdx > i && isRow(blocks[lastIdx]) && lastIdx + 1 < blocks.length && isList(blocks[lastIdx + 1])) {
          // Check if the list would fit; if not, push the row to next page too
          const listFits = blocks[lastIdx + 1].bottom - pageStart <= pageCapacity;
          if (!listFits) {
            lastIdx--;
            adjusted = true;
            continue;
          }
        }

        // Rule 3: Don't leave an h2/h3 with less than ORPHAN_HEADING_THRESHOLD space after it
        if (lastIdx > i && isHeading(blocks[lastIdx]) && lastIdx < blocks.length - 1) {
          const spaceAfter = pageCapacity - (blocks[lastIdx].bottom - pageStart);
          if (spaceAfter < ORPHAN_HEADING_THRESHOLD) {
            lastIdx--;
            adjusted = true;
            continue;
          }
        }

        // Rule 4: Don't end page on a bare HR separator — push it to next page
        if (lastIdx > i && isHr(blocks[lastIdx])) {
          lastIdx--;
          adjusted = true;
          continue;
        }

        // Rule 5: Ensure at least one block per page (infinite loop guard)
        if (lastIdx < i) {
          lastIdx = i;
          adjusted = false;
        }
      }

      // Collect HTML for this page
      const parts: string[] = [];
      for (let k = i; k <= lastIdx; k++) {
        parts.push(blocks[k].el.outerHTML);
      }
      if (parts.length > 0) {
        pages.push(parts.join("\n"));
      }
      i = lastIdx + 1;
    }

    if (pages.length === 0) {
      pages.push(html);
    }
    setPageHTMLs(pages);
  }, [html, settings.fontSize, settings.lineHeight, settings.marginY, settings.marginX, settings.textColor,
      customCSS, overrideCSS, settings.contactLayout, contentWidthPx, availableHeightPx, transitionKey]);

  useLayoutEffect(() => {
    if (settings.contactLayout !== "stacked" || !photoDataUrl) return;
    const firstPage = document.querySelector<HTMLElement>(".a4-wrapper .resume-page");
    if (!firstPage) return;
    const photoFrame = firstPage.querySelector<HTMLElement>(".photo-frame");
    if (!photoFrame) return;
    const preview = firstPage.querySelector<HTMLElement>(".resume-preview");
    if (!preview) return;

    const pageRect = firstPage.getBoundingClientRect();
    const photoHeight = photoFrame.offsetHeight;

    const headerItems = preview.querySelectorAll<HTMLElement>(".resume-header-item");
    let contactBottom = 0;
    if (headerItems.length > 0) {
      const last = headerItems[headerItems.length - 1];
      contactBottom = last.getBoundingClientRect().bottom - pageRect.top;
    }

    if (contactBottom > 0) {
      photoFrame.style.top = `${Math.max(0, contactBottom - photoHeight)}px`;
    }

    return () => {
      photoFrame.style.top = "";
    };
  }, [photoDataUrl, settings.contactLayout, settings.fontSize, settings.marginY, settings.marginX, pageHTMLs, overrideCSS]);

  // Fallback: if pagination hasn't run yet, show single page
  const pagesToRender = pageHTMLs.length > 0 ? pageHTMLs : [html];

  return (
    <section className="flex flex-col h-full min-h-0">
      <div className="resume-preview-header h-10 flex items-center justify-between px-4 border-b border-[#e2e8f0] bg-[#ffffffcc] backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm transition-colors"
            style={{ backgroundColor: settings.accentColor }}
          />
          <span className="text-[12px] font-semibold text-[#0f172a] tracking-wide">
            {t.title}
            {pagesToRender.length > 1 && (
              <span className="ml-2 text-[10px] font-normal text-[#64748b]">
                · {pagesToRender.length} {language === "zh" ? "页" : "pages"}
              </span>
            )}
          </span>
        </div>
        <span className="text-[11px] text-[#64748b] italic">{t.subtitle}</span>
      </div>

      {/* Hidden measurer for pagination */}
      <div ref={measurerRef} style={measurerStyle} aria-hidden="true" />

      <div className="a4-wrapper">
        {/* Hidden file input — shared, triggered by any page's photo frame */}
        {settings.contactLayout === "stacked" && (
          <input
            ref={photoInputRef}
            type="file"
            accept={ACCEPTED_PHOTO_TYPES.join(",")}
            style={{ display: "none" }}
            onChange={(e) => {
              void handleFilesChosen(e.target.files);
              e.target.value = "";
            }}
          />
        )}

        {pagesToRender.map((pageHTML, pageIdx) => (
          <div
            key={pageIdx}
            className={`resume-page ${contactLayoutClass}`}
            style={pageStyle}
          >
            <style
              data-nonce={STYLE_NONCE}
              dangerouslySetInnerHTML={{ __html: customCSS }}
            />
            <style
              data-nonce="resume-settings-override"
              dangerouslySetInnerHTML={{ __html: overrideCSS }}
            />

            {/* Photo box: only on the FIRST page, stacked layout only */}
            {pageIdx === 0 && settings.contactLayout === "stacked" && (
              <>
                <div
                  className={`photo-frame screen-only ${photoDataUrl ? "has-photo" : ""}`}
                  onMouseEnter={() => setPhotoHover(true)}
                  onMouseLeave={() => setPhotoHover(false)}
                  onClick={() => photoInputRef.current?.click()}
                  role="button"
                  aria-label={photoDataUrl ? t.changePhoto : t.uploadPhoto}
                  title={photoDataUrl ? t.changePhoto : t.uploadPhoto}
                >
                  {photoDataUrl ? (
                    <>
                      <img
                        src={photoDataUrl}
                        alt=""
                        className="photo-image"
                        draggable={false}
                      />
                      {photoHover && (
                        <div className="photo-overlay screen-only">
                          <ImagePlus size={18} />
                          <span>{t.changePhoto}</span>
                          <button
                            className="photo-remove-btn screen-only"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setPhotoDataUrl(null);
                            }}
                            title={t.removePhoto}
                            aria-label={t.removePhoto}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="photo-placeholder">
                      <ImagePlus size={22} className="photo-placeholder-icon" />
                      <span className="photo-placeholder-text">{t.photoHint}</span>
                      <span className="photo-placeholder-sub">{t.photoHint2}</span>
                    </div>
                  )}
                </div>
                {photoError && (
                  <div
                    className="photo-error screen-only"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      clearPhotoError();
                    }}
                    title="Close"
                    role="button"
                  >
                    <AlertCircle size={14} />
                    <span>{photoError.message}</span>
                    <X size={12} />
                  </div>
                )}
              </>
            )}

            <div
              id={pageIdx === 0 ? "resume-preview" : undefined}
              className={`resume-preview ${containerClass}`}
              key={`${transitionKey}-${pageIdx}`}
              dangerouslySetInnerHTML={{ __html: pageHTML }}
            />
          </div>
        ))}
      </div>

      {/* Photo Cropper Modal — outside .resume-page */}
      {cropImageUrl && (
        <PhotoCropper
          open={cropOpen}
          imageUrl={cropImageUrl}
          aspectRatio={PHOTO_ASPECT}
          language={language}
          onConfirm={(croppedUrl) => {
            setPhotoDataUrl(croppedUrl);
            setCropOpen(false);
          }}
          onCancel={() => {
            setCropOpen(false);
            setTimeout(() => setCropImageUrl(null), 300);
          }}
        />
      )}
    </section>
  );
};
