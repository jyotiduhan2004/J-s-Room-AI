"use client";

export type SavedItem = {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail?: string;
};

type Props = {
  items: SavedItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
};

function parsePrice(price: string): number {
  const match = price.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

function detectCurrency(items: SavedItem[]): string {
  for (const item of items) {
    if (item.price.includes("₹") || item.price.toLowerCase().includes("rs")) return "₹";
  }
  return "₹";
}

function formatTotal(total: number, symbol: string): string {
  if (symbol === "₹") {
    return `₹${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  return `${symbol}${total.toFixed(2)}`;
}

function getItemLink(item: SavedItem): string {
  if (item.link) return item.link;
  return `https://www.google.com/search?q=${encodeURIComponent(item.title + " buy online India")}`;
}

export default function SavedItemsList({ items, onRemove, onClear }: Props) {
  const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const hasPrices = items.some((item) => parsePrice(item.price) > 0);
  const currency = detectCurrency(items);

  const handleExport = () => {
    const lines = items.map((item, i) => {
      const link = getItemLink(item);
      return `${i + 1}. ${item.title} — ${item.price} (${item.source})\n   ${link}`;
    });
    if (hasPrices) lines.push(`\nTotal: ${formatTotal(total, currency)}`);
    const blob = new Blob([`My Room Design Shopping List\n\n${lines.join("\n\n")}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopping-list.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const lines = items.map((item, i) => {
      const link = getItemLink(item);
      return `${i + 1}. ${item.title} — ${item.price}\n   ${link}`;
    });
    if (hasPrices) lines.push(`\nTotal: ${formatTotal(total, currency)}`);
    const text = `My Room Design Shopping List\n\n${lines.join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center gap-2 sm:gap-3">
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 !text-3xl sm:!text-4xl">
          bookmark
        </span>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 max-w-xs">
          Products will appear here as your designer finds matches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 dark:border-slate-800">
        <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Saved Items ({items.length})
        </h4>
        <button
          onClick={onClear}
          className="text-[10px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium active:scale-95"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {items.map((item, i) => {
          const href = getItemLink(item);
          return (
            <div
              key={i}
              className="group flex gap-2.5 sm:gap-3 p-2.5 sm:p-3 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              {/* Thumbnail — clickable */}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="size-10 sm:size-12 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 block"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400 !text-base sm:!text-xl">shopping_bag</span>
                  </div>
                )}
              </a>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white leading-tight line-clamp-2 hover:text-primary transition-colors"
                  >
                    {item.title}
                  </a>
                  {item.source && item.source !== "Recommended" && (
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.source}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  {item.price && (
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {item.price}
                    </span>
                  )}
                  <div className="flex gap-0.5 sm:gap-1 ml-auto">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors active:scale-90"
                      title={item.link ? "Open product page" : "Search online"}
                    >
                      <span className="material-symbols-outlined !text-sm sm:!text-base">
                        {item.link ? "open_in_new" : "search"}
                      </span>
                    </a>
                    <button
                      onClick={() => onRemove(i)}
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors active:scale-90"
                      title="Remove from saved"
                    >
                      <span className="material-symbols-outlined !text-sm sm:!text-base">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5 sm:space-y-3">
        {hasPrices && (
          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Est. Total</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {formatTotal(total, currency)}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined !text-xs sm:!text-sm">content_copy</span>
            Copy
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] sm:text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined !text-xs sm:!text-sm">download</span>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
