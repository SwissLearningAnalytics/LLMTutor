// based on the vercel ai sdk cookbook https://ai-sdk.dev/cookbook/next/markdown-chatbot-with-memoization

import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";
import type { UIMessage } from "ai";

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { output: "html" }]]}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.content !== nextProps.content) {
      return false;
    }
    return true;
  },
);

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock";

export const MemoizedMarkdown = memo(
  ({ parts, id }: { parts: UIMessage["parts"]; id: string }) => {
    const blocks = useMemo(
      () =>
        parts
          .filter((part) => part.type === "text")
          .flatMap((part) =>
            parseMarkdownIntoBlocks(
              part.text
                .replace(/\\\[(.*?)\\\]/gs, (_, math) => `$$${math}$$`)
                .replace(/\\\((.*?)\\\)/gs, (_, math) => `$${math}$`),
            ),
          ),
      [parts],
    );

    return blocks.map((block, index) => (
      <MemoizedMarkdownBlock
        content={block}
        key={`${id}-block_${index.toString()}`}
      />
    ));
  },
);

MemoizedMarkdown.displayName = "MemoizedMarkdown";
