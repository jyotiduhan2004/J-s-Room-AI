"use client";

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
  onAddToList: (product: Product) => void;
};

export default function ProductGallery({ products, onAddToList }: Props) {
  if (products.length === 0) return null;

  return (
    <div className="p-3 border-b border-zinc-800">
      <h3 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
        Product Results ({products.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col"
          >
            {product.thumbnail && (
              <div className="aspect-video bg-zinc-800 overflow-hidden">
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="p-2 flex flex-col flex-1 gap-1">
              <p className="text-xs text-zinc-200 line-clamp-2 leading-tight">
                {product.title}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {product.price && (
                  <span className="px-1.5 py-0.5 bg-violet-900/60 text-violet-300 text-[10px] rounded font-medium">
                    {product.price}
                  </span>
                )}
                {product.source && (
                  <span className="text-[10px] text-zinc-500 truncate">
                    {product.source}
                  </span>
                )}
              </div>
              {product.rating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg
                      key={j}
                      className={`w-2.5 h-2.5 ${
                        j < Math.round(product.rating!) ? "text-yellow-400" : "text-zinc-700"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}
              <div className="flex gap-1 mt-auto pt-1">
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-1 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-medium rounded transition-colors"
                >
                  Buy Now
                </a>
                <button
                  onClick={() => onAddToList(product)}
                  className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-[10px] font-medium rounded transition-colors"
                  title="Add to list"
                >
                  + List
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
