"use client";

import type { DesignChoice } from "@/context/SessionContext";

type Props = {
  choices: DesignChoice[];
  onEdit: (key: string) => void;
  disabled?: boolean;
};

export default function DesignBrief({ choices, onEdit, disabled }: Props) {
  const confirmed = choices.filter((c) => c.confirmed).length;
  const total = choices.length;
  const progress = (confirmed / total) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined !text-lg text-primary">checklist</span>
            Design Brief
          </h3>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {confirmed} of {total}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Choices list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {choices.map((choice) => (
          <button
            key={choice.key}
            onClick={() => !disabled && choice.confirmed && onEdit(choice.key)}
            disabled={disabled || !choice.confirmed}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              choice.confirmed && !disabled
                ? "hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                : "cursor-default"
            }`}
          >
            {/* Checkbox */}
            <span
              className={`material-symbols-outlined !text-lg shrink-0 ${
                choice.confirmed
                  ? "text-emerald-500"
                  : "text-slate-300 dark:text-slate-600"
              }`}
            >
              {choice.confirmed ? "check_circle" : "radio_button_unchecked"}
            </span>

            {/* Label + value */}
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {choice.label}
              </span>
              {choice.confirmed && choice.value && (
                <p className="text-sm text-slate-900 dark:text-white truncate mt-0.5">
                  {choice.value}
                </p>
              )}
            </div>

            {/* Edit hint */}
            {choice.confirmed && !disabled && (
              <span className="material-symbols-outlined !text-sm text-slate-300 dark:text-slate-600">
                edit
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
