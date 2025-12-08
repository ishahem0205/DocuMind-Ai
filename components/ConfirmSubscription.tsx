import React from 'react';
import { CheckCircle } from 'lucide-react';

interface Props {
  plan: 'standard' | 'pro' | 'free';
  credits: number;
  onClose?: () => void;
}

export const ConfirmSubscription: React.FC<Props> = ({ plan, credits, onClose }) => {
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-sm p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle className="text-emerald-400" size={40} />
          <h3 className="text-white font-semibold">Payment Successful</h3>
          <p className="text-slate-300 text-sm">Your subscription is now active ({plan}). {credits} credits have been added to your account.</p>
          <div className="mt-4 w-full">
            <button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded">Continue</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSubscription;