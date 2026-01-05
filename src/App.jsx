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
  Terminal
} from 'lucide-react';

// ==========================================
// SECTION 1: FIREBASE CORE LOGIC (Safe Env Handling)
// ==========================================

// دالة لجلب متغيرات البيئة بشكل آمن لتجنب أخطاء التوافق في بعض المتصفحات أو بيئات البناء
const getSafeEnv = (key) => {
  try {
    // محاولة الوصول لـ import.meta.env بشكل ديناميكي لتجنب تحذيرات المترجم (Compiler)
    const env = (import.meta && import.meta.env) ? import.meta.env : {};
    return env[key];
  } catch (e) {
    return undefined;
  }
};

const getFirebaseConfig = () => {
  // القراءة من متغيرات البيئة (Vercel/Vite) باستخدام الدالة الآمنة
  const config = {
    apiKey: getSafeEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getSafeEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getSafeEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getSafeEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getSafeEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getSafeEnv('VITE_FIREBASE_APP_ID')
  };

  // Fallback للعمل داخل بيئة الـ Canvas التجريبية إذا كانت الإعدادات مفقودة
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
const apiKey = ""; // يتم التعامل معه داخلياً

// ==========================================
// SECTION 2: DICTIONARY (Universal & Generic)
// ==========================================
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

// ==========================================
// SECTION 3: MAIN APP COMPONENT
// ==========================================
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

  // --- Auth Observer ---
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

  // --- Real-time Data Sync (Strict user path) ---
  useEffect(() => {
    if (!user || user.isDemo) return;

    // جلب البروفايل: artifacts/{appId}/users/{userId}/profile/core
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile(prev => ({ ...prev, ...snap.data() }));
      } else if (!authChecking) {
        setAuthMode('setup'); 
      }
    }, (err) => {
      console.warn("Real-time profile sync pending auth or permissions.");
    });

    // جلب المهام: artifacts/{appId}/users/{userId}/tasks
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.warn("Real-time tasks sync pending auth or permissions.");
    });

    return () => { unsubProfile(); unsubTasks(); };
  }, [user, authChecking, appId]);

  // --- Developer Bypass ---
  const handleDeveloperLogin = () => {
    const mockUser = {
      uid: "dev_user_mock",
      email: "dev@humam.absolute",
      isDemo: true
    };
    setUser(mockUser);
    setProfile({
      name: "Humam (Dev Mode)",
      aura: 500,
      lang: "ar_jo",
      streak: 5,
      lastLogin: new Date().toISOString()
    });
    setTasks([
      { id: 'dev1', text: 'اختبار واجهة المستخدم العامة', status: 'todo', emoji: '⚙️' },
      { id: 'dev2', text: 'تجربة إضافة المهام التجريبية', status: 'doing', emoji: '🔴' }
    ]);
  };

  // --- AI Advice (Gemini 1.5 Flash) ---
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

  // --- Task Operations ---
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

  // ==========================================
  // 4. UI RENDERERS
  // ==========================================
  if (authChecking) return <div className="h-screen bg-black flex items-center justify-center text-red-600"><Loader2 className="animate-spin" size={48} /></div>;

  // شاشة الدخول (Login / Identity Setup)
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
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">GlowUp <span className="text-red-600">Omni</span></h1>
          </div>

          {isSetup ? (
            <div className="space-y-6 animate-in zoom-in-95">
              <p className="text-zinc-400 font-bold text-center">أهلاً بك! ما هو الاسم الذي تود استخدامه في بروفايلك؟</p>
              <input 
                autoFocus type="text" placeholder={t.identity_placeholder} 
                className="w-full bg-black border border-red-900/30 rounded-2xl p-6 text-center text-3xl font-black text-white outline-none focus:ring-4 ring-red-600/20" 
                onChange={(e)=>setTempName(e.target.value)} 
              />
              <button onClick={handleIdentitySave} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all uppercase tracking-widest text-lg">تثبيت الهوية ⚡</button>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(err) { setAuthError("بياناتك غير صحيحة! ⚠️"); } }} className="space-y-4">
                <input type="email" placeholder="الإيميل" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setEmail(e.target.value)} required />
                <input type="password" placeholder="كلمة السر" className="w-full bg-black border border-red-900/20 rounded-2xl p-5 text-white font-bold" onChange={(e)=>setPassword(e.target.value)} required />
                <button type="submit" className="w-full bg-red-600 py-6 rounded-2xl font-black text-white text-lg uppercase shadow-xl hover:bg-red-500 transition-all">دخول</button>
              </form>
              <div className="flex flex-col gap-4">
                <button onClick={async () => { try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch(e) { setAuthError("فشل دخول جوجل (جرب الـ Dev Access)."); } }} className="w-full py-4 bg-zinc-800 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3">Google Sync <Zap size={14}/></button>
                <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div><div className="relative flex justify-center text-[8px] uppercase font-black text-zinc-700 px-2">Testing Purposes</div></div>
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
    <div className="min-h-screen bg-[#020000] text-white p-4 md:p-8 font-sans" dir={profile.lang === 'ar_jo' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        <header className="flex flex-col md:flex-row justify-between items-start gap-8 animate-in slide-in-from-top-10 duration-700">
          <div className="space-y-4 flex-1">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">
              {t.welcome.replace('{name}', '')} 
              <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] uppercase"> {profile.name}</span>
            </h1>
            <div className="flex items-center gap-5 bg-zinc-900/50 p-6 rounded-[2.5rem] border border-red-900/20 max-w-2xl group">
              <Bot size={32} className="text-red-600 group-hover:animate-pulse" />
              <div className="flex-1 overflow-hidden">
                <p className="text-lg font-black italic leading-tight truncate">{aiAdvice || "Locked in and ready, Humam. 🦾"}</p>
              </div>
              <button onClick={getAiAdvice} disabled={isAiLoading} className="p-3 bg-red-600/10 rounded-xl hover:rotate-180 transition-all shadow-lg">
                {isAiLoading ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
              </button>
            </div>
          </div>

          <div className="flex gap-4">
             <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-red-900/20 text-center shadow-2xl backdrop-blur-md min-w-[140px]">
                <Flame size={32} className={profile.streak > 0 ? "text-orange-500 animate-pulse mx-auto" : "text-zinc-700 mx-auto"} />
                <p className="text-4xl font-black mt-2">{profile.streak || 0}</p>
                <p className="text-[10px] font-bold uppercase text-zinc-600 tracking-widest leading-none">The Streak</p>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-10 bg-zinc-900/40 border border-red-900/20 rounded-[3rem] text-zinc-500 hover:text-red-500 transition-all shadow-xl active:scale-90">
                <Settings size={40} />
             </button>
          </div>
        </header>

        <section className="bg-zinc-900/40 p-6 rounded-[3.5rem] border border-red-900/20 shadow-2xl backdrop-blur-2xl">
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex items-center px-10 bg-black/60 rounded-[3rem] border border-red-900/10 min-h-[90px] w-full">
              <PlusCircle size={32} className="text-zinc-700 ml-4" />
              <input value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} placeholder={t.add_task} className="bg-transparent flex-1 text-2xl font-black text-white outline-none py-6" />
            </div>
            <button onClick={handleAddTask} className="bg-red-600 px-16 py-8 rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all text-white uppercase">{t.yo.split(' ')[0]}</button>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
           {tasks.length === 0 ? (
             <div className="col-span-full py-40 text-center border-4 border-dashed border-red-900/10 rounded-[4rem] opacity-20 flex flex-col items-center gap-6">
                <ZapOff size={80} />
                <p className="text-4xl font-black italic tracking-widest uppercase">Protocol Clear. Start adding goals.</p>
             </div>
           ) : tasks.map(tk => (
             <div key={tk.id} className={`group p-8 rounded-[3rem] border transition-all duration-500 ${tk.status === 'done' ? 'opacity-30 grayscale' : 'bg-zinc-900/60 border-red-900/20 shadow-2xl hover:scale-[1.02]'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-16 h-16 bg-black/40 rounded-2xl flex items-center justify-center text-4xl shadow-inner">{tk.emoji || "✨"}</div>
                   <button onClick={async ()=> { 
                      if(user.isDemo) { setTasks(tasks.filter(t=>t.id!==tk.id)); return; } 
                      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id)); 
                   }} className="opacity-0 group-hover:opacity-100 p-3 text-zinc-700 hover:text-red-500 transition-all"><Trash size={20}/></button>
                </div>
                <h3 className={`text-2xl font-black tracking-tight leading-snug mb-10 ${tk.status === 'done' ? 'line-through opacity-50' : ''}`}>{tk.text}</h3>
                <button 
                  onClick={async () => {
                    const seq = ['todo', 'doing', 'done', 'missed'];
                    const next = seq[(seq.indexOf(tk.status) + 1) % 4];
                    if (user.isDemo) {
                      setTasks(tasks.map(t => t.id === tk.id ? {...t, status: next} : t));
                      return;
                    }
                    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id), { status: next, completed: next === 'done' });
                    if (next === 'done' && tk.status !== 'done') {
                      const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                      await updateDoc(pRef, { aura: (profile.aura || 0) + 10 });
                    }
                  }}
                  className={`w-full py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all shadow-lg ${tk.status === 'done' ? 'bg-emerald-600' : tk.status === 'doing' ? 'bg-orange-600 animate-pulse' : tk.status === 'missed' ? 'bg-red-900' : 'bg-zinc-800'}`}
                >
                   {t.status[tk.status]}
                </button>
             </div>
           ))}
        </div>

        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={()=>setShowSettings(false)}></div>
            <div className="relative w-full max-w-xl bg-zinc-900 border border-red-900/30 p-12 rounded-[4rem] shadow-2xl animate-in zoom-in-95 text-right" dir="rtl">
               <button onClick={()=>setShowSettings(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white"><X size={32}/></button>
               <h2 className="text-4xl font-black italic mb-10 flex items-center gap-4 text-red-600"><Settings2/> الإعدادات</h2>
               <div className="space-y-12">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block italic">لغة النظام</label>
                    <div className="grid grid-cols-2 gap-3">
                       {Object.entries(LANGUAGES).map(([key, value]) => (
                         <button key={key} onClick={async ()=> {
                            if (user.isDemo) { setProfile({...profile, lang: key}); return; }
                            const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
                            await updateDoc(pRef, { lang: key });
                         }} className={`p-5 rounded-2xl font-black text-xs transition-all ${profile.lang === key ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                           {key.toUpperCase()}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="pt-10 border-t border-zinc-800">
                     <button onClick={async ()=>{ if(user.isDemo) { window.location.reload(); return; } await signOut(auth); }} className="w-full py-8 bg-red-600/10 border border-red-600/20 text-red-500 rounded-3xl font-black uppercase tracking-[0.5em] transition-all hover:bg-red-600 hover:text-white">Sign Out Protocol</button>
                  </div>
               </div>
            </div>
          </div>
        )}

        <footer className="mt-28 pt-20 border-t border-red-900/10 flex flex-col md:flex-row justify-between items-center gap-12 px-10 pb-24 opacity-30 hover:opacity-100 transition-all duration-1000 group">
          <div className="flex flex-col items-center md:items-start gap-2">
             <div className="flex items-center gap-3"><Rocket size={24} className="text-red-600" /><p className="text-[12px] font-black tracking-[0.6em] text-zinc-500 uppercase italic">GlowUp Omni Absolute</p></div>
             <p className="text-[14px] font-black text-zinc-400 uppercase italic tracking-widest mt-2 leading-none">Operational Build V43.2 • Secure Sync Active</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 text-right">
             <div className="flex items-center gap-2 opacity-30 mb-1"><ShieldCheck size={14} /><p className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted & Engineered For Excellence</p></div>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em] mb-2 leading-none">Developed By</p>
             <p className="text-5xl font-black tracking-[0.4em] uppercase italic leading-none transition-all duration-1000 text-white group-hover:text-red-600 group-hover:drop-shadow-[0_0_15px_red]">HUMAM TAIBEH 🦾</p>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;400;700;900&display=swap');
        :root { font-family: 'Tajawal', sans-serif; scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out infinite; }
        .animate-in { animation: fade-in-up 0.6s ease-out; }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default App;
