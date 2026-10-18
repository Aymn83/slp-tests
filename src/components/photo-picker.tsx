"use client";

import { useState } from "react";
import type { Dict } from "@/lib/i18n";

// تصغير الصورة في المتصفح إلى 480 بكسل كحد أقصى وتحويلها JPEG — يبقى الحجم صغيراً قبل الإرسال
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 480 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// اختيار صورة شخصية مع معاينة؛ يرسل للخادم حقلين: photo (الصورة الجديدة) و photoMode (keep | remove | new)
export function PhotoPicker({ t, existingUrl, inputId = "photo-input" }: { t: Dict; existingUrl?: string | null; inputId?: string }) {
  const [photo, setPhoto] = useState("");
  const [mode, setMode] = useState<"keep" | "remove" | "new">("keep");
  const [error, setError] = useState("");
  const preview = mode === "new" ? photo : mode === "keep" ? existingUrl : null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="photo" value={mode === "new" ? photo : ""} />
      <input type="hidden" name="photoMode" value={mode} />
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-24 w-24 rounded-full border border-line object-cover" />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-page text-3xl text-ink-soft">👤</span>
      )}
      <div className="space-y-2">
        <label className="label" htmlFor={inputId}>
          {t.photo} <span className="muted font-normal">({t.optional})</span>
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block text-sm"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            setError("");
            if (!f) return;
            if (f.size > 15 * 1024 * 1024) return setError(t.invalidPhoto);
            try {
              setPhoto(await shrinkImage(f));
              setMode("new");
            } catch {
              setError(t.invalidPhoto);
            }
          }}
        />
        <p className="muted text-xs">{t.photoHint}</p>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {preview && (
          <button type="button" className="btn btn-sm" onClick={() => setMode("remove")}>
            {t.removePhoto}
          </button>
        )}
      </div>
    </div>
  );
}
