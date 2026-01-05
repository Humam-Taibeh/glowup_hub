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
// SECTION 1: CORE ENGINE & CONFIGURATION
// ==========================================

const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const apiKey = ""; 

const appId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_omni_v2';

// Dynamic AI Quote Database
const AI_QUOTES = {
  ar: [
    "كُن النسخة الأفضل منك اليوم.",
    "الاستمرارية هي مفتاح الهيبة الحقيقية.",
    "أنت المعماري، ابنِ مستقبلك بدقة.",
    "الـ Glow Up يبدأ من الداخل.",
    "انضبط لتسود وتتحكم في مصيرك."
  ],
  en: [
    "Become the ultimate version of yourself.",
    "Consistency is the ultimate flex.",
    "Your future is being architected now.",
    "Precision in action, excellence in result.",
    "Master your routine, master your life."
  ]
};

const SYSTEM_LANGS = [
  { id: 'ar_jo', label: 'AR - Urban' },
  { id: 'ar_formal', label: 'AR - Classic' },
  { id: 'en_formal', label: 'EN - Official' },
  { id: 'en_slang', label: 'EN - Slang' }
];

const UI_SCALES = [
  { id: 'small', label: 'Compact' },
  { id: 'default', label: 'Standard' },
  { id: 'large', label: 'Expanded' }
];

const LANGUAGES = {
  ar_jo: { 
    welcome: "يا هلا يا {name}", 
    yo: "عاش يا وحش! 🔥", 
    add_task: "شو أهدافك لليوم؟", 
    status: { missed: "فاتتني ❌", todo: "بانتظار البدء ⚪", doing: "قاعد بسويها 🟠", done: "خلصتها ✅" }, 
    slots: { all: "الكل", morning: "الصبح", day: "النهار", night: "بليل" }, 
    water: { label: "متتبع الماء", custom: "مخصص" }, 
    identity_placeholder: "اكتب اسمك هون...", 
    target: "Target" 
  },
  ar_formal: { 
    welcome: "مرحباً بك يا {name}", 
    yo: "استمر في التقدم! 🚀", 
    add_task: "ما هي أهدافك؟", 
    status: { missed: "لم تكتمل ❌", todo: "بانتظار البدء ⚪", doing: "قيد التنفيذ 🟠", done: "تم الإنجاز ✅" }, 
    slots: { all: "الكل", morning: "الصباح", day: "النهار", night: "المساء" }, 
    water: { label: "متتبع المياه", custom: "محدد" }, 
    identity_placeholder: "أدخل اسمك هنا...", 
    target: "الهدف" 
  },
  en_formal: { 
    welcome: "Greetings, {name}", 
    yo: "Maintain momentum! 🚀", 
    add_task: "Define objectives", 
    status: { missed: "Missed ❌", todo: "Pending ⚪", doing: "In Progress 🟠", done: "Completed ✅" }, 
    slots: { all: "Full", morning: "Morning", day: "Daytime", night: "Night" }, 
    water: { label: "Hydration", custom: "Manual" }, 
    identity_placeholder: "Enter your name...", 
    target: "Target" 
  },
  en_slang: { 
    welcome: "Yo {name}, u good? fr", 
    yo: "Lock in! 🔒🔥", 
    add_task: "Wuts the move? ngl", 
    status: { missed: "L ❌", todo: "Waitin' ⚪", doing: "Cookin' 🟠", done: "W ✅" }, 
    slots: { all: "All", morning: "Sunrise", day: "Grind", night: "Late" }, 
    water: { label: "Water Hub", custom: "Custom" }, 
    identity_placeholder: "Ur name here...", 
    target: "Grind" 
  }
};

// ==========================================
// SECTION 2: UI COMPONENTS (Pixel Perfect)
// ==========================================

const TaskCard = forwardRef(({ tk, t, onUpdate, onDelete, s, onEdit }, ref) => {
  const isMissed = tk.status !== 'done' && tk.deadline && new Date(tk.deadline) < new Date();
  const [pulse, setPulse] = useState(false);

  const handleStatusClick = (e) => {
    e.stopPropagation();
    if (tk.status !== 'done') setPulse(true);
    setTimeout(() => setPulse(false), 500);
    onUpdate(tk);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1, backgroundColor: "rgba(255, 255, 255, 0.04)" }}
      onClick={() => onEdit(tk)}
      className={`relative cursor-pointer group flex items-center gap-4 p-4 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl border-[0.5px] border-white/10 shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.05)] transition-all duration-200 glass-noise ${tk.status === 'done' ? 'opacity-30' : ''}`}
    >
      <AnimatePresence>
        {pulse && (
          <motion.div 
            initial={{ opacity: 0.6, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.4 }}
            className="absolute inset-0 bg-red-600/30 rounded-[2rem] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <div 
        onClick={handleStatusClick}
        className={`w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border-[0.5px] transition-all z-10 ${
          tk.status === 'done' ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400' : 
          tk.status === 'doing' ? 'bg-orange-500/20 border-orange-400/30 text-orange-400 animate-pulse' : 
          tk.status === 'missed' ? 'bg-red-600/20 border-red-500/30 text-red-400' : 
          'bg-zinc-950/50 border-white/5 text-zinc-600 hover:border-white/20'
        }`}
      >
        {tk.status === 'done' ? <CheckCircle size={18}/> : tk.status === 'doing' ? <Construction size={18}/> : tk.status === 'missed' ? <X size={18}/> : <Circle size={18}/>}
      </div>

      <div className="flex-1 overflow-hidden text-right" dir="rtl">
        <div className="flex items-center gap-2">
           <span className="text-xl">{String(tk.emoji || '✨')}</span>
           <h3 className={`text-sm md:text-base font-bold truncate ${tk.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-100'}`}>
             {String(tk.text)}
           </h3>
           {tk.deadline && tk.status !== 'done' && (
             <div className={`text-[8px] px-1.5 py-0.5 rounded-full font-black border-[0.5px] whitespace-nowrap ${isMissed ? 'bg-red-600/10 border-red-500/30 text-red-500 shadow-[0_0_10px_red]' : 'bg-blue-600/10 border-blue-500/30 text-blue-500'}`}>
               {new Date(tk.deadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </div>
           )}
        </div>
        <div className="flex items-center gap-2 mt-1">
           <p className="text-[9px] font-light text-zinc-500 uppercase tracking-widest flex items-center gap-1">
             {tk.slot === 'morning' ? <Sun size={10}/> : tk.slot === 'night' ? <Moon size={10}/> : <CloudSun size={10}/>}
             {String(t.slots[tk.slot || 'day'])}
           </p>
           <span className="h-0.5 w-0.5 bg-zinc-800 rounded-full" />
           <p className="text-[9px] font-light text-zinc-700 uppercase tracking-widest">{String(t.target)}</p>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity z-10">
         <button onClick={(e) => { e.stopPropagation(); onDelete(tk.id); }} className="p-2 text-zinc-700 hover:text-red-500">
           <Trash2 size={16}/>
         </button>
      </div>

      {isMissed && <div className="absolute inset-0 rounded-[2rem] border-[1px] border-red-600/10 animate-pulse pointer-events-none" />}
    </motion.div>
  );
});

TaskCard.displayName = "TaskCard";

// ==========================================
// SECTION 3: MAIN APP LOGIC
// ==========================================
const App = () => {
  // --- States ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ 
    name: "", aura: 0, lang: "ar_jo", streak: 0, lastLogin: "", 
    waterLevel: 0, uiScale: 'default', lastWaterAmount: 0 
  });
  const [tasks, setTasks] = useState([]);
  const [authChecking, setAuthChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskSlot, setNewTaskSlot] = useState("day");
  const [aiAdvice, setAiAdvice] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showWater, setShowWater] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [customWater, setCustomWater] = useState("");
  const [timeFilter, setTimeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // AMBIENT PARALLAX VALUES
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glowX = useSpring(useTransform(mouseX, [0, 1920], [-50, 50]), { stiffness: 50, damping: 30 });
  const glowY = useSpring(useTransform(mouseY, [0, 1080], [-50, 50]), { stiffness: 50, damping: 30 });

  const t = LANGUAGES[profile.lang] || LANGUAGES.ar_jo;
  const isArabic = profile.lang.startsWith('ar');

  const scaleConfig = {
    small: { text: 'text-xs', welcome: 'text-4xl md:text-5xl', icon: 18, cardP: 'p-4' },
    default: { text: 'text-sm', welcome: 'text-6xl md:text-7xl', icon: 24, cardP: 'p-5' },
    large: { text: 'text-base', welcome: 'text-7xl md:text-8xl', icon: 30, cardP: 'p-6' }
  };
  const s = scaleConfig[profile.uiScale || 'default'];

  // AI Quote Engine
  useEffect(() => {
    const langKey = isArabic ? 'ar' : 'en';
    const quotes = AI_QUOTES[langKey];
    setAiAdvice(quotes[Math.floor(Math.random() * quotes.length)]);
    const interval = setInterval(() => {
      setAiAdvice(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 12000);
    return () => clearInterval(interval);
  }, [profile.lang, isArabic]);

  // Sync Logic
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth init error:", e); }
      finally { setAuthChecking(false); }
    };
    initAuth();
    
    const unsub = onAuthStateChanged(auth, setUser);
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => { unsub(); window.removeEventListener('mousemove', handleMouseMove); };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (!user || user.isDemo || authChecking) return;
    const pRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubP = onSnapshot(pRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(prev => ({ ...prev, ...data }));
        const today = new Date().toISOString().split('T')[0];
        if (data.lastLogin !== today) {
            const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            let newStreak = data.streak || 0;
            if (data.lastLogin === yesterdayStr && data.hasDoneTaskToday) newStreak += 1;
            else if (data.lastLogin < yesterdayStr) newStreak = 0;
            setDoc(pRef, { lastLogin: today, waterLevel: 0, streak: newStreak, hasDoneTaskToday: false }, { merge: true });
        }
      } else {
        // Setup initial profile if not exists
      }
    }, (err) => { });
    const tCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubT = onSnapshot(tCol, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => { });
    return () => { unsubP(); unsubT(); };
  }, [user, authChecking, appId]);

  // --- Handlers ---
  const addWater = async (ml) => {
    const amount = parseInt(ml);
    if (isNaN(amount) || !user) return;
    const newLvl = (profile.waterLevel || 0) + amount;
    const updates = { waterLevel: newLvl, lastWaterAmount: amount };
    if (user.isDemo) { setProfile({...profile, ...updates}); setCustomWater(""); return; }
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), updates, { merge: true });
    setCustomWater("");
  };

  const updateStatus = async (tk) => {
    if (!user) return;
    const next = ['todo', 'doing', 'done', 'missed'][(['todo', 'doing', 'done', 'missed'].indexOf(tk.status) + 1) % 4];
    if (user.isDemo) { setTasks(tasks.map(t => t.id === tk.id ? {...t, status: next} : t)); return; }
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', tk.id), { status: next, completed: next === 'done', lastStatusChange: new Date().toISOString() });
    if (next === 'done') {
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { aura: (profile.aura || 0) + 10, hasDoneTaskToday: true }, { merge: true });
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !user) return;
    const tkData = { text: String(newTaskText), status: 'todo', slot: newTaskSlot, dateAdded: new Date().toISOString(), completed: false, emoji: '✨', category: 'personal' };
    if (user.isDemo) { setTasks([{ id: Date.now().toString(), ...tkData }, ...tasks]); setNewTaskText(""); return; }
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), tkData);
    setNewTaskText("");
  };

  const handleUpdateName = async (newName) => {
    const updates = { name: String(newName) };
    setProfile(prev => ({ ...prev, ...updates })); 
    if (!user || user.isDemo) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), updates, { merge: true });
  };

  const filteredTasks = tasks.filter(tk => {
    const matchTime = timeFilter === 'all' || tk.slot === timeFilter;
    const matchStatus = statusFilter === 'all' || tk.status === statusFilter;
    return matchTime && matchStatus;
  });

  if (authChecking) return <div className="h-screen bg-[#050505] flex items-center justify-center text-red-600"><Loader2 className="animate-spin" size={48} /></div>;

  // --- Auth View ---
  if (!user || (user && !profile.name)) {
    return (
      <div className="min-h-screen bg-[#050000] flex items-center justify-center p-6 text-right font-sans" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05),transparent_75%)]"></div>
        <div className="w-full max-w-md bg-white/[0.01] backdrop-blur-3xl border-[0.5px] border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden glass-noise">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-transparent"></div>
          <div className="text-center mb-10">
            <Rocket size={40} className="text-red-600 animate-bounce mx-auto" />
            <h1 className="text-4xl font-black text-white italic mt-4 uppercase tracking-tighter">GlowUp <span className="text-red-600 font-black">Omni</span></h1>
          </div>
          {user ? (
             <div className="space-y-6">
                <input autoFocus type="text" placeholder={String(t.identity_placeholder)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-center text-2xl font-black text-white outline-none focus:ring-1 ring-red-600/40" onChange={(e)=>setTempName(e.target.value)} />
                <button onClick={async () => {
                  if (!tempName.trim()) return;
                  await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { name: String(tempName), aura: 0, lang: 'ar_jo', streak: 0, uiScale: 'default', lastLogin: new Date().toISOString().split('T')[0], hasDoneTaskToday: false, waterLevel: 0 }, { merge: true });
                }} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white shadow-xl text-lg">تثبيت الهوية ⚡</button>
             </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={async (e) => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, email, password); } catch(err) { } }} className="space-y-4 text-right">
                <input type="email" placeholder="Email" className="w-full bg-black/40 border-[0.5px] border-white/10 rounded-2xl p-5 text-white font-bold outline-none" onChange={(e)=>setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" className="w-full bg-black/40 border-[0.5px] border-white/10 rounded-2xl p-5 text-white font-bold outline-none" onChange={(e)=>setPassword(e.target.value)} required />
                <button type="submit" className="w-full bg-red-600 py-6 rounded-2xl font-black text-white text-lg uppercase shadow-xl">دخول</button>
              </form>
              <button onClick={() => setUser({ uid: "dev", isDemo: true, name: "Developer" })} className="w-full py-4 border border-dashed border-red-600/20 text-red-600/60 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 active:scale-95 transition-all"><Terminal size={14}/> Developer Login</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#050505] text-white p-4 md:p-12 font-sans relative overflow-x-hidden ${s.text}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* AMBIENT BACKGROUND GLOW */}
      <motion.div style={{ x: glowX, y: glowY }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] bg-red-600/[0.02] blur-[180px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-12 pb-40">
        {/* HEADER SECTION */}
        <header className={`flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-white/5 ${isArabic ? 'text-right' : 'text-left md:items-start'}`}>
          <div className="flex-1 w-full">
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`${s.welcome} font-black italic tracking-tighter leading-none`}>
              {String(t.welcome.replace('{name}', ''))} 
              <span className="text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase font-black"> {String(profile.name)}</span>
            </motion.h1>
            <div className={`flex items-center gap-4 mt-4 h-8 overflow-hidden ${isArabic ? 'justify-start' : 'justify-start'}`}>
              <AnimatePresence mode='wait'>
                <motion.p key={aiAdvice} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.3 }} className="font-light text-zinc-500 italic max-w-2xl truncate text-base">
                  "{String(aiAdvice)}"
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ repeat: Infinity, duration: 4 }} className="flex items-center gap-4 bg-white/[0.01] p-3 md:p-4 rounded-[3rem] border-[0.5px] border-white/10 backdrop-blur-3xl shadow-2xl">
             <div className="flex items-center gap-3 px-8 border-l border-white/5">
                <Flame size={s.icon + 10} className={profile.streak > 0 ? "text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "text-zinc-800"} />
                <span className="text-5xl font-black tracking-tighter">{profile.streak || 0}</span>
             </div>
             <button onClick={()=>setShowSettings(true)} className="p-4 hover:bg-white/5 rounded-2xl text-zinc-600 hover:text-red-600 transition-all active:scale-90"><Settings2 size={s.icon + 4} /></button>
          </motion.div>
        </header>

        {/* INPUT & FILTERS HUB */}
        <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto">
           <div className="flex-1 bg-white/[0.02] p-4 rounded-[3rem] border-[0.5px] border-white/10 shadow-2xl backdrop-blur-3xl focus-within:ring-1 ring-red-600/10 transition-all glass-noise">
              <div className="flex items-center gap-4">
                 <div className="flex-1 flex items-center px-6 bg-black/40 rounded-[2.2rem] border-[0.5px] border-white/10 min-h-[60px]">
                    <Plus size={24} className="text-zinc-800" />
                    <input value={newTaskText} onChange={(e)=>setNewTaskText(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleAddTask()} placeholder={String(t.add_task)} className="bg-transparent flex-1 text-lg font-bold text-white outline-none py-4" />
                 </div>
                 <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl">
                    {['morning', 'day', 'night'].map(sl => (
                      <button key={sl} onClick={()=>setNewTaskSlot(sl)} className={`p-3 rounded-xl transition-all ${newTaskSlot === sl ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-700'}`}>
                        {sl === 'morning' ? <Sun size={14}/> : sl === 'night' ? <Moon size={14}/> : <CloudSun size={14}/>}
                      </button>
                    ))}
                 </div>
                 <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddTask} className="bg-red-600 p-4 rounded-[1.8rem] hover:bg-red-500 shadow-xl transition-all text-white"><ArrowRightCircle size={28}/></motion.button>
              </div>
           </div>
           <div className="flex gap-3 p-3 bg-white/[0.01] border-[0.5px] border-white/10 rounded-[2.5rem] backdrop-blur-xl">
              <select value={timeFilter} onChange={(e)=>setTimeFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-zinc-500 outline-none cursor-pointer px-2">
                {Object.entries(t.slots).map(([k, v]) => <option key={k} value={k} className="bg-[#09090b]">{String(v)}</option>)}
              </select>
              <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase text-zinc-500 outline-none cursor-pointer px-2">
                <option value="all" className="bg-[#09090b]">All Filters</option>
                {Object.entries(t.status).map(([k, v]) => <option key={k} value={k} className="bg-[#09090b]">{String(v)}</option>)}
              </select>
           </div>
        </div>

        {/* TASK MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           <AnimatePresence mode='popLayout'>
           {filteredTasks.length === 0 ? (
             <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center gap-6">
                <ZapOff size={80} className="text-zinc-800" />
                <p className="text-2xl font-black italic tracking-widest uppercase text-zinc-800">Clear</p>
             </motion.div>
           ) : filteredTasks.map((tk) => (
             <TaskCard key={tk.id} tk={tk} t={t} s={s} onUpdate={updateStatus} onDelete={(id) => user.isDemo ? setTasks(tasks.filter(t=>t.id!==id)) : deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id))} onEdit={(task) => setEditingTask(task)} />
           ))}
           </AnimatePresence>
        </div>

        {/* WATER HUB MODAL */}
        <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-6">
           <AnimatePresence>
           {showWater && (
             <motion.div initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} className="bg-zinc-950/98 border-[0.5px] border-white/20 p-8 rounded-[4rem] shadow-[0_30px_100px_rgba(0,0,0,1)] w-80 backdrop-blur-3xl overflow-hidden glass-noise">
                <div className="flex justify-between items-center mb-8 relative z-10 px-2 text-right" dir="rtl">
                   <h4 className="font-black text-xl italic uppercase tracking-tighter text-blue-500">Hydration</h4>
                   <button onClick={()=>setShowWater(false)}><X size={20} className="text-zinc-600" /></button>
                </div>
                <div className="h-56 w-full bg-black/60 rounded-[2.5rem] relative overflow-hidden mb-8 border-[0.5px] border-white/10 shadow-inner">
                   <motion.div animate={{ y: [0, -3, 0], x: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }} className="absolute bottom-0 left-[-10%] w-[120%] bg-blue-600/25" style={{ height: `${Math.min(100, ((profile.waterLevel || 0) / 4000) * 100)}%` }} />
                   <div className="absolute inset-0 flex items-center justify-center font-black text-6xl tracking-tighter opacity-70 z-10">{Math.round(((profile.waterLevel || 0) / 4000) * 100)}%</div>
                </div>
                <div className="flex items-center gap-2 mb-6 text-right" dir="rtl">
                   {[100, 250, 600].map(v => (
                     <button key={v} onClick={()=>addWater(v)} className="flex-1 bg-white/5 hover:bg-blue-600/10 py-4 rounded-2xl font-black text-[10px] transition-all border border-white/10">{v}مل</button>
                   ))}
                </div>
                <div className="flex gap-2">
                   <input type="number" value={customWater} onChange={(e)=>setCustomWater(e.target.value)} placeholder={String(t.water.custom)} className="flex-1 bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-black text-white outline-none focus:ring-1 ring-blue-600" />
                   <button onClick={()=>addWater(customWater)} className="bg-blue-600 p-4 rounded-2xl shadow-lg active:scale-90 transition-transform"><Plus size={20}/></button>
                   <button onClick={async () => {
                     const lastAmt = profile.lastWaterAmount || 0;
                     const newLvl = Math.max(0, (profile.waterLevel || 0) - lastAmt);
                     if (user.isDemo) setProfile({...profile, waterLevel: newLvl});
                     else await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { waterLevel: newLvl });
                   }} className="bg-zinc-800 p-4 rounded-2xl text-zinc-500 hover:text-red-500 transition-all"><Undo2 size={20}/></button>
                </div>
             </motion.div>
           )}
           </AnimatePresence>
           <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowWater(!showWater)} className="w-20 h-20 bg-blue-600 text-white rounded-full shadow-[0_15px_40px_rgba(37,99,235,0.5)] flex items-center justify-center border-[0.5px] border-white/30 group"><Droplets size={32} className="group-hover:animate-bounce" /></motion.button>
        </div>

        {/* SETTINGS OVERLAY (Full-Screen Backdrop Blur) */}
        <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right" dir="rtl">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black backdrop-blur-2xl z-0" onClick={()=>setShowSettings(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative w-full max-w-2xl bg-white/[0.05] border-[0.5px] border-white/10 p-12 md:p-16 rounded-[4rem] md:rounded-[5rem] shadow-2xl backdrop-blur-3xl max-h-[90vh] overflow-y-auto no-scrollbar glass-noise z-10">
               <button onClick={()=>setShowSettings(false)} className="absolute top-10 right-10 text-zinc-600 hover:text-white transition-colors z-20"><X size={32}/></button>
               <div className="space-y-16 text-left" dir="ltr">
                  <h2 className="text-4xl font-black italic mb-12 text-red-600 tracking-tighter uppercase">System Config</h2>
                  <div className="space-y-12">
                    {/* IDENTITY SETTINGS */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-zinc-500 border-b border-white/5 pb-4">
                        <IDIcon size={20} className="text-red-600" />
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] block italic">Profile Settings</label>
                      </div>
                      <div className="bg-black/40 border-[0.5px] border-white/10 rounded-2xl p-4 flex items-center gap-4 group focus-within:border-red-600/40 transition-all">
                        <UserIcon size={18} className="text-zinc-700" />
                        <input type="text" value={profile.name} onChange={(e) => handleUpdateName(e.target.value)} placeholder="Your Name..." className="bg-transparent flex-1 text-zinc-100 font-bold outline-none placeholder:text-zinc-800" />
                      </div>
                    </div>
                    {/* SYSTEM TONE */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-zinc-500 border-b border-white/5 pb-4">
                        <LanguagesIcon size={20} className="text-red-600" />
                        <label className="text-[10px] font-black uppercase tracking-[0.5em] block italic">System Tone</label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SYSTEM_LANGS.map(lang => (
                          <button key={lang.id} onClick={async () => { if(user.isDemo) { setProfile({...profile, lang: lang.id}); return; } await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'), { lang: lang.id }); }} className={`p-8 rounded-[2rem] font-black text-xs transition-all border-[0.5px] flex items-center justify-between px-10 ${profile.lang === lang.id ? 'border-red-600 text-white bg-red-600/5 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-white/5 text-zinc-700 bg-white/[0.01] hover:bg-white/5'}`}><span>{String(lang.label)}</span>{profile.lang === lang.id && <CheckCircle2 size={20} className="text-red-500" />}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={async ()=>{ if(user.isDemo) window.location.reload(); else await signOut(auth); }} className="w-full py-8 bg-zinc-950 border-[0.5px] border-red-600/20 text-red-500 rounded-3xl font-black uppercase tracking-[0.5em] shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 leading-none">End Session</button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
        </AnimatePresence>

        {/* ULTRA MINIMALIST FOOTER (Humam Taibeh One-Line Fix) */}
        <footer className="mt-64 pt-24 border-t border-white/5 flex flex-col items-center justify-center px-6 pb-24 opacity-60 gap-16 text-center">
          <div className="w-full flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-800 max-w-5xl">
             <div className="flex items-center gap-2"><Shield size={14} className="text-zinc-900" /><p className="text-[8px] font-black uppercase tracking-[0.3em]">Encrypted System • AI Core Active</p></div>
             <div className="flex items-center gap-2"><p className="text-[8px] font-black uppercase tracking-[0.3em]">GlowUp Omni Absolute • Build V43.2</p><Rocket size={14} className="text-zinc-900" /></div>
          </div>
          <div className="flex flex-col items-center group cursor-default">
             <div className="relative">
                <motion.p transition={{ duration: 0.1 }} whileHover={{ color: "#ef4444", textShadow: "0 0 35px rgba(239,68,68,1)" }} className={`text-xl md:text-2xl font-black tracking-[0.4em] uppercase leading-none text-zinc-900 transition-colors cursor-pointer select-none whitespace-nowrap`}>HUMAM TAIBEH</motion.p>
                <motion.div initial={{ scaleX: 0 }} whileHover={{ scaleX: 1 }} transition={{ duration: 0.2 }} className="absolute -bottom-4 left-0 w-full h-[1px] bg-red-600 origin-center" />
             </div>
             <p className="text-[7px] font-black text-zinc-900 uppercase tracking-[1.2em] mt-10 opacity-40 uppercase">Sovereign Productivity Engine • © 2026</p>
          </div>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;700;900&display=swap');
        :root { font-family: 'Tajawal', sans-serif; background-color: #050505; color-scheme: dark; scroll-behavior: smooth; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        ::-selection { background: rgba(220, 38, 38, 0.4); color: white; }
        .font-light { font-weight: 300; } .font-black { font-weight: 900; }
        .glass-noise::before { content: ""; position: absolute; inset: 0; z-index: -1; opacity: 0.02; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); }
      `}</style>
    </div>
  );
};

export default App;
