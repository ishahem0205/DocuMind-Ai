import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSubscription } from './SubscriptionContext';
import ConfirmSubscription from './ConfirmSubscription.tsx';

interface PaymentModalProps {
  initialPlan: 'standard' | 'pro';
  onClose: () => void;
}

const isValidCard = (num: string) => {
  const cleaned = num.replace(/\s+/g, '');
  return /^\d{16}$/.test(cleaned) && (cleaned.startsWith('4') || /^5[1-5]/.test(cleaned));
};

const isValidExpiry = (exp: string) => /^\d{2}\/\d{2}$/.test(exp);

const isValidCvv = (cvv: string) => /^\d{3,4}$/.test(cvv);

export const PaymentModal: React.FC<PaymentModalProps> = ({ initialPlan, onClose }) => {
  const [nameOnCard, setNameOnCard] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const { subscribeToPlan, purchaseCredits } = useSubscription();

  const priceLabel = initialPlan === 'pro' ? 'Tk 799' : 'Tk 299';
  const grantCredits = initialPlan === 'pro' ? 1000 : 200;

  const handleSubmit = () => {
    if (!nameOnCard.trim()) { alert('Enter name on card (demo).'); return; }
    if (!isValidCard(card)) { alert('Enter a valid 16-digit Visa or Mastercard number (starts with 4 or 5).'); return; }
    if (!isValidExpiry(expiry)) { alert('Expiry must be MM/YY'); return; }
    if (!isValidCvv(cvv)) { alert('Enter valid CVV'); return; }

    setLoading(true);
    setTimeout(() => {
      // simulate payment success
      subscribeToPlan(initialPlan, grantCredits);
      setLoading(false);
      setConfirmed(true);
    }, 1100);
  };

  if (confirmed) {
    return <ConfirmSubscription onClose={onClose} plan={initialPlan} credits={grantCredits} />;
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Checkout — {priceLabel} (demo)</h3>
          <button onClick={onClose} className="text-slate-400"><X /></button>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-slate-400">Name on card</label>
          <input value={nameOnCard} onChange={e => setNameOnCard(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />

          <label className="text-sm text-slate-400">Card number</label>
          <input value={card} onChange={e => setCard(e.target.value)} placeholder="4242 4242 4242 4242" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-slate-400">Expiry (MM/YY)</label>
              <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="04/26" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
            </div>
            <div className="w-28">
              <label className="text-sm text-slate-400">CVV</label>
              <input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div className="text-xs text-slate-500">Only Visa (start 4) and MasterCard (start 51–55) accepted (demo validation).</div>

          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
              {loading ? 'Processing...' : `Pay ${priceLabel} (mock)`}
            </button>
            <button onClick={onClose} className="bg-slate-800 border border-slate-700 px-3 py-2 rounded text-slate-300">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;