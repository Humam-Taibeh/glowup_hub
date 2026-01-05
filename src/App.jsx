/**
 * @import must be the first line to prevent Vite build errors.
 */
const CSS_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;700;900&display=swap');

:root { 
    font-family: 'Tajawal', sans-serif; 
    background-color: #050505; 
    color-scheme: dark; 
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.glass-noise::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.02;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
`;

import React, { useState, useEffect, useRef, useMemo, forwardRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, 
  signOut, signInWithEmailAndPassword 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, 
  deleteDoc, addDoc
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Flame, RefreshCw, X, Moon, Sun, CloudSun,
  Settings2, Rocket, ZapOff, ArrowRightCircle, Droplets, PlusCircle,
  Terminal, Repeat, User as UserIcon, Undo2, Shield,
  Fingerprint as IDIcon, Languages as LanguagesIcon, Maximize2, Construction, CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';

// ==========================================
// SECTION 1: GLOBAL INITIALIZATION (V43.2)
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDRB_9laY7I6lG6ZpgphX5dzKiUdhwl40M",
  authDomain: "glowup-omni.firebaseapp.com",
  projectId: "glowup-omni",
  storageBucket: "glowup-omni.appspot.com",
  messagingSenderId: "367281920",
  appId: "1:367281920:web:4f20e40a02d40909c00",
  measurementId: "G-G5X599L9Z9"
};

let firebaseApp, auth, db;
try {
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (e) {
  console.error("Firebase Sync Failure:", e);
}

const appId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_omni_v2';

const AI_QUOTES = {
  ar: ["كُن النسخة الأفضل منك اليوم.", "الاستمرارية هي مفتاح الهيبة الحقيقية.", "أنت المعماري، ابنِ مستقبلك بدقة."],
  en: ["Become the ultimate version of yourself.", "Consistency is the ultimate flex.", "Your future is being architected now."]
};

const LANGUAGES = {
  ar_jo: { welcome: "يا هلا يا {name}", yo: "عاش يا وحش! 🔥", add_task: "شو أهدافك لليوم؟", status: { missed: "فاتتني ❌", todo: "بانتظار البدء ⚪", doing: "قاعد بسويها 🟠", done: "خلصتها ✅" }, slots: { all: "الكل", morning: "الصبح", day: "النهار", night: "بليل" }, water: { label: "متتبع الماء", custom: "مخصص" }, identity_placeholder: "اكتب اسمك هون...", target: "Target" },
  en_slang: { welcome: "Yo {name}, u good? fr", yo: "Lock in! 🔒🔥", add_task: "Wuts the move? ngl", status: { missed: "L ❌", todo: "Waitin' ⚪", doing: "Cookin' 🟠", done: "W ✅" }, slots: { all: "All", morning: "Sunrise", day: "Grind", night: "Late" }, water: { label: "Water Hub", custom: "Custom" }, identity_placeholder: "Ur name here...", target: "Grind" }
};

// ==========================================
// SECTION 2: UI COMPONENTS
// ==========================================

const TaskCard = forwardRef(({ tk, t, onUpdate, onDelete }, ref) => (
  <motion.div
    ref={ref} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
    className={`relative group flex items-center gap-4 p-5 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-3xl border-[0.5px] border-white/10 shadow-lg transition-all glass-noise ${tk?.status === 'done' ? 'opacity-40' : ''}`}
  >
    <div onClick={(e) => { e.stopPropagation(); onUpdate(tk); }} className="w-12 h-12 rounded-2xl flex items-center justify-center border-[0.5px] border-white/10 bg-black/40 cursor-pointer hover:border-red-600/40 transition-colors">
      {tk?.status === 'done' ? <CheckCircle className="text-emerald-500" size={20}/> : <Circle className="text-zinc-700" size={20}/>}
    </div>
    <div className="flex-1 text-right overflow-hidden" dir="rtl">
      <h3 className={`text-sm md:text-base font-bold truncate ${tk?.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-100'}`}>{String(tk?.text || "")}</h3>
      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1 opacity-60">Status: {tk?.status || 'todo'}</p>
    </div>
    <button onClick={() => onDelete(tk.id)} className="p-2 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>
  </motion.div>
));
TaskCard.displayName = "TaskCard";

// ==========================================
// SECTION 3: MAIN APPLICATION ENGINE
// ==========================================
const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [tempName, setTempName] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("Locked in.");

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(useTransform(mouseX, [0, 1920], [-40, 40]));
  const glowY = useSpring(useTransform(mouseY, [0, 1080], [-40, 40]));

  const currentLang = profile?.lang || "ar_jo";
  const t = LANGUAGES[currentLang] || LANGUAGES.ar_jo;
  const isArabic = currentLang.startsWith('ar');

  // BOOTSTRAP EMERGENCY TIMEOUT
  useEffect(() => {
    const timer = setTimeout(() => {
        if (isLoading || authChecking) {
            setAuthChecking(false);
            setIsLoading(false);
        }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading, authChecking]);

  // ENGINE: Authentication Handshake
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (auth) await signInAnonymously(auth);
      } catch (e) { console.error("[AUTH] Fail:", e.message); }
      finally { setAuthChecking(false); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const handleMM = (e) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener('mousemove', handleMM);
    return () => { unsub(); window.removeEventListener('mousemove', handleMM); };
  }, []);

  // ENGINE: Data Synchronization
  useEffect(() => {
    if (!user || authChecking || !db) return;
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubP = onSnapshot(pRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setProfile({ name: "" }); // Trigger setup
      setIsLoading(false);
    }, () => setIsLoading(false));

    const tCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubT = onSnapshot(tCol, (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubP(); unsubT(); };
  }, [user, authChecking]);

  const handleUpdateName = async (n) => {
    setProfile(p => ({ ...p, name: n }));
    if (user && db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { name: n }, { merge: true });
  };

  const updateStatus = async (tk) => {
    if (!user || !tk) return;
    const next = tk.status === 'done' ? 'todo' : 'done';
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id), { status: next });
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), { text: newTaskText, status: 'todo', dateAdded: new Date().toISOString() });
    setNewTaskText("");
  };

  // ==========================================
  // VIEW: LOADING / AUTH ROUTING
  // ==========================================
  
  if (authChecking || isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="text-red-600" size={48} /></motion.div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-800 animate-pulse text-center">Engine Handshake Active</p>
      </div>
    );
  }

  // IF NO PROFILE NAME -> SHOW ONBOARDING
  if (!user || (user && !profile?.name)) {
    return (
      <div className="w-full min-h-screen bg-[#050000] flex items-center justify-center p-6 text-right font-sans" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05),transparent_75%)]"></div>
        <div className="w-full max-w-md bg-white/[0.01] backdrop-blur-3xl border-[0.5px] border-white/10 rounded-[4rem] p-12 shadow-2xl relative overflow-hidden glass-noise">
          <div className="text-center mb-12">
            <Rocket size={48} className="text-red-600 animate-bounce mx-auto" />
            <h1 className="text-4xl font-black text-white italic mt-6 uppercase tracking-tighter">GlowUp <span className="text-red-600 font-black">Omni</span></h1>
          </div>
          <div className="space-y-8">
            <input autoFocus type="text" placeholder={String(t?.identity_placeholder || "Ur Name...")} className="w-full bg-black/40 border border-white/10 rounded-[2rem] p-6 text-center text-2xl font-black text-white outline-none focus:ring-1 ring-red-600/40" onChange={(e)=>setTempName(e.target.value)} />
            <button onClick={async () => {
                if (!tempName.trim()) return;
                const pData = { name: String(tempName), aura: 0, lang: 'ar_jo', streak: 0, lastLogin: new Date().toISOString().split('T')[0], waterLevel: 0 };
                setProfile(pData);
                if (user && db) await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), pData, { merge: true });
            }} className="w-full bg-red-600 py-6 rounded-[2rem] font-black text-white shadow-xl text-lg uppercase active:scale-95 transition-all">Initialize identity ⚡</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: MAIN DASHBOARD (MAX-BALANCE)
  // ==========================================
  return (
    <div className="w-full min-h-screen bg-[#050505] text-white font-sans relative overflow-x-hidden">
      <style>{CSS_STYLES}</style>
      <motion.div style={{ x: glowX, y: glowY }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-red-600/[0.02] blur-[180px] rounded-full pointer-events-none -z-10" />

      {/* CORE WRAPPER */}
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 flex flex-col gap-12 py-12 pb-40">
        
        {/* RE-BALANCED HEADER */}
        <header className={`flex flex-col md:flex-row items-center justify-between gap-10 pb-12 border-b border-white/5 ${isArabic ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
          <div className={`flex-1 w-full ${isArabic ? 'text-right' : 'text-left'}`}>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-black italic tracking-tighter leading-none">
              {String(t?.welcome?.replace('{name}', '') || "Hi")} 
              <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase font-black"> {String(profile?.name || "User")}</span>
            </motion.h1>
            <div className={`flex items-center gap-4 mt-6 h-8 overflow-hidden ${isArabic ? 'justify-end' : 'justify-start'}`}>
              <AnimatePresence mode='wait'>
                <motion.p key={aiAdvice} initial={{ opacity: 0, x: isArabic ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isArabic ? -10 : 10 }} transition={{ duration: 0.3 }} className="font-light text-zinc-500 italic max-w-2xl truncate text-lg">"{aiAdvice}"</motion.p>
              </AnimatePresence>
            </div>
          </div>

          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-6 bg-white/[0.01] p-4 md:p-5 rounded-[3rem] border-[0.5px] border-white/10 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center gap-4 px-8 border-l border-white/5">
                <Flame size={28} className={profile?.streak > 0 ? "text-orange-500" : "text-zinc-800"} />
                <span className="text-6xl font-black tracking-tighter">{profile?.streak || 0}</span>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-5 hover:bg-white/5 rounded-[1.5rem] text-zinc-600 hover:text-red-600 transition-all active:scale-90 shadow-inner"><Settings2 size={28} /></button>
          </motion.div>
        </header>

        {/* INPUT HUB (FULL WIDTH FLUID) */}
        <div className="w-full max-w-5xl mx-auto space-y-12">
           <div className="w-full bg-white/[0.02] p-5 rounded-[3rem] border-[0.5px] border-white/10 shadow-2xl backdrop-blur-3xl focus-within:ring-1 ring-red-600/10 transition-all glass-noise">
              <div className="flex items-center gap-5 w-full">
                 <div className="flex-1 flex items-center px-8 bg-black/40 rounded-[2.5rem] border border-white/10 min-h-[70px]">
                    <Plus size={24} className="text-zinc-700" />
                    <input value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleAddTask()} placeholder={String(t?.add_task || "What's next?")} className="bg-transparent flex-1 text-xl font-bold text-white outline-none py-4 px-2" />
                 </div>
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddTask} className="bg-red-600 p-6 rounded-[2rem] hover:bg-red-500 shadow-xl transition-all text-white"><ArrowRightCircle size={32}/></motion.button>
              </div>
           </div>

           {/* BALANCED MATRIX GRID */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode='popLayout'>
              {tasks.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center gap-6">
                   <ZapOff size={80} className="text-zinc-800" />
                   <p className="text-2xl font-black italic tracking-widest uppercase text-zinc-800">Clear Orbit</p>
                </motion.div>
              ) : tasks.map((tk) => (<TaskCard key={tk.id} tk={tk} t={t} onUpdate={updateStatus} onDelete={(id) => deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id))} onEdit={(task) => {}} />))}
              </AnimatePresence>
           </div>
        </div>

        {/* SETTINGS (TOTAL ISOLATION) */}
        <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#050505] backdrop-blur-3xl z-0" onClick={()=>setShowSettings(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white/[0.05] border-[0.5px] border-white/10 p-16 rounded-[4rem] shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar glass-noise z-10">
               <button onClick={()=>setShowSettings(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-colors z-20"><X size={32}/></button>
               <div className="space-y-16 text-left" dir="ltr">
                  <h2 className="text-4xl font-black italic mb-12 text-red-600 tracking-tighter uppercase">System Config</h2>
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-zinc-500 border-b border-white/5 pb-4"><IDIcon size={20} className="text-red-600" /><label className="text-[10px] font-black uppercase tracking-[0.5em] block italic">Profile Settings</label></div>
                      <div className="bg-black/40 border-[0.5px] border-white/10 rounded-2xl p-5 flex items-center gap-4 group focus-within:border-red-600/40 transition-all"><UserIcon size={18} className="text-zinc-700" /><input type="text" value={profile?.name || ""} onChange={(e) => handleUpdateName(e.target.value)} placeholder="Your Name..." className="bg-transparent flex-1 text-zinc-100 font-bold outline-none" /></div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-zinc-500 border-b border-white/5 pb-4"><LanguagesIcon size={20} className="text-red-600" /><label className="text-[10px] font-black uppercase tracking-[0.5em] block italic">System Tone</label></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{['ar_jo', 'en_slang'].map(langId => (<button key={langId} onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { lang: langId }); }} className={`p-8 rounded-[2rem] font-black text-xs transition-all border-[0.5px] flex items-center justify-between px-10 ${currentLang === langId ? 'border-red-600 text-white bg-red-600/5' : 'border-white/5 text-zinc-700 bg-white/[0.01] hover:bg-white/5'}`}><span>{langId === 'ar_jo' ? 'AR - Urban' : 'EN - Slang'}</span>{currentLang === langId && <CheckCircle2 size={20} className="text-red-500" />}</button>))}</div>
                    </div>
                    <button onClick={async ()=>{ await signOut(auth); window.location.reload(); }} className="w-full py-8 bg-zinc-950 border-[0.5px] border-red-600/20 text-red-500 rounded-3xl font-black uppercase tracking-[0.5em] shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 leading-none">End Session</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* REFINED STATIC FOOTER */}
        <footer className="mt-64 pt-24 border-t border-white/5 flex flex-col items-center justify-center opacity-60 gap-16 text-center">
          <div className="w-full flex justify-between items-center text-zinc-800 max-w-5xl">
             <div className="flex items-center gap-2"><Shield size={14} /><p className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted System • AI Core Active</p></div>
             <div className="flex items-center gap-2"><p className="text-[8px] font-black uppercase tracking-[0.3em]">GlowUp Omni Absolute • Build V43.2</p><Rocket size={14} /></div>
          </div>
          
          <div className="flex flex-col items-center group cursor-default">
             <div className="relative">
                <motion.p 
                  transition={{ duration: 0.1 }} 
                  whileHover={{ color: "#ef4444", textShadow: "0 0 35px rgba(239,68,68,1)" }} 
                  className="text-3xl md:text-5xl font-black tracking-[0.4em] uppercase leading-none text-zinc-900 transition-colors cursor-pointer select-none whitespace-nowrap not-italic"
                >
                    HUMAM TAIBEH
                </motion.p>
                <motion.div initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.2 }} className="absolute -bottom-4 left-0 w-full h-[1px] bg-red-600 origin-center" />
             </div>
             <p className="text-[8px] font-black text-zinc-900 uppercase tracking-[1.2em] mt-10 opacity-40 uppercase">Sovereign Productivity Engine • © 2026</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
