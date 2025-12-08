import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { User } from '../types';

interface SubscriptionProps {
  user: User;
  onClose: () => void;
  onSubscribe: (opts?: { creditsGranted?: number }) => void;
}

const detectCardType = (num: string) => {
  if (!num) return '';
  const n = num.replace(/\s+/g, '');
  if (n.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(n)) return 'Mastercard';
  return 'Unknown';
};

export const Subscription: React.FC<SubscriptionProps> = ({ user, onClose, onSubscribe }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [plan, setPlan] = useState<'standard' | 'pro'>('standard');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handlePayMock = async () => {
    if (isProcessing) return;
    // basic form validation
    if (!cardNumber || cardNumber.replace(/\s+/g, '').length < 13) {
      alert('Please enter a valid card number (demo).');
      return;
    }
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      alert('Please enter expiry as MM/YY (demo).');
      return;
    }
    if (!cvc || cvc.length < 3) {
      alert('Please enter a valid CVC (demo).');
      return;
    }

    const cardType = detectCardType(cardNumber);
    if (cardType === 'Unknown') {
      if (!confirm('Card looks like a non-Visa/Master number. Continue with mock payment?')) {
        return;
      }
    }

    setIsProcessing(true);
    setTimeout(() => {
      // simulate successful payment and grant credits depending on plan
      const creditsGranted = plan === 'pro' ? 1000 : 100;
      onSubscribe({ creditsGranted });
      setIsProcessing(false);
      alert(`Mock payment accepted (${cardType}). Subscription activated. ${creditsGranted} credits granted.`);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="text-blue-400" />
            <h3 className="text-white font-semibold">Subscription</h3>
          </div>
          <button onClick={onClose} className="text-slate-400"><X /></button>
        </div>

        <div className="space-y-4">
          <p className="text-slate-300 text-sm">Welcome, <span className="text-white font-medium">{user.name}</span>.</p>
          <p className="text-slate-400 text-sm">You currently have <span className="text-white">{user.credits}</span> free credits and {user.subscribed ? 'an active subscription' : 'no subscription' }.</p>

          <div className="bg-slate-800 p-4 rounded border border-slate-700">
            <h4 className="text-white font-semibold mb-2">Choose a Plan (Demo)</h4>

            <div className="flex gap-3">
              <label className={`flex-1 p-3 rounded border ${plan === 'standard' ? 'border-blue-500 bg-slate-900' : 'border-slate-700'}`}>
                <input type="radio" name="plan" className="mr-2" checked={plan === 'standard'} onChange={() => setPlan('standard')} />
                <div className="text-sm font-medium">Standard — $9.99</div>
                <div className="text-xs text-slate-400">100 credits / month (demo)</div>
              </label>

              <label className={`flex-1 p-3 rounded border ${plan === 'pro' ? 'border-emerald-400 bg-slate-900' : 'border-slate-700'}`}>
                <input type="radio" name="plan" className="mr-2" checked={plan === 'pro'} onChange={() => setPlan('pro')} />
                <div className="text-sm font-medium">Pro — $19.99</div>
                <div className="text-xs text-slate-400">1000 credits / month (demo)</div>
              </label>
            </div>

            <div className="mt-4 text-xs text-slate-500">This is a local demo: no real billing will occur. Use the mock card fields to simulate Visa/Master payments (Visa card numbers typically start with 4, Mastercard with 5).</div>

            <div className="mt-4">
              <label className="text-sm text-slate-400 block mb-1">Card number</label>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
            </div>

            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label className="text-sm text-slate-400 block mb-1">Expiry (MM/YY)</label>
                <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="04/26" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
              </div>
              <div className="w-28">
                <label className="text-sm text-slate-400 block mb-1">CVC</label>
                <input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={handlePayMock} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
                {isProcessing ? 'Processing...' : `Pay ${plan === 'pro' ? '$19.99' : '$9.99'} (mock)`}
              </button>
              <button onClick={onClose} className="bg-slate-800 border border-slate-700 px-3 py-2 rounded text-slate-300">Cancel</button>
            </div>
          </div>

          <p className="text-xs text-slate-500">This interface is a simulated billing demo. For production integrate a payment provider (Stripe, PayPal).</p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;