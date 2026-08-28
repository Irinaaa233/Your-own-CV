import { FileText, Globe, ArrowRight } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { RESUME_TEMPLATE_ZH, RESUME_TEMPLATE_EN } from "@/utils/templates";

export default function Welcome() {
  const { selectTemplate } = useResumeStore();

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#f5f6fa] to-[#eef2f7] animate-appRise">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#3b82f6]/8 to-transparent blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#C9A962]/8 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-3xl px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-[0_8px_30px_rgba(59,130,246,0.3)] mb-6">
          <FileText size={32} className="text-white" strokeWidth={2.2} />
        </div>

        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-[#0f172a] text-center tracking-tight mb-3">
          Markdown 简历编辑器
        </h1>
        <p className="text-[clamp(0.95rem,2vw,1.1rem)] text-[#64748b] text-center mb-2">
          专注内容创作，告别排版烦恼
        </p>
        <p className="text-sm text-[#94a3b8] text-center mb-12 flex items-center gap-2">
          <Globe size={14} />
          Choose your template language / 选择模板语言
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <TemplateCard
            title="中文模板"
            subtitle="Chinese Template"
            preview={RESUME_TEMPLATE_ZH}
            ctaText="开始使用 →"
            onClick={() => selectTemplate("zh")}
            badgeText="推荐"
            badgeColor="from-[#3b82f6] to-[#1d4ed8]"
          />
          <TemplateCard
            title="English Template"
            subtitle="英文模板"
            preview={RESUME_TEMPLATE_EN}
            ctaText="Get Started →"
            onClick={() => selectTemplate("en")}
          />
        </div>

        <p className="mt-10 text-xs text-[#94a3b8] text-center">
          选择后可随时在工具栏切换界面语言 · You can switch UI language anytime in the toolbar
        </p>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  title: string;
  subtitle: string;
  preview: string;
  ctaText: string;
  onClick: () => void;
  badgeText?: string;
  badgeColor?: string;
}

function TemplateCard({ title, subtitle, preview, ctaText, onClick, badgeText, badgeColor }: TemplateCardProps) {
  const previewText = preview
    .replace(/<[^>]*>/g, "")
    .replace(/[#*\-—]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 140) + "...";

  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-2xl border border-[#e2e8f0] p-6 text-left transition-all duration-300 hover:border-[#3b82f6]/40 hover:shadow-[0_12px_40px_rgba(59,130,246,0.12)] hover:-translate-y-1 cursor-pointer overflow-hidden w-full"
    >
      {badgeText && (
        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${badgeColor} shadow-md`}>
          {badgeText}
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[#0f172a] group-hover:text-[#1d4ed8] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-[#94a3b8] mt-0.5">{subtitle}</p>
      </div>

      <div className="bg-[#f8fafc] rounded-lg p-4 mb-4 border border-[#f1f5f9] h-32 overflow-hidden relative">
        <p
          className="text-[11px] text-[#64748b] leading-relaxed"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {previewText}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#f8fafc] to-transparent" />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#3b82f6] group-hover:text-[#1d4ed8]">
          {ctaText}
        </span>
        <ArrowRight
          size={18}
          className="text-[#3b82f6] group-hover:text-[#1d4ed8] transition-transform duration-300 group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}
