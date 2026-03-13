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
  if (items.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center">
        <p className="text-xs text-zinc-600 text-center">
          No items yet — ask J&apos;s Room AI for product recommendations
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + parsePrice(item.price), 0);
  const hasPrices = items.some((item) => parsePrice(item.price) > 0);

  return (
    <div className="flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Shopping List ({items.length})
        </h3>
        <button
          onClick={onClear}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="divide-y divide-zinc-800/50">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2">
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="w-8 h-8 object-cover rounded flex-shrink-0 bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-200 truncate">{item.title}</p>
              <div className="flex items-center gap-1.5">
                {item.price && (
                  <span className="text-[10px] text-violet-400 font-medium">
                    {item.price}
                  </span>
                )}
                {item.source && item.source !== "Recommended" && (
                  <span className="text-[10px] text-zinc-600">{item.source}</span>
                )}
              </div>
            </div>
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-2 py-0.5 bg-violet-700 hover:bg-violet-600 text-white text-[10px] rounded transition-colors"
              >
                Buy
              </a>
            ) : (
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(item.title + " buy online")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[10px] rounded transition-colors"
              >
                Search
              </a>
            )}
            <button
              onClick={() => onRemove(i)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded transition-colors text-sm"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {hasPrices && (
        <div className="px-3 py-2 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Estimated Total</span>
          <span className="text-xs text-white font-semibold">${total.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
