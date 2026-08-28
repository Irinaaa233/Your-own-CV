import { marked } from "marked";

marked.setOptions({
  breaks: true,
  gfm: true,
});

const XSS_ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeUserHtml = (src: string): string => {
  return src.replace(/[<>"']/g, (c) => XSS_ESCAPE_MAP[c] || c);
};

const SAFE_HTML_PATTERNS = [
  /^<div\s+class="(resume-header-item(?:\s+no-separator)?|row|left|right)">\s*[\s\S]*?\s*<\/div>\s*$/i,
  /^<br\s*\/?>$/i,
];

const isSafeHtmlSnippet = (html: string): boolean => {
  const trimmed = html.trim();
  for (const re of SAFE_HTML_PATTERNS) {
    if (re.test(trimmed)) return true;
  }
  return false;
};

const preprocess = (markdown: string): string => {
  const lines = markdown.split(/\r?\n/);
  const processed: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      processed.push(line);
      continue;
    }
    if (inCodeBlock) {
      processed.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (/^<[\w\s="':;\/-]+>[\s\S]*<\/\w+>\s*$/i.test(trimmed) || /^<br\s*\/?>$/i.test(trimmed)) {
      if (isSafeHtmlSnippet(trimmed)) {
        processed.push(line);
      } else {
        processed.push(line.replace(/[<>"']/g, (c) => XSS_ESCAPE_MAP[c] || c));
      }
    } else {
      processed.push(line);
    }
  }

  return processed.join("\n");
};

export const renderMarkdown = async (markdown: string): Promise<string> => {
  const preprocessed = preprocess(markdown);
  const html = await marked.parse(preprocessed);

  const wrapped = `
    <div data-scope="vue-smart-pages" data-part="page" style="width:100%;height:100%;">
      ${html}
    </div>
  `;

  return wrapped;
};

export const countWords = (markdown: string): { chars: number; lines: number } => {
  const chars = markdown.length;
  const lines = markdown.split(/\r?\n/).length;
  return { chars, lines };
};

export const escapeUnsafeHtmlText = escapeUserHtml;
