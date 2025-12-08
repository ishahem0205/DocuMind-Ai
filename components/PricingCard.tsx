import React from 'react';

interface PricingCardProps {
  title: string;
  priceLabel: string;
  bullets: string[];
  highlight?: boolean;
  onChoose?: () => void;
  ctaLabel?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({ title, priceLabel, bullets, highlight = false, onChoose, ctaLabel }) => {
  return (
    <div className={`p-6 rounded-lg border ${highlight ? 'border-emerald-400 bg-slate-900' : 'border-slate-700 bg-slate-800'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">{priceLabel}</p>
        </div>
      </div>

      <ul className="mt-4 text-slate-300 text-sm space-y-2">
        {bullets.map((b, i) => (
          <li key={i}>• {b}</li>
        ))}
      </ul>

      <div className="mt-6">
        <button
          onClick={onChoose}
          className={`w-full py-2 rounded ${highlight ? 'bg-emerald-500 text-black' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
        >
          {ctaLabel ?? 'Choose'}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;