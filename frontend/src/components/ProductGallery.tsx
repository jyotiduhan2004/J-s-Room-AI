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
    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Found Products
        </h4>
        <span className="text-xs font-medium text-primary">{products.length} Items</span>
      </div>
      <div className="space-y-2">
        {products.map((product, i) => (
          <div
            key={i}
            className="group flex gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
          >
            {/* Thumbnail */}
            <div className="size-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
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
                  <span className="material-symbols-outlined text-slate-400 !text-2xl">chair</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight line-clamp-2">
                  {product.title}
                </p>
                {product.source && (
                  <p className="text-xs text-slate-500 mt-0.5">{product.source}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                {product.price && (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {product.price}
                  </span>
                )}
                <div className="flex gap-1 ml-auto">
                  <a
                    href={product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Open link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined !text-lg">open_in_new</span>
                  </a>
                  <button
                    onClick={() => onAddToList(product)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Add to list"
                  >
                    <span className="material-symbols-outlined !text-lg">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
