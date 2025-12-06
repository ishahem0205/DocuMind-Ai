import React from 'react';
import { X, Info, CreditCard, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onClose: () => void;
  onSignup: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onClose, onSignup }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 p-3 rounded">
              <Sparkles className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Welcome to DocuMind</h2>
              <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                DocuMind extracts text, summarizes documents, detects potential tampering, and lets you chat with documents.
                New users receive 5 free credits to try the analysis feature. When credits run out, you can subscribe to get more credits and priority access.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t border-slate-800">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <Info className="text-blue-400" />
              How it works
            </div>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• Upload a PDF or image (OCR supported).</li>
              <li>• DocuMind analyzes the content and classifies the document.</li>
              <li>• Get short/medium/long summaries and view extracted entities.</li>
              <li>• Chat with the document to get contextual Q&A.</li>
            </ul>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 text-slate-200 font-semibold mb-2">
              <CreditCard className="text-emerald-400" />
              Subscription & Credits
            </div>
            <p className="text-slate-400 text-sm mb-2">
              New users: 5 free credits. Each analysis costs 1 credit for non-subscribers. Subscribe to receive 100 credits and remove limits (mock payment).
            </p>
            <p className="text-xs text-slate-500">Note: payments in this demo are simulated (mock).</p>
          </div>

          <div className="flex flex-col justify-between bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div>
              <h4 className="text-white font-semibold">Get started</h4>
              <p className="text-slate-400 text-sm mt-2">Sign up to claim your 5 free credits and start analyzing documents.</p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  // mark onboarding seen then open signup
                  try { localStorage.setItem('docuOnboardSeen', '1'); } catch (e) {}
                  onSignup();
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded font-medium"
              >
                Sign Up (Free 5 credits)
              </button>

              <button
                onClick={() => {
                  try { localStorage.setItem('docuOnboardSeen', '1'); } catch (e) {}
                  onClose();
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded border border-slate-600"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;