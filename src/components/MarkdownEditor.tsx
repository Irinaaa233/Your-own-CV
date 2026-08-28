import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { countWords } from "@/utils/markdown";
import { FileCode2, FileText } from "lucide-react";

type EditorTab = "markdown" | "css";

const UI_TEXT = {
  zh: {
    md: {
      title: "Markdown 内容",
      placeholder:
        "# 在这里用 Markdown 写你的简历...\n\n## 工作经历\n- 项目经历列表\n- 数据化成果",
      syntax:
        "支持：标题、列表、**加粗**、*斜体*、`代码`、[链接](url)、--- 分隔线",
    },
    css: {
      title: "自定义样式 (CSS)",
      placeholder:
        "/* 在这里编辑简历样式 */\n#resume-preview h2 {\n  color: #2563eb;\n}",
      syntax: "作用域限制在 #resume-preview，可使用 CSS 变量 --accent 一键换色",
    },
    chars: "字",
    lines: "行",
    indent: "缩进",
  },
  en: {
    md: {
      title: "Markdown Content",
      placeholder:
        "# Write your resume in Markdown here...\n\n## Experience\n- Bullet points\n- Quantified impact",
      syntax:
        "Supports: Headings, Lists, **Bold**, *Italic*, `Code`, [Links](url), --- Dividers",
    },
    css: {
      title: "Custom Style (CSS)",
      placeholder:
        "/* Edit resume styles here */\n#resume-preview h2 {\n  color: #2563eb;\n}",
      syntax:
        "Scoped to #resume-preview. Use CSS var --accent for one-click recoloring",
    },
    chars: "chars",
    lines: "lines",
    indent: "indent",
  },
};

export const MarkdownEditor = () => {
  const {
    content,
    customCSS,
    setContent,
    setCustomCSS,
    language,
  } = useResumeStore();
  const t = UI_TEXT[language];

  const [tab, setTab] = useState<EditorTab>("markdown");

  const mdTextareaRef = useRef<HTMLTextAreaElement>(null);
  const cssTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mdLineNumbersRef = useRef<HTMLDivElement>(null);
  const cssLineNumbersRef = useRef<HTMLDivElement>(null);

  const activeText = tab === "markdown" ? content : customCSS;
  const activeSetter = tab === "markdown" ? setContent : setCustomCSS;
  const activeTextareaRef =
    tab === "markdown" ? mdTextareaRef : cssTextareaRef;
  const activeLineNumbersRef =
    tab === "markdown" ? mdLineNumbersRef : cssLineNumbersRef;

  const lines = useMemo(() => activeText.split(/\r?\n/), [activeText]);
  const lineNumbers = useMemo(
    () =>
      Array.from({ length: lines.length }, (_, i) => i + 1).map((n) =>
        n.toString()
      ),
    [lines.length]
  );

  const { chars } = useMemo(() => countWords(activeText), [activeText]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      activeSetter(e.target.value);
    },
    [activeSetter]
  );

  const handleScroll = useCallback(() => {
    if (activeTextareaRef.current && activeLineNumbersRef.current) {
      activeLineNumbersRef.current.scrollTop =
        activeTextareaRef.current.scrollTop;
    }
  }, [activeTextareaRef, activeLineNumbersRef]);

  const handleTabKey = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = activeTextareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue =
          activeText.substring(0, start) + "  " + activeText.substring(end);
        activeSetter(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [activeText, activeSetter, activeTextareaRef]
  );

  useEffect(() => {
    const ta = mdTextareaRef.current;
    if (ta && ta.value !== content) ta.value = content;
  }, [content]);

  useEffect(() => {
    const ta = cssTextareaRef.current;
    if (ta && ta.value !== customCSS) ta.value = customCSS;
  }, [customCSS]);

  const copy = tab === "markdown" ? t.md : t.css;

  return (
    <section className="flex flex-col h-full min-h-0 bg-[#f7f8fb]">
      {/* Tab bar */}
      <div className="h-12 flex items-end px-3 border-b border-[#e2e8f0] bg-[#f8fafc] gap-1 flex-shrink-0">
        <TabButton
          active={tab === "markdown"}
          onClick={() => setTab("markdown")}
          icon={<FileText size={14} />}
          label={t.md.title}
          color="#2563eb"
        />
        <TabButton
          active={tab === "css"}
          onClick={() => setTab("css")}
          icon={<FileCode2 size={14} />}
          label={t.css.title}
          color="#7c3aed"
        />
        <div className="flex-1" />
        <div className="flex items-center gap-3 pb-2 px-2 text-[11px] text-[#64748b] tabular-nums">
          <span>
            {lines.length} {t.lines}
          </span>
          <span className="w-px h-3 bg-[#d6dce5]" />
          <span>
            {chars.toLocaleString()} {t.chars}
          </span>
        </div>
      </div>

      {/* Editor body (shared scroll + line numbers) */}
      <div className="relative flex-1 min-h-0 overflow-hidden flex">
        <div
          ref={(node) => {
            // route ref to the active tab's line-number box
            if (tab === "markdown") (mdLineNumbersRef as any).current = node;
            else (cssLineNumbersRef as any).current = node;
            if (node && activeTextareaRef.current) {
              node.scrollTop = activeTextareaRef.current.scrollTop;
            }
          }}
          key={`lines-${tab}`}
          className="w-14 flex-shrink-0 overflow-hidden bg-[#f1f5f9] border-r border-[#e2e8f0] text-right py-4 pr-3 select-none"
          aria-hidden
        >
          {lineNumbers.map((n) => (
            <div
              key={n}
              className="h-[1.6em] text-[12.5px] leading-[1.6em] text-[#94a3b8] font-mono"
            >
              {n}
            </div>
          ))}
        </div>

        {/* Markdown textarea */}
        {tab === "markdown" && (
          <textarea
            ref={mdTextareaRef}
            defaultValue={content}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleTabKey}
            spellCheck={false}
            placeholder={t.md.placeholder}
            className="flex-1 min-w-0 resize-none outline-none bg-transparent py-4 px-5 font-mono text-[14px] leading-[1.6em] text-[#0f172a] placeholder:text-[#94a3b8] selection:bg-[rgba(37,99,235,0.22)] caret-[#2563eb] overflow-y-auto"
            style={{ tabSize: 2 }}
          />
        )}

        {/* CSS textarea */}
        {tab === "css" && (
          <textarea
            ref={cssTextareaRef}
            defaultValue={customCSS}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleTabKey}
            spellCheck={false}
            placeholder={t.css.placeholder}
            className="flex-1 min-w-0 resize-none outline-none bg-transparent py-4 px-5 font-mono text-[13.5px] leading-[1.6em] text-[#1e1b4b] placeholder:text-[#94a3b8] selection:bg-[rgba(124,58,237,0.22)] caret-[#7c3aed] overflow-y-auto"
            style={{ tabSize: 2 }}
          />
        )}
      </div>

      {/* Footer status bar */}
      <div className="h-9 flex items-center justify-between px-4 border-t border-[#e2e8f0] bg-white text-[11px] text-[#64748b] flex-shrink-0">
        <span className="opacity-85">{copy.syntax}</span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded border border-[#d6dce5] bg-[#f1f5f9] text-[10px] font-mono text-[#334155]">
            Tab
          </kbd>
          <span>{t.indent}</span>
        </span>
      </div>
    </section>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const TabButton = ({ active, onClick, icon, label, color }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`group relative h-10 px-3.5 -mb-px flex items-center gap-2 text-[12.5px] font-medium rounded-t-md transition-all duration-150 select-none ${
        active
          ? "bg-white text-[#0f172a] border border-[#e2e8f0] border-b-white"
          : "text-[#64748b] hover:text-[#334155] hover:bg-white/60"
      }`}
    >
      <span
        style={{
          color: active ? color : "currentColor",
          opacity: active ? 1 : 0.75,
        }}
      >
        {icon}
      </span>
      <span>{label}</span>
      {active && (
        <span
          className="absolute left-0 right-0 -bottom-px h-[2px] rounded-t"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
};
