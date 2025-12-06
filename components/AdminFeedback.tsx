import React, { useEffect, useState } from 'react';
import { X, Trash } from 'lucide-react';

interface FeedbackRecord {
  id: string;
  kind: string;
  subject: string;
  message: string;
  rating?: number;
  email?: string;
  fileName?: string;
  fileBase64?: string;
  date: string;
  user?: { id?: string; name?: string; email?: string };
}

export const AdminFeedback: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [items, setItems] = useState<FeedbackRecord[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('docuFeedbacks');
    const prev = raw ? JSON.parse(raw) as FeedbackRecord[] : [];
    setItems(prev);
  }, []);

  const handleClearLocal = () => {
    if (!confirm('Clear all locally stored feedback?')) return;
    localStorage.removeItem('docuFeedbacks');
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/50 overflow-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Admin — Feedback</h3>
          <div className="flex items-center gap-2">
            <button onClick={handleClearLocal} className="text-red-400 hover:text-red-300 flex items-center gap-1"><Trash size={14}/> Clear Local</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-slate-400">No locally saved feedback found.</p>
          ) : (
            items.map(it => (
              <div key={it.id} className="bg-slate-800 border border-slate-700 rounded p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-white font-semibold">{it.subject || '[no subject]'}</div>
                    <div className="text-xs text-slate-400">{it.kind} • {new Date(it.date).toLocaleString()}</div>
                    <div className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{it.message}</div>
                    {it.fileName && (
                      <div className="mt-2 text-xs text-slate-300">
                        Attachment: <a href={it.fileBase64} download={it.fileName} className="text-blue-400 underline">{it.fileName}</a>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    {it.user?.name && <div>{it.user.name}</div>}
                    {it.email && <div>{it.email}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;