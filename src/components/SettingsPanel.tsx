import { useResumeStore } from "@/store/useResumeStore";
import {
  ACCENT_PRESETS,
  ZH_FONT_PRESETS,
  EN_FONT_PRESETS,
  DEFAULT_SETTINGS,
} from "@/utils/settings";
import { X, RotateCcw } from "lucide-react";
import { useMemo } from "react";

const UI_TEXT = {
  zh: {
    title: "样式设置",
    accent: "主题色",
    custom: "自定义",
    marginX: "左右页边距",
    marginY: "上下页边距",
    zhFont: "中文字体",
    enFont: "英文字体",
    fontSize: "正文字号",
    headingScale: "标题缩放",
    lineHeight: "行间距",
    paraSpacing: "段间距",
    sectionSpacing: "章节间距",
    contactLayout: "联系方式布局",
    contactStacked: "每项一行",
    contactInline: "横向一排",
    reset: "恢复默认",
    unit_mm: "mm",
    unit_px: "px",
    unit_em: "em",
    unit_x: "×",
  },
  en: {
    title: "Style Settings",
    accent: "Accent Color",
    custom: "Custom",
    marginX: "Horizontal Margin",
    marginY: "Vertical Margin",
    zhFont: "CJK Font",
    enFont: "Latin Font",
    fontSize: "Body Size",
    headingScale: "Heading Scale",
    lineHeight: "Line Height",
    paraSpacing: "Paragraph Gap",
    sectionSpacing: "Section Gap",
    contactLayout: "Contact Layout",
    contactStacked: "Each on own line",
    contactInline: "Inline with separators",
    reset: "Reset",
    unit_mm: "mm",
    unit_px: "px",
    unit_em: "em",
    unit_x: "×",
  },
};

export const SettingsPanel = () => {
  const { settings, setSettings, resetSettings, settingsOpen, setSettingsOpen, language } =
    useResumeStore();
  const t = UI_TEXT[language];

  const cssVars = useMemo(
    () => ({
      "--rm-margin-x": `${settings.marginX}mm`,
      "--rm-margin-y": `${settings.marginY}mm`,
      "--rm-accent": settings.accentColor,
      "--rm-heading-color": settings.headingColor,
      "--rm-text-color": settings.textColor,
      "--rm-font-zh": settings.zhFont,
      "--rm-font-en": settings.enFont,
      "--rm-font-size": `${settings.fontSize}px`,
      "--rm-heading-scale": settings.headingScale,
      "--rm-para-spacing": settings.paragraphSpacing,
      "--rm-line-height": settings.lineHeight,
      "--rm-section-spacing": settings.sectionSpacing,
    } as React.CSSProperties),
    [settings]
  );

  if (!settingsOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="settings-panel fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px] animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setSettingsOpen(false)}
        style={{
          animation: "settingsFadeIn 0.22s ease-out",
        }}
      />

      {/* Drawer */}
      <aside
        className="settings-panel fixed top-0 right-0 bottom-0 w-[340px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{
          animation: "settingsSlideIn 0.28s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-[#e2e8f0] flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0f172a] tracking-wide">
              {t.title}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={resetSettings}
              className="h-8 w-8 rounded-md flex items-center justify-center text-[#64748b] hover:text-[#2563eb] hover:bg-[#eff6ff] transition-colors"
              title={t.reset}
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setSettingsOpen(false)}
              className="h-8 w-8 rounded-md flex items-center justify-center text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Apply CSS vars onto a wrapper so preview updates in real time (injected to .resume-page via ResumePreview) */}
          <div style={cssVars} data-settings-vars />

          {/* Accent color */}
          <Section label={t.accent}>
            <div className="flex flex-wrap gap-2">
              {ACCENT_PRESETS.map((p) => {
                const active = settings.accentColor === p.color;
                return (
                  <button
                    key={p.color}
                    onClick={() =>
                      setSettings({ accentColor: p.color, headingColor: p.heading })
                    }
                    className={`relative w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                      active
                        ? "ring-2 ring-offset-2 ring-[#334155] scale-105"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                );
              })}
              <label
                className="w-8 h-8 rounded-full border-2 border-dashed border-[#cbd5e1] flex items-center justify-center cursor-pointer hover:border-[#3b82f6] transition-colors overflow-hidden relative"
                title={t.custom}
              >
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSettings({ accentColor: v, headingColor: v });
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <span className="text-[14px] text-[#94a3b8] font-bold">+</span>
              </label>
            </div>
          </Section>

          {/* Contact layout */}
          <Section label={t.contactLayout}>
            <div className="grid grid-cols-2 gap-2">
              <PillButton
                active={settings.contactLayout === "stacked"}
                onClick={() => setSettings({ contactLayout: "stacked" })}
              >
                {t.contactStacked}
              </PillButton>
              <PillButton
                active={settings.contactLayout === "inline"}
                onClick={() => setSettings({ contactLayout: "inline" })}
              >
                {t.contactInline}
              </PillButton>
            </div>
          </Section>

          {/* Margins */}
          <SliderRow
            label={t.marginX}
            value={settings.marginX}
            min={10}
            max={30}
            step={1}
            unit={t.unit_mm}
            onChange={(v) => setSettings({ marginX: v })}
          />
          <SliderRow
            label={t.marginY}
            value={settings.marginY}
            min={10}
            max={35}
            step={1}
            unit={t.unit_mm}
            onChange={(v) => setSettings({ marginY: v })}
          />

          {/* Font families */}
          <SelectRow
            label={t.zhFont}
            value={settings.zhFont}
            options={ZH_FONT_PRESETS.map((p) => ({ label: p.label, value: p.value }))}
            onChange={(v) => setSettings({ zhFont: v })}
          />
          <SelectRow
            label={t.enFont}
            value={settings.enFont}
            options={EN_FONT_PRESETS.map((p) => ({ label: p.label, value: p.value }))}
            onChange={(v) => setSettings({ enFont: v })}
          />

          {/* Typography */}
          <SliderRow
            label={t.fontSize}
            value={settings.fontSize}
            min={11}
            max={18}
            step={1}
            unit={t.unit_px}
            onChange={(v) => setSettings({ fontSize: v })}
          />
          <SliderRow
            label={t.headingScale}
            value={settings.headingScale}
            min={1.1}
            max={1.6}
            step={0.05}
            unit={t.unit_x}
            precision={2}
            onChange={(v) => setSettings({ headingScale: v })}
          />
          <SliderRow
            label={t.lineHeight}
            value={settings.lineHeight}
            min={1.3}
            max={2.2}
            step={0.05}
            unit={t.unit_em}
            precision={2}
            onChange={(v) => setSettings({ lineHeight: v })}
          />
          <SliderRow
            label={t.paraSpacing}
            value={settings.paragraphSpacing}
            min={0}
            max={1.2}
            step={0.1}
            unit={t.unit_em}
            precision={1}
            onChange={(v) => setSettings({ paragraphSpacing: v })}
          />
          <SliderRow
            label={t.sectionSpacing}
            value={settings.sectionSpacing}
            min={0.6}
            max={2.4}
            step={0.1}
            unit={t.unit_em}
            precision={1}
            onChange={(v) => setSettings({ sectionSpacing: v })}
          />
        </div>

        {/* Footer tip */}
        <div className="px-5 py-3 border-t border-[#e2e8f0] text-[11px] text-[#94a3b8] leading-relaxed bg-[#f8fafc] flex-shrink-0">
          {language === "zh"
            ? "所有更改实时生效并自动保存。打印 / 导出 PDF 时会沿用当前设置。"
            : "All changes apply in real time and are auto-saved. They also apply when printing / exporting PDF."}
        </div>
      </aside>

      <style>{`
        @keyframes settingsFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes settingsSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  );
};

/* ------------- Section ------------- */
const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2.5">
      {label}
    </div>
    {children}
  </div>
);

/* ------------- Slider ------------- */
const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  precision = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  precision?: number;
  onChange: (v: number) => void;
}) => {
  const display = precision === 0 ? value.toFixed(0) : value.toFixed(precision);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] text-[#334155]">{label}</span>
        <span className="text-[12px] text-[#2563eb] font-medium tabular-nums">
          {display}
          <span className="text-[#94a3b8] ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#2563eb]"
        style={{
          background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
            ((value - min) / (max - min)) * 100
          }%, #e2e8f0 ${((value - min) / (max - min)) * 100}%, #e2e8f0 100%)`,
        }}
      />
    </div>
  );
};

/* ------------- Select ------------- */
const SelectRow = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) => {
  return (
    <div>
      <div className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md border border-[#e2e8f0] bg-white text-[13px] text-[#334155] outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/15 transition cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/* ------------- Pill Button (Segmented control) ------------- */
const PillButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-2 rounded-md text-[12.5px] font-medium transition-all duration-150 cursor-pointer border ${
        active
          ? "bg-[#2563eb] text-white border-[#2563eb] shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
          : "bg-white text-[#475569] border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
      }`}
    >
      {children}
    </button>
  );
};

export default SettingsPanel;
