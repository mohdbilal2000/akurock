import { formatEur } from "@/config/prices";

interface CalculatorProps {
  panelCount: number;
  areaM2: number;
  priceEur: number;
}

/** Always-visible "12 panels · 7.2 m² · €2,640" readout, per spec 3. */
export function Calculator({ panelCount, areaM2, priceEur }: CalculatorProps) {
  return (
    <div className="flex items-center justify-center gap-4 rounded-xl bg-neutral-900 px-6 py-4 text-white">
      <Stat label="panels" value={formatCount(panelCount)} />
      <Divider />
      <Stat label="m²" value={areaM2.toFixed(1)} />
      <Divider />
      <Stat label="" value={formatEur(priceEur)} emphasis />
    </div>
  );
}

function formatCount(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="text-center">
      <div className={emphasis ? "text-xl font-bold" : "text-lg font-semibold"}>{value}</div>
      {label && <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>}
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-neutral-700" />;
}
