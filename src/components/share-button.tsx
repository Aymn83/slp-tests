"use client";

import { useEffect, useRef, useState } from "react";

type Labels = { share: string; copyLink: string; linkCopied: string; shareVia: string };

// زر مشاركة صفحة: قائمة المشاركة في الهاتف إن توفرت، وإلا قائمة روابط ونسخ الرابط
export function ShareButton({ url, title, text, labels }: { url: string; title: string; text: string; labels: Labels }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const onClick = async () => {
    // الهواتف: قائمة المشاركة الأصلية (واتساب، تيليغرام…)
    if (typeof navigator.share === "function" && matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as DOMException).name === "AbortError") return;
      }
    }
    setOpen((v) => !v);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt(labels.copyLink, url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const u = encodeURIComponent(url);
  const msg = encodeURIComponent(`${text}\n${url}`);
  const targets = [
    { name: "WhatsApp", href: `https://wa.me/?text=${msg}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${u}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}` },
    { name: "Email", href: `mailto:?subject=${encodeURIComponent(title)}&body=${msg}` },
  ];

  return (
    <div className="relative inline-block" ref={box}>
      <button type="button" className="btn btn-sm" onClick={onClick} aria-haspopup="menu" aria-expanded={open}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {labels.share}
      </button>
      {open && (
        <div role="menu" className="absolute end-0 z-30 mt-2 w-56 space-y-1 rounded-xl border border-line bg-white p-2 shadow-lg">
          <button type="button" role="menuitem" onClick={copy} className="w-full rounded-lg px-3 py-2 text-start text-sm font-semibold hover:bg-page">
            {copied ? `✓ ${labels.linkCopied}` : `🔗 ${labels.copyLink}`}
          </button>
          <div className="px-3 pt-1 text-xs text-ink-soft">{labels.shareVia}</div>
          {targets.map((x) => (
            <a
              key={x.name}
              role="menuitem"
              href={x.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-3 py-1.5 text-sm hover:bg-page"
              onClick={() => setOpen(false)}
            >
              {x.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
