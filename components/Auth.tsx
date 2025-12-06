import React, { useEffect, useState } from 'react';
import { User as UserIcon, X, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface AuthProps {
  onClose: () => void;
  onLogin: (user: User) => void;
  initialMode?: 'signup' | 'login';
}

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  credits: number;
  subscribed: boolean;
  subscriptionExpires?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Auth: React.FC<AuthProps> = ({ onClose, onLogin, initialMode = 'signup' }) => {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    // Load remembered email on login mode
    if (initialMode === 'login') {
      const remembered = localStorage.getItem('docuRememberedEmail');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    }
  }, [initialMode]);

  const loadStoredUsers = (): StoredUser[] => {
    try {
      const raw = localStorage.getItem('docuUsers');
      if (!raw) return [];
      return JSON.parse(raw) as StoredUser[];
    } catch {
      return [];
    }
  };

  const saveStoredUsers = (users: StoredUser[]) => {
    try {
      localStorage.setItem('docuUsers', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  };

  const validateEmail = (e: string) => EMAIL_RE.test(e.trim());

  const handleSignup = () => {
    if (!name.trim()) {
      alert('Please enter a display name.');
      return;
    }
    if (!email.trim() || !validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    const users = loadStoredUsers();
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      alert('An account with this email already exists. Please log in.');
      setMode('login');
      return;
    }

    const id = `user_${Date.now()}`;
    const newStored: StoredUser = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      credits: 5,
      subscribed: false,
      subscriptionExpires: null
    };

    users.push(newStored);
    saveStoredUsers(users);

    const publicUser: User = {
      id: newStored.id,
      name: newStored.name,
      email: newStored.email,
      credits: newStored.credits,
      subscribed: newStored.subscribed,
      subscriptionExpires: newStored.subscriptionExpires
    };

    onLogin(publicUser);
    onClose();
  };

  const handleLogin = () => {
    if (!email.trim() || !validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!password) {
      alert('Please enter your password.');
      return;
    }

    const users = loadStoredUsers();
    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!found) {
      alert('Invalid credentials. Please check email/password or Sign Up.');
      return;
    }

    // Handle "Remember me"
    if (rememberMe) {
      localStorage.setItem('docuRememberedEmail', email.trim().toLowerCase());
    } else {
      localStorage.removeItem('docuRememberedEmail');
    }

    const publicUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      credits: found.credits,
      subscribed: found.subscribed,
      subscriptionExpires: found.subscriptionExpires
    };

    onLogin(publicUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserIcon className="text-emerald-400" />
            <h3 className="text-white font-semibold">{mode === 'signup' ? 'Create Account' : 'Sign In'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400"><X /></button>
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-sm text-slate-400">Display name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 text-sm text-white" />
            </div>
          )}

          <div>
            <label className="text-sm text-slate-400">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 mt-1 text-sm text-white" />
          </div>

          <div>
            <label className="text-sm text-slate-400">Password</label>
            <div className="relative mt-1">
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="At least 8 characters" 
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'login' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-800 border border-slate-700 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer">
                Remember me
              </label>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400 mt-4">
            <div>
              {mode === 'signup' ? 'By signing up you get 5 starter credits.' : 'Welcome back — sign in to continue.'}
            </div>
            <button
              onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-blue-400 hover:underline"
            >
              {mode === 'signup' ? 'Already have an account? Sign in' : "No account? Create one"}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-slate-300 hover:bg-slate-700">Cancel</button>
            {mode === 'signup' ? (
              <button onClick={handleSignup} className="px-4 py-2 text-sm bg-emerald-500 text-black rounded hover:bg-emerald-400 font-medium">Create Account</button>
            ) : (
              <button onClick={handleLogin} className="px-4 py-2 text-sm bg-emerald-500 text-black rounded hover:bg-emerald-400 font-medium">Sign In</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;