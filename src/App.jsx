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
  query,
  getDoc
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, TrendingUp, Zap, 
  Dumbbell, Flame, Play, Pause, RotateCcw, 
  Quote, Settings, UserCircle, 
  Clock, X, Moon, Heart, Brain, Timer, Coffee, 
  Swords, Rocket, Trophy, Power, Settings2, 
  AlertTriangle, Sun, Sunset, CloudSun, Layout, User, Bot, 
  Gem, Ghost, Crown, Star, RefreshCw, Save, Activity,
  CheckCircle, Construction, CalendarDays, ArchiveX, History, Calendar, Edit2, LogOut,
  Mail, Lock, UserPlus, KeyRound, ArrowRightCircle, ShieldCheck, Droplets, Info,
  Calculator, ChevronRight, ChevronLeft, FastForward, Target, ZapOff, Scale, Utensils,
  LayoutGrid, Loader2
} from 'lucide-react';

// ==========================================
// 1. FIREBASE & CORE CONFIGURATION
// ==========================================
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_omni_absolute_v1';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const apiKey = ""; 

// ==========================================
// 2. CONSTANTS & STATIC DATA (ZUJ Hub)
// ==========================================
const ZUJ_EXAMS = [
  { 
    id: 1, 
    name: "الريادة والابتكار (Entrepreneurship)", 
    doctor: "د. يوسف أبوزغلة العمارين", 
    date: "2026-01-14T12:00:00", 
    location: "كلية الأعمال - مختبر 216", 
    notes: "الفصل 1-6" 
  },
  { 
    id: 2, 
    name: "تحليلات البيانات (Data Analytics)", 
    doctor: "د. إبراهيم عتوم", 
    date: "2026-01-21T11:30:00", 
    location: "ZUJ AI Lab", 
    notes: "Advanced Analytics Focus" 
  },
  { 
    id: 3, 
    name: "تراكيب البيانات (Data Structure)", 
    doctor: "د. سهير الحكيم", 
    date: "2026-01-26T11:30:00", 
    location: "Main Hall", 
    notes: "20251-Data Structure-AllSec" 
  },
  { 
    id: 4, 
    name: "تنقيب البيانات (Data Mining)", 
    doctor: "د. بلال حواشين", 
    date: "2026-02-02T14:00:00", 
    location: "Online/Lab 5", 
    notes: "Final Project Submission" 
  },
];

const FOOD_DATABASE = [
  { name: "بيضة مسلوقة", protein: 6, calories: 70 },
  { name: "بطاطا مسلوقة (100g)", protein: 2, calories: 87 },
  { name: "صدر دجاج (100g)", protein: 31, calories: 165 },
  { name: "علبة تونة", protein: 25, calories: 120 },
];

// ==========================================
// 3. MAIN COMPONENT (App)
// ==========================================
const App = () => {
  // --- A. Authentication States ---
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login, register, reset, guest_setup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // --- B. User Profile & Progress States ---
  const [profile, setProfile] = useState({
    name: "",
    aura: 0,
    streak: 0,
    waterLevel: 0, // in ml
    totalProtein: 0,
    creatineTaken: false,
    lastLogin: null
  });

  // --- C. Operations States (Tasks) ---
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskSlot, setTaskSlot] = useState("morning"); // morning, day, night
  const [taskFreq, setTaskFreq] = useState("once"); // once, daily, weekly

  // --- D. UI & Mode States ---
  const [isGymMode, setIsGymMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, operations, health, academy, settings
  const [aiQuote, setAiQuote] = useState("يا مية أهلاً بالبطل همام! الموقع جاهز يخدمك. 🔥");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAuraModal, setShowAuraModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- E. Timer Logic States ---
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const timerRef = useRef(null);

  // ==========================================
  // 4. FIREBASE SYNC & LIFECYCLE
  // ==========================================
  
  // (1) Auth Observer
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth Init Error", e); }
      setAuthChecking(false);
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) resetAllStates();
    });
    return () => unsub();
  }, []);

  // (2) Real-time Data Listeners (Firestore Rules Compliant)
  useEffect(() => {
    if (!user) return;

    // Profile Listener
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) setProfile(snap.data());
      else setAuthMode('guest_setup'); // Trigger name setup if no profile exists
    }, (err) => console.error("Profile Fetch Fail", err));

    // Tasks Listener
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      const tList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTasks(tList.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)));
    }, (err) => console.error("Tasks Fetch Fail", err));

    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // (3) Timer Interval
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (timeLeft === 0 && timerRunning) {
        setTimerRunning(false);
        handleAuraGain(5); // Small reward for focus session
      }
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timeLeft]);

  // ==========================================
  // 5. CORE LOGIC FUNCTIONS
  // ==========================================

  const resetAllStates = () => {
    setProfile({ name: "", aura: 0, streak: 0, waterLevel: 0, totalProtein: 0, creatineTaken: false, lastLogin: null });
    setTasks([]);
    setAiQuote("سجّل دخول يا وحش عشان نبلش! 🔥");
  };

  const handleAuraGain = async (pts) => {
    if (!user) return;
    const newAura = (profile.aura || 0) + pts;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    await setDoc(profileRef, { aura: newAura }, { merge: true });
  };

  const handleAddWater = async (ml) => {
    if (!user) return;
    const newLevel = Math.min(5000, (profile.waterLevel || 0) + ml);
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    await setDoc(profileRef, { waterLevel: newLevel }, { merge: true });
  };

  const handleTaskAction = async (txt, slot, freq) => {
    if (!txt.trim() || !user) return;
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    await addDoc(tasksCol, {
      text: txt,
      status: 'todo',
      slot,
      frequency: freq,
      dateAdded: new Date().toISOString(),
      completed: false
    });
    setNewTask("");
  };

  const toggleTaskStatus = async (task) => {
    const sequence = ['todo', 'doing', 'done'];
    const currentIndex = sequence.indexOf(task.status);
    const nextStatus = sequence[(currentIndex + 1) % 3];
    const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id);
    await updateDoc(taskDoc, { status: nextStatus, completed: nextStatus === 'done' });
    
    if (nextStatus === 'done' && task.status !== 'done') {
      handleAuraGain(10);
    }
  };

  const deleteTask = async (id) => {
    if (!user) return;
    const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
    await deleteDoc(taskDoc);
  };

  // --- AI ENGINE (Gemini 2.5) ---
  const callGemini = async (prompt, system) => {
    setIsAiLoading(true);
    let backoff = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: system }] }
          })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        setIsAiLoading(false);
        return typeof text === 'string' ? text : "فشلت عملية التحفيز حالياً، استمر يا بطل! 🔥";
      } catch (e) {
        await new Promise(r => setTimeout(r, backoff));
        backoff *= 2;
      }
    }
    setIsAiLoading(false);
    return "فشلت عملية التحفيز حالياً، استمر يا بطل! 🔥";
  };

  const refreshMotivation = async () => {
    const mood = isGymMode ? "Beast Mode, Aggressive, Gym Vibe, Slang" : "Success, Wisdom, Discipline, Calm";
    const res = await callGemini(
      `اعطيني جملة تحفيزية لـ ${profile.name || 'همام'} بلهجة أردنية سلاج (Slang) قوية جداً. المود هسا هو: ${mood}.`,
      "Jordanian Motivation Coach. Be direct, use emojis, and sound like a brother."
    );
    if (res) setAiQuote(res.trim());
  };

  const handleIdentitySave = async () => {
    if (!tempName.trim()) { setAuthError("نَسيت الاسم يا بطل! ⚠️"); return; }
    // Protocol Check
    if (tempName.toLowerCase() !== "همام" && tempName.toLowerCase() !== "humam") {
      setAuthError("نَسيت الاسم يا بطل! ⚠️ (ممنوع دخول غير همام)");
      return;
    }
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core');
    await setDoc(profileRef, {
      name: tempName,
      aura: 0,
      streak: 0,
      waterLevel: 0,
      totalProtein: 0,
      creatineTaken: false,
      lastLogin: new Date().toISOString()
    }, { merge: true });
    setAuthSuccess("يا هلا بالزعيم همام! 🔥");
    // Clear setup mode
    setAuthMode('login');
  };

  // --- Auth Actions ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { setAuthError("معلوماتك فيها غلط يا غالي! ⚠️"); }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setAuthError("مشكلة في تسجيل الدخول عبر جوجل! ⚠️");
    }
  };

  const handleGuestEntry = async () => {
    try {
      await signInAnonymously(auth);
      setAuthMode('guest_setup');
    } catch (err) {
      setAuthError("مشكلة في الدخول السريع! ⚠️");
    }
  };

  // --- Utils ---
  const getExamCountdown = (targetDate) => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return "انتهى ✅";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h`;
  };

  // ==========================================
  // 6. RENDERERS (Sub-Components)
  // ==========================================

  // (A) Login / Register Screen
  if (authChecking) return <div className="h-screen bg-[#020617] flex items-center justify-center text-purple-500 animate-pulse"><Loader2 size={60} className="animate-spin" /></div>;

  if (!user || !profile.name) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-right font-sans selection:bg-purple-500/30 overflow-hidden" dir="rtl">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse"></div>
        
        <div className="w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-700">
          <div className="glass p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 to-indigo-500"></div>
            
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-purple-600/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20 group hover:scale-110 transition-all">
                <Rocket size={48} className="text-purple-500 group-hover:animate-bounce" />
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">GlowUp <span className="text-purple-500">Omni</span></h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Absolute Mastery Protocol</p>
            </div>

            {authMode === 'guest_setup' ? (
              <div className="space-y-6 text-center">
                <p className="text-slate-400 font-black text-lg">يا مية هلا بالبطل! عرفنا باسمك المسجل بالبروتوكول؟</p>
                <input 
                  autoFocus
                  type="text" placeholder="اكتب همام..." 
                  className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-6 text-center text-4xl font-black text-white outline-none focus:ring-4 ring-purple-500/20 shadow-inner"
                  onChange={(e)=>setTempName(e.target.value)}
                  onKeyDown={(e)=>e.key==='Enter' && handleIdentitySave()}
                />
                <button onClick={handleIdentitySave} className="w-full bg-purple-600 hover:bg-purple-500 py-6 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest">تأكيد الهوية <Zap size={20}/></button>
              </div>
            ) : authMode === 'reset' ? (
              <div className="space-y-6">
                <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                  <Mail className="text-slate-600" />
                  <input type="email" placeholder="إيميلك المسجل" className="bg-transparent flex-1 outline-none text-white font-bold" onChange={(e)=>setEmail(e.target.value)} />
                </div>
                <button onClick={async () => { try{await sendPasswordResetEmail(auth, email); setAuthSuccess("تم إرسال رابط التعيين ✅");}catch(e){setAuthError("الإيميل غلط! ⚠️");} }} className="w-full bg-indigo-600 py-5 rounded-3xl font-black text-white shadow-xl active:scale-95 transition-all">إرسال رابط استعادة الباسورد</button>
                <button onClick={()=>setAuthMode('login')} className="w-full text-slate-500 text-[10px] font-black uppercase tracking-widest">رجوع للدخول</button>
              </div>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                    <Mail className="text-slate-600" size={20} />
                    <input type="email" placeholder="الإيميل" className="bg-transparent flex-1 outline-none text-white font-bold" onChange={(e)=>setEmail(e.target.value)} required />
                  </div>
                  <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                    <Lock className="text-slate-600" size={20} />
                    <input type="password" placeholder="كلمة السر" className="bg-transparent flex-1 outline-none text-white font-bold" onChange={(e)=>setPassword(e.target.value)} required />
                  </div>
                  <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 py-6 rounded-3xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest">
                    {authMode === 'login' ? 'تسجيل دخول' : 'إنشاء حساب جديد'} <ArrowRightCircle size={20}/>
                  </button>
                </form>
                <div className="flex justify-between px-2">
                  <button onClick={()=>setAuthMode(authMode==='login'?'register':'login')} className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">{authMode==='login'?'سجّل هسا':'عندي حساب'}</button>
                  <button onClick={()=>setAuthMode('reset')} className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-all">نسيت الباسورد؟</button>
                </div>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-[#0f172a] px-4 text-slate-600">طرق دخول أخرى</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={handleGoogleAuth} className="bg-white text-slate-950 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm hover:bg-slate-100 transition-all"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4"/> Google</button>
                  <button onClick={handleGuestEntry} className="bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-sm hover:bg-slate-700 transition-all"><Zap size={16} className="text-yellow-400"/> Guest</button>
                </div>
              </div>
            )}

            {authError && <p className="text-red-500 text-center text-[10px] font-black mt-6 uppercase tracking-widest animate-pulse">{authError}</p>}
            {authSuccess && <p className="text-emerald-500 text-center text-[10px] font-black mt-6 uppercase tracking-widest">{authSuccess}</p>}
          </div>
          <div className="mt-8 flex items-center justify-center gap-3 opacity-30">
            <ShieldCheck size={14} className="text-slate-500" />
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Humam Taibeh Sovereign Protection Protocol V43.0</p>
          </div>
        </div>
      </div>
    );
  }

  // (B) Main App Dashboard
  return (
    <div className={`min-h-screen transition-all duration-1000 p-4 md:p-8 font-sans selection:bg-purple-500/40 relative overflow-x-hidden ${isGymMode ? 'bg-[#1a0101]' : 'bg-[#020617]'} text-right`} dir="rtl">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ${isGymMode ? 'bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.05),transparent_70%)]'}`}></div>
        {isGymMode && (
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full animate-heat-rise bg-gradient-to-t from-red-600 to-transparent"></div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* --- HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-8 animate-in slide-in-from-top-10 duration-1000">
          <div className="flex flex-col gap-2">
            <h1 className={`text-6xl md:text-8xl font-black italic tracking-tighter transition-all duration-1000 leading-none ${isGymMode ? 'text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.7)]' : 'text-white'}`}>
              يا هلا <span className="bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent uppercase">{profile.name}</span>
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <span className={`h-2 w-2 rounded-full animate-pulse ${isGymMode ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_emerald]'}`}></span>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic">Identity Protocol Active: Humam-Omni-Absolute</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Stats Cards */}
            <div className={`p-6 rounded-[2.5rem] border transition-all duration-700 flex items-center gap-6 shadow-2xl ${isGymMode ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl'}`}>
              <div className="text-center px-4 border-l border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Aura</p>
                <div className="flex items-center gap-2 justify-center">
                  <p className={`text-4xl font-black ${isGymMode ? 'text-red-500' : 'text-purple-400'}`}>{profile.aura || 0}</p>
                  <Gem size={24} className={isGymMode ? 'text-red-500' : 'text-purple-400'} />
                </div>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Streak</p>
                <div className="flex items-center gap-2 justify-center">
                  <p className={`text-4xl font-black ${profile.streak > 0 ? 'text-orange-500' : 'text-slate-700'}`}>{profile.streak || 0}</p>
                  <Flame size={24} className={profile.streak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-700'} />
                </div>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="flex gap-2">
              <button onClick={() => setIsGymMode(!isGymMode)} className={`p-8 rounded-[2.5rem] border transition-all duration-700 flex flex-col items-center justify-center min-w-[120px] active:scale-90 shadow-2xl ${isGymMode ? 'bg-red-600 border-red-400 text-white shadow-red-900/40' : 'bg-slate-900/40 border-white/5 text-slate-500'}`}>
                <Dumbbell size={32} className={isGymMode ? 'animate-pulse' : ''} />
                <p className="text-[9px] font-black uppercase mt-2 tracking-widest">{isGymMode ? 'BEAST MODE' : 'POWER FITNESS'}</p>
              </button>
              <button onClick={() => setActiveTab('settings')} className={`p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 text-slate-500 hover:text-white transition-all shadow-xl active:scale-90`}>
                <Settings size={32} />
              </button>
            </div>
          </div>
        </header>

        {/* --- AI MOTIVATION PROTOCOL --- */}
        <section className={`p-8 rounded-[3.5rem] border transition-all duration-700 shadow-2xl flex flex-col md:flex-row items-center gap-8 ${isGymMode ? 'bg-red-950/20 border-red-600/20 text-red-100' : 'bg-slate-900/40 border-white/10 backdrop-blur-2xl text-slate-100'}`}>
          <div className={`w-20 h-20 rounded-[1.8rem] flex items-center justify-center shadow-inner ${isGymMode ? 'bg-red-600/20 text-red-500' : 'bg-purple-600/20 text-purple-500'}`}>
            {isAiLoading ? <Loader2 className="animate-spin" size={32} /> : <Bot size={40} className={isGymMode ? 'animate-pulse' : ''} />}
          </div>
          <div className="flex-1">
            <p className="text-2xl md:text-3xl font-black italic tracking-tight leading-tight">"{aiQuote}"</p>
            <div className="flex items-center gap-2 mt-2 opacity-40">
              <Sparkles size={14} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Gemini AI 2.5 Motivation Neural Link</p>
            </div>
          </div>
          <button onClick={refreshMotivation} className="p-5 bg-slate-800/50 hover:bg-slate-700 rounded-3xl transition-all hover:rotate-180 active:scale-90 border border-white/5"><RefreshCw size={24}/></button>
        </section>

        {/* --- NAVIGATION TABS --- */}
        <nav className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: <LayoutGrid size={20}/> },
            { id: 'operations', label: 'مركز العمليات', icon: <Swords size={20}/> },
            { id: 'health', label: 'المؤشرات الحيوية', icon: <Activity size={20}/> },
            { id: 'academy', label: 'ZUJ Exam Hub', icon: <Brain size={20}/> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={()=>setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-sm whitespace-nowrap transition-all shadow-xl active:scale-95 ${activeTab === tab.id ? (isGymMode ? 'bg-red-600 text-white shadow-red-900/50' : 'bg-purple-600 text-white shadow-purple-900/50') : 'bg-slate-900/40 border border-white/5 text-slate-500 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* --- DYNAMIC TAB CONTENT --- */}
        <main className="animate-in fade-in slide-in-from-bottom-5 duration-700">
          
          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Focus Timer */}
              <div className={`lg:col-span-2 p-10 rounded-[4rem] border transition-all duration-700 flex flex-col items-center justify-center gap-8 relative overflow-hidden ${isGymMode ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5 shadow-2xl backdrop-blur-3xl'}`}>
                <div className="relative flex items-center justify-center">
                   <svg className="w-64 h-64 transform -rotate-90">
                      <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-950/40" />
                      <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray="691" strokeDashoffset={691 - (691 * (timeLeft / timerTotal))} strokeLinecap="round" className={`transition-all duration-500 ${timerRunning ? (isGymMode ? 'text-red-500 shadow-[0_0_20px_red]' : 'text-purple-500 shadow-[0_0_15px_purple]') : 'text-slate-800'}`} />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                     <p className={`text-6xl font-black tracking-tighter ${timerRunning ? 'text-white' : 'text-slate-700'}`}>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Deep Work Protocol</p>
                   </div>
                </div>
                <div className="flex gap-6 items-center">
                   <button onClick={()=>setTimeLeft(prev => prev + 300)} className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 hover:text-white transition-all">+5m</button>
                   <button onClick={()=>setTimerRunning(!timerRunning)} className={`w-24 h-24 rounded-[2.2rem] flex items-center justify-center transition-all shadow-2xl active:scale-90 ${timerRunning ? 'bg-red-600 text-white animate-pulse' : 'bg-purple-600 text-white'}`}>
                     {timerRunning ? <Pause size={40} /> : <Play size={40} className="mr-1" />}
                   </button>
                   <button onClick={()=>{setTimerRunning(false); setTimeLeft(25 * 60);}} className="p-4 bg-slate-800/50 rounded-2xl text-slate-500 hover:text-white transition-all"><RotateCcw size={28}/></button>
                </div>
              </div>

              {/* Quick Daily Stats */}
              <div className="flex flex-col gap-8">
                <div className={`p-8 rounded-[3.5rem] border transition-all duration-700 ${isGymMode ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5 shadow-xl'}`}>
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3"><Droplets className="text-blue-500"/> شرب الماء اليوم</h3>
                  <div className="h-4 bg-slate-950 rounded-full overflow-hidden shadow-inner mb-6 border border-white/5">
                    <div className="h-full bg-blue-500 shadow-[0_0_15px_blue] transition-all duration-1000" style={{width: `${((profile.waterLevel || 0) / 4000) * 100}%`}}></div>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-4xl font-black text-white">{(profile.waterLevel || 0) / 1000}<span className="text-sm text-slate-500 ml-1">L</span></p>
                    <div className="flex gap-2">
                       <button onClick={()=>handleAddWater(250)} className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 font-black text-xs hover:bg-blue-600/20 transition-all">+250</button>
                       <button onClick={()=>handleAddWater(500)} className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-500 font-black text-xs hover:bg-blue-600/20 transition-all">+500</button>
                    </div>
                  </div>
                </div>

                <div className={`p-8 rounded-[3.5rem] border transition-all duration-700 ${isGymMode ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5 shadow-xl'}`}>
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3"><Utensils className="text-orange-500"/> الروتين الصحي</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <div>
                         <p className="text-white font-black text-sm">وجبة الفطور 🍳</p>
                         <p className="text-slate-500 text-[10px]">4 بيضات + بطاطا مسلوقة</p>
                      </div>
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <div>
                         <p className="text-white font-black text-sm">جرعة الكرياتين ⚡</p>
                         <p className="text-slate-500 text-[10px]">Creatine Protocol V1</p>
                      </div>
                      <div className={`h-4 w-4 rounded-full ${profile.creatineTaken ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. OPERATIONS CENTER (TASKS) */}
          {activeTab === 'operations' && (
            <div className="flex flex-col gap-8">
              {/* Task Adder */}
              <div className={`p-4 rounded-[4rem] border transition-all duration-700 shadow-2xl focus-within:ring-4 ring-purple-500/10 ${isGymMode ? 'bg-red-950/20 border-red-600/20' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl'}`}>
                 <form className="flex flex-col md:flex-row gap-4 items-center" onSubmit={(e)=>{e.preventDefault(); handleTaskAction(newTask, taskSlot, taskFreq);}}>
                   <div className="flex-1 flex items-center px-8 bg-slate-950/60 rounded-[3rem] border border-white/5 min-h-[90px] w-full shadow-inner">
                     <Plus size={32} className="text-slate-600 ml-4" />
                     <input 
                       value={newTask}
                       onChange={(e)=>setNewTask(e.target.value)}
                       placeholder="شو أهدافك الجديدة يا بطل؟" 
                       className="bg-transparent flex-1 text-2xl font-black text-white outline-none placeholder:text-slate-800 py-6" 
                     />
                   </div>
                   <div className="flex gap-3 px-4 w-full md:w-auto overflow-x-auto no-scrollbar">
                      {['morning', 'day', 'night'].map(s => (
                        <button key={s} type="button" onClick={()=>setTaskSlot(s)} className={`p-6 rounded-3xl transition-all shadow-xl active:scale-90 ${taskSlot === s ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                          {s === 'morning' ? <Sun size={24}/> : s === 'day' ? <CloudSun size={24}/> : <Moon size={24}/>}
                        </button>
                      ))}
                   </div>
                   <button type="submit" className={`px-12 py-8 rounded-[3rem] font-black text-lg transition-all shadow-2xl active:scale-90 text-white ${isGymMode ? 'bg-red-600 shadow-red-900/40' : 'bg-purple-600 shadow-purple-900/40'}`}>تفعيل ⚡</button>
                 </form>
              </div>

              {/* Task Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'morning', label: 'الصباح 🌅', icon: <Sun className="text-orange-400" /> },
                  { id: 'day', label: 'النهار ☀️', icon: <CloudSun className="text-blue-400" /> },
                  { id: 'night', label: 'الليل 🌙', icon: <Moon className="text-indigo-400" /> }
                ].map(col => (
                  <div key={col.id} className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-4">
                       {col.icon}
                       <h4 className="text-slate-500 font-black uppercase text-xs tracking-widest">{col.label}</h4>
                    </div>
                    <div className="space-y-4">
                      {tasks.filter(t => t.slot === col.id).length === 0 ? (
                        <div className="p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] opacity-20 text-center text-[10px] font-black uppercase italic tracking-widest">فاضية.. عبيها يا وحش!</div>
                      ) : (
                        tasks.filter(t => t.slot === col.id).map(task => (
                          <div key={task.id} className={`group flex items-center justify-between p-6 rounded-[2.5rem] border transition-all duration-500 ${task.status === 'done' ? 'opacity-30 grayscale scale-95 border-emerald-500/20 bg-slate-950/20' : (isGymMode ? 'bg-red-950/20 border-red-500/20 hover:scale-[1.02]' : 'bg-slate-900/60 border-white/5 shadow-xl hover:scale-[1.02] backdrop-blur-md')}`}>
                            <div className="flex items-center gap-6 overflow-hidden">
                              <button onClick={()=>toggleTaskStatus(task)} className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all shadow-2xl active:scale-75 ${task.status === 'done' ? 'bg-emerald-500 text-white' : task.status === 'doing' ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-950 border border-white/5 text-slate-800'}`}>
                                {task.status === 'done' ? <CheckCircle size={24}/> : task.status === 'doing' ? <Construction size={24}/> : <Circle size={24}/>}
                              </button>
                              <div className="overflow-hidden">
                                <p className={`text-xl font-black truncate leading-tight transition-all ${task.status === 'done' ? 'line-through text-slate-600 italic' : 'text-white'}`}>{task.text}</p>
                                <div className="flex gap-2 mt-1">
                                   <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>{task.status}</span>
                                   {task.frequency !== 'once' && <span className="text-[8px] px-2 py-0.5 rounded-full font-black uppercase bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 italic">{task.frequency}</span>}
                                </div>
                              </div>
                            </div>
                            <button onClick={()=>deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-3 text-slate-600 hover:text-red-500 transition-all active:scale-90"><Trash2 size={24}/></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. VITAL TRACKERS (HEALTH) */}
          {activeTab === 'health' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* 4L Water Challenge */}
               <div className={`p-12 rounded-[4rem] border transition-all duration-700 shadow-2xl relative overflow-hidden ${isGymMode ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl'}`}>
                  <Droplets size={140} className="absolute -bottom-10 -left-10 text-blue-500/10" />
                  <div className="flex justify-between items-start mb-10">
                     <h3 className="text-3xl font-black text-white italic">تحدي الـ 4 لتر <span className="text-blue-500">ماء</span></h3>
                     <div className="text-left">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</p>
                        <p className="text-4xl font-black text-white">{Math.round(((profile.waterLevel || 0) / 4000) * 100)}%</p>
                     </div>
                  </div>
                  <div className="flex flex-col gap-6 relative z-10">
                     <div className="grid grid-cols-3 gap-4">
                        {[250, 500, 1000].map(v => (
                          <button key={v} onClick={()=>handleAddWater(v)} className="bg-slate-950/60 hover:bg-blue-600/20 border border-white/5 py-8 rounded-[2rem] flex flex-col items-center gap-2 transition-all active:scale-95 group shadow-inner">
                            <Droplets size={28} className="text-blue-500 group-hover:scale-125 transition-all" />
                            <p className="text-sm font-black text-white">+{v >= 1000 ? '1L' : v+'ml'}</p>
                          </button>
                        ))}
                     </div>
                     <button onClick={async ()=>{ const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'); await setDoc(profileRef, {waterLevel: 0}, {merge: true}); }} className="w-full py-4 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">تصفير العداد لليوم الجديد 🌅</button>
                  </div>
               </div>

               {/* Power Fitness Protocol */}
               <div className={`p-12 rounded-[4rem] border transition-all duration-700 shadow-2xl relative overflow-hidden ${isGymMode ? 'bg-red-950/40 border-red-500/40' : 'bg-slate-900/40 border-white/5'}`}>
                  <Dumbbell size={140} className="absolute -bottom-10 -right-10 text-red-500/10" />
                  <h3 className="text-3xl font-black text-white italic mb-10 flex items-center gap-4">نظام <span className="text-red-600">الجيم</span> والأكل</h3>
                  <div className="space-y-6 relative z-10">
                     <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between ${isGymMode ? 'bg-red-600/10 border-red-500/20' : 'bg-slate-950/50 border-white/5'}`}>
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500"><Utensils size={24}/></div>
                           <div>
                              <p className="text-white font-black text-lg">فطور الأبطال</p>
                              <p className="text-slate-500 text-xs">4 بيضات مسلوقة + حبة بطاطا (عاش يا بطل)</p>
                           </div>
                        </div>
                        <CheckCircle2 size={28} className="text-emerald-500" />
                     </div>
                     <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between ${isGymMode ? 'bg-red-600/10 border-red-500/20' : 'bg-slate-950/50 border-white/5'}`}>
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400"><Zap size={24}/></div>
                           <div>
                              <p className="text-white font-black text-lg">الكرياتين</p>
                              <p className="text-slate-500 text-xs">اضبط طعم الكرياتين المُرّ هسا!</p>
                           </div>
                        </div>
                        <button onClick={async ()=>{ const pr = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'); await setDoc(pr, {creatineTaken: !profile.creatineTaken}, {merge: true}); }} className={`w-8 h-8 rounded-full border transition-all ${profile.creatineTaken ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_10px_emerald]' : 'border-slate-800'}`}></button>
                     </div>
                     <div className="p-8 bg-slate-950/40 border border-white/5 rounded-[2.5rem] mt-4">
                        <div className="flex items-center gap-3 mb-2">
                           <Info size={14} className="text-blue-500" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gym Target: Power Fitness</p>
                        </div>
                        <p className="text-xs text-slate-300 font-bold italic leading-relaxed">اشتراك الـ 5 أشهر (180 دينار) كنز! استغل المسبح والسونا والجاكوزي لتسريع عملية الـ Recovery.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* 4. ZUJ EXAM HUB (ACADEMY) */}
          {activeTab === 'academy' && (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ZUJ_EXAMS.map(exam => (
                  <div key={exam.id} className="bg-slate-900/60 border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500 opacity-0 group-hover:opacity-100 transition-all"></div>
                    <div className="flex justify-between items-start mb-6">
                       <div className="text-left">
                          <p className="text-[10px] font-black text-slate-500 uppercase">Countdown</p>
                          <p className="text-2xl font-black text-purple-400">{getExamCountdown(exam.date)}</p>
                       </div>
                       <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><History size={20}/></div>
                    </div>
                    <h4 className="text-2xl font-black text-white mb-2 leading-tight">{exam.name}</h4>
                    <p className="text-slate-500 text-xs font-bold flex items-center gap-2 mb-4"><User size={14} className="text-slate-700"/> {exam.doctor}</p>
                    <div className="space-y-3 pt-4 border-t border-white/5">
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><CalendarDays size={14}/> {new Date(exam.date).toLocaleDateString('ar-JO')}</div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock size={14}/> {new Date(exam.date).toLocaleTimeString('ar-JO', {hour:'2-digit', minute:'2-digit'})}</div>
                       <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Layout size={14}/> {exam.location}</div>
                    </div>
                    <div className="mt-6 p-4 bg-slate-950/60 rounded-2xl border border-white/5">
                       <p className="text-[9px] font-black text-purple-500 uppercase mb-1">Study Focus</p>
                       <p className="text-xs text-slate-300 font-bold italic">{exam.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`p-10 rounded-[4rem] border transition-all duration-700 ${isGymMode ? 'bg-red-950/20 border-red-500/20' : 'bg-slate-900/40 border-white/5'} shadow-2xl text-center`}>
                 <Brain size={60} className="mx-auto text-purple-500 mb-6" />
                 <h3 className="text-4xl font-black text-white italic mb-4 uppercase tracking-tighter">ZUJ Final Exams Protocol 2026</h3>
                 <p className="text-slate-400 font-bold text-lg max-w-2xl mx-auto">تخصص الذكاء الاصطناعي بدّه همّة! لا تنسى تراجع الـ Data Structures مع د. سهير لأنها مادة أساسية لكل شيء جاي بالطريق.</p>
              </div>
            </div>
          )}

          {/* 5. SETTINGS HUB */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto flex flex-col gap-8">
               <div className="bg-slate-900/60 border border-white/5 p-12 rounded-[4rem] shadow-2xl animate-in zoom-in-95">
                  <h2 className="text-4xl font-black text-white italic mb-10 flex items-center gap-4"><Settings2 className="text-purple-500"/> Core Settings</h2>
                  <div className="space-y-10">
                    <div className="space-y-4">
                       <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] block">تعديل اسم الهوية</label>
                       <input 
                         value={profile.name}
                         onChange={async (e)=>{ const n = e.target.value; const pr = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'core'); await setDoc(pr, {name: n}, {merge: true}); }}
                         className="w-full bg-slate-950 border border-white/5 rounded-3xl p-6 text-2xl font-black text-white outline-none focus:ring-4 ring-purple-500/20 shadow-inner"
                       />
                    </div>
                    <div className="pt-10 border-t border-white/5 space-y-6">
                       <button onClick={async ()=>{ await signOut(auth); window.location.reload(); }} className="w-full bg-slate-800 hover:bg-red-600/10 text-red-500 border border-white/5 py-6 rounded-[2.2rem] font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">
                         <LogOut size={24}/> تسجيل خروج من البروتوكول
                       </button>
                    </div>
                  </div>
               </div>
               <div className="p-8 bg-slate-950/40 border border-white/5 rounded-[3rem] text-center opacity-40">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sovereign Identifier: {user.uid}</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 italic leading-none">Powered by Gemini 2.5 & Firebase Architecture</p>
               </div>
            </div>
          )}

        </main>

        {/* --- GLOBAL FOOTER SIGNATURE --- */}
        <footer className="mt-20 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 px-10 pb-20 opacity-30 hover:opacity-100 transition-all duration-1000">
          <div className="flex flex-col items-center md:items-start gap-1">
             <p className="text-[10px] font-black tracking-[0.5em] text-slate-500 uppercase italic">GlowUp Omni Absolute</p>
             <p className="text-[12px] font-black text-slate-400 uppercase italic">Version 43.1 • 2026 Ready</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1 text-right">
             <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">Architected & Engineered by</p>
             <p className={`text-4xl font-black tracking-[0.3em] uppercase italic leading-none mt-2 transition-all duration-1000 ${isGymMode ? 'text-red-600 drop-shadow-[0_0_10px_red]' : 'text-white'}`}>HUMAM TAIBEH 🦾</p>
          </div>
        </footer>

      </div>

      {/* --- GLOBAL CSS --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@200;400;700;900&display=swap');
        
        :root {
          font-family: 'Tajawal', sans-serif;
        }

        .glass {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
        }

        @keyframes heat-rise {
          0% { transform: translateY(0) scaleY(1); opacity: 0.1; }
          50% { transform: translateY(-30px) scaleY(1.1); opacity: 0.2; }
          100% { transform: translateY(-60px) scaleY(1.2); opacity: 0; }
        }

        .animate-heat-rise {
          animation: heat-rise 3s infinite linear;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.05);
        }

        .animate-in {
          animation: fade-in 0.7s ease-out;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Gym Mode Specific Overrides */
        ${isGymMode ? `
          ::selection { background: rgba(220, 38, 38, 0.4); }
        ` : ''}
      `}</style>

    </div>
  );
};

export default App;
