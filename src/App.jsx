import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  serverTimestamp,
  query
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, TrendingUp, Zap, 
  BrainCircuit, Loader2, Dumbbell, Flame, Play, Pause, RotateCcw, 
  Quote, Target, Settings, X, Moon, Heart, Brain, Coffee, Swords, Rocket, 
  Gem, Filter, RefreshCw, Save, Search, Activity,
  FlameKindling, CheckCircle, Construction, CalendarDays, ArchiveX, History, Calendar, Edit2, LogOut,
  Mail, Lock, UserPlus, KeyRound, ArrowRightCircle, ShieldCheck, Settings2,
  Smartphone, ExternalLink, BookOpen, AlertCircle, MapPin, User, Book, Star, Wand2, Sun, CloudSun, Droplets, Timer
} from 'lucide-react';

// --- 1. FIREBASE CONFIGURATION (INTEGRATED BY HUMAM) ---
const firebaseConfig = {
  apiKey: "AIzaSyDRB_9laY7I6lG6ZpgphX5dzKiUdhwl40M",
  authDomain: "aura-sovereign.firebaseapp.com",
  projectId: "aura-sovereign",
  storageBucket: "aura-sovereign.firebasestorage.app",
  messagingSenderId: "912670363868",
  appId: "1:912670363868:web:e9d46f795d2cc932ce2419",
  measurementId: "G-CM81C8ED35"
};

// RULE 1: Sanitize path segments to avoid "Invalid document reference" (Even segments only)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'aura_sovereign_v47';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

const actualConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
const app = initializeApp(actualConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. AI SETUP (GEMINI 2.5 FLASH) ---
const apiKey = ""; // همام: بتقدر تحط مفتاحك هون لو حبيت تشغل الذكاء الحقيقي
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const App = () => {
  // --- CORE STATES ---
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [aura, setAura] = useState(0);
  const [streak, setStreak] = useState(0);
  const [waterTotal, setWaterTotal] = useState(0);
  const [lang, setLang] = useState("ar"); 
  const [config, setConfig] = useState({ fontSize: 'medium', iconSize: 'medium' });

  // UI & LOADING STATES
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login, register, reset, guest, setName
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [isGymMode, setIsGymMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuraInfo, setShowAuraInfo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("جاري تحضير الطاقة يا هُـمام... ⚡");

  // TIMER ENGINE
  const [timerActive, setTimerActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isCustomTime, setIsCustomTime] = useState(false);
  const timerRef = useRef(null);

  // SETTINGS & FILTER DRAFTS
  const [draftName, setDraftName] = useState("");
  const [filterSlot, setFilterSlot] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [newTaskSlot, setNewTaskSlot] = useState('day');
  const [newTaskFreq, setNewTaskFreq] = useState('none'); 

  // SCALING & VISUALS
  const scalingStyles = useMemo(() => {
    const scales = { small: 0.75, medium: 1, large: 1.4 };
    return { zoom: scales[config.fontSize] || 1 };
  }, [config.fontSize]);

  // ZUJ FINAL EXAM INTEL (As requested by Humam)
  const exams = [
    { id: 1, name: "الريادة والابتكار", date: "14/1/2026", time: "12:00-1:00", instructor: "د. يوسف أبوزغلة", location: "مختبرات 216", daysLeft: 9 },
    { id: 2, name: "Advanced Data Analytics", date: "21/1/2026", time: "11:30-1:30", instructor: "Dr. Ibrahim Atoum", location: "TBD", daysLeft: 16 },
    { id: 3, name: "Data Structure", date: "26/1/2026", time: "11:30-1:30", instructor: "Dr. Sohair Al Hakeem", location: "TBD", daysLeft: 21 },
    { id: 4, name: "Data Mining", date: "2/2/2026", time: "2:00-3:30", instructor: "Dr. Bilal Hawashin", location: "TBD", daysLeft: 28 }
  ];

  // --- 3. ROBUST DICTIONARY (Anti-Object Crash) ---
  const d = useMemo(() => ({
    welcome: "يا هلا.. عرفني عن اسمك؟",
    googleBtn: "Cloud Sync (Google) ☁️",
    emailBtn: "دخول",
    registerBtn: "عضوية جديدة",
    resetBtn: "نسيت كلمة السر؟",
    startBtn: "ابدأ الآن 🚀",
    errorName: "نَسيت الاسم يا بطل! ⚠️",
    efficiency: "الإنجاز",
    aura: "الآورا",
    beast: "Beast Mode",
    power: "Power Mode",
    focus: "Focus Mode",
    howLong: "كم دقيقة يا وحش؟ ⏱️",
    customTimerMsg: "اختيار بطل! {mins} دقيقة.. يلا Lock In! 🔥",
    addTaskPlaceholder: "شو هدفنا اليوم يا {name}؟",
    addBtn: "إضافة",
    identity: "اسم المناداة",
    save: "حفظ التغييرات",
    logout: "تسجيل خروج",
    heroSub: "نظام تنظيم الوقت والارتقاء الشخصي",
    empty: "القائمة فاضية.. ابدأ هسا!",
    statuses: { todo: "جاهزة", doing: "قيد التنفيذ", done: "تمت" },
    slots: { all: "الكل", morning: "الصبح", day: "نهاراً", night: "بليل" },
    freq: { none: "مرة واحدة", daily: "يومياً", weekly: "أسبوعياً", monthly: "شهرياً" },
    newDay: "يوم جديد 🌅",
    filters: "الفلاتر",
    hello: "هلا",
    streak: "الستريك",
    auraGuide: "كل مهمة بتخلصها بتزيد الآورا 10 نقاط. الستريك بلمع كل ما خلصت مهام اليوم!"
  }), []);

  // --- 4. FIREBASE LOGIC (Rule 3: Auth First) ---
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth));
      } else {
        await signInAnonymously(auth).catch(() => {});
      }
      setIsAuthLoading(false);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // DATA SYNC (Rule 1 & 2: Simple paths, memory sorting)
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserName(String(data.name || ""));
        setDraftName(String(data.name || ""));
        setAura(data.aura || 0);
        setStreak(data.streak || 0);
        setWaterTotal(data.water || 0);
      } else { setUserName(""); }
      setIsAuthLoading(false);
    });

    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    });

    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // --- 5. HANDLERS ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    setLoginError("");
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { setLoginError("خطأ في البيانات.. تأكد وحاول ثانية ⚠️"); }
    finally { setIsActionLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (err) { setLoginError("قوقل مقيد حالياً. استخدم الإيميل! ⚠️"); }
    finally { setIsGoogleLoading(false); }
  };

  const saveProfile = async (updates) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await setDoc(profileRef, { ...updates }, { merge: true });
    if(updates.name) setUserName(String(updates.name));
  };

  const handleAddTask = async (txt, slot = 'day', freq = 'none') => {
    if (!txt || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), {
      text: String(txt), completed: false, status: 'todo', emoji: "✨",
      slot, frequency: freq, timestamp: serverTimestamp()
    });
  };

  const toggleTask = async (id) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const sequence = ['todo', 'doing', 'done'];
    const nextStatus = sequence[(sequence.indexOf(task.status) + 1) % 3];
    let auraUpdate = aura;
    if (nextStatus === 'done' && task.status !== 'done') auraUpdate += 10;
    if (task.status === 'done' && nextStatus === 'todo') auraUpdate = Math.max(0, auraUpdate - 10);
    
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { 
      status: nextStatus, completed: nextStatus === 'done' 
    });
    saveProfile({ aura: auraUpdate });
  };

  const addWater = (amt) => {
    const newVal = Math.min(waterTotal + amt, 4000);
    setWaterTotal(newVal);
    saveProfile({ water: newVal });
  };

  const startNewDay = async () => {
    if (!user) return;
    const doneToday = tasks.filter(t => t.status === 'done').length;
    const newStreak = doneToday > 0 ? streak + 1 : 0;
    for (const task of tasks) {
      const taskDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id);
      if (task.frequency === 'none') { if (task.status === 'done') await deleteDoc(taskDocRef); }
      else { await updateDoc(taskDocRef, { status: 'todo', completed: false }); }
    }
    saveProfile({ streak: newStreak });
    setCurrentQuote("يوم جديد يعني فرصة جديدة للارتقاء! 🌅");
  };

  // AI Logic (Backup)
  const refreshAiQuote = () => {
    setIsAiLoading(true);
    const quotes = [
      "الالتزام هو اللي بيصنع الفرق.. 🔥",
      "الوحوش ما بتوقف.. كمل طريقك! 🦾",
      "كل مهمة بتخلصها هي خطوة للقمة. 👑",
      "الذكاء الاصطناعي بدو عقل صاحي وجسم قوي! 🧠🔥"
    ];
    setTimeout(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setIsAiLoading(false);
    }, 600);
  };

  // Timer Tick
  useEffect(() => {
    if (timerActive && timeLeft > 0) timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  const ringOffset = 502 - (502 * (timeLeft / (selectedDuration * 60)));
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const updateTimer = (m) => { setTimerActive(false); setTimeLeft(m * 60); setSelectedDuration(m); setIsCustomTime(false); };

  // --- 6. UI COMPONENTS ---

  // AUTH LANDING
  if (isAuthLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 size={64} className="text-blue-500 animate-spin" /></div>;

  if (!userName) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-right font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 blur-[180px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/5 blur-[180px] rounded-full"></div>
        
        <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-700">
          <div className="glass p-16 rounded-[4rem] text-center shadow-2xl border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_15px_blue]"></div>
            <Rocket size={48} className="text-blue-500 mx-auto mb-10 animate-bounce" />
            <h1 className="text-7xl font-black mb-4 italic text-white uppercase leading-none tracking-tighter">GLOWUP</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.6em] mb-12 italic">{String(d.heroSub)}</p>
            
            <div className="space-y-8">
              {user && !userName ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">{String(d.welcome)}</p>
                  <input 
                    type="text" placeholder="..." 
                    className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-8 text-center font-black text-4xl text-white outline-none focus:ring-4 ring-blue-500/10 shadow-inner transition-all"
                    onChange={(e)=>{setTempName(e.target.value); setLoginError("");}}
                    onKeyDown={(e)=>e.key==='Enter' && (!tempName.trim() ? setLoginError(String(d.errorName)) : saveProfile({name:tempName, aura:0, streak:0}))}
                  />
                  <button onClick={()=> !tempName.trim() ? setLoginError(String(d.errorName)) : saveProfile({name: tempName, aura: 0, streak: 0})} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[2.5rem] font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-900/40">ابدأ الآن 🚀</button>
                </div>
              ) : authMode === 'reset' ? (
                <div className="space-y-6 text-right animate-in slide-in-from-bottom-2">
                   <div className="bg-slate-950/50 p-6 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                      <Mail className="text-slate-600" size={20} />
                      <input type="email" placeholder="بريدك الإلكتروني" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} />
                   </div>
                   <button onClick={handlePasswordReset} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all">
                      <KeyRound size={20}/> {String(d.resetBtn)}
                   </button>
                   <button onClick={() => setAuthMode('login')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">العودة للدخول</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Mail className="text-slate-600" size={20} /><input type="email" placeholder="Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} required /></div>
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Lock className="text-slate-600" size={20} /><input type="password" placeholder="Password" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setPassword(e.target.value)} required /></div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl font-black text-white active:scale-95 transition-all shadow-xl shadow-blue-900/30">{authMode === 'login' ? String(d.emailBtn) : String(d.registerBtn)}</button>
                  </form>
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 px-4">
                    <button type="button" onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Join Now':'Sign In'}</button>
                    <button type="button" onClick={()=>setAuthMode('reset')}>{String(d.resetBtn)}</button>
                  </div>
                  <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5 opacity-10"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase bg-[#0f172a] px-4 italic">Cloud Protocol</div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="bg-white text-slate-900 p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm">{isGoogleLoading ? <Loader2 size={16} className="animate-spin" /> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google"/> GOOGLE</>}</button>
                    <button onClick={()=>signInAnonymously(auth)} className="bg-slate-800 text-white p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-700 flex items-center justify-center gap-2 shadow-sm"><Zap size={16} className="text-yellow-400" /> GUEST</button>
                  </div>
                </div>
              )}
              {loginError && <p className="text-red-500 text-[11px] font-black animate-pulse text-center">{String(loginError)}</p>}
              <div className="flex items-center justify-center gap-3 opacity-30 mt-8"><ShieldCheck size={14}/><p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Cloud Shield Protocol Active • V47.0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className={`min-h-screen transition-all duration-1000 p-6 md:p-8 pb-48 font-sans selection:bg-blue-500/30 overflow-x-hidden ${isGymMode ? 'bg-[#0b011d]' : 'bg-[#020617]'}`}>
      {isGymMode && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30"><div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-purple-600/40 to-transparent animate-heat-rise"></div></div>}
      <div className="fixed inset-0 pointer-events-none opacity-40 -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-600/40 animate-pulse' : 'bg-blue-600/10'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-red-900/30' : 'bg-indigo-600/5'}`}></div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto main-wrapper" style={{ zoom: scalingStyles.zoom }}>
        
        {/* TOP BAR / HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20 border-b border-white/5 pb-12 text-right">
            <div className="flex-1">
                <h1 className={`text-6xl md:text-9xl font-black italic leading-[0.8] mb-6 tracking-tighter ${isGymMode ? 'text-purple-400 drop-shadow-[0_0_20px_purple]' : 'text-white'}`}>
                  {String(d.hello)} <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent uppercase">{String(userName)}</span>
                </h1>
                <div className="inline-flex items-center gap-4 bg-slate-900/40 p-5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md group">
                  <BrainCircuit size={20} className={isGymMode ? "text-purple-400" : "text-blue-500"} />
                  <p className="text-slate-200 italic font-bold text-lg md:text-xl leading-none truncate max-w-[400px]">"{String(currentQuote)}"</p>
                  <button onClick={refreshAiQuote} disabled={isAiLoading} className="p-2 hover:rotate-180 transition-all duration-500 text-slate-600 hover:text-white">
                    <RefreshCw size={18} className={isAiLoading ? "animate-spin" : ""} />
                  </button>
                </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowAuraInfo(true)} className={`p-8 rounded-[2.5rem] border glass flex items-center gap-8 min-w-[280px] shadow-2xl transition-all hover:scale-105 active:scale-95 ${isGymMode ? 'border-purple-500/30 shadow-purple-950/20' : 'border-white/5 shadow-blue-950/20'}`}>
                 <div className="flex-1 text-right leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-2 italic tracking-widest">{String(d.aura)}</p><p className={`text-5xl font-black ${isGymMode ? 'text-purple-500' : 'text-blue-400'}`}><Gem className="inline" size={28} /> {aura}</p><div className="w-full h-1 bg-slate-800 rounded-full mt-5 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isGymMode ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`} style={{width: `${(aura % 1000) / 10}%`}}></div></div></div>
                 <div className="w-[1px] h-12 bg-white/10"></div>
                 <div className="text-center leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-2 italic tracking-widest">{String(d.streak)}</p><p className="text-5xl font-black text-orange-500">{streak} <Flame className="inline animate-pulse" size={32}/></p></div>
              </button>
              <button onClick={()=>setIsGymMode(!isGymMode)} className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center min-w-[160px] active:scale-95 shadow-2xl ${isGymMode ? 'bg-purple-600 border-purple-400 text-white shadow-purple-950/50' : 'glass text-slate-500 shadow-blue-900/10'}`}>{isGymMode ? <Flame size={40}/> : <Dumbbell size={40}/>}<p className="text-[10px] font-black uppercase mt-2">{isGymMode ? 'BEAST ACTIVATED' : String(d.power)}</p></button>
              <button onClick={()=>{setShowSettings(true); setDraftName(userName);}} className="p-10 rounded-[2.5rem] glass border border-white/5 text-slate-500 hover:text-blue-400 transition-all active:scale-90 shadow-xl"><Settings size={40}/></button>
            </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* COLUMN 1: VITALS & ACADEMICS (4/12) */}
            <div className="lg:col-span-4 space-y-12 animate-in slide-in-from-left-10 duration-1000">
                {/* Hydration Ops */}
                <section className="bg-slate-900/60 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <Droplets size={150} className="absolute -right-10 -top-10 opacity-5 text-cyan-500 group-hover:scale-110 transition-transform duration-[2s]" />
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 flex items-center gap-2 font-black italic"><Droplets size={14}/> Hydration Ops</h2>
                        <p className="text-3xl font-black text-white">{waterTotal}ml</p>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full mb-8 overflow-hidden shadow-inner"><div className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_15px_cyan]" style={{width:`${(waterTotal/2000)*100}%`}}></div></div>
                    <div className="grid grid-cols-3 gap-3">
                        {[250, 500, 750].map(amt => <button key={amt} onClick={()=>addWater(amt)} className="py-5 rounded-2xl bg-slate-800 hover:bg-cyan-900/40 text-xs font-black border border-white/5 transition-all active:scale-90 shadow-sm">+{amt}</button>)}
                    </div>
                </section>

                {/* ZUJ Exam Ops (Integrated Dates) */}
                <section className="bg-slate-900/60 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative group overflow-hidden">
                    <BookOpen size={150} className="absolute -right-10 -top-10 opacity-5 text-purple-400 group-hover:scale-110 transition-transform duration-[2s]" />
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-purple-400 mb-10 flex items-center gap-3 italic"><Calendar size={16}/> ZUJ EXAM OPS</h2>
                    <div className="space-y-4 relative z-10">
                        {exams.map(ex => (
                            <div key={ex.id} className="p-7 rounded-[3rem] bg-slate-950/60 border border-slate-800 flex justify-between items-center hover:border-purple-500/40 transition-all cursor-pointer shadow-lg active:scale-95 group/item">
                                <div className="text-right">
                                    <p className="text-lg font-black text-white uppercase tracking-tight leading-none group-hover/item:text-purple-300 transition-colors">{ex.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-2 tracking-[0.2em]">{ex.date} • {ex.instructor}</p>
                                </div>
                                <div className={`text-[10px] font-black px-4 py-2 rounded-full border shadow-inner ${ex.daysLeft < 10 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-purple-500/10 border-purple-500/30 text-purple-500'}`}>{ex.daysLeft}d</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* COLUMN 2: OPERATIONS CENTER (8/12) */}
            <div className="lg:col-span-8 space-y-12 animate-in slide-in-from-right-10 duration-1000">
                
                {/* TIMER HUB (VERTICAL DESIGN AS REQUESTED) */}
                <section className={`p-10 rounded-[5rem] border glass shadow-2xl flex items-center justify-between gap-12 w-full relative overflow-hidden group ${isGymMode ? 'border-purple-500/30 shadow-purple-950/30' : 'shadow-blue-950/10'}`}>
                    {/* Controls Side */}
                    <div className="flex flex-col gap-5 min-w-[140px] relative z-10">
                        <button onClick={()=>setTimerActive(!timerActive)} className={`w-24 h-24 rounded-[3rem] flex items-center justify-center transition-all active:scale-90 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${timerActive ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-blue-600 text-white shadow-blue-900/50'}`}>
                            {timerActive ? <Pause size={48}/> : <Play size={48} className="ml-1"/>}
                        </button>
                        <button onClick={()=>{setTimerActive(false); setTimeLeft(selectedDuration*60);}} className="w-24 h-20 rounded-[2.5rem] glass border border-white/5 text-slate-500 flex items-center justify-center active:rotate-180 transition-all duration-700 shadow-lg hover:text-white">
                          <RotateCcw size={32}/>
                        </button>
                    </div>

                    {/* Ring Side (Middle) */}
                    <div className="relative flex flex-col items-center justify-center flex-1">
                        <svg className="w-72 h-72 transform -rotate-90">
                          <circle cx="144" cy="144" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/50 shadow-inner" />
                          <circle cx="144" cy="144" r="120" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="754" strokeDashoffset={754 - (754 * (timeLeft / (selectedDuration * 60)))} strokeLinecap="round" className={`transition-all duration-1000 ${isGymMode ? 'text-purple-600 drop-shadow-[0_0_20px_purple]' : 'text-blue-500 drop-shadow-[0_0_20px_blue]'}`} />
                        </svg>
                        <div className="absolute flex flex-col items-center text-center">
                          <p className="text-7xl font-black text-white tracking-tighter leading-none">{formatTime(timeLeft)}</p>
                          {isCustomTime && <p className="text-[10px] font-black text-slate-500 uppercase mt-4 px-4 italic animate-pulse tracking-widest">{String(d.customTimerMsg).replace('{mins}', selectedDuration)}</p>}
                        </div>
                        {isCustomTime && <input type="number" autoFocus placeholder={String(d.howLong)} className={`mt-6 w-32 glass border border-white/10 rounded-2xl p-4 text-center text-white font-black text-2xl outline-none focus:ring-4 ${isGymMode ? 'ring-purple-600/20' : 'ring-blue-600/20'} shadow-inner`} onChange={(e)=>{const v=parseInt(e.target.value); if(v>0) {setSelectedDuration(v); setTimeLeft(v*60);}}} />}
                    </div>

                    {/* Presets Side */}
                    <div className="flex flex-col gap-4 min-w-[120px] items-end relative z-10">
                        {[15, 25, 45, 60].map(m => (<button key={m} onClick={()=>updateTimer(m)} className={`h-16 w-24 rounded-[2rem] text-sm font-black uppercase transition-all shadow-xl ${selectedDuration===m && !isCustomTime ? (isGymMode ? 'bg-purple-600 text-white shadow-purple-900/50' : 'bg-blue-600 text-white shadow-blue-900/50') : 'glass text-slate-500 hover:text-white border border-white/5'}`}>{m}m</button>))}
                        <button onClick={()=>setIsCustomTime(!isCustomTime)} className={`h-16 w-24 rounded-[2rem] glass transition-all shadow-xl flex items-center justify-center ${isCustomTime ? (isGymMode ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-white border border-white/5'}`}><Settings2 size={28}/></button>
                    </div>
                </section>

                {/* TASK HUB */}
                <div className="space-y-12">
                    <div className={`glass p-4 rounded-[5rem] border transition-all shadow-2xl ${isGymMode ? 'border-purple-600/30 focus-within:ring-4 ring-purple-600/20' : 'border-white/5 focus-within:ring-4 ring-blue-600/10'}`}>
                        <form onSubmit={(e)=>{e.preventDefault(); handleAddTask(e.target.task.value, newTaskSlot, newTaskFreq); e.target.reset();}} className="flex flex-col md:flex-row gap-4 items-center">
                            <div className={`flex-1 flex items-center px-10 rounded-[3rem] border glass shadow-inner transition-all ${isGymMode ? 'border-purple-900/30 bg-slate-950/40' : 'border-slate-800 bg-slate-950/20'}`}>
                                <Plus size={32} className={isGymMode ? 'text-purple-700 mr-6' : 'text-slate-600 mr-6'} />
                                <input name="task" placeholder={String(d.addTaskPlaceholder).replace('{name}', userName)} className="w-full bg-transparent py-12 text-3xl md:text-4xl font-black outline-none text-white placeholder:text-slate-800 text-right tracking-tight leading-tight" />
                            </div>
                            <div className="flex flex-col gap-3 min-w-[220px]">
                              <div className={`flex gap-2 p-1.5 rounded-2xl border glass ${isGymMode ? 'border-purple-900/40' : 'border-white/5'}`}>
                                {['morning', 'day', 'night'].map(s => (
                                  <button key={s} type="button" onClick={() => setNewTaskSlot(s)} title={String(d.slots[s])} className={`flex-1 p-4 rounded-xl transition-all active:scale-90 ${newTaskSlot === s ? (isGymMode ? 'bg-purple-600 text-white shadow-purple-600/30' : 'bg-blue-600 text-white shadow-lg') : (isGymMode ? 'text-purple-900 hover:text-purple-500' : 'text-slate-500 hover:text-white')}`}>
                                      {s === 'morning' ? <Sun size={20}/> : s === 'day' ? <CloudSun size={20}/> : <Moon size={20}/>}
                                  </button>
                                ))}
                              </div>
                              <select onChange={(e) => setNewTaskFreq(e.target.value)} className={`text-[10px] font-black uppercase px-5 py-4 rounded-2xl outline-none border glass cursor-pointer transition-all ${isGymMode ? 'text-purple-100 border-purple-800/40 bg-purple-950/40' : 'text-slate-400 border-white/5 bg-slate-800'}`}>
                                {Object.entries(d.freq).map(([k,v]) => <option key={k} value={k}>{String(v)}</option>)}
                              </select>
                              <button type="submit" className={`px-12 py-6 rounded-[2.5rem] font-black text-white active:scale-95 transition-all shadow-2xl uppercase tracking-widest text-sm ${isGymMode ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'}`}>{String(d.addBtn)}</button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {tasks.length === 0 ? (
                          <div className="py-48 text-center border-4 border-dashed border-slate-900/40 rounded-[6rem] animate-pulse opacity-20 group">
                            <ArchiveX size={100} className="mx-auto mb-8 text-slate-800 group-hover:scale-110 transition-transform duration-1000" />
                            <p className="text-3xl font-black uppercase tracking-[0.5em] italic text-slate-700">Operations Pending..</p>
                          </div>
                        ) : tasks.map(task => (
                            <div key={task.id} className={`group flex items-center justify-between p-8 rounded-[4rem] border glass transition-all duration-700 ${task.completed ? 'opacity-30 grayscale scale-95 border-slate-900 shadow-none' : (isGymMode ? 'border-purple-900/20 shadow-2xl shadow-purple-950/20 hover:scale-[1.01] hover:border-purple-500/40' : 'hover:border-blue-500/30 hover:scale-[1.01] shadow-xl hover:shadow-blue-950/20')}`}>
                              <div className="flex items-center gap-10 flex-1 overflow-hidden text-right">
                                <button onClick={()=>toggleTask(task.id)} className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all shadow-lg active:scale-90 ${task.completed ? 'bg-emerald-500 text-white shadow-emerald-900/40' : 'glass border-2 border-slate-800 text-transparent hover:border-blue-500 shadow-inner'}`}><CheckCircle2 size={32}/></button>
                                <div className="flex items-center gap-8 overflow-hidden">
                                  <span className="text-5xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-700">{String(task.emoji || "✨")}</span>
                                  <div className="flex flex-col overflow-hidden text-right">
                                    <p className={`text-3xl md:text-4xl font-black tracking-tight truncate leading-tight ${task.completed ? 'line-through text-slate-500 italic' : 'text-slate-100 italic'}`}>{String(task.text)}</p>
                                    <div className="flex items-center justify-end gap-5 mt-4">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border shadow-sm ${isGymMode ? 'bg-purple-500/5 border-purple-500/10 text-purple-900' : 'bg-slate-800/50 border-white/5 text-slate-600'}`}>{String(d.slots[task.slot] || "Grind")}</span>
                                        {task.frequency !== 'none' && <span className="text-[10px] font-black uppercase italic bg-blue-500/10 text-blue-500 px-4 py-1.5 rounded-full border border-blue-500/20 shadow-sm">{String(d.freq[task.frequency])}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button onClick={()=>deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-6 text-slate-700 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-3xl active:scale-90"><Trash2 size={28}/></button>
                            </div>))}
                    </div>
                </div>
            </div>
        </main>

        <footer className="mt-64 border-t border-white/5 pt-20 flex flex-col md:flex-row justify-between items-center gap-12 px-12 pb-24 opacity-40 hover:opacity-100 transition-all duration-1000 text-right">
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-black tracking-[0.8em] text-slate-500 uppercase italic">V47.1 SOVEREIGN MASTER BUILD</p>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">DISCIPLINE EQUALS FREEDOM • ZUJ AI CORE</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-right leading-none group">
                <p className="text-[11px] font-black uppercase text-slate-600 mb-3 italic tracking-widest group-hover:text-blue-500 transition-colors">DESIGNED & OPTIMIZED BY</p>
                <div className="relative">
                  <p className={`text-5xl font-black uppercase tracking-widest leading-none italic ${isGymMode ? 'text-purple-600 drop-shadow-[0_0_15px_purple]' : 'text-white'}`}>HUMAM TAIBEH 🦾</p>
                  <div className={`h-1 w-full mt-4 rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-500 shadow-[0_0_15px_purple]' : 'bg-blue-500'}`}></div>
                </div>
            </div>
        </footer>
      </div>

      {/* AURA INFO MODAL */}
      {showAuraInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setShowAuraInfo(false)}></div>
           <div className="relative w-full max-w-md bg-slate-900 border border-white/10 p-16 rounded-[5rem] text-center shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_15px_blue]"></div>
              <Gem size={80} className="mx-auto text-blue-400 mb-10 animate-pulse" />
              <h3 className="text-4xl font-black text-white mb-8 uppercase italic tracking-tighter">Aura Protocol</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-12 text-right font-bold italic">"{String(d.auraGuide)}"</p>
              <div className="bg-slate-800/50 p-10 rounded-[3rem] border border-white/5 mb-12 flex justify-between items-center text-right shadow-inner relative overflow-hidden">
                 <div className="text-right flex-1 relative z-10"><p className="text-[11px] font-black text-slate-500 uppercase mb-2 tracking-[0.2em]">{String(d.streak)}</p><p className="text-6xl font-black text-white leading-none">{streak}</p></div>
                 <Flame size={72} className={streak > 0 ? 'text-orange-500 ml-4 animate-pulse relative z-10' : 'text-slate-700 ml-4 relative z-10'} />
              </div>
              <button onClick={() => setShowAuraInfo(false)} className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] active:scale-95 transition-all shadow-2xl shadow-blue-900/40">LOCKED IN 🦾</button>
           </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-right">
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
              <div className={`relative w-full max-w-2xl border p-20 rounded-[6rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] glass animate-in zoom-in-95 duration-500 ${isGymMode ? 'border-purple-500/20' : 'border-white/5'}`}>
                <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 p-6 rounded-full border bg-slate-800 text-slate-400 hover:bg-red-500 transition-all active:scale-90 shadow-2xl"><X size={32}/></button>
                <h2 className={`text-6xl font-black italic mb-20 flex items-center gap-6 ${isGymMode ? 'text-purple-50' : 'text-white'}`}><Settings className={isGymMode ? "animate-spin-slow text-purple-600" : "text-blue-500"} /> CORE CONFIG</h2>
                <div className="space-y-16 relative z-10 text-right font-sans">
                    <div className="space-y-6">
                        <label className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 flex items-center justify-end gap-3 italic font-black">اسم المناداة <UserCircle size={18} /></label>
                        <input type="text" value={draftName} className={`w-full border rounded-[3rem] p-10 font-black text-white text-5xl text-center outline-none transition-all shadow-inner ${isGymMode ? 'bg-slate-950 border-purple-500/20 focus:ring-purple-600/10' : 'bg-slate-950 border-white/5 focus:ring-blue-600/10'}`} onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="pt-20 border-t border-white/5 space-y-6">
                        <button onClick={() => { saveProfile({ name: draftName }); setShowSettings(false); }} className={`w-full py-10 rounded-[3.5rem] font-black text-base uppercase tracking-[0.5em] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 ${isGymMode ? 'bg-purple-700 hover:bg-purple-600 shadow-purple-900/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}><Save size={32} /> {String(d.save)}</button>
                        <button onClick={()=>signOut(auth).then(()=>window.location.reload())} className="w-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white py-6 rounded-[3rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-xl border border-white/5 active:scale-95"><LogOut size={20}/> {String(d.logout)}</button>
                    </div>
                </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes heat-rise { 0% { transform: translateY(0) scaleY(1); opacity: 0.3; } 50% { transform: translateY(-40px) scaleY(1.2); opacity: 0.6; } 100% { transform: translateY(-80px) scaleY(1.4); opacity: 0; } }
        .animate-heat-rise { animation: heat-rise 2s infinite linear; }
        .logo-glow { text-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;
