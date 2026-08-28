"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getVisualizerStrings,
  resolveVisualizerLocale,
  type VisualizerLocale,
  type VisualizerStrings,
} from "@/lib/i18n/visualizer";

/**
 * The locale is read from the URL (?lang=, which every site link carries —
 * see lib/i18n/translate-html.ts) with the browser language as fallback.
 * Both are client-only, so the server has to render *something* else; German
 * is the site's default and therefore the server snapshot.
 *
 * useSyncExternalStore rather than an effect: it hands React a server
 * snapshot and a client snapshot explicitly, so hydration is correct by
 * construction instead of relying on a post-mount setState.
 */
const subscribe = () => () => {};

let cached: VisualizerLocale | null = null;

function getClientLocale(): VisualizerLocale {
  // Cached because getSnapshot must be referentially stable across renders.
  if (cached) return cached;
  const lang = new URLSearchParams(window.location.search).get("lang");
  cached = resolveVisualizerLocale(lang, navigator.language);
  return cached;
}

const getServerLocale = (): VisualizerLocale => "de";

export function useVisualizerLocale(): VisualizerLocale {
  return useSyncExternalStore(subscribe, getClientLocale, getServerLocale);
}

export function useVisualizerStrings(): VisualizerStrings {
  const locale = useVisualizerLocale();

  // The root layout hardcodes lang="de". Correct it for the locale actually
  // being shown, or screen readers announce Spanish copy with German
  // pronunciation rules and crawlers mislabel the page.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return getVisualizerStrings(locale);
}
