import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { ChatMessage, User as UserType } from '../types';

type FeedbackKind = 'bug' | 'feature' | 'general';

interface FeedbackRecord {
  id: string;
  kind: FeedbackKind;
  subject: string;
  message: string;
  rating?: number;
  email?: string;
  fileName?: string;
  fileBase64?: string;
  date: string;
  user?: { id?: string; name?: string; email?: string };
}

interface FeedbackProps {
  onClose: () => void;
  currentUser?: UserType | null;
  // callback when feedback needs an authenticated user
  onRequireAuth?: () => void;
  // optional endpoint (Vite env var recommended)
  endpoint?: string;
}

export const Feedback: React.FC<FeedbackProps> = ({ onClose, currentUser, onRequireAuth, endpoint }) => {
  const [kind, setKind] = useState<FeedbackKind>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEmail(currentUser?.email || '');
  }, [currentUser]);

  const handleFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const fr = new FileReader();
    fr.onload = () => {
      const base64 = fr.result as string;
      setFileBase64(base64);
    };
    fr.readAsDataURL(file);
  };

  const reset = () => {
    setKind('general'); setSubject(''); setMessage(''); setRating(undefined); setFileName(undefined); setFileBase64(undefined);
  };

  const submitToBackend = async (payload: FeedbackRecord) => {
    try {
      // If endpoint is provided, try to send as JSON (with optional base64 file)
      const url = endpoint || (import.meta.env.VITE_FEEDBACK_ENDPOINT as string) || '';
      if (!url) throw new Error('No backend endpoint configured');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      return true;
    } catch (err) {
      console.warn('Backend feedback submission failed', err);
      return false;
    }
  };

  const handleSubmit = async () => {
    // require login to submit if no currentUser
    if (!currentUser) {
      if (onRequireAuth) {
        if (!confirm('You need to sign in to submit feedback. Sign in now?')) return;
        onRequireAuth();
        return;
      } else {
        alert('Sign in required to submit feedback.');
        return;
      }
    }

    if (!message.trim() && !subject.trim()) {
      alert('Please add a subject or message describing your feedback.');
      return;
    }

    setIsSaving(true);
    try {
      const id = `fb_${Date.now()}`;
      const payload: FeedbackRecord = {
        id,
        kind,
        subject,
        message,
        rating,
        email: email || undefined,
        fileName,
        fileBase64,
        date: new Date().toISOString(),
        user: currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
      };

      // First try backend if configured
      const posted = await submitToBackend(payload);
      if (posted) {
        alert('Thanks — feedback submitted to server.');
        reset();
        onClose();
        return;
      }

      // Fallback to localStorage
      const raw = localStorage.getItem('docuFeedbacks');
      const prev = raw ? JSON.parse(raw) as FeedbackRecord[] : [];
      prev.unshift(payload);
      localStorage.setItem('docuFeedbacks', JSON.stringify(prev));
      console.log('Saved feedback locally', payload);

      alert('Thanks — your feedback was saved locally (demo).');
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to save feedback', err);
      alert('Failed to save feedback. See console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Send Feedback</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <select value={kind} onChange={e => setKind(e.target.value as FeedbackKind)} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200">
              <option value="general">General</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature Request</option>
            </select>

            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)" className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200" />
          </div>

          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the issue or suggestion..." rows={6} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200" />

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400">Rating (optional)</label>
            <select value={rating ?? ''} onChange={e => setRating(e.target.value ? Number(e.target.value) : undefined)} className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200">
              <option value="">—</option>
              <option value="1">1 - Poor</option>
              <option value="2">2</option>
              <option value="3">3 - Okay</option>
              <option value="4">4</option>
              <option value="5">5 - Great</option>
            </select>

            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email (optional)" className="ml-auto bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200" />
          </div>

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} className="text-xs text-slate-400" />
            {fileName && <div className="text-xs text-slate-300">{fileName}</div>}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button onClick={onClose} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-300">Cancel</button>
            <button onClick={handleSubmit} disabled={isSaving} className="px-4 py-2 bg-emerald-500 text-black rounded text-sm">
              {isSaving ? 'Saving...' : 'Send Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;