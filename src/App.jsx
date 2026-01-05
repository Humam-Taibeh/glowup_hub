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
  Terminal, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ملاحظة لـ همام: تأكد من تنصيب framer-motion في مشروعك: npm install framer-motion
// وتأكد من وجود import './index.css'; في main.jsx

// ==========================================
// SECTION 1: FIREBASE CORE LOGIC (Safe Env Handling)
// ==========================================

const getSafeEnv = (key) => {
  try {
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    return env[key];
  } catch (e) {
    return undefined;
  }
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
    try {
      return JSON.parse(__firebase_config);
    } catch (e) {
      console.error("Fallback config parsing failed");
    }
  }
  return config;
};

const firebaseApp = !getApps().length ? initializeApp(getFirebaseConfig()) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const GEMINI_MODEL = "gemini-1.5-flash";
const apiKey = ""; 

const LANGUAGES = {
  ar_jo: {
    welcome: "يا هلا يا {name}",
    yo: "عاش يا وحش! 🔥",
    add_task: "شو أهدافك لليوم؟",
    slots: { morning: "الصباح 🌅", day: "النهار ☀️", night: "بليل 🌙" },
    status: { missed: "فاتتني ❌", todo: "بانتظار البدء ⚪", doing: "قاعد بسويها 🟠", done: "خلصتها ✅" },
    identity_placeholder: "اكتب اسمك هون...",
    auth: { login: "تسجيل الدخول", signup: "إنشاء حساب", dev: "Developer Access (Test Mode)" }
  },
  en_slang: {
    welcome: "Yo {name}, what's good?",
    yo: "Lock in! 🔒🔥",
    add_task: "What's the move today?",
    slots: { morning: "Sunrise 🌅", day: "Grind ☀️", night: "After Hours 🌙" },
    status: { missed: "Missed ❌", todo: "Pending ⚪", doing: "Cookin' 🟠", done: "W ✅" },
    identity_placeholder: "Enter your name here...",
    auth: { login: "Login", signup: "Join Up", dev: "Dev Bypass" }
  }
};

const App = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", aura: 0, lang: "ar_jo", streak: 0, lastLogin: "" });
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
        if (!authChecking) setAuthMode('login');
      }
      setAuthChecking(false);
    });
    return () => unsub();
  }, [authChecking]);

  useEffect(() => {
    if (!user || user.isDemo) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(prev => ({ ...prev, ...snap.data() }));
      } else if (!authChecking) {
        setAuthMode('setup'); 
      }
    });
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubProfile(); unsubTasks(); };
  }, [user, authChecking, appId]);

  const handleDeveloperLogin = () => {
    const mockUser = { uid: "dev_user_mock", email: "dev@humam.absolute", isDemo: true };
    setUser(mockUser);
    setProfile({ name: "Humam (Dev Mode)", aura: 500, lang: "ar_jo", streak: 5, lastLogin: new Date().toISOString() });
    setTasks([
      { id: 'dev1', text: 'فحص الترتيب الجديد (7xl)', status: 'todo', emoji: '⚙️' },
      { id: 'dev2', text: 'تجربة أنيميشن Framer Motion', status: 'doing', emoji: '🔴' },
      { id: 'dev3', text: 'فحص توافق الأيقونات مع الحجم', status: 'done', emoji: '📐' }
    ]);
  };

  const getAiAdvice = async () => {
    setIsAiLoading(true);
    try {
      const taskSummary = tasks.map(tk => tk.text).join(', ');
      const system = `You are a coach for ${profile.name}. Language: ${profile.lang}. If Slang, use Jordanian Arabic. Be direct and aggressive. Tasks: ${taskSummary || 'None'}`;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Analyze my tasks and give me a 1-sentence motivation." }] }],
          systemInstruction: { parts: [{ text: system }] }
        })
      });
      const data = await resp.json();
      setAiAdvice(data.candidates?.[0]?.content?.parts?.[0]?.text || "Lock in! 🦾");
    } catch (e) {
      setAiAdvice("السيستم حالياً بمرحلة الريكفري، شد حيلك! 🔥");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user) return;
    if (user.isDemo) {
      setTasks([...tasks, { id: Date.now().toString(), text: newTaskText, status: 'todo', emoji: '✨' }]);
      setNewTaskText("");
      return;
    }
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    await addDoc(tasksCol, { 
      text: newTaskText, 
      status: 'todo', 
      dateAdded: new Date().toISOString(), 
      completed: false,
      emoji: '✨'
    });
    setNewTaskText("");
  };

  const handleIdentitySave = async () => {
    if (!tempName.trim()) return setAuthError("نَسيت الاسم يا بطل! ⚠️");
    if (user.isDemo) {
      setProfile({...profile, name: tempName});
      setAuthMode('login');
      return;
    }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    await setDoc(profileRef, { 
      name: tempName, aura: 0, lang: 'ar_jo', streak: 0, lastLogin: new Date().toISOString().split('T')[0]
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
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-500/10">
              <Rocket size={40} className="text-red-600 animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">GlowUp <span className="text-red-600">Omni</span></h1>
          </div>
          {isSetup ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <p className="text-zinc-400 font-bold text-center">أهلاً بك! ما هو الاسم الذي تود استخدامه في بروفايلك؟</p>
              <input 
                autoFocus type="text" placeholder={t.identity_placeholder} 
                className="w-full bg-black border border-red-900/30 rounded-2xl p-6 text-center text-3xl font-black text-white outline-none focus:ring-4 ring-red-600/20 shadow-inner" 
                onChange={(e)=>setTempName(e.target.value)} 
              />
              <button onClick={handleIdentitySave} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all uppercase tracking-widest text-lg">تثبيت الهوية ⚡</button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(err) { setAuthError("بياناتك غير صحيحة! ⚠️"); } }} className="space-y-4">
                <input type="email" placeholder="الإيميل" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setEmail(e.target.value)} required />
                <input type="password" placeholder="كلمة السر" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setPassword(e.target.value)} required />
                <button type="submit" className="w-full bg-red-600 py-6 rounded-2xl font-black text-white text-lg uppercase shadow-xl hover:bg-red-500 transition-all">دخول</button>
              </form>
              <div className="flex flex-col gap-4">
                <button onClick={async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { setAuthError("فشل دخول جوجل."); } }} className="w-full py-4 bg-zinc-800 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3">Google Sync <Zap size={14}/></button>
                <button onClick={handleDeveloperLogin} className="w-full py-4 border border-dashed border-red-600/40 text-red-600 rounded-2xl font-black text-xs uppercase hover:bg-red-600/10 transition-all flex items-center justify-center gap-3"><Terminal size={14}/> {t.auth.dev}</button>
              </div>
            </div>
          )}
          {authError && <p className="mt-6 text-red-500 text-center text-xs font-black animate-shake">{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020000] text-white p-4 md:p-12 font-sans relative overflow-x-hidden" dir={profile.lang === 'ar_jo' ? 'rtl' : 'ltr'}>
      {/* SECTION: Red Spirit Background Gradient */}
      <div className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-tr from-red-600/[0.05] via-transparent to-red-600/[0.02]"></div>
      
      <div className="max-w-7xl mx-auto space-y-16">
        {/* SECTION: POLISHED HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start gap-12 animate-in slide-in-from-top-10 duration-1000">
          <div className="space-y-6 flex-1">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter leading-none drop-shadow-[0_5px_15px_rgba(220,38,38,0.2)]"
            >
              {t.welcome.replace('{name}', '')} 
              <span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase block md:inline"> {profile.name}</span>
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6 bg-zinc-900/40 p-8 rounded-[3rem] border border-red-900/20 max-w-3xl group shadow-2xl backdrop-blur-md"
            >
              <div className="p-4 bg-red-600/10 rounded-2xl">
                <Bot size={36} className="text-red-600 group-hover:animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xl md:text-2xl font-black italic leading-tight text-slate-100 italic">{aiAdvice || "Locked in and ready, Humam. 🦾"}</p>
                <p className="text-[10px] font-black uppercase text-zinc-600 mt-2 tracking-[0.4em]">{t.yo}</p>
              </div>
              <button onClick={getAiAdvice} disabled={isAiLoading} className="p-4 bg-red-600/10 rounded-2xl hover:rotate-180 transition-all shadow-lg active:scale-90">
                {isAiLoading ? <Loader2 className="animate-spin" size={24}/> : <RefreshCw size={24} className="text-red-500" />}
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-6 self-end xl:self-start"
          >
             <div className="bg-zinc-900/40 p-10 rounded-[3.5rem] border border-red-900/20 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md min-w-[180px] group transition-all hover:border-red-600/40">
                <Flame size={48} className={profile.streak > 0 ? "text-orange-500 animate-pulse mx-auto" : "text-zinc-700 mx-auto group-hover:text-red-500 transition-colors"} />
                <p className="text-6xl font-black mt-4">{profile.streak || 0}</p>
                <p className="text-[11px] font-bold uppercase text-zinc-600 tracking-[0.4em] mt-2">The Streak</p>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-12 bg-zinc-900/40 border border-red-900/20 rounded-[3.5rem] text-zinc-500 hover:text-red-500 transition-all shadow-xl active:scale-90 hover:rotate-90 duration-700">
                <Settings size={48} />
             </button>
          </motion.div>
        </header>

        {/* SECTION: POLISHED TASK ADDER */}
        <section className="bg-zinc-900/30 p-8 rounded-[4.5rem] border border-red-900/10 shadow-2xl backdrop-blur-3xl focus-within:ring-8 ring-red-600/5 transition-all">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="flex-1 flex items-center px-12 bg-black/60 rounded-[3.5rem] border border-red-900/10 min-h-[110px] w-full group focus-within:border-red-600/40 transition-all shadow-inner">
              <PlusCircle size={40} className="text-zinc-800 group-focus-within:text-red-600 transition-colors ml-6" />
              <input 
                value={newTaskText} 
                onChange={(e)=>setNewTaskText(e.target.value)} 
                placeholder={t.add_task} 
                className="bg-transparent flex-1 text-3xl font-black text-white outline-none py-8 placeholder:text-zinc-900 tracking-tight" 
              />
            </div>
            <button 
              onClick={handleAddTask} 
              className="w-full lg:w-auto px-20 py-10 rounded-[3.5rem] bg-red-600 hover:bg-red-500 font-black text-2xl shadow-[0_15px_30px_rgba(220,38,38,0.3)] active:scale-95 transition-all text-white uppercase tracking-widest border-b-8 border-red-800"
            >
              {t.yo.split(' ')[0]} ⚡
            </button>
          </div>
        </section>

        {/* SECTION: POLISHED DYNAMIC GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-40">
           <AnimatePresence mode='popLayout'>
           {tasks.length === 0 ? (
             <motion.div 
               key="empty"
               initial={{ opacity: 0 }} animate={{ opacity: 0.2 }}
               className="col-span-full py-48 text-center border-8 border-dashed border-red-900/5 rounded-[5rem] flex flex-col items-center gap-10"
             >
                <ZapOff size={120} className="text-zinc-800" />
                <p className="text-5xl font-black italic tracking-widest uppercase text-zinc-700">Protocol Clear. Feed the System.</p>
             </motion.div>
           ) : tasks.map((tk, index) => (
             <motion.div 
                key={tk.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`group relative p-10 rounded-[4rem] border transition-all duration-700 ${tk.status === 'done' ? 'opacity-30 grayscale' : 'bg-zinc-900/60 border-red-900/20 shadow-2xl hover:scale-[1.03] hover:border-red-600/30'}`}
             >
                <div className="flex justify-between items-start mb-10">
                   <div className="w-20 h-20 bg-black/40 rounded-3xl flex items-center justify-center text-5xl shadow-inner border border-red-900/10 group-hover:scale-110 transition-transform duration-500">{tk.emoji || "✨"}</div>
                   <div className="flex gap-2">
                      <button onClick={async ()=> { 
                          if(user.isDemo) { setTasks(tasks.filter(t=>t.id!==tk.id)); return; } 
                          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id)); 
                       }} className="opacity-0 group-hover:opacity-100 p-4 text-zinc-700 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-2xl"><Trash2 size={28}/></button>
                   </div>
                </div>
                <h3 className={`text-3xl font-black tracking-tight leading-snug mb-12 h-24 overflow-hidden ${tk.status === 'done' ? 'line-through opacity-50' : 'text-slate-100'}`}>{tk.text}</h3>
                
                <button 
                  onClick={async () => {
                    const seq = ['todo', 'doing', 'done', 'missed'];
                    const next = seq[(seq.indexOf(tk.status) + 1) % 4];
                    if (user.isDemo) { setTasks(tasks.map(t => t.id === tk.id ? {...t, status: next} : t)); return; }
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id), { status: next, completed: next === 'done' });
                    if (next === 'done' && tk.status !== 'done') {
                      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                      await updateDoc(pRef, { aura: (profile.aura || 0) + 10 });
                    }
                  }}
                  className={`w-full py-7 rounded-3xl font-black text-xs uppercase tracking-[0.5em] transition-all shadow-xl ${tk.status === 'done' ? 'bg-emerald-600 shadow-emerald-900/40' : tk.status === 'doing' ? 'bg-orange-600 animate-pulse shadow-orange-900/40' : tk.status === 'missed' ? 'bg-red-900 shadow-red-950/50' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                >
                   {t.status[tk.status]}
                </button>
             </motion.div>
           ))}
           </AnimatePresence>
        </div>

        {/* SECTION: POLISHED SETTINGS */}
        <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={()=>setShowSettings(false)}></motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-red-900/30 p-16 rounded-[5rem] shadow-2xl"
            >
               <button onClick={()=>setShowSettings(false)} className="absolute top-12 left-12 text-zinc-600 hover:text-white transition-colors p-2"><X size={40}/></button>
               <h2 className="text-5xl font-black italic mb-16 flex items-center gap-6 text-red-600"><Settings2 size={48}/> الإعدادات</h2>
               <div className="space-y-16">
                  <div className="space-y-6">
                    <label className="text-xs font-black uppercase text-zinc-500 tracking-[0.4em] block italic">لغة البروتوكول</label>
                    <div className="grid grid-cols-2 gap-4">
                       {Object.entries(LANGUAGES).map(([key, value]) => (
                         <button key={key} onClick={async ()=> {
                            if (user.isDemo) { setProfile({...profile, lang: key}); return; }
                            const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                            await updateDoc(pRef, { lang: key });
                         }} className={`p-6 rounded-[2rem] font-black text-sm transition-all border-2 ${profile.lang === key ? 'bg-red-600 border-red-400 text-white shadow-red-900/40' : 'bg-zinc-800 border-transparent text-zinc-500'}`}>{key.toUpperCase()}</button>
                       ))}
                    </div>
                  </div>
                  <div className="pt-12 border-t border-zinc-800">
                     <button onClick={async ()=>{ if(user.isDemo) { window.location.reload(); return; } await signOut(auth); }} className="w-full py-10 bg-red-600/10 border-2 border-red-600/20 text-red-500 rounded-[2.5rem] font-black uppercase tracking-[0.6em] transition-all hover:bg-red-600 hover:text-white shadow-2xl active:scale-95">Sign Out Protocol</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* SECTION: FOOTER MASTERPIECE */}
        <footer className="mt-40 pt-24 border-t border-red-900/10 flex flex-col xl:flex-row justify-between items-center gap-16 px-10 pb-32 opacity-30 hover:opacity-100 transition-all duration-1000 group">
          <div className="flex flex-col items-center xl:items-start gap-4">
             <div className="flex items-center gap-5">
               <div className="p-3 bg-red-600/10 rounded-xl group-hover:bg-red-600/20 transition-colors"><Rocket size={32} className="text-red-600" /></div>
               <p className="text-sm font-black tracking-[0.8em] text-zinc-500 uppercase italic leading-none">GlowUp Omni Absolute</p>
             </div>
             <p className="text-base font-black text-zinc-400 uppercase italic tracking-[0.3em] mt-2 leading-none">Build V43.2.1 • © 2026 Sovereign Sync</p>
          </div>
          <div className="flex flex-col items-center xl:items-end gap-4 text-right">
             <div className="flex items-center gap-3 opacity-30 mb-2">
               <ShieldCheck size={18} />
               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Encrypted & Engineered For Excellence</p>
             </div>
             <p className="text-[12px] font-black text-zinc-700 uppercase tracking-[0.8em] mb-2 leading-none">Architected By</p>
             <div className="relative overflow-hidden">
                <p className="text-7xl font-black tracking-[0.3em] uppercase italic leading-none transition-all duration-1000 text-white group-hover:text-red-600 group-hover:drop-shadow-[0_0_25px_red]">HUMAM TAIBEH 🦾</p>
                <motion.div className="absolute bottom-0 left-0 w-full h-1 bg-red-600" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} transition={{ duration: 1 }} />
             </div>
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
        ::selection { background: rgba(220, 38, 38, 0.4); color: white; }
        
        @keyframes heat-rise {
          0% { transform: translateY(0) scaleY(1); opacity: 0.1; }
          50% { transform: translateY(-40px) scaleY(1.2); opacity: 0.25; }
          100% { transform: translateY(-80px) scaleY(1.4); opacity: 0; }
        }
        .animate-heat-rise { animation: heat-rise 4s infinite ease-out; }
      `}</style>
    </div>
  );
};

export default App;
