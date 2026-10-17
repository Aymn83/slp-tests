"use client";

import Link from "next/link";
import type { Dict } from "@/lib/i18n";

// «تصدير PDF» يفتح نافذة الطباعة باسم ملف مناسب؛ المتصفح يحفظه PDF بنص عربي سليم وقابل للنسخ
export function ReportToolbar({ t, backHref, fileName }: { t: Dict; backHref: string; fileName: string }) {
  const printAs = (title?: string) => {
    const old = document.title;
    if (title) document.title = title;
    window.print();
    document.title = old;
  };
  return (
    <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center gap-2">
      <Link href={backHref} className="btn btn-sm">
        ← {t.back}
      </Link>
      <div className="ms-auto flex gap-2">
        <button type="button" className="btn btn-sm" onClick={() => printAs()}>
          🖨 {t.print}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => printAs(fileName)}>
          ⬇ {t.exportPdf}
        </button>
      </div>
      <p className="muted w-full text-end text-xs">{t.pdfHint}</p>
    </div>
  );
}
