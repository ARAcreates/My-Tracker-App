
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Library as LibraryIcon, 
  Settings as SettingsIcon,
  Plus,
  ChevronLeft,
  Trash2,
  CheckCircle2,
  Circle,
  LogOut,
  User,
  Loader2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { NavigationTab, Subject, Chapter, Section, Task, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import Settings from './components/Settings';
import Modal from './components/Modal';

const MOCK_GUEST: UserProfile = {
  uid: 'guest-123',
  displayName: 'Premium Guest',
  email: 'guest@example.com',
  photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=Guest',
  isAnonymous: true
};

/**
 * CLIENT ID UPDATED FROM SCREENSHOT
 */
const GOOGLE_CLIENT_ID = "7463253850-o4ei5n0av595k5a9qudl9p01nod3tjn4.apps.googleusercontent.com";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('mytracker_theme') === 'dark';
  });

  const googleBtnRef = useRef<HTMLDivElement>(null);
  
  // Critical: The origin must NOT have a trailing slash for Google Cloud Console
  const currentOrigin = window.location.origin.replace(/\/$/, "");

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = useCallback((response: any) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      const newUser: UserProfile = {
        uid: payload.sub,
        displayName: payload.name,
        email: payload.email,
        photoURL: payload.picture,
        isAnonymous: false
      };
      setUser(newUser);
      localStorage.setItem('mytracker_user', JSON.stringify(newUser));
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mytracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mytracker_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mytracker_user');
    const savedSubjects = localStorage.getItem('mytracker_subjects');
    const savedChapters = localStorage.getItem('mytracker_chapters');
    const savedTasks = localStorage.getItem('mytracker_tasks');
    
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    if (savedChapters) setChapters(JSON.parse(savedChapters));
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedUser) setUser(JSON.parse(savedUser));

    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkGoogle = () => {
      const g = (window as any).google;
      if (g && g.accounts) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: "popup",
          cancel_on_tap_outside: true
        });
        setGoogleInitialized(true);
      } else {
        setTimeout(checkGoogle, 150);
      }
    };
    checkGoogle();
  }, [handleCredentialResponse]);

  useEffect(() => {
    if (googleInitialized && !user && !isLoading && googleBtnRef.current) {
      const g = (window as any).google;
      try {
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: isDarkMode ? "filled_black" : "outline",
          size: "large",
          width: "320",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left"
        });
      } catch (err) {
        console.error("Google Button Render Error", err);
      }
    }
  }, [googleInitialized, user, isLoading, isDarkMode]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('mytracker_subjects', JSON.stringify(subjects));
      localStorage.setItem('mytracker_chapters', JSON.stringify(chapters));
      localStorage.setItem('mytracker_tasks', JSON.stringify(tasks));
    }
  }, [subjects, chapters, tasks, isLoading]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('mytracker_user');
    const g = (window as any).google;
    if (g && g.accounts) g.accounts.id.disableAutoSelect();
  };

  const handleGuestLogin = () => {
    setUser(MOCK_GUEST);
    localStorage.setItem('mytracker_user', JSON.stringify(MOCK_GUEST));
  };

  const updateUserProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('mytracker_user', JSON.stringify(updatedUser));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Accessing Vault</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans transition-colors duration-300">
        <div className="w-full max-w-sm text-center animate-in">
          <div className="flex flex-col items-center mb-12">
            <div className="bg-slate-900 dark:bg-indigo-600 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-2xl shadow-slate-200 dark:shadow-indigo-900/40">
              <LibraryIcon className="text-white w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 uppercase">MY TRACKER</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Cloud Powered Sync</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl dark:shadow-2xl border border-white dark:border-slate-800 space-y-8">
            <div className="flex flex-col items-center min-h-[50px]">
              <div ref={googleBtnRef} className="w-full flex justify-center">
                {!googleInitialized && (
                  <div className="flex items-center gap-3 text-slate-300 dark:text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Connecting Google...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full">
              <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">or</span>
              <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800"></div>
            </div>

            <button 
              onClick={handleGuestLogin}
              className="w-full py-5 px-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              Anonymous Guest Entrance
            </button>

            <div className="pt-2">
              <button 
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="text-slate-400 dark:text-slate-500 font-bold text-[9px] uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-indigo-500 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Auth Verification Hub
              </button>

              {showTroubleshooting && (
                <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-950 rounded-[2.5rem] border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 text-left animate-in">
                  <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 mb-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Fix Origin Mismatch</span>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed">
                      1. Copy the "Correct Origin" below.<br/>
                      2. In Google Console, delete existing origin.<br/>
                      3. Paste this one (NO trailing slash / at the end).<br/>
                      4. Add your email to "Test Users" in OAuth Consent Screen.
                    </p>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Correct Origin (Copy this)</p>
                      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-slate-800 shadow-inner group">
                        <code className="flex-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 truncate font-black">{currentOrigin}</code>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(currentOrigin); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="p-1 text-slate-300 hover:text-indigo-600 transition-all"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <header className="sticky top-0 z-40 premium-blur px-6 py-5 flex items-center justify-between border-b border-slate-100/50 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 dark:bg-indigo-600 p-2.5 rounded-xl transition-colors">
            <LibraryIcon className="text-white w-5 h-5" />
          </div>
          <h1 className="font-black text-lg tracking-tight text-slate-900 dark:text-white uppercase">MY TRACKER</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{user.displayName}</p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{user.isAnonymous ? 'Guest' : 'Pro Account'}</p>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
             <img src={user.photoURL || ''} alt="User Profile" className="w-full h-full object-cover" />
           </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-6">
        {activeTab === NavigationTab.DASHBOARD && (
          <Dashboard 
            subjects={subjects} 
            chapters={chapters} 
            tasks={tasks}
            setTasks={setTasks}
            setSubjects={setSubjects}
            setChapters={setChapters}
          />
        )}
        {activeTab === NavigationTab.LIBRARY && (
          <Library 
            subjects={subjects} 
            setSubjects={setSubjects}
            chapters={chapters} 
            setChapters={setChapters} 
          />
        )}
        {activeTab === NavigationTab.SETTINGS && (
          <Settings 
            user={user} 
            onLogout={handleLogout} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
            onUpdateUser={updateUserProfile}
          />
        )}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md rounded-[2.5rem] p-2 flex items-center gap-1 shadow-2xl z-50 ring-4 ring-white/10 dark:ring-black/10 transition-colors duration-300">
        <NavButton 
          active={activeTab === NavigationTab.DASHBOARD} 
          onClick={() => setActiveTab(NavigationTab.DASHBOARD)}
          icon={<LayoutDashboard className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === NavigationTab.LIBRARY} 
          onClick={() => setActiveTab(NavigationTab.LIBRARY)}
          icon={<LibraryIcon className="w-5 h-5" />}
        />
        <NavButton 
          active={activeTab === NavigationTab.SETTINGS} 
          onClick={() => setActiveTab(NavigationTab.SETTINGS)}
          icon={<SettingsIcon className="w-5 h-5" />}
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-[1.8rem] transition-all duration-500 active:scale-90 ${
      active 
      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/40' 
      : 'text-slate-500 hover:text-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
    }`}
  >
    {icon}
  </button>
);

export default App;
