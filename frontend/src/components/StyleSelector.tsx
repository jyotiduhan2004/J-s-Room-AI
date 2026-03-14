"use client";

import { useState } from "react";

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
  const [active, setActive] = useState<string | null>(null);

  const handleSelect = (style: string) => {
    if (disabled) return;
    setActive(style);
    onStyleSelect(`Show me ${style} living rooms`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STYLES.map((style) => (
        <button
          key={style}
          disabled={disabled}
          onClick={() => handleSelect(style)}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
            active === style
              ? "bg-primary text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {style}
        </button>
      ))}
    </div>
  );
}
