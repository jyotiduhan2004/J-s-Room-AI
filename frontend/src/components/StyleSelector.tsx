"use client";

const STYLES = [
  "Modern",
  "Scandinavian",
  "Minimalist",
  "Bohemian",
  "Industrial",
  "Japandi",
];

type Props = {
  onStyleSelect: (message: string) => void;
  disabled: boolean;
};

export default function StyleSelector({ onStyleSelect, disabled }: Props) {
  return (
    <div className="px-3 pb-3 flex flex-wrap gap-1.5">
      {STYLES.map((style) => (
        <button
          key={style}
          disabled={disabled}
          onClick={() => onStyleSelect(`Show me ${style} living rooms`)}
          className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-violet-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {style}
        </button>
      ))}
    </div>
  );
}
