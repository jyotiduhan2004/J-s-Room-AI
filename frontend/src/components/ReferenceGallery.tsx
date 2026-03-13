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
      <div className="px-3 py-2 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 mb-2">Reference Images</p>
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setEnlarged(img)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-800 hover:ring-2 hover:ring-violet-500 transition-all"
            >
              <img
                src={img.url_small}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[9px] truncate">{img.photographer}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {enlarged && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setEnlarged(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={enlarged.url_regular}
              alt={enlarged.alt}
              className="w-full rounded-xl"
            />
            <p className="text-zinc-400 text-xs mt-2 text-center">
              Photo by{" "}
              {enlarged.photographer_url ? (
                <a
                  href={enlarged.photographer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:underline"
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
              className="mt-3 w-full py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
