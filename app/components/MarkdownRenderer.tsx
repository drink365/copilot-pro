// app/components/MarkdownRenderer.tsx
"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
// 有些專案的 TS 會對 remark-gfm 型別嚴格，這裡用 as any 保證可編譯
// 若你沒開嚴格模式，去掉 "as any" 也可以正常使用
// eslint-disable-next-line @typescript-eslint/no-var-requires
const remarkGfm = require("remark-gfm") as any

type Props = { content: string }

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        // @ts-expect-error: remark-gfm 型別在某些 TS 設定下會標紅，實際可正常執行
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm" {...props} />
            </div>
          ),
          th: (props) => <th className="border-b p-2 text-left bg-slate-100" {...props} />,
          td: (props) => <td className="border-b p-2 align-top" {...props} />,
          code: ({ inline, className, children, ...props }) =>
            inline ? (
              <code className="px-1 py-0.5 rounded bg-slate-200 text-slate-800" {...props}>
                {children}
              </code>
            ) : (
              <pre className="rounded-xl bg-slate-900 text-slate-50 p-4 overflow-x-auto text-xs sm:text-[13px]">
                <code {...props} className={className}>
                  {children}
                </code>
              </pre>
            ),
          h1: (props) => <h1 className="text-xl font-semibold" {...props} />,
          h2: (props) => <h2 className="text-lg font-semibold mt-2" {...props} />,
          h3: (props) => <h3 className="text-base font-semibold mt-2" {...props} />,
          ul: (props) => <ul className="list-disc pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5" {...props} />,
          p: (props) => <p className="my-2" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
