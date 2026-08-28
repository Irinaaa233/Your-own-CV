export type ContactLayout = "stacked" | "inline";

export interface ResumeSettings {
  marginX: number;
  marginY: number;
  accentColor: string;
  headingColor: string;
  textColor: string;
  zhFont: string;
  enFont: string;
  fontSize: number;
  headingScale: number;
  paragraphSpacing: number;
  lineHeight: number;
  sectionSpacing: number;
  contactLayout: ContactLayout;
}

export const DEFAULT_SETTINGS: ResumeSettings = {
  marginX: 20,
  marginY: 22,
  accentColor: "#3b82f6",
  headingColor: "#1e3a8a",
  textColor: "#374151",
  zhFont: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Hiragino Sans GB"',
  enFont: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSize: 14,
  headingScale: 1.25,
  paragraphSpacing: 0.4,
  lineHeight: 1.7,
  sectionSpacing: 1.2,
  contactLayout: "stacked",
};

export const ACCENT_PRESETS: { name: string; color: string; heading: string }[] = [
  { name: "蓝色", color: "#3b82f6", heading: "#1e3a8a" },
  { name: "深蓝", color: "#1d4ed8", heading: "#1e3a8a" },
  { name: "墨绿", color: "#059669", heading: "#064e3b" },
  { name: "青色", color: "#0891b2", heading: "#164e63" },
  { name: "紫色", color: "#7c3aed", heading: "#4c1d95" },
  { name: "玫红", color: "#db2777", heading: "#831843" },
  { name: "橙色", color: "#ea580c", heading: "#7c2d12" },
  { name: "金色", color: "#d97706", heading: "#78350f" },
  { name: "砖红", color: "#dc2626", heading: "#7f1d1d" },
  { name: "黑色", color: "#000000", heading: "#000000" },
];

export const ZH_FONT_PRESETS: { label: string; value: string }[] = [
  {
    label: "苹方 (推荐)",
    value: '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Hiragino Sans GB"',
  },
  {
    label: "思源黑体",
    value: '"Source Han Sans SC", "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei"',
  },
  {
    label: "微软雅黑",
    value: '"Microsoft YaHei", "PingFang SC", sans-serif',
  },
  {
    label: "宋体 (衬线)",
    value: '"Songti SC", "SimSun", "Noto Serif CJK SC", serif',
  },
  {
    label: "楷体",
    value: '"Kaiti SC", "KaiTi", "STKaiti", serif',
  },
  { label: "黑体", value: '"Heiti SC", "SimHei", sans-serif' },
];

export const EN_FONT_PRESETS: { label: string; value: string }[] = [
  {
    label: "Helvetica (推荐)",
    value: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  {
    label: "Inter",
    value: '"Inter", "Helvetica Neue", Arial, sans-serif',
  },
  {
    label: "Georgia (衬线)",
    value: "Georgia, 'Times New Roman', Times, serif",
  },
  {
    label: "Times New Roman",
    value: '"Times New Roman", Times, Georgia, serif',
  },
  {
    label: "Roboto",
    value: "Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  {
    label: "Arial",
    value: "Arial, Helvetica, sans-serif",
  },
];
