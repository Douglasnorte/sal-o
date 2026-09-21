"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-2xl bg-surface p-6 shadow-xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-primary-soft hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
