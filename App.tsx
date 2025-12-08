import React, { useEffect, useState } from 'react';
import {
  FileSearch,
  MessageSquareText,
  Files,
  Menu,
  LayoutDashboard,
  Github,
  Brain,
  User as UserIcon,
  LogOut,
  CreditCard
} from 'lucide-react';

import { FileUpload } from './components/FileUpload';
import { AnalysisView } from './components/AnalysisView';
import { ChatInterface } from './components/ChatInterface';
import { SimilarityView } from './components/SimilarityView';
import { analyzeDocument } from './services/geminiService';
import { AnalysisResult, AnalysisStatus, UploadedFile, ChatMessage, User } from './types';

import { Auth } from './components/Auth';
import { Onboarding } from './components/Onboarding';
import { HelpCenter } from './components/HelpCenter';
import Feedback from './components/Feedback';
import AdminFeedback from './components/AdminFeedback';

// Direct imports to avoid barrel/export mismatches
import { SubscriptionProvider, useSubscription } from './components/SubscriptionContext';
import Subscription from './components/Subscription';
import PricingPage from './components/PricingPage';
import PaymentModal from './components/PaymentModal';

function AppInner() {
  const [activeTab, setActiveTab] = useState<'analyze' | 'chat' | 'compare' | 'pricing'>('analyze');
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatMessage[]>>({});

  // Auth & subscription state
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [showSubscription, setShowSubscription] = useState(false);

  // Payment modal (pricing flow)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<'standard' | 'pro'>('standard');

  // Onboarding & other modals
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAdminFeedback, setShowAdminFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const storageKeyForFile = (fileName: string) => `docuChat:${fileName}`;

  // SubscriptionContext (sync to local user object)
  const { currentPlan, creditsRemaining, isSubscribed } = useSubscription();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('docuUser');
      if (raw) {
        setUser(JSON.parse(raw) as User);
      }
    } catch (err) {
      console.error('Failed to load user from storage', err);
    }
  }, []);

  useEffect(() => {
    try {
      const seen = localStorage.getItem('docuOnboardSeen');
      if (!seen) {
        setShowOnboarding(true);
      }
    } catch (err) {}
  }, []);

  // Persist user whenever it changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem('docuUser', JSON.stringify(user));
      else localStorage.removeItem('docuUser');
    } catch (err) {
      console.error('Failed to persist user to storage', err);
    }
  }, [user]);

  // Sync subscription context into the persisted `user` so credits and subscribed flag stay consistent
  useEffect(() => {
    if (!user) return;
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, subscribed: isSubscribed, credits: creditsRemaining };
      try { localStorage.setItem('docuUser', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  }, [isSubscribed, creditsRemaining]);

  const handleAnalyze = async (uploadedFile: UploadedFile) => {
    if (!user) {
      setAuthMode('signup');
      setShowAuth(true);
      return;
    }

    if (!user.subscribed && user.credits <= 0) {
      setShowSubscription(true);
      return;
    }

    setFile(uploadedFile);
    setStatus(AnalysisStatus.ANALYZING);
    setResult(null);
    setError(null);
    setActiveTab('analyze');

    try {
      const data = await analyzeDocument(uploadedFile.base64, uploadedFile.mimeType);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);

      const key = storageKeyForFile(uploadedFile.file.name);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Array<{ role: 'user' | 'model'; text: string; timestamp: string }>;
          const restored = parsed.map(m => ({ role: m.role, text: m.text, timestamp: new Date(m.timestamp) }));
          setChatSessions(prev => ({ ...prev, [uploadedFile.file.name]: restored }));
        } catch (err) {
          setChatSessions(prev => ({ ...prev, [uploadedFile.file.name]: [] }));
        }
      } else {
        setChatSessions(prev => ({
          ...prev,
          [uploadedFile.file.name]: [
            { role: 'model', text: `Hi! I've analyzed ${uploadedFile.file.name}. Ask me anything about it.`, timestamp: new Date() }
          ]
        }));
      }

      // Deduct 1 credit on successful analysis if not subscribed
      if (user && !user.subscribed) {
        setUser(prev => {
          if (!prev) return prev;
          const next: User = { ...prev, credits: Math.max(0, prev.credits - 1) };
          localStorage.setItem('docuUser', JSON.stringify(next));
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze document. Please ensure the file is valid and try again.");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const clearSession = () => {
    if (!file) return;
    const key = storageKeyForFile(file.file.name);
    localStorage.removeItem(key);
    setChatSessions(prev => {
      const copy = { ...prev };
      delete copy[file.file.name];
      return copy;
    });
    setFile(null);
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setShowAuth(false);
    try { localStorage.setItem('docuOnboardSeen', '1'); } catch (e) {}
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    if (!confirm('Logout and clear local user session?')) return;
    setUser(null);
  };

  const handleSubscribeSuccess = (opts?: { creditsGranted?: number }) => {
    if (!user) return;
    const creditsGranted = opts?.creditsGranted ?? 100;
    const next: User = {
      ...user,
      subscribed: true,
      credits: Math.max(user.credits, creditsGranted),
      subscriptionExpires: null
    };
    setUser(next);
    setShowSubscription(false);
  };

  const requireAuthForFeedback = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const navItems = [
    { id: 'analyze', label: 'Dashboard & Analysis', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat with Document', icon: MessageSquareText },
    { id: 'compare', label: 'Similarity Check', icon: Files },
    { id: 'pricing', label: 'Pricing', icon: CreditCard },
  ] as const;

  // Landing component for unauthenticated users
  const Landing = () => {
    const [typed, setTyped] = React.useState('');
    const fullText = 'Extract insights, detect fraud, summarize documents, and chat with your files — powered by advanced AI.';
    React.useEffect(() => {
      let i = 0;
      let mounted = true;
      const tick = () => {
        if (!mounted) return;
        if (i <= fullText.length) {
          setTyped(fullText.slice(0, i));
          i += 1;
          setTimeout(tick, 28);
        }
      };
      tick();
      return () => { mounted = false; };
    }, []);

    const handleGetStarted = () => {
      setAuthMode('signup');
      setShowAuth(true);
    };

    const handleSignIn = () => {
      setAuthMode('login');
      setShowAuth(true);
    };

    const handleSubscribeOpen = () => {
      if (!user) {
        setAuthMode('signup');
        setShowAuth(true);
        return;
      }
      setShowSubscription(true);
    };

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">DocuMind AI – See Beyond the Text</h1>
          <p className="text-slate-400 text-lg mb-3">
            <span>{typed}</span>
            <span className="ml-1 inline-block w-1 bg-slate-200 animate-pulse align-middle" style={{ height: 18 }} />
          </p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-emerald-500 text-black rounded font-semibold hover:bg-emerald-400"
            >
              Get Started
            </button>
            <button
              onClick={handleSignIn}
              className="px-6 py-3 bg-slate-800 text-slate-200 rounded border border-slate-700 hover:bg-slate-700"
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="w-full max-w-4xl mt-12 grid gap-6 grid-cols-1 md:grid-cols-3">
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-2">Smart OCR</h3>
            <p className="text-slate-400 text-sm">Extract text from PDFs and images accurately.</p>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-2">Fraud Detection</h3>
            <p className="text-slate-400 text-sm">Detect signs of tampering and anomalies.</p>
          </div>
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-2">Contextual Chat</h3>
            <p className="text-slate-400 text-sm">Ask questions about your documents instantly.</p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="w-full max-w-4xl mt-12">
          <h2 className="text-2xl font-bold text-white mb-4">Pricing</h2>
          <p className="text-slate-400 text-sm mb-6">Choose a plan that fits your workflow — billing shown is a demo only.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Free</h3>
                  <p className="text-slate-400 text-sm">Starter tier for casual use</p>
                </div>
                <div className="text-2xl font-bold text-emerald-400">Free</div>
              </div>
              <ul className="mt-4 text-slate-300 text-sm space-y-2">
                <li>• 5 credits</li>
                <li>• Basic OCR & summaries</li>
                <li>• Chat with single document</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded"
                >
                  Get Free
                </button>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Standard</h3>
                  <p className="text-slate-400 text-sm">For frequent document users</p>
                </div>
                <div className="text-2xl font-bold text-blue-400">$9.99</div>
              </div>
              <ul className="mt-4 text-slate-300 text-sm space-y-2">
                <li>• 100 credits / month</li>
                <li>• Priority analysis</li>
                <li>• Similarity checks</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => { if (!user) { setAuthMode('signup'); setShowAuth(true); return; } setPaymentPlan('standard'); setShowPaymentModal(true); }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
                >
                  Choose Standard
                </button>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Pro</h3>
                  <p className="text-slate-400 text-sm">For teams and heavy use</p>
                </div>
                <div className="text-2xl font-bold text-emerald-400">$19.99</div>
              </div>
              <ul className="mt-4 text-slate-300 text-sm space-y-2">
                <li>• 1000 credits / month</li>
                <li>• Highest priority & SLA (demo)</li>
                <li>• Advanced fraud reports</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={() => { if (!user) { setAuthMode('signup'); setShowAuth(true); return; } setPaymentPlan('pro'); setShowPaymentModal(true); }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded"
                >
                  Choose Pro
                </button>
              </div>
            </div>
          </div>
        </div>

       <div className="max-w-4xl mt-10 text-slate-500 text-sm">
  <h4 className="text-slate-200 font-semibold mb-2">About</h4>
  <section className="max-w-4xl mx-auto p-6 leading-relaxed">
    <h1 className="text-3xl font-bold mb-4">About DocuMind AI</h1>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Our Mission</h2>
    <p>
      DocuMind AI exists to make understanding documents effortless. In a world overflowing with 
      information, we focus on clarity — transforming long pages, complex reports, and messy PDFs 
      into clean, sharp insights. Our mission is simple: help people learn faster, work smarter, 
      and think deeper.
    </p>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Who We Are</h2>
    <p>
      We're a homegrown team from Dhaka, Bangladesh, built by three curious minds: 
      <strong> Shahriar Hasan</strong>, <strong> Shukriyan Ahamed</strong>, and 
      <strong> Samir Uddin</strong>. A shared belief drives us — that students and researchers 
      deserve tools that actually save time instead of wasting it.
    </p>
    <p className="mt-2">
      We're builders with a traditional work ethic and a future-focused vision. We believe in clean 
      design, honest results, and tech that feels like a helping hand — not a headache.
    </p>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Our Approach</h2>
    <p>
      DocuMind combines proven analysis logic with modern AI power. We keep things:
    </p>
    <ul className="list-disc pl-6 mt-2 space-y-1">
      <li><strong>Fast</strong> — results in seconds</li>
      <li><strong>Accurate</strong> — built for trust</li>
      <li><strong>Multi-format ready</strong> — PDF, DOCX, images, and more</li>
      <li><strong>Private</strong> — your data stays yours</li>
      <li><strong>Simple</strong> — no learning curve, no complication</li>
    </ul>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Leadership</h2>
    <p>
      Shahriar, Shukriyan, and Samir lead DocuMind with a grounded and practical mindset — asking 
      tough questions, demanding real results, and refusing shortcuts. Their vision drives the 
      platform forward.
    </p>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Our Values</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li><strong>Privacy First</strong> — your documents stay secure.</li>
      <li><strong>Speed With Purpose</strong> — fast and meaningful answers.</li>
      <li><strong>Clarity Over Complexity</strong> — no clutter, just insight.</li>
      <li><strong>Built for People</strong> — real users, real impact.</li>
      <li><strong>Empower Learning</strong> — technology that helps people grow.</li>
      <li><strong>Always Improving</strong> — evolving with every update.</li>
    </ul>

    <h2 className="text-2xl font-semibold mt-6 mb-2">Join Our Team</h2>
    <p>
      We're building the future of document understanding — one idea at a time. If you love tech, 
      design, or solving meaningful problems, we’d love to connect. DocuMind AI is more than a 
      platform; it's a growing community of curious thinkers.
    </p>

    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center gap-2 mt-4">
      <span className="text-lg">📧</span>
      <a href="mailto:porjectcse1@gmail.com" className="text-blue-400 hover:text-blue-300 underline text-sm font-medium">
        porjectcse1@gmail.com
      </a>
    </div>
  </section>
</div>

        <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-3">Legal</h3>
            <ul className="text-slate-300 space-y-2 text-sm list-disc list-inside">
              <li>Privacy Policy</li>
              <li>Terms and Conditions</li>
              <li>Disclaimer</li>
            </ul>
            <p className="text-slate-400 text-xs mt-3">These documents explain user rights, data handling, billing and legal disclaimers for using DocuMind AI.</p>
          </div>

          <div className="bg-slate-800/40 p-6 rounded-lg border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-3">Learn More</h3>
            <ul className="text-slate-300 space-y-2 text-sm list-disc list-inside">
              <li>FAQ</li>
              <li>Tutorials</li>
              <li>Blog</li>
            </ul>
            <p className="text-slate-400 text-xs mt-3">Helpful resources to get the most out of DocuMind — documentation, guides, and support channels.</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col
        ${isSidebarCollapsed ? 'w-20' : 'w-64'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        <div className="p-4 border-b border-slate-800 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500`}>
              <Brain className="text-white h-5 w-5" />
            </div>
            <h1 className={`text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              DocuMind AI
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="p-2 rounded hover:bg-slate-900/50"
            >
              <Menu size={16} />
            </button>

            <button
              className="lg:hidden p-2 rounded hover:bg-slate-900/50"
              onClick={() => setIsSidebarOpen(open => !open)}
              title="Toggle sidebar"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === item.id
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}
              `}
            >
              <item.icon size={18} />
              <span className={`${isSidebarCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
            </button>
          ))}

          <div className="mt-4 border-t border-slate-800 pt-4 space-y-2 px-1">
            <button
              onClick={() => { setShowAbout(true); setIsSidebarOpen(false); }}
              title="About"
              className="w-full text-left text-slate-400 hover:text-slate-200 text-sm px-3 py-2 rounded"
            >
              <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>About</span>
            </button>
            <button
              onClick={() => { setShowHelp(true); setIsSidebarOpen(false); }}
              title="Help Center"
              className="w-full text-left text-slate-400 hover:text-slate-200 text-sm px-3 py-2 rounded"
            >
              <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Help Center</span>
            </button>
            <button
              onClick={() => {
                if (!user) { setAuthMode('login'); setShowAuth(true); }
                else setShowFeedback(true);
                setIsSidebarOpen(false);
              }}
              title="Feedback"
              className="w-full text-left text-slate-400 hover:text-slate-200 text-sm px-3 py-2 rounded"
            >
              <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Feedback</span>
            </button>

            {user && user.isAdmin && (
              <button
                onClick={() => { setShowAdminFeedback(true); setIsSidebarOpen(false); }}
                className="w-full text-left text-slate-400 hover:text-slate-200 text-sm px-3 py-2 rounded"
                title="Admin: View Feedback"
              >
                <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Admin: View Feedback</span>
              </button>
            )}
          </div>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-2">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-800/50 rounded p-2 border border-slate-700">
                <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Active User</span>
                </div>
              </div>

              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 text-sm">
                    <UserIcon size={16} />
                    <span className={`font-medium ${isSidebarCollapsed ? 'hidden' : 'inline'}`}>{user.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <span className={`text-xs bg-blue-600/20 px-2 py-1 rounded ${isSidebarCollapsed ? 'hidden' : 'inline'}`}>
                      {user.subscribed ? '⭐ Subscribed' : `💰 ${user.credits} credits`}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded border border-red-600/20 text-sm font-medium transition-colors"
                  >
                    <LogOut size={14} />
                    <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAuthMode('login'); setShowAuth(true); }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition-colors"
                >
                  <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Sign In</span>
                  {isSidebarCollapsed && <UserIcon size={16} />}
                </button>
              )}
            </div>
          </div>

          <a href="https://github.com/shukriyan-ahamed/DocuMind-AI-Intelligent-Document-Analysis-Fraud-Detection-System" className={`flex items-center gap-2 text-xs text-slate-500 mt-4 hover:text-slate-300 transition-colors justify-center ${isSidebarCollapsed ? 'flex-col' : ''}`}>
            <Github size={14} /> <span className={`${isSidebarCollapsed ? 'hidden' : 'inline'}`}>Project</span>
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto space-y-6">
            {!user ? (
              <Landing />
            ) : (
              <>
                {activeTab === 'compare' ? (
                  <SimilarityView />
                ) : activeTab === 'pricing' ? (
                  <PricingPage onOpenPayment={(plan) => { setPaymentPlan(plan); setShowPaymentModal(true); }} />
                ) : (
                  <>
                    {(!file || status === AnalysisStatus.IDLE) && (
                      <div className="animate-fade-in">
                        <div className="text-center mb-10">
                          <h2 className="text-3xl font-bold text-white mb-4">Intelligent Document Analysis</h2>
                          <p className="text-slate-400 max-w-2xl mx-auto">
                            Upload documents to extract text, detect fraud, summarize content, and analyze entities using advanced AI.
                          </p>
                        </div>
                        <div className="h-64">
                          <FileUpload
                            onFileSelect={handleAnalyze}
                            selectedFile={file}
                            onClear={clearSession}
                            label="Drop your document here (PDF/Image)"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
                          {[
                            { title: "Smart OCR", desc: "Extract text from images and scans instantly." },
                            { title: "Fraud Detection", desc: "Identify font inconsistencies & tampering." },
                            { title: "Auto Summary", desc: "Get concise summaries in seconds." },
                            { title: "Entity Extraction", desc: "Pull names, dates, and prices automatically." },
                            { title: "Doc Classification", desc: "Auto-tag invoices, resumes, and more." },
                            { title: "Contextual Chat", desc: "Ask questions directly to your documents." }
                          ].map((feature, idx) => (
                            <div key={idx} className="bg-slate-800/50 border border-slate-800 p-6 rounded-xl hover:bg-slate-800 transition-colors">
                              <h3 className="text-blue-400 font-semibold mb-2">{feature.title}</h3>
                              <p className="text-slate-400 text-sm">{feature.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {status === AnalysisStatus.ANALYZING && (
                      <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in">
                        <div className="relative w-24 h-24 mb-6">
                          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                          <Brain className="absolute inset-0 m-auto text-blue-400 animate-pulse" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold text-white">Analyzing Document...</h3>
                        <p className="text-slate-400 mt-2">Extracting entities, checking authenticity, and summarizing.</p>
                      </div>
                    )}

                    {status === AnalysisStatus.ERROR && (
                      <div className="flex flex-col items-center justify-center h-[50vh] animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl">⚠️</span>
                        </div>
                        <h3 className="text-xl font-semibold text-white">Analysis Failed</h3>
                        <p className="text-red-400 mt-2 max-w-md">{error}</p>
                        <button
                          onClick={clearSession}
                          className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                        >
                          Try Again
                        </button>
                      </div>
                    )}

                    {status === AnalysisStatus.COMPLETED && file && result && (
                      <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 sticky top-0 z-10 backdrop-blur">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                              <FileSearch className="text-blue-400" size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-sm truncate max-w-[200px]">{file.file.name}</h3>
                              <p className="text-xs text-slate-500">Analyzed successfully</p>
                            </div>
                          </div>

                          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button
                              onClick={() => setActiveTab('analyze')}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'analyze' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              Analysis
                            </button>
                            <button
                              onClick={() => setActiveTab('chat')}
                              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                              Chat
                            </button>
                          </div>

                          <button onClick={clearSession} className="text-xs text-slate-400 hover:text-white underline">
                            Analyze New File
                          </button>
                        </div>

                        {activeTab === 'analyze' ? (
                          <AnalysisView result={result} fileName={file.file.name} />
                        ) : (
                          <ChatInterface
                            file={file}
                            messages={chatSessions[file.file.name] ?? []}
                            onMessagesChange={(msgs: ChatMessage[]) => {
                              setChatSessions(prev => ({ ...prev, [file.file.name]: msgs }));
                              try {
                                const toStore = msgs.map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp.toISOString() }));
                                localStorage.setItem(storageKeyForFile(file.file.name), JSON.stringify(toStore));
                              } catch (err) {
                                console.error('Failed to persist chat to localStorage', err);
                              }
                            }}
                          />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Auth & Subscription modals */}
      {showAuth && (
        <Auth
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onLogin={(u) => handleLogin(u)}
        />
      )}

      {showSubscription && user && (
        <Subscription
          user={user}
          onClose={() => setShowSubscription(false)}
          onSubscribe={(opts) => handleSubscribeSuccess(opts)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          initialPlan={paymentPlan}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showOnboarding && (
        <Onboarding
          onClose={() => {
            setShowOnboarding(false);
            try { localStorage.setItem('docuOnboardSeen', '1'); } catch (e) {}
          }}
          onSignup={() => {
            setAuthMode('signup');
            setShowAuth(true);
            try { localStorage.setItem('docuOnboardSeen', '1'); } catch (e) {}
          }}
        />
      )}

      {showHelp && (
        <HelpCenter
          onClose={() => setShowHelp(false)}
          onOpenFeedback={() => {
            setShowHelp(false);
            if (!user) { setAuthMode('login'); setShowAuth(true); }
            else setShowFeedback(true);
          }}
          supportEmail="porjectcse1@gmail.com"
        />
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">About DocuMind AI</h2>
              <button onClick={() => setShowAbout(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
            </div>

            <div className="space-y-6 text-slate-300 text-sm max-h-96 overflow-y-auto pr-2">
              <section>
                <h3 className="text-blue-400 font-semibold text-lg mb-2">Our Mission</h3>
                <p>
                  DocuMind AI exists to make understanding documents effortless. In a world overflowing with information, we focus on clarity — transforming long pages, complex reports, and messy PDFs into clean, sharp insights.
                </p>
              </section>
            </div>

            <button onClick={() => setShowAbout(false)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors mt-6">
              Close
            </button>
          </div>
        </div>
      )}

      {showFeedback && (
        <Feedback
          onClose={() => setShowFeedback(false)}
          onRequireAuth={() => requireAuthForFeedback()}
          supportEmail="porjectcse1@gmail.com"
        />
      )}

      {showAdminFeedback && user && user.isAdmin && (
        <AdminFeedback
          onClose={() => setShowAdminFeedback(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SubscriptionProvider>
      <AppInner />
    </SubscriptionProvider>
  );
}