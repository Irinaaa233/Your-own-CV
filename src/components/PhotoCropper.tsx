import { useEffect, useRef, useState } from "react";
import { X, Check, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

interface PhotoCropperProps {
  open: boolean;
  imageUrl: string;
  /** target aspect ratio (width / height). For ID photo = 30mm / 42mm ≈ 0.714 */
  aspectRatio: number;
  language: "zh" | "en";
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

const UI_TEXT = {
  zh: {
    title: "选择照片展示位置",
    subtitle: "拖动框选您希望保留的区域，比例已锁定为证件照尺寸",
    cancel: "取消",
    confirm: "确认使用",
    rotate: "旋转90°",
    zoomIn: "放大",
    zoomOut: "缩小",
    reset: "重置",
  },
  en: {
    title: "Crop Your Photo",
    subtitle: "Drag to select the area to keep. Aspect ratio is locked for ID-photo size.",
    cancel: "Cancel",
    confirm: "Confirm",
    rotate: "Rotate 90°",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    reset: "Reset",
  },
};

type Rect = { x: number; y: number; w: number; h: number };

export default function PhotoCropper({
  open,
  imageUrl,
  aspectRatio,
  language,
  onConfirm,
  onCancel,
}: PhotoCropperProps) {
  const t = UI_TEXT[language];
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  const [imgScale, setImgScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  /** Selection in IMAGE natural pixel coordinate space */
  const [sel, setSel] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  /** Drag mode */
  const dragRef = useRef<
    | { mode: "move"; startX: number; startY: number; orig: Rect }
    | { mode: "nw" | "ne" | "sw" | "se"; startX: number; startY: number; orig: Rect; fixedPt: { x: number; y: number } }
    | null
  >(null);

  /* ---------- Reset state whenever a new image opens ---------- */
  useEffect(() => {
    if (!open) return;
    setRotation(0);
    setImgScale(1);
    setImgSize(null);
  }, [open, imageUrl]);

  /* ---------- When image loads, size stage and default selection ---------- */
  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const natW = rotation % 180 === 0 ? img.naturalWidth : img.naturalHeight;
    const natH = rotation % 180 === 0 ? img.naturalHeight : img.naturalWidth;
    setImgSize({ w: natW, h: natH });

    // Compute default selection = the largest centered rect matching aspect ratio
    const sw = Math.min(natW, natH * aspectRatio);
    const sh = sw / aspectRatio;
    const sx = (natW - sw) / 2;
    const sy = (natH - sh) / 2;
    setSel({ x: sx, y: sy, w: sw, h: sh });

    // compute stage size
    const stage = stageRef.current;
    if (stage) {
      const r = stage.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    }
  };

  /* ---------- Scale mapping between image pixels and stage pixels ---------- */
  const displayScale = (() => {
    if (!imgSize || stageSize.w === 0) return 1;
    const fitScale = Math.min(
      stageSize.w / imgSize.w,
      stageSize.h / imgSize.h
    );
    return fitScale * imgScale;
  })();

  const displayedImgSize = imgSize
    ? { w: imgSize.w * displayScale, h: imgSize.h * displayScale }
    : { w: 0, h: 0 };

  const displayedImgOffset = imgSize
    ? {
        x: (stageSize.w - displayedImgSize.w) / 2,
        y: (stageSize.h - displayedImgSize.h) / 2,
      }
    : { x: 0, y: 0 };

  /* ---------- Helpers ---------- */
  const selToDisplay = (s: Rect) => ({
    x: displayedImgOffset.x + s.x * displayScale,
    y: displayedImgOffset.y + s.y * displayScale,
    w: s.w * displayScale,
    h: s.h * displayScale,
  });

  const displayToImg = (px: number, py: number) => {
    const imgX = (px - displayedImgOffset.x) / displayScale;
    const imgY = (py - displayedImgOffset.y) / displayScale;
    return { imgX, imgY };
  };

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const clampSel = (s: Rect, natW: number, natH: number): Rect => {
    let { x, y, w, h } = s;
    w = clamp(w, 10, natW);
    h = w / aspectRatio;
    if (h > natH) {
      h = natH;
      w = h * aspectRatio;
    }
    x = clamp(x, 0, natW - w);
    y = clamp(y, 0, natH - h);
    return { x, y, w, h };
  };

  /* ---------- Mouse interactions ---------- */
  const getStagePoint = (e: React.MouseEvent) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startMove = (e: React.MouseEvent) => {
    if (!imgSize) return;
    e.preventDefault();
    const p = getStagePoint(e);
    dragRef.current = { mode: "move", startX: p.x, startY: p.y, orig: { ...sel } };
  };

  const startResize = (corner: "nw" | "ne" | "sw" | "se") => (e: React.MouseEvent) => {
    if (!imgSize) return;
    e.preventDefault();
    e.stopPropagation();
    const p = getStagePoint(e);
    const { imgX, imgY } = displayToImg(
      p.x,
      p.y
    );
    // fixedPt = the opposite corner
    const fixedPt = {
      x: corner.includes("w") ? sel.x + sel.w : sel.x,
      y: corner.includes("n") ? sel.y + sel.h : sel.y,
    };
    dragRef.current = {
      mode: corner,
      startX: p.x,
      startY: p.y,
      orig: { ...sel },
      fixedPt,
    };
  };

  useEffect(() => {
    if (!open) return;
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !imgSize) return;
      const stage = stageRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const p = { x: ev.clientX - r.left, y: ev.clientY - r.top };
      const d = dragRef.current;
      if (d.mode === "move") {
        const dx = (p.x - d.startX) / displayScale;
        const dy = (p.y - d.startY) / displayScale;
        setSel(
          clampSel(
            { ...d.orig, x: d.orig.x + dx, y: d.orig.y + dy },
            imgSize.w,
            imgSize.h
          )
        );
      } else {
        const { imgX, imgY } = displayToImg(p.x, p.y);
        const minX = Math.min(imgX, d.fixedPt.x);
        const maxX = Math.max(imgX, d.fixedPt.x);
        const minY = Math.min(imgY, d.fixedPt.y);
        const maxY = Math.max(imgY, d.fixedPt.y);
        const rawW = Math.max(2, maxX - minX);
        const rawH = Math.max(2, maxY - minY);
        // enforce aspect ratio: use the larger extent, derive the other
        let w = rawW;
        let h = w / aspectRatio;
        if (h > rawH) {
          h = rawH;
          w = h * aspectRatio;
        }
        // anchor to the fixed point corner
        const corner = d.mode;
        let nx = corner.includes("w") ? d.fixedPt.x - w : d.fixedPt.x;
        let ny = corner.includes("n") ? d.fixedPt.y - h : d.fixedPt.y;
        setSel(clampSel({ x: nx, y: ny, w, h }, imgSize.w, imgSize.h));
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open, sel, imgSize, aspectRatio, displayScale]);

  /* ---------- Canvas crop & output ---------- */
  const performCrop = (): string | null => {
    const img = imgRef.current;
    if (!img || !imgSize) return null;
    // Use a canvas sized to the TARGET selection (in natural-image pixels).
    // We must also account for rotation: rotate the context, write the source image,
    // then draw the selected region back onto a second canvas.
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const rot = ((rotation % 360) + 360) % 360;
    // Stage 1: rotate source onto a rotated-sized canvas
    const [rotW, rotH] =
      rot === 0 || rot === 180 ? [srcW, srcH] : [srcH, srcW];
    const c1 = document.createElement("canvas");
    c1.width = rotW;
    c1.height = rotH;
    const ctx1 = c1.getContext("2d");
    if (!ctx1) return null;
    ctx1.save();
    ctx1.translate(rotW / 2, rotH / 2);
    ctx1.rotate((rot * Math.PI) / 180);
    ctx1.drawImage(img, -srcW / 2, -srcH / 2);
    ctx1.restore();
    // Stage 2: cut selection (already in rotated coordinate space)
    const c2 = document.createElement("canvas");
    c2.width = Math.round(sel.w);
    c2.height = Math.round(sel.h);
    const ctx2 = c2.getContext("2d");
    if (!ctx2) return null;
    ctx2.drawImage(
      c1,
      Math.round(sel.x),
      Math.round(sel.y),
      Math.round(sel.w),
      Math.round(sel.h),
      0,
      0,
      c2.width,
      c2.height
    );
    try {
      return c2.toDataURL("image/jpeg", 0.92);
    } catch {
      return c2.toDataURL();
    }
  };

  if (!open) return null;

  const d = selToDisplay(sel);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fadein">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col max-w-[880px] w-[92vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div>
            <h3 className="m-0 text-[16px] font-semibold text-slate-800">
              {t.title}
            </h3>
            <p className="m-0 mt-1 text-[12.5px] text-slate-500">{t.subtitle}</p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center transition-colors"
            aria-label="close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stage */}
        <div className="flex-1 min-h-0 bg-[#0b1020] relative flex items-center justify-center p-4">
          <div
            ref={stageRef}
            className="relative w-full h-full flex items-center justify-center select-none"
            onMouseDown={startMove}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              minHeight: 380,
            }}
          >
            {open && (
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                draggable={false}
                onLoad={handleImgLoad}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  transform: `rotate(${rotation}deg) scale(${imgScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.18s ease",
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Dark overlay around selection */}
            {imgSize && (
              <>
                {/* Left */}
                <div
                  className="absolute bg-black/55 pointer-events-none"
                  style={{
                    left: 0,
                    top: 0,
                    width: d.x,
                    height: "100%",
                  }}
                />
                {/* Right */}
                <div
                  className="absolute bg-black/55 pointer-events-none"
                  style={{
                    left: d.x + d.w,
                    top: 0,
                    right: 0,
                    height: "100%",
                  }}
                />
                {/* Top */}
                <div
                  className="absolute bg-black/55 pointer-events-none"
                  style={{
                    left: d.x,
                    top: 0,
                    width: d.w,
                    height: d.y,
                  }}
                />
                {/* Bottom */}
                <div
                  className="absolute bg-black/55 pointer-events-none"
                  style={{
                    left: d.x,
                    top: d.y + d.h,
                    width: d.w,
                    bottom: 0,
                  }}
                />
                {/* Selection box */}
                <div
                  className="absolute border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] pointer-events-none"
                  style={{
                    left: d.x,
                    top: d.y,
                    width: d.w,
                    height: d.h,
                  }}
                >
                  {/* Rule of thirds gridlines */}
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/40" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/40" />
                  <div className="absolute top-1/3 left-0 right-0 border-t border-white/40" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-white/40" />
                  {/* Corner handles */}
                  {(["nw", "ne", "sw", "se"] as const).map((c) => {
                    const map: Record<string, React.CSSProperties> = {
                      nw: { left: -7, top: -7, cursor: "nwse-resize" },
                      ne: { right: -7, top: -7, cursor: "nesw-resize" },
                      sw: { left: -7, bottom: -7, cursor: "nesw-resize" },
                      se: { right: -7, bottom: -7, cursor: "nwse-resize" },
                    };
                    return (
                      <div
                        key={c}
                        className="absolute w-3.5 h-3.5 bg-white rounded-sm border border-slate-700/80 shadow-sm"
                        style={{ ...map[c], pointerEvents: "auto" }}
                        onMouseDown={startResize(c)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Toolbar + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5">
            <button
              className="h-8 px-3 rounded-md text-[12.5px] hover:bg-white hover:shadow-sm bg-white/60 text-slate-700 inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              title={t.rotate}
            >
              <RotateCw size={14} />
              {t.rotate}
            </button>
            <button
              className="h-8 w-8 rounded-md text-slate-700 bg-white/60 hover:bg-white hover:shadow-sm inline-flex items-center justify-center border border-slate-200 transition-colors"
              onClick={() => setImgScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
              title={t.zoomIn}
            >
              <ZoomIn size={14} />
            </button>
            <button
              className="h-8 w-8 rounded-md text-slate-700 bg-white/60 hover:bg-white hover:shadow-sm inline-flex items-center justify-center border border-slate-200 transition-colors"
              onClick={() => setImgScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
              title={t.zoomOut}
            >
              <ZoomOut size={14} />
            </button>
            <button
              className="h-8 px-3 rounded-md text-[12.5px] hover:bg-white hover:shadow-sm bg-white/60 text-slate-700 inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
              onClick={() => {
                setImgScale(1);
                setRotation(0);
                if (imgSize) {
                  const natW = imgSize.w;
                  const natH = imgSize.h;
                  const sw = Math.min(natW, natH * aspectRatio);
                  const sh = sw / aspectRatio;
                  setSel({
                    x: (natW - sw) / 2,
                    y: (natH - sh) / 2,
                    w: sw,
                    h: sh,
                  });
                }
              }}
              title={t.reset}
            >
              {t.reset}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-md text-[13px] text-slate-700 hover:bg-white bg-white/70 border border-slate-200 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={() => {
                const out = performCrop();
                if (out) onConfirm(out);
              }}
              className="h-9 px-5 rounded-md text-[13px] text-white inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] shadow-[0_2px_8px_rgba(37,99,235,0.3)] transition-colors"
            >
              <Check size={15} />
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
