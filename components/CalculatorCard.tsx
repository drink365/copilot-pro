// components/CalculatorCard.tsx
"use client";
import { PropsWithChildren } from "react";

export default function CalculatorCard(
  { title, children, footer }: PropsWithChildren<{ title: string; footer?: React.ReactNode }>
) {
  return (
    <div className="rounded-2xl shadow-lg border bg-white p-6 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
      {footer && <div className="pt-4 border-t">{footer}</div>}
    </div>
  );
}
