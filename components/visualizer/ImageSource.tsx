"use client";

import { useRef } from "react";
import { PRESET_ROOMS } from "@/config/panels";
import { useVisualizerStrings } from "./useVisualizerStrings";

interface ImageSourceProps {
  onImageSelected: (url: string) => void;
}

export function ImageSource({ onImageSelected }: ImageSourceProps) {
  const t = useVisualizerStrings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onImageSelected(URL.createObjectURL(file));
    e.target.value = "";
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-line bg-white p-8 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">{t.photoHeading}</h2>
      <p className="text-sm text-ink/60">
        {t.photoHelp}
      </p>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
        >
          {t.takePhoto}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink/40"
        >
          {t.uploadPhoto}
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="mt-2 w-full">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink/40">
          {t.presetLabel}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_ROOMS.map((room) => (
            <button
              key={room.slug}
              type="button"
              onClick={() => onImageSelected(room.url)}
              className="group overflow-hidden rounded-lg border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={room.url}
                alt={room.label}
                className="h-16 w-full object-cover transition group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
