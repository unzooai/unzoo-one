"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown 排好版显示：智能体的回复、它写下的 .md 成果。
 *
 * 文字是智能体写的，网页内容也可能混在里面，所以只认 Markdown 本身：不渲染
 * 原始 HTML（react-markdown 默认如此），链接的 javascript: 之类会被去掉，
 * 链接一律在外部浏览器打开，不让应用窗口自己跳走。
 */
const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="markdown-table-wrap">
      <table>{children}</table>
    </div>
  ),
};

export function MarkdownView({ text, className }: { text: string; className?: string }) {
  return (
    <div className={className ? `markdown-view ${className}` : "markdown-view"}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

/** 这个成果是不是 Markdown：看格式，没有格式就看文件名。 */
export function isMarkdown(format?: string | null, filename?: string | null): boolean {
  const kind = (format ?? "").trim().toLowerCase();
  if (kind === "md" || kind === "markdown") return true;
  return /\.(md|markdown)$/i.test(filename ?? "");
}
