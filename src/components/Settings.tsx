
import React, { useState, useRef, useEffect } from 'react';
import { 
  LogOut, 
  User, 
  Shield, 
  Info, 
  Bell, 
  Cloud, 
  Star, 
  ChevronRight, 
  Moon, 
  Sun, 
  Pencil, 
  Upload, 
  Sparkles, 
  Loader2, 
  Camera, 
  Check, 
  X,
  Palette,
  Quote,
  Image as ImageIcon
} from 'lucide-react';
import { UserProfile } from '../types';
import Modal from './Modal';
import { GoogleGenAI } from "@google/genai";

// Extensive list of premade high-quality vector icons based on the user's reference image
const PREMADE_ICONS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Wizard",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Gorilla",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Viking",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Unicorn",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Dragon",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Fox",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Panda",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cat",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Dog",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Ninja",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Ghost",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Rocket",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pizza",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Burger",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Gaming",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Music",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Camera",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Idea",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Success",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Shark",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Tiger",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Koala",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sloth",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zebra",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Monkey",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Bear",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Owl",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Lion",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Alien",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Skull",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Pirate",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Space",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Fire",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Snow",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Sun",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cloud",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Lightning",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Heart",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Shield"
];

// Define SettingsProps interface to fix compilation error
interface SettingsProps {
  user: UserProfile;
  onLogout: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout, isDarkMode, setIsDarkMode, onUpdateUser }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user.displayName || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhotoURL, setEditPhotoURL] = useState(user.photoURL || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditModalOpen) {
      setEditName(user.displayName || '');
      setEditEmail(user.email || '');
      setEditPhotoURL(user.photoURL || '');
    }
  }, [isEditModalOpen, user]);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateUser({
      ...user,
      displayName: editName,
      email: editEmail,
      photoURL: editPhotoURL
    });
    setIsEditModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditPhotoURL(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Generate AI avatar using Gemini model
  const generateAIAvatar = async () => {
    setIsGenerating(true);
    try {
      // Always initialize GoogleGenAI inside the call to ensure fresh API key usage
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `2D circular vector art icon of a character, clean lines, minimalist aesthetic, professional illustration style, soft colored background, high quality.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      let foundImage = '';
      if (response.candidates?.[0]?.content?.parts) {
        // Find the image part in the response as per guidelines
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            foundImage = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (foundImage) {
        setEditPhotoURL(foundImage);
        setGeneratedOptions(prev => [foundImage, ...prev].slice(0, 8));
      }
    } catch (err) {
      console.error("AI Generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
       {/* Main Profile Card - Enhanced UI */}
       <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-sm border border-slate-50 dark:border-slate-800 text-center transition-all relative">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-8 right-8 p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm"
          >
            <Pencil className="w-5 h-5" />
          </button>

          <div className="relative inline-block mb-6">
             <div className="w-32 h-32 rounded-[3rem] bg-indigo-50 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-2xl overflow-hidden mx-auto transition-all">
                <img src={editPhotoURL || user.photoURL || ''} alt="User Profile" className="w-full h-full object-cover" />
             </div>
             <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-8 h-8 rounded-full border-[6px] border-white dark:border-slate-900 shadow-sm"></div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white transition-colors uppercase tracking-tight">{user.displayName || 'Guest User'}</h2>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs mt-1 transition-colors uppercase tracking-widest">{user.email || 'guest@example.com'}</p>
       </div>

       {/* Interface Preferences */}
       <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em] ml-6">Interface Preferences</h3>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]"
          >
             <div className="flex items-center gap-5">
                <div className={`p-3.5 rounded-2xl transition-colors ${isDarkMode ? 'bg-indigo-900/30 text-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.2)]' : 'bg-amber-50 text-amber-500'}`}>
                   {isDarkMode ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
                </div>
                <div className="text-left">
                  <span className="font-black text-slate-900 dark:text-white block uppercase text-sm tracking-tight">Dark Theme</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isDarkMode ? 'Enabled' : 'Disabled'}</span>
                </div>
             </div>
             <div className={`w-14 h-7 rounded-full p-1.5 transition-colors duration-300 flex items-center ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`} />
             </div>
          </button>
       </div>

       {/* Account Ecosystem */}
       <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.3em] ml-6">Account Ecosystem</h3>
          <SettingsItem icon={<Shield className="text-indigo-500" />} label="Security & Privacy" />
          <SettingsItem icon={<Cloud className="text-sky-500" />} label="Cloud Backup" status="Enabled" />
       </div>

       <button 
          onClick={onLogout}
          className="w-full bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 p-6 rounded-[2.5rem] flex items-center justify-center gap-4 transition-all group active:scale-95 border border-rose-100/50 dark:border-rose-900/20"
        >
          <LogOut className="text-rose-500 w-6 h-6" />
          <span className="font-black text-rose-600 dark:text-rose-400 uppercase text-xs tracking-[0.2em]">Logout Session</span>
       </button>

       {/* Avatar Studio Modal - Highly Improved */}
       <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Avatar Studio">
          <form onSubmit={handleSaveProfile} className="space-y-10">
             {/* Current Preview */}
             <div className="flex flex-col items-center">
                <div className="relative mb-6">
                   <div className="w-40 h-40 rounded-[3.5rem] bg-slate-50 dark:bg-slate-800 border-8 border-white dark:border-slate-850 shadow-2xl overflow-hidden relative group">
                      <img src={editPhotoURL} alt="Preview" className="w-full h-full object-cover" />
                      {isGenerating && (
                         <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                         </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                      >
                         <Upload className="w-8 h-8 mb-1" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Device Upload</span>
                      </button>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                   
                   <button 
                      type="button"
                      onClick={generateAIAvatar}
                      disabled={isGenerating}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 active:scale-95 hover:scale-105 transition-all disabled:opacity-50"
                   >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Spawn with AI</span>
                   </button>
                </div>
             </div>

             {/* Icon Library Grid - Matching user's image request */}
             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">Premium Collection</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{PREMADE_ICONS.length} Icons</span>
                </div>
                
                <div className="grid grid-cols-5 gap-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                   {PREMADE_ICONS.map((url, idx) => (
                      <button 
                         key={idx}
                         type="button"
                         onClick={() => setEditPhotoURL(url)}
                         className={`aspect-square rounded-[1.2rem] overflow-hidden border-4 transition-all active:scale-90 ${editPhotoURL === url ? 'border-indigo-600 scale-105 shadow-lg' : 'border-transparent bg-slate-50 dark:bg-slate-800 opacity-60 hover:opacity-100'}`}
                      >
                         <img src={url} alt={`Icon ${idx}`} className="w-full h-full object-cover" />
                      </button>
                   ))}
                </div>
             </div>

             {/* Personal Details - Editable */}
             <div className="grid gap-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-4">Full Identity</label>
                   <div className="neumorphic-inset rounded-[1.8rem] transition-all focus-within:ring-2 focus-within:ring-indigo-500/50">
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="w-full bg-transparent p-5 font-bold text-slate-900 dark:text-white outline-none"
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] ml-4">Email Channel</label>
                   <div className="neumorphic-inset rounded-[1.8rem] transition-all focus-within:ring-2 focus-within:ring-indigo-500/50">
                      <input 
                        type="email" 
                        value={editEmail} 
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-transparent p-5 font-bold text-slate-900 dark:text-white outline-none"
                      />
                   </div>
                </div>
             </div>

             <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-[2.5rem] active:scale-95 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 py-5 bg-indigo-600 dark:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-[2.5rem] shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 active:scale-95 transition-all disabled:opacity-50"
                >
                  Apply Identity
                </button>
             </div>
          </form>
       </Modal>

       {/* Enhanced Branding Quote Footer */}
       <div className="flex flex-col items-center py-16 px-4">
          <div className="relative max-w-[280px] w-full">
            <Quote className="absolute -top-6 -left-4 w-8 h-8 text-slate-200 dark:text-slate-800 opacity-50" />
            <div className="space-y-1">
              <p className="text-[14px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.25em]">Track it,</p>
              <p className="text-[14px] font-black uppercase text-slate-400 dark:text-slate-600 tracking-[0.25em]">& Crack it!</p>
            </div>
            <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest text-right mt-4 italic">
              — Rihan Alam
            </p>
          </div>
       </div>
    </div>
  );
};

const SettingsItem: React.FC<{ icon: React.ReactNode; label: string; status?: string }> = ({ icon, label, status }) => (
  <button className="w-full bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm border border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98]">
     <div className="flex items-center gap-5">
        <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-2xl transition-colors">
           {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : icon}
        </div>
        <span className="font-black text-slate-900 dark:text-white transition-colors uppercase text-xs tracking-tight">{label}</span>
     </div>
     {status ? (
       <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-xl">
         <Check className="w-3 h-3 text-emerald-500" />
         <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-colors">{status}</span>
       </div>
     ) : (
       <ChevronRight className="w-5 h-5 text-slate-200 dark:text-slate-700 transition-colors" />
     )}
  </button>
);

export default Settings;
