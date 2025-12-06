import React, { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import { User } from '../types';

interface SubscriptionProps {
  user: User;
  onClose: () => void;
  onSubscribe: () => void;
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onClose, onSubscribe }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayMock = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    // Simulate network/payment delay
    setTimeout(() => {
      // Simulate successful payment
      // In real integration you would call backend and use Stripe/Checkout
      onSubscribe();
      setIsProcessing(false);
      alert('Mock payment success — subscription activated.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6">
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
            <h4 className="text-white font-semibold">Pro Plan — Mock Payment</h4>
            <p className="text-slate-400 text-sm">Monthly access + 100 credits (mock). In production use Stripe or similar.</p>
            <div className="mt-3 flex gap-3">
              <button onClick={handlePayMock} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
                {isProcessing ? 'Processing...' : 'Pay $9.99 (mock)'}
              </button>
              <button onClick={onClose} className="bg-slate-800 border border-slate-700 px-3 py-2 rounded text-slate-300">Cancel</button>
            </div>
          </div>

          <p className="text-xs text-slate-500">This is a simulated payment flow for local testing only. Do not use in production.</p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;