import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, 
  GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, 
  deleteDoc, addDoc, serverTimestamp, query, where, getDocs, writeBatch
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, Zap, Dumbbell, Flame, Play, 
  Pause, RotateCcw, Settings, UserCircle, Clock, X, Moon, Heart, Brain, 
  Timer, Coffee, Swords, Rocket, Trophy, Power, Settings2, Sun, CloudSun, 
  Layout, Bot, Gem, RefreshCw, Activity, CheckCircle, Construction, 
  CalendarDays, ZapOff, Utensils, LayoutGrid, Loader2, Award, Zap as Bolt, 
  BarChart3, Binary, ShieldAlert, Fingerprint, Mail, Lock, ArrowRightCircle, 
  ShieldCheck, Droplets, Info, FastForward, Edit3, Filter, Trash, AlertCircle, PlusCircle,
  Terminal, Share2, Type, Maximize2, Minimize2, Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// SECTION 1: CONFIGURATION & ENVIRONMENT
// ==========================================

const getSafeEnv = (key) => {
  try {
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    return env[key];
  } catch (e) { return undefined; }
};

const getFirebaseConfig = () => {
  const config = {
    apiKey: getSafeEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getSafeEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getSafeEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getSafeEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getSafeEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getSafeEnv('VITE_FIREBASE_APP_ID')
  };
  if (!config.apiKey && typeof __firebase_config !== 'undefined') {
    try { return JSON.parse(__firebase_config); } catch (e) { console.error("Config error"); }
  }
  return config;
};

const firebaseApp = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const GEMINI_MODEL = "gemini-1.5-flash";
const apiKey = ""; 

// ==========================================
// SECTION 2: MULTI-LANGUAGE DICTIONARY
// ==========================================
const LANGUAGES = {
  ar_jo: {
    name: "عربي (شبابي)",
    welcome: "يا هلا يا {name}",
    yo: "عاش يا وحش! 🔥",
    add_task: "شو أهدافك لليوم؟",
    status: { missed: "فاتتني ❌", todo: "بانتظار البدء ⚪", doing: "قاعد بسويها 🟠", done: "خلصتها ✅" },
    identity_placeholder: "اكتب اسمك هون...",
    auth: { login: "دخول", signup: "اشتراك", dev: "Dev Access" },
    settings: { label: "الإعدادات", lang: "نبرة النظام", scale: "مقياس العرض" },
    ai_tone: "Jordanian youth slang, حيوي، فرفوش، direct motivation"
  },
  ar_formal: {
    name: "العربية (الفصحى)",
    welcome: "مرحباً بك يا {name}",
    yo: "استمر في التقدم! 🚀",
    add_task: "ما هي أهدافك لهذا اليوم؟",
    status: { missed: "لم تكتمل ❌", todo: "بانتظار البدء ⚪", doing: "قيد التنفيذ 🟠", done: "تم الإنجاز ✅" },
    identity_placeholder: "أدخل اسمك هنا...",
    auth: { login: "تسجيل الدخول", signup: "إنشاء حساب", dev: "دخول المطور" },
    settings: { label: "الإعدادات", lang: "نبرة النظام", scale: "مقياس العرض" },
    ai_tone: "Standard Modern Arabic, formal, professional life coach, wise"
  },
  en_formal: {
    name: "English (Professional)",
    welcome: "Greetings, {name}",
    yo: "Maintain momentum! 🚀",
    add_task: "Define your objectives for today",
    status: { missed: "Missed ❌", todo: "Pending ⚪", doing: "In Progress 🟠", done: "Completed ✅" },
    identity_placeholder: "Enter your name...",
    auth: { login: "Sign In", signup: "Sign Up", dev: "Developer Access" },
    settings: { label: "Settings", lang: "Language Tone", scale: "Display Scale" },
    ai_tone: "Formal British English, professional, sophisticated coach"
  },
  en_slang: {
    name: "English (Slang)",
    welcome: "Yo {name}, u good? fr",
    yo: "Lock in! 🔒🔥",
    add_task: "Wuts the move today? ngl",
    status: { missed: "L ❌", todo: "Waitin' ⚪", doing: "Cookin' 🟠", done: "W ✅" },
    identity_placeholder: "Ur name here...",
    auth: { login: "Pull Up", signup: "Join Squad", dev: "Dev Bypass" },
    settings: { label: "Vibe Config", lang: "Language Tone", scale: "Display Scale" },
    ai_tone: "US Street Slang, abbreviations like fr, ngl, tbh, u, r, aggressive motivation"
  }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ 
    name: "", aura: 0, lang: "ar_jo", streak: 0, lastLogin: "", 
    hasDoneTaskToday: false, uiScale: 'default' 
  });
  const [tasks, setTasks] = useState([]);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [authError, setAuthError] = useState("");
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const t = LANGUAGES[profile.lang] || LANGUAGES.ar_jo;
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_omni_v2';

  const scaleConfig = {
    small: { text: 'text-sm', welcome: 'text-4xl', aiText: 'text-xs', icon: 18, cardP: 'p-6', label: 'Compact' },
    default: { text: 'text-base', welcome: 'text-6xl', aiText: 'text-base', icon: 28, cardP: 'p-10', label: 'Standard' },
    large: { text: 'text-xl', welcome: 'text-7xl', aiText: 'text-xl', icon: 36, cardP: 'p-14', label: 'Expanded' }
  };
  const s = scaleConfig[profile.uiScale || 'default'];

  // حساب نسبة الإنجاز
  const progressPercent = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter(tk => tk.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else { setUser(null); if (!authChecking) setAuthMode('login'); }
      setAuthChecking(false);
    });
    return () => unsub();
  }, [authChecking]);

  useEffect(() => {
    if (!user || user.isDemo) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(prev => ({ ...prev, ...snap.data() }));
      else if (!authChecking) setAuthMode('setup'); 
    });
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProfile(); unsubTasks(); };
  }, [user, authChecking, appId]);

  const handleDeveloperLogin = () => {
    setUser({ uid: "dev_mock", email: "dev@humam.absolute", isDemo: true });
    setProfile({ name: "Humam", aura: 999, lang: "ar_jo", streak: 5, uiScale: 'default' });
    setTasks([{ id: '1', text: 'اختبار التوزيع الجديد للواجهة', status: 'todo', emoji: '📐' }]);
  };

  const getAiAdvice = async () => {
    setIsAiLoading(true);
    try {
      const taskSummary = tasks.map(tk => tk.text).join(', ');
      const system = `You are a coach for ${profile.name}. Language Mode: ${profile.lang}. Persona: ${t.ai_tone}. Tasks: ${taskSummary || 'None'}`;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Provide a sharp 1-sentence motivation call." }] }],
          systemInstruction: { parts: [{ text: system }] }
        })
      });
      const data = await resp.json();
      setAiAdvice(data.candidates?.[0]?.content?.parts?.[0]?.text || "Locked in! 🦾");
    } catch (e) { setAiAdvice("AI is recalibrating the vibe. 🦾"); }
    finally { setIsAiLoading(false); }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user) return;
    if (user.isDemo) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, status: 'todo', emoji: '✨' }]);
      setNewTaskText(""); return;
    }
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    await addDoc(tasksCol, { text: newTaskText, status: 'todo', dateAdded: new Date().toISOString(), completed: false, emoji: '✨' });
    setNewTaskText("");
  };

  const handleIdentitySave = async () => {
    if (!tempName.trim()) return setAuthError("نَسيت الاسم يا بطل! ⚠️");
    if (user.isDemo) { setProfile({...profile, name: tempName}); setAuthMode('login'); return; }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    await setDoc(profileRef, { 
      name: tempName, aura: 0, lang: 'ar_jo', streak: 0, uiScale: 'default',
      lastLogin: new Date().toISOString().split('T')[0], hasDoneTaskToday: false
    }, { merge: true });
    setAuthMode('login');
  };

  if (authChecking) return <div className="h-screen bg-black flex items-center justify-center text-red-600"><Loader2 className="animate-spin" size={48} /></div>;

  if (!user || (user && !profile.name)) {
    const isSetup = user && !profile.name;
    return (
      <div className="min-h-screen bg-[#020000] flex items-center justify-center p-6 text-right font-sans" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.1),transparent_75%)]"></div>
        <div className="w-full max-w-md bg-zinc-900 border border-red-900/30 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-10">
            <Rocket size={40} className="text-red-600 animate-bounce mx-auto" />
            <h1 className="text-4xl font-black text-white italic mt-4 uppercase">GlowUp <span className="text-red-600">Omni</span></h1>
          </div>
          {isSetup ? (
            <div className="space-y-6">
              <p className="text-zinc-400 font-bold text-center">أهلاً بك! ما هو الاسم الذي نعتمد لبروفايلك؟</p>
              <input autoFocus type="text" placeholder={t.identity_placeholder} className="w-full bg-black border border-red-900/30 rounded-2xl p-6 text-center text-3xl font-black text-white outline-none focus:ring-4 ring-red-600/20 shadow-inner" onChange={(e)=>setTempName(e.target.value)} />
              <button onClick={handleIdentitySave} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white shadow-xl active:scale-95 text-lg uppercase tracking-widest">تثبيت ⚡</button>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(err) { setAuthError("بياناتك غير صحيحة! ⚠️"); } }} className="space-y-4">
                <input type="email" placeholder="الإيميل" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setEmail(e.target.value)} required />
                <input type="password" placeholder="كلمة السر" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setPassword(e.target.value)} required />
                <button type="submit" className="w-full bg-red-600 py-6 rounded-2xl font-black text-white text-lg uppercase shadow-xl hover:bg-red-500 transition-all">دخول</button>
              </form>
              <button onClick={handleDeveloperLogin} className="w-full py-4 border border-dashed border-red-600/40 text-red-600 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3"><Terminal size={14}/> {t.auth.dev}</button>
            </div>
          )}
          {authError && <p className="mt-6 text-red-500 text-center text-xs font-black animate-shake">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#020000] text-white p-4 md:p-12 font-sans relative overflow-x-hidden ${s.text}`} dir={profile.lang.startsWith('ar') ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-tr from-red-600/[0.05] via-transparent to-red-600/[0.02]"></div>
      
      <div className="max-w-7xl mx-auto space-y-12">
        {/* COMPACT HEADER LOGIC (One Line Flex) */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-10 duration-1000 border-b border-white/5 pb-8">
          <div className="space-y-2 flex-1 w-full text-center md:text-right">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${s.welcome} font-black italic tracking-tighter leading-none`}>
              {t.welcome.replace('{name}', '')} 
              <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase"> {profile.name}</span>
            </motion.h1>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <p className={`${s.aiText} font-black italic text-zinc-500 max-w-2xl truncate`}>"{aiAdvice || "Ready for objectives... 🦾"}"</p>
              <button onClick={getAiAdvice} disabled={isAiLoading} className="p-2 hover:bg-red-600/10 rounded-lg transition-all text-red-600">
                <RefreshCw size={16} className={isAiLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-zinc-900/30 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
             <div className="flex items-center gap-3 px-6 border-l border-white/10 group cursor-default">
                <Flame size={s.icon} className={profile.streak > 0 ? "text-orange-500 animate-pulse" : "text-zinc-700"} />
                <span className="text-3xl font-black">{profile.streak || 0}</span>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-4 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-red-600 transition-all active:scale-90">
                <Settings2 size={s.icon} />
             </button>
          </div>
        </header>

        {/* PROGRESS BAR (The Optimization) */}
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase text-zinc-600 tracking-widest px-1">
              <span>{t.add_task.split(' ')[0]} Efficiency</span>
              <span>{progressPercent}%</span>
           </div>
           <div className="w-full h-1 bg-zinc-900/50 rounded-full overflow-hidden border border-white/5">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-red-600 shadow-[0_0_10px_red]" />
           </div>
        </div>

        <section className="bg-zinc-900/30 p-8 rounded-[4.5rem] border border-red-900/10 shadow-2xl backdrop-blur-3xl focus-within:ring-8 ring-red-600/5 transition-all">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 flex items-center px-12 bg-black/60 rounded-[3.5rem] border border-red-900/10 min-h-[110px] w-full group focus-within:border-red-600/40 transition-all shadow-inner">
              <PlusCircle size={40} className="text-zinc-800 group-focus-within:text-red-600 transition-colors ml-6" />
              <input value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} placeholder={t.add_task} className="bg-transparent flex-1 text-3xl font-black text-white outline-none py-8 tracking-tight" />
            </div>
            <button onClick={handleAddTask} className="w-full lg:w-auto px-20 py-10 rounded-[3.5rem] bg-red-600 hover:bg-red-500 font-black text-2xl shadow-xl active:scale-95 transition-all text-white uppercase tracking-widest border-b-8 border-red-800 leading-none">
              {t.yo.split(' ')[0]} ⚡
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40">
           <AnimatePresence mode='popLayout'>
           {tasks.length === 0 ? (
             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="col-span-full py-40 text-center border-4 border-dashed border-white/5 rounded-[5rem] flex flex-col items-center gap-6">
                <ZapOff size={80} className="text-zinc-800" />
                <p className="text-3xl font-black italic tracking-widest uppercase text-zinc-700">Protocol Clear.</p>
             </motion.div>
           ) : tasks.map((tk, idx) => (
             <motion.div key={tk.id} layout initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}
                className={`${s.cardP} rounded-[4rem] border transition-all duration-700 ${tk.status === 'done' ? 'opacity-30 grayscale' : 'bg-zinc-900/60 border-red-900/20 shadow-2xl hover:scale-[1.03] hover:border-red-600/30'}`}
             >
                <div className="flex justify-between items-start mb-8">
                   <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-red-900/10 group-hover:scale-110 transition-transform duration-500">{tk.emoji || "✨"}</div>
                   <button onClick={async ()=> { 
                      if(user.isDemo) { setTasks(tasks.filter(t=>t.id!==tk.id)); return; } 
                      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id)); 
                   }} className="opacity-0 group-hover:opacity-100 p-4 text-zinc-700 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-2xl"><Trash2 size={24}/></button>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-snug mb-10 h-24 overflow-hidden">{tk.text}</h3>
                <button 
                  onClick={async () => {
                    const seq = ['todo', 'doing', 'done', 'missed'];
                    const next = seq[(seq.indexOf(tk.status) + 1) % 4];
                    if (user.isDemo) { setTasks(tasks.map(t => t.id === tk.id ? {...t, status: next} : t)); return; }
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id), { 
                      status: next, completed: next === 'done', lastStatusChange: new Date().toISOString() 
                    });
                    if (next === 'done' && tk.status !== 'done') {
                      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                      await updateDoc(pRef, { aura: (profile.aura || 0) + 10 });
                    }
                  }}
                  className={`w-full py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.5em] transition-all shadow-xl ${tk.status === 'done' ? 'bg-emerald-600 shadow-emerald-900/40' : tk.status === 'doing' ? 'bg-orange-600 animate-pulse shadow-orange-900/40' : tk.status === 'missed' ? 'bg-red-900 shadow-red-950/40' : 'bg-zinc-800 text-zinc-400'}`}
                >
                   {t.status[tk.status]}
                </button>
             </motion.div>
           ))}
           </AnimatePresence>
        </div>

        <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right" dir={profile.lang.startsWith('ar') ? 'rtl' : 'ltr'}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={()=>setShowSettings(false)}></motion.div>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative w-full max-w-2xl bg-zinc-900 border border-red-900/30 p-12 md:p-16 rounded-[5rem] shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
               <button onClick={()=>setShowSettings(false)} className="absolute top-12 left-12 text-zinc-600 hover:text-white transition-colors p-2"><X size={40}/></button>
               <h2 className="text-5xl font-black italic mb-16 flex items-center gap-6 text-red-600 tracking-tighter"><Settings2 size={48}/> {t.settings.label}</h2>
               
               <div className="space-y-16">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 text-zinc-500 border-b border-zinc-800 pb-4">
                      <Languages size={20} className="text-red-600" />
                      <label className="text-xs font-black uppercase tracking-[0.4em] block italic">{t.settings.lang}</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.entries(LANGUAGES).map(([key, value]) => (
                         <button key={key} onClick={async ()=> {
                            if (user.isDemo) { setProfile({...profile, lang: key}); return; }
                            const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                            await updateDoc(pRef, { lang: key });
                         }} className={`p-6 rounded-[2.5rem] font-black text-sm transition-all border-2 flex items-center justify-between px-10 ${profile.lang === key ? 'bg-red-600 border-red-400 text-white shadow-red-900/40' : 'bg-zinc-800 border-transparent text-zinc-500 hover:bg-zinc-800/80'}`}>
                           <span>{value.name}</span>
                           {profile.lang === key && <CheckCircle2 size={20} />}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-4 text-zinc-500 border-b border-zinc-800 pb-4">
                      <Maximize2 size={20} className="text-red-600" />
                      <label className="text-xs font-black uppercase tracking-[0.4em] block italic">{t.settings.scale}</label>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       {Object.entries(scaleConfig).map(([scaleKey, config]) => (
                         <button key={scaleKey} onClick={async ()=> {
                            if (user.isDemo) { setProfile({...profile, uiScale: scaleKey}); return; }
                            const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                            await updateDoc(pRef, { uiScale: scaleKey });
                         }} className={`p-6 rounded-[2.2rem] font-black text-[11px] uppercase transition-all border-2 text-center tracking-widest ${profile.uiScale === scaleKey ? 'bg-red-600 border-red-400 text-white shadow-red-900/40' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>
                           {config.label}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="pt-12 border-t border-zinc-800">
                     <button onClick={async ()=>{ if(user.isDemo) { window.location.reload(); return; } await signOut(auth); }} className="w-full py-10 bg-red-600/10 border-2 border-red-600/20 text-red-500 rounded-[2.5rem] font-black uppercase tracking-[0.6em] transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-95 leading-none">Sign Out Protocol</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        <footer className="mt-40 pt-24 border-t border-red-900/10 flex flex-col xl:flex-row justify-between items-center gap-16 px-10 pb-32 opacity-30 group hover:opacity-100 transition-all duration-1000">
          <div className="flex flex-col items-center xl:items-start gap-4">
             <div className="flex items-center gap-5">
               <Rocket size={32} className="text-red-600" />
               <p className="text-sm font-black tracking-[0.8em] text-zinc-500 uppercase italic">GlowUp Omni Absolute</p>
             </div>
             <p className="text-base font-black text-zinc-400 uppercase italic tracking-[0.3em] mt-2 leading-none">Build V43.2.1 • © 2026 Sovereign Sync</p>
          </div>
          <div className="flex flex-col items-center xl:items-end gap-4 text-right">
             <p className="text-7xl font-black tracking-[0.3em] uppercase italic leading-none transition-all duration-1000 text-white group-hover:text-red-600 group-hover:drop-shadow-[0_0_25px_red]">HUMAM TAIBEH 🦾</p>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;400;700;900&display=swap');
        :root { font-family: 'Tajawal', sans-serif; scroll-behavior: smooth; color-scheme: dark; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default App;
