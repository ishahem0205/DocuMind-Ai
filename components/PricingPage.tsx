import React, { useState } from 'react';
import PricingCard from './PricingCard';
import { useSubscription } from './SubscriptionContext';
import { CreditCard } from 'lucide-react';

interface Props {
  onOpenPayment?: (plan: 'standard' | 'pro') => void;
}

export const PricingPage: React.FC<Props> = ({ onOpenPayment }) => {
  const { subscribeToPlan } = useSubscription();
  const [message, setMessage] = useState<string | null>(null);

  const handleFree = () => {
    subscribeToPlan('free', 10);
    setMessage('Signed up for Free plan — 10 credits granted.');
  };

  const openPayment = (plan: 'standard' | 'pro') => {
    onOpenPayment?.(plan);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white">Pricing</h2>
        <p className="text-slate-400 mt-2">Pick a plan that matches your needs. Payments are simulated in this demo.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <PricingCard
          title="Free"
          priceLabel="Free — 10 credits"
          bullets={['10 credits', 'Basic uploads', 'No card required']}
          onChoose={handleFree}
          ctaLabel="Get Free"
        />

        <PricingCard
          title="Standard"
          priceLabel="Tk 299 / month"
          bullets={['200 credits / month', 'Fraud detection + analysis', 'Similarity checks']}
          onChoose={() => openPayment('standard')}
          ctaLabel="Choose Standard"
        />

        <PricingCard
          title="Pro"
          priceLabel="Tk 799 / month"
          bullets={['High / unlimited credits', 'All advanced features', 'Priority support']}
          highlight
          onChoose={() => openPayment('pro')}
          ctaLabel="Choose Pro"
        />
      </div>

      {message && (
        <div className="mt-6 bg-emerald-900/20 border border-emerald-700 p-3 rounded text-emerald-200">
          <div className="flex items-center gap-2">
            <CreditCard /> <span>{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;