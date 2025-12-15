"use client";

interface SpecialInstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function SpecialInstructions({ value, onChange }: SpecialInstructionsProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Special Instructions</h2>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Any special requests? (e.g., less ice, extra sweet)"
        className="w-full rounded-xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
        rows={3}
      />
    </div>
  );
}
