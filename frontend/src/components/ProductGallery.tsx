"use client";

import type { SavedItem } from "@/context/SessionContext";

type Product = {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail: string;
  rating?: number;
};

type Props = {
  products: Product[];
  onSave: (product: SavedItem) => void;
  onUnsave?: (title: string) => void;
  savedTitles?: Set<string>;
};

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={`text-[10px] sm:text-xs ${i <= Math.round(rating) ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}`}
      >
        ★
      </span>
    );
  }
  return <span className="flex gap-px">{stars}</span>;
}

export default function ProductGallery({ products, onSave, onUnsave, savedTitles }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Found Products
        </h4>
        <span className="text-[10px] sm:text-xs font-medium text-primary">{products.length} Items</span>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        {products.map((product, i) => {
          const isSaved = savedTitles?.has(product.title) ?? false;
          return (
            <div
              key={i}
              className="group flex gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              {/* Thumbnail — clickable link */}
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="size-14 sm:size-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 block"
              >
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 !text-xl sm:!text-2xl">
                      chair
                    </span>
                  </div>
                )}
              </a>

              {/* Info */}
              <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                <div>
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-primary transition-colors"
                  >
                    {product.title}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.source && (
                      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{product.source}</p>
                    )}
                    {product.rating && <StarRating rating={product.rating} />}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  {product.price && (
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {product.price}
                    </span>
                  )}
                  <div className="flex gap-0.5 sm:gap-1 ml-auto">
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 sm:p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-colors active:scale-90"
                      title="Open link"
                    >
                      <span className="material-symbols-outlined !text-base sm:!text-lg">open_in_new</span>
                    </a>
                    <button
                      onClick={() => {
                        if (isSaved) {
                          onUnsave?.(product.title);
                        } else {
                          onSave({
                            title: product.title,
                            price: product.price,
                            source: product.source,
                            link: product.link,
                            thumbnail: product.thumbnail,
                          });
                        }
                      }}
                      className={`p-1 sm:p-1.5 rounded-full transition-colors active:scale-90 ${
                        isSaved
                          ? "text-primary bg-primary/10 dark:bg-primary/20"
                          : "text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                      }`}
                      title={isSaved ? "Remove from saved" : "Save to list"}
                    >
                      <span className="material-symbols-outlined !text-base sm:!text-lg">
                        {isSaved ? "bookmark" : "bookmark_border"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
