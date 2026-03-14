"use client";

import { useState } from "react";

type ReferenceImage = {
  id?: string;
  url_small: string;
  url_regular: string;
  alt: string;
  photographer: string;
  photographer_url?: string;
};

type Props = {
  images: ReferenceImage[];
};

export default function ReferenceGallery({ images }: Props) {
  const [enlarged, setEnlarged] = useState<ReferenceImage | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined !text-lg text-primary">photo_library</span>
            Style Inspiration
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-3">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setEnlarged(img)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 hover:ring-2 hover:ring-primary transition-all"
            >
              <img
                src={img.url_small}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[9px] truncate">{img.photographer}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setEnlarged(null)}
        >
          <div
            className="max-w-2xl w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={enlarged.url_regular}
              alt={enlarged.alt}
              className="w-full rounded-2xl shadow-2xl"
            />
            <p className="text-slate-400 text-xs mt-3 text-center">
              Photo by{" "}
              {enlarged.photographer_url ? (
                <a
                  href={enlarged.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {enlarged.photographer}
                </a>
              ) : (
                enlarged.photographer
              )}{" "}
              on Unsplash
            </p>
            <button
              onClick={() => setEnlarged(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
