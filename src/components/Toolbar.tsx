import { Printer, FileText, Languages, Settings } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { countWords } from "@/utils/markdown";
import { printResume } from "@/utils/print";
import { useMemo } from "react";

const UI_TEXT = {
  zh: {
    brand: "Markdown 简历编辑器",
    subtitle: "专注内容，告别排版",
    print: "导出 PDF / 打印",
    loadTemplate: "载入示例模板",
    settings: "样式设置",
    language: "English",
    saved: "已自动保存",
    chars: "字",
    lines: "行",
    justNow: "刚刚",
    minutesAgo: (n: number) => `${n} 分钟前`,
  },
  en: {
    brand: "Markdown Resume Editor",
    subtitle: "Content First. Format Locked.",
    print: "Export PDF / Print",
    loadTemplate: "Load Sample",
    settings: "Style Settings",
    language: "中文",
    saved: "Auto-saved",
    chars: "chars",
    lines: "lines",
    justNow: "just now",
    minutesAgo: (n: number) => `${n} min ago`,
  },
};

export const Toolbar = () => {
  const { content, language, setLanguage, loadTemplate, lastSavedAt, toggleSettings, resetToWelcome } =
    useResumeStore();

  const t = UI_TEXT[language];
  const { chars, lines } = useMemo(() => countWords(content), [content]);

  const timeLabel = useMemo(() => {
    if (!lastSavedAt) return "";
    const diff = Math.floor((Date.now() - lastSavedAt) / 60000);
    if (diff < 1) return t.justNow;
    return t.minutesAgo(Math.min(diff, 59));
  }, [lastSavedAt, t]);

  const handlePrint = () => {
    printResume();
  };

  const toggleLanguage = () => {
    setLanguage(language === "zh" ? "en" : "zh");
  };

  const handleLoadTemplate = () => {
    loadTemplate();
  };

  return (
    <header className="screen-only w-full h-16 bg-[#f8fafc] border-b border-[#e2e8f0] px-6 flex items-center justify-between flex-shrink-0 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-3 group cursor-pointer select-none bg-transparent border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]/40 rounded-lg"
          onClick={resetToWelcome}
          title={t.brand}
          aria-label={t.brand}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.28)] group-hover:shadow-[0_6px_16px_rgba(59,130,246,0.35)] transition-shadow">
            <FileText size={18} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold text-[#0f172a] tracking-wide group-hover:text-[#1d4ed8] transition-colors">
              {t.brand}
            </span>
            <span className="text-[11px] text-[#64748b]">{t.subtitle}</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-4 mr-2 text-[12px] text-[#64748b] pr-4 border-r border-[#e2e8f0] h-8">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
            {t.saved} · {timeLabel}
          </span>
          <span className="tabular-nums">
            {chars.toLocaleString()} {t.chars} · {lines} {t.lines}
          </span>
        </div>

        <ToolbarButton onClick={toggleSettings} icon={<Settings size={16} />} title={t.settings}>
          <span className="hidden sm:inline">{t.settings}</span>
        </ToolbarButton>

        <ToolbarButton onClick={toggleLanguage} icon={<Languages size={16} />}>
          {t.language}
        </ToolbarButton>

        <ToolbarButton
          onClick={handleLoadTemplate}
          icon={<FileText size={16} />}
          variant="ghost"
        >
          {t.loadTemplate}
        </ToolbarButton>

        <ToolbarButton
          onClick={handlePrint}
          icon={<Printer size={16} />}
          variant="primary"
        >
          {t.print}
        </ToolbarButton>
      </div>
    </header>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "primary" | "ghost";
  title?: string;
}

const ToolbarButton = ({
  onClick,
  icon,
  children,
  variant = "default",
  title,
}: ToolbarButtonProps) => {
  const base =
    "h-9 px-3.5 rounded-md text-[13px] font-medium flex items-center gap-2 transition-all duration-150 cursor-pointer select-none whitespace-nowrap";

  const styles: Record<string, string> = {
    default:
      "bg-white text-[#334155] border border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#cbd5e1] hover:text-[#0f172a] hover:-translate-y-[1px] hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]",
    ghost:
      "bg-transparent text-[#475569] border border-[#e2e8f0] hover:bg-[#eff6ff] hover:border-[#93c5fd] hover:text-[#1d4ed8] hover:-translate-y-[1px]",
    primary:
      "bg-gradient-to-b from-[#60a5fa] to-[#2563eb] text-white hover:from-[#7cb6ff] hover:to-[#1d4ed8] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(37,99,235,0.35)] border border-[#1d4ed8]",
  };

  return (
    <button onClick={onClick} title={title} className={`${base} ${styles[variant]}`}>
      {icon}
      <span>{children}</span>
    </button>
  );
};
