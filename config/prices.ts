/**
 * Live pricing pulled from public/data/mock-cms-data.json: all six finishes
 * are €220.00 per panel (2400x600x23mm, 1.44 m²). Kept as a lookup keyed by
 * finish slug so a future per-finish price divergence is a one-line change,
 * not a refactor.
 */

export const CURRENCY = "EUR" as const;

export const PRICE_PER_PANEL_EUR: Record<string, number> = {
  whisper: 220,
  brush: 220,
  gaia: 220,
  yami: 220,
  yuki: 220,
  ligia: 220,
};

export const DEFAULT_PRICE_PER_PANEL_EUR = 220;

export function pricePerPanel(finishSlug: string): number {
  return PRICE_PER_PANEL_EUR[finishSlug] ?? DEFAULT_PRICE_PER_PANEL_EUR;
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: CURRENCY,
  }).format(amount);
}
