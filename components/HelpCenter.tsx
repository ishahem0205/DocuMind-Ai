import React, { useMemo, useState } from 'react';
import { X, Search, Mail } from 'lucide-react';

interface FAQ {
  id: string;
  q: string;
  a: string;
  tags?: string[];
}

const defaultFaqs: FAQ[] = [
  { id: 'faq-1', q: 'How do I upload a document?', a: 'Use the Upload area on the dashboard. Accepts PDF, PNG, JPG. Maximum recommended size 10MB.' },
  { id: 'faq-2', q: 'How are credits consumed?', a: 'Each successful analysis consumes 1 credit for non-subscribers. Subscribers receive credits as part of their plan.' },
  { id: 'faq-3', q: 'Is my API key secure?', a: 'In this demo the key may be exposed. For production, move API calls to a backend to keep keys secret.' },
  { id: 'faq-4', q: 'What formats are supported?', a: 'PDF and image formats (PNG, JPG). OCR works on image-based pages.' },
  { id: 'faq-5', q: 'How do I request a new feature?', a: 'Open the Feedback form and choose "Feature Request", describe your idea and the team will review it.' },
  { id: 'faq-6', q: 'What is the subscription model?', a: 'Mock subscription: subscribing grants extra credits and removes limits in the demo. Real billing is not enabled.' }
];

interface Props {
  onClose: () => void;
  onOpenFeedback?: () => void;
  supportEmail?: string; // default if not provided
}

export const HelpCenter: React.FC<Props> = ({ onClose, onOpenFeedback, supportEmail = 'support@documind.example' }) => {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const faqs = useMemo(() => defaultFaqs, []);
  const filtered = faqs.filter(f => (f.q + f.a + (f.tags || []).join(' ')).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50 overflow-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Help Center</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenFeedback?.()} className="text-sm text-slate-200 bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">Report / Feedback</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded text-slate-200 text-sm"
                placeholder="Search FAQs or topics..."
              />
            </div>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-slate-400 text-sm">No results. Try different keywords or open Feedback to report an issue.</p>
            )}

            {filtered.map(item => (
              <div key={item.id} className="bg-slate-800 border border-slate-700 rounded p-3">
                <button onClick={() => setActiveId(activeId === item.id ? null : item.id)} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white font-medium">{item.q}</div>
                    <div className="text-xs text-slate-400">{activeId === item.id ? 'Hide' : 'Show'}</div>
                  </div>
                </button>
                {activeId === item.id && (
                  <div className="mt-2 text-sm text-slate-300">{item.a}</div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-sm text-slate-200 font-semibold mb-2">Contact Support</h4>
            <p className="text-sm text-slate-400 mb-3">If you need direct help, email us at:</p>
            <div className="flex gap-2 items-center">
              <a className="flex items-center gap-2 bg-blue-600 px-3 py-2 rounded text-sm" href={`mailto:${supportEmail}?subject=DocuMind%20Support`}>
                <Mail size={14} /> {supportEmail}
              </a>
              <button onClick={() => onOpenFeedback?.()} className="bg-slate-800 px-3 py-2 rounded text-sm text-slate-200">Open Feedback Form</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
