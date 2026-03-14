"use client";

export type ShoppingItem = {
  title: string;
  price: string;
  source: string;
  link: string;
  thumbnail?: string;
};

type Props = {
  items: ShoppingItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
};

function parsePrice(price: string): number {
  const match = price.replace(/,/g, "").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export default function ShoppingList({ items, onRemove, onClear }: Props) {
  const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const hasPrices = items.some((item) => parsePrice(item.price) > 0);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700 !text-4xl">
          shopping_cart
        </span>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          No items yet — ask Live Room AI for product recommendations
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            In this render
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-primary">{items.length} Items</span>
          <button
            onClick={onClear}
            className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {items.map((item, i) => (
          <div
            key={i}
            className="group flex gap-3 p-3 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            {/* Thumbnail */}
            {item.thumbnail && (
              <div className="size-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
                {item.title}
              </p>
              {item.source && item.source !== "Recommended" && (
                <p className="text-xs text-slate-500 mt-0.5">{item.source}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                {item.price && (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.price}
                  </span>
                )}
                <div className="flex gap-1 ml-auto">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="material-symbols-outlined !text-lg">open_in_new</span>
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(item.title + " buy online")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined !text-lg">search</span>
                    </a>
                  )}
                  <button
                    onClick={() => onRemove(i)}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined !text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer total + checkout */}
      {hasPrices && (
        <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-500">Total Est.</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ${total.toFixed(2)}
            </span>
          </div>
          <button className="w-full bg-slate-900 dark:bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black dark:hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            Go to Checkout
            <span className="material-symbols-outlined !text-sm">arrow_forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
