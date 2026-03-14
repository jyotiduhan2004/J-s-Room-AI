"use client";

import { useState, useRef, useCallback } from "react";

type Props = {
  onUpload: (file: File) => void;
  variant: "dropzone" | "compact" | "button";
};

export default function RoomUploader({ onUpload, variant }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
      e.target.value = "";
    },
    [onUpload]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) onUpload(file);
          break;
        }
      }
    },
    [onUpload]
  );

  if (variant === "button") {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors shrink-0 active:scale-90"
          title="Upload room photo"
        >
          <span className="material-symbols-outlined !text-lg sm:!text-xl">attach_file</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm text-slate-600 dark:text-slate-300 font-medium transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined !text-lg">add_photo_alternate</span>
          Add photo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </>
    );
  }

  // dropzone variant
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
      onClick={() => inputRef.current?.click()}
      tabIndex={0}
      className={`relative cursor-pointer rounded-xl sm:rounded-2xl border-2 border-dashed transition-all duration-200 p-6 sm:p-10 text-center focus:outline-none focus:ring-2 focus:ring-primary/40 ${
        isDragging
          ? "border-primary bg-primary/5 dark:bg-primary/10 scale-[1.01]"
          : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div
          className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors ${
            isDragging ? "bg-primary/10 dark:bg-primary/20" : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          <span
            className={`material-symbols-outlined !text-3xl sm:!text-4xl transition-colors ${
              isDragging ? "text-primary" : "text-slate-400 dark:text-slate-500"
            }`}
          >
            cloud_upload
          </span>
        </div>
        <div>
          <p className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-200">
            {isDragging ? "Drop your photo here" : "Drop a room photo here"}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            or tap to browse
          </p>
        </div>
        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500">
          JPG, PNG, HEIC up to 10MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
