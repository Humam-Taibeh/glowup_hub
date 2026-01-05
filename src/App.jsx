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
  query
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, TrendingUp, Zap, 
  BrainCircuit, Loader2, Dumbbell, Flame, Play, Pause, RotateCcw, 
  Quote, Target, Settings, ChevronRight, UserCircle, Lightbulb, 
  Clock, Command, X, PlusCircle, Moon, Heart, Brain, Timer, Coffee, Code, Hourglass, LayoutGrid, 
  Swords, Rocket, Trophy, Power, Settings2, Sparkle, Languages, 
  AlertTriangle, Sun, Sunset, CloudSun, Layout, User, Bot, ZapOff,
  Gem, Ghost, Crown, Star, HelpCircle, Layers, Filter, RefreshCw, Save, Search, Activity,
  FlameKindling, CheckCircle, Construction, CalendarDays, ArchiveX, History, Calendar, Edit2, LogOut,
  Mail, Lock, UserPlus, KeyRound, ArrowRightCircle, ShieldCheck
} from 'lucide-react';

// --- 1. Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// إصلاح معرف التطبيق لضمان استقرار المسارات في Firebase
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_nexus_v46';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

// --- 2. AI Configuration ---
const apiKey = ""; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const App = () => {
  // --- Core States ---
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [aura, setAura] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lang, setLang] = useState("ar"); 
  const [config, setConfig] = useState({ fontSize: 'medium', iconSize: 'medium' });

  // UI & Auth States
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [isGymMode, setIsGymMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAuraInfo, setShowAuraInfo] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filterSlot, setFilterSlot] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [newTaskSlot, setNewTaskSlot] = useState('day');
  const [newTaskFreq, setNewTaskFreq] = useState('none'); 

  // Timer Engine
  const [timerActive, setTimerActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isCustomTime, setIsCustomTime] = useState(false);
  const timerRef = useRef(null);

  // Settings Drafts
  const [draftConfig, setDraftConfig] = useState({ fontSize: 'medium', iconSize: 'medium' });
  const [draftName, setDraftName] = useState("");
  const [draftLang, setDraftLang] = useState("ar");

  // Scaling Logic
  const scalingStyles = useMemo(() => {
    const scales = { small: 0.75, medium: 1, large: 1.5 };
    return { zoom: scales[config.fontSize] || 1 };
  }, [config.fontSize]);

  // --- 3. Dynamic Dictionary ---
  const dictionary = useMemo(() => ({
    ar: {
      welcome: "يا هلا.. عرفني عن اسمك؟",
      googleBtn: "Cloud Sync (Google) ☁️",
      emailBtn: "دخول",
      registerBtn: "عضوية جديدة",
      resetBtn: "نسيت كلمة السر؟",
      startBtn: "دخول سريع (بدون حساب) ⚡",
      errorName: "نَسيت الاسم يا بطل! ⚠️",
      unauthDomain: "تسجيل قوقل غير متاح حالياً. استخدم الإيميل أو الدخول السريع! ⚠️",
      efficiency: "الإنجاز",
      aura: "الآورا",
      beast: "Beast Mode",
      power: "Power Mode",
      focus: "Focus Mode",
      howLong: "كم دقيقة يا وحش؟ ⏱️",
      customTimerMsg: "اختيار بطل! {mins} دقيقة كافية لتهد الجبال. يلا Lock In! 🔥",
      addTaskPlaceholder: "شو هدفنا اليوم يا {name}؟",
      addBtn: "إضافة",
      aiHub: "AI Ops",
      aiSub: "بروتوكولات النجاح العالمية",
      pipeline: "قائمة الإنجاز",
      active: "مهام نشطة",
      identity: "ايش بنحب نناديك؟",
      font: "حجم الموقع",
      icons: "حجم الأيقونة",
      language: "اللغة",
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
      editTask: "تعديل المهمة"
    },
    en_slang: {
      welcome: "Yo! Who's pullin' up?",
      googleBtn: "Cloud Sync (Google) ☁️",
      emailBtn: "Sign In",
      registerBtn: "Join squad",
      resetBtn: "Forgot pass?",
      startBtn: "Ghost Entry ⚡",
      errorName: "Forgot ID, King! ⚠️",
      unauthDomain: "Google Login restricted. Use Email! ⚠️",
      efficiency: "Grind Meter",
      aura: "Aura Pts",
      beast: "Beast Mode",
      power: "Alpha Concentration",
      focus: "Focus Hub",
      howLong: "Duration? ⏱️",
      customTimerMsg: "Bet! {mins} mins is plenty to go crazy. Lock in! 🔥",
      addTaskPlaceholder: "What's the grind today, {name}?",
      addBtn: "Deploy",
      aiHub: "Aura Ops",
      aiSub: "Elite Protocols",
      pipeline: "Siege Line",
      active: "Active Ops",
      identity: "Ur ID Tag?",
      save: "Apply Vibe",
      logout: "Sign Out",
      heroSub: "Life Optimization Engine",
      empty: "Siege line empty.. Start grindin'!",
      statuses: { todo: "Todo", doing: "Lockin'", done: "W" },
      slots: { all: "All", morning: "Sunrise", day: "Grind", night: "After Hours" },
      freq: { none: "One-off", daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
      newDay: "Next Grind 🌅",
      filters: "Sort",
      hello: "Yo",
      streak: "Streak",
      editTask: "Refine Op"
    },
    en_normal: {
      welcome: "Welcome. Please enter your name.",
      googleBtn: "Sign in with Google ☁️",
      emailBtn: "Login",
      registerBtn: "Register",
      resetBtn: "Reset Password",
      startBtn: "Quick Start ⚡",
      errorName: "Name required! ⚠️",
      unauthDomain: "Google error. Use Email instead. ⚠️",
      efficiency: "Productivity",
      aura: "Aura Points",
      beast: "Beast Mode",
      power: "Power Mode",
      focus: "Focus Center",
      howLong: "Duration? ⏱️",
      customTimerMsg: "Great choice! {mins} mins is enough to move mountains.",
      addTaskPlaceholder: "Goals for today, {name}?",
      addBtn: "Add Task",
      identity: "Update Name",
      save: "Save",
      logout: "Logout",
      heroSub: "Time Management System",
      empty: "Task list is currently empty.",
      statuses: { todo: "Todo", doing: "Active", done: "Done" },
      slots: { all: "All", morning: "Morning", day: "Day", night: "Night" },
      freq: { none: "Once", daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
      newDay: "New Day 🌅",
      filters: "Filter View",
      hello: "Hello",
      streak: "Daily Streak",
      editTask: "Edit Task"
    }
  }), []);

  const t = useMemo(() => dictionary[lang] || dictionary.ar, [lang, dictionary]);
  const [currentQuote, setCurrentQuote] = useState("الالتزام هو اللي بيصنع الفرق.. 🔥");

  // --- 4. Firebase Authentication Handlers ---
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth));
      } else {
        await signInAnonymously(auth).catch(() => {});
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setUserName("");
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 5. Cloud Data Synchronization ---
  useEffect(() => {
    if (!user) return;
    const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const n = String(data.name || user.displayName || "");
        setUserName(n);
        setDraftName(n);
        setAura(data.aura || 0);
        setStreak(data.streak || 0);
        setLang(data.lang || "ar");
        setDraftLang(data.lang || "ar");
        setConfig(data.config || { fontSize: 'medium', iconSize: 'medium' });
        setDraftConfig(data.config || { fontSize: 'medium', iconSize: 'medium' });
      } else {
        setUserName(""); 
      }
      setIsAuthLoading(false);
    }, (error) => console.error("Profile Sync Error:", error));

    const tasksColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksColRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)));
    }, (error) => console.error("Tasks Sync Error:", error));

    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // --- 6. Logic Handlers ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    setLoginError("");
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else if (authMode === 'register') await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) { setLoginError("بيانات غير صحيحة يا بطل! ⚠️"); }
    finally { setIsActionLoading(false); }
  };

  const handlePasswordReset = async () => {
    if (!email) return setLoginError("اكتب إيميلك أولاً! ⚠️");
    setIsActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("تم إرسال رابط إعادة التعيين لإيميلك ✅");
    } catch (e) { setLoginError("فشل إرسال الرابط."); }
    finally { setIsActionLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { setLoginError("قوقل مقيد في هذا النطاق. استخدم الإيميل! ⚠️"); }
    finally { setIsGoogleLoading(false); }
  };

  const saveProfile = async (updates) => {
    if (!user) return;
    const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await setDoc(profileDocRef, { ...updates }, { merge: true });
    if(updates.name) setUserName(String(updates.name));
  };

  const handleAddTask = async (txt, slot = 'day', freq = 'none') => {
    if (!txt || !user) return;
    const tasksColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    await addDoc(tasksColRef, {
      text: String(txt), completed: false, status: 'todo', emoji: "⏳",
      slot, frequency: freq, dateAdded: new Date().toISOString(), isProcessing: true
    });
  };

  const toggleStatus = async (id) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    if(!task) return;
    const sequence = ['todo', 'doing', 'done'];
    const nextStatus = sequence[(sequence.indexOf(task.status) + 1) % 3];
    let auraUpdate = aura;
    if (nextStatus === 'done' && task.status !== 'done') auraUpdate += 10;
    if (task.status === 'done' && nextStatus === 'todo') auraUpdate = Math.max(0, auraUpdate - 10);
    
    const taskDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
    await updateDoc(taskDocRef, { status: nextStatus, completed: nextStatus === 'done' });
    saveProfile({ aura: auraUpdate });
  };

  const deleteTask = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id));
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
  };

  // Timer Lifecycle
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

  // --- 7. UI Rendering ---
  if (isAuthLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 size={64} className="text-blue-500 animate-spin" /></div>;

  if (!user || !userName) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative font-sans overflow-hidden text-right">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 blur-[180px] animate-pulse rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/5 blur-[180px] animate-pulse rounded-full"></div>
        
        <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-700">
          <div className="glass p-16 rounded-[4rem] text-center shadow-2xl relative border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
            <Rocket size={48} className="text-blue-500 mx-auto mb-10 animate-bounce" />
            <h1 className="text-7xl font-black mb-4 italic text-white logo-glow uppercase leading-none">GLOWUP</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.6em] mb-10">{String(t.heroSub)}</p>
            
            <div className="space-y-8 text-right">
              {user && !userName ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{String(t.welcome)}</p>
                  <input 
                    type="text" placeholder="..." 
                    className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-8 text-center font-black text-4xl text-white outline-none focus:ring-4 ring-blue-500/10 shadow-inner"
                    onChange={(e)=>setTempName(e.target.value)}
                    onKeyDown={(e)=>e.key==='Enter' && tempName.trim() && saveProfile({name:tempName, aura:0, streak:0})}
                  />
                  <button onClick={()=>tempName.trim() ? saveProfile({name: tempName, aura: 0, streak: 0}) : setLoginError("الاسم مطلوب! ⚠️")} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[2.5rem] font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-900/20 text-center flex justify-center items-center">ابدأ الآن 🚀</button>
                </div>
              ) : authMode === 'reset' ? (
                <div className="space-y-6 text-right animate-in slide-in-from-bottom-2">
                   <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                      <Mail className="text-slate-600" size={20} />
                      <input type="email" placeholder="بريدك الإلكتروني" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} />
                   </div>
                   <button onClick={handlePasswordReset} disabled={isActionLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all">
                      {isActionLoading ? <Loader2 className="animate-spin" /> : <><KeyRound size={20}/> {String(t.resetBtn)}</>}
                   </button>
                   <button onClick={() => setAuthMode('login')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">العودة للدخول</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleEmailAuth} className="space-y-4 text-right">
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Mail className="text-slate-600" size={20} /><input type="email" placeholder="Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} required /></div>
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Lock className="text-slate-600" size={20} /><input type="password" placeholder="Password" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setPassword(e.target.value)} required /></div>
                    <button type="submit" disabled={isActionLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95">{isActionLoading ? <Loader2 className="animate-spin" /> : <><ArrowRightCircle size={24}/> {authMode === 'login' ? String(t.emailBtn) : String(t.registerBtn)}</>}</button>
                  </form>
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 px-4">
                    <button type="button" onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Join Now':'Sign In'}</button>
                    <button type="button" onClick={()=>setAuthMode('reset')}>{String(t.resetBtn)}</button>
                  </div>
                  <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase bg-[#0f172a] px-4 italic">Quick Access</div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="bg-white text-slate-900 p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm">{isGoogleLoading ? <Loader2 className="animate-spin" /> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google"/> GOOGLE</>}</button>
                    <button onClick={()=>signInAnonymously(auth)} className="bg-slate-800 text-white p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-700 flex items-center justify-center gap-2 shadow-sm"><Zap size={16} className="text-yellow-400" /> GUEST</button>
                  </div>
                </div>
              )}
              {loginError && <p className="text-red-500 text-xs font-black animate-pulse text-center">{String(loginError)}</p>}
              {successMsg && <p className="text-emerald-500 text-xs font-black text-center">{String(successMsg)}</p>}
              <div className="flex items-center justify-center gap-3 opacity-30 mt-8"><ShieldCheck size={14}/><p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Cloud Shield System • V46.0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 8. Main Hub ---
  return (
    <div className={`min-h-screen transition-all duration-1000 p-6 md:p-8 pb-48 font-sans selection:bg-blue-500/30 overflow-x-hidden ${isGymMode ? 'bg-[#0f0105]' : 'bg-[#020617]'}`}>
      {isGymMode && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30"><div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-600/40 to-transparent animate-heat-rise"></div></div>}
      <div className="fixed inset-0 pointer-events-none opacity-40 -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-red-600/40 animate-pulse' : 'bg-blue-600/10'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-900/30' : 'bg-indigo-600/5'}`}></div>
      </div>

      <div className="w-full max-w-full mx-auto main-wrapper" style={{ zoom: scalingStyles.zoom }}>
        <header className="flex flex-col gap-10 mb-16 border-b border-white/5 pb-12 animate-in slide-in-from-top-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 text-right">
            <h1 className={`text-5xl md:text-8xl font-black tracking-tighter italic ${isGymMode ? 'text-red-600 drop-shadow-[0_0_20px_red]' : 'text-white'}`}>
              {String(t.hello)} <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent uppercase">{String(userName)}</span>
            </h1>
            <div className="flex gap-4">
              <button onClick={() => setShowAuraInfo(true)} className={`p-8 rounded-[2.5rem] border glass flex items-center gap-8 min-w-[280px] shadow-2xl transition-all ${isGymMode ? 'border-red-500/30 shadow-red-950/20' : 'border-white/5 shadow-blue-950/20'}`}>
                 <div className="flex-1 text-right leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 italic">{String(t.aura)}</p><p className={`text-5xl font-black ${isGymMode ? 'text-red-500' : 'text-blue-400'}`}><Gem className="inline" size={28} /> {aura}</p><div className="w-full h-1 bg-slate-800 rounded-full mt-5 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isGymMode ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`} style={{width: `${(aura % 1000) / 10}%`}}></div></div></div>
                 <div className="w-[1px] h-12 bg-white/10"></div>
                 <div className="text-center leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-1 italic">{String(t.streak)}</p><p className="text-5xl font-black text-orange-500">{streak} <Flame className="inline animate-pulse" size={32}/></p></div>
              </button>
              <button onClick={()=>setIsGymMode(!isGymMode)} className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center min-w-[160px] active:scale-95 shadow-2xl ${isGymMode ? 'bg-red-600 border-red-400 text-white shadow-red-600/30' : 'glass text-slate-500 shadow-blue-900/10'}`}>{isGymMode ? <Swords size={40}/> : <Dumbbell size={40}/>}<p className="text-[10px] font-black uppercase mt-2">{isGymMode ? 'BEAST ACTIVATED' : String(t.power)}</p></button>
              <button onClick={()=>setShowSettings(true)} className="p-10 rounded-[2.5rem] glass border border-white/5 text-slate-500 hover:text-blue-400 transition-all active:scale-90 shadow-xl"><Settings size={40}/></button>
            </div>
          </div>
          <div className={`w-full flex items-center justify-between px-10 py-5 rounded-[3rem] border glass shadow-2xl ${isGymMode ? 'border-red-500/30 shadow-red-950/10' : ''}`}>
              <Quote className={isGymMode ? 'text-red-500 animate-pulse flex-shrink-0' : 'text-blue-500 flex-shrink-0'} size={28} />
              <p className="text-xl md:text-2xl font-black italic tracking-tight truncate px-8 flex-1 text-right">"{String(currentQuote)}"</p>
              <button onClick={() => setCurrentQuote("الوحوش ما بتوقف.. كمل طريقك! 🦾")} className="p-4 rounded-2xl border border-white/5 hover:rotate-180 transition-transform duration-500 shadow-lg"><RefreshCw size={24}/></button>
          </div>
        </header>

        {/* FOCUS HUB */}
        <section className={`p-8 rounded-[4rem] border glass shadow-2xl flex items-center justify-between gap-12 w-full mb-12 ${isGymMode ? 'border-red-500/30 shadow-red-950/20' : 'shadow-blue-950/10'}`}>
            <div className="flex flex-col gap-4 min-w-[120px]">
                <button onClick={()=>setTimerActive(!timerActive)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all active:scale-90 shadow-2xl ${timerActive ? 'bg-red-500/20 text-red-500' : 'bg-blue-600 text-white shadow-blue-900/40'}`}>
                    {timerActive ? <Pause size={32}/> : <Play size={32}/>}
                </button>
                <button onClick={()=>{setTimerActive(false); setTimeLeft(selectedDuration*60);}} className="w-16 h-16 rounded-3xl glass border border-white/5 text-slate-500 shadow-lg"><RotateCcw size={28}/></button>
            </div>
            <div className="relative flex flex-col items-center justify-center flex-1">
                <svg className="w-56 h-56 transform -rotate-90">
                  <circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/50" />
                  <circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="534" strokeDashoffset={ringOffset*(534/502)} strokeLinecap="round" className={`transition-all duration-1000 ${isGymMode ? 'text-red-600 drop-shadow-[0_0_15px_red]' : 'text-blue-500 shadow-blue-500/50'}`} />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <p className="text-5xl font-black text-white tracking-tighter">{formatTime(timeLeft)}</p>
                  {isCustomTime && <p className="text-[10px] font-black text-slate-500 uppercase mt-2 px-4 italic animate-pulse">{String(t.customTimerMsg).replace('{mins}', selectedDuration)}</p>}
                </div>
                {isCustomTime && <input type="number" autoFocus placeholder={String(t.howLong)} className={`mt-4 w-32 glass border border-white/5 rounded-2xl p-3 text-center text-white font-black outline-none focus:ring-4 ${isGymMode ? 'ring-red-600/20' : 'ring-blue-600/20'}`} onChange={(e)=>{const v=parseInt(e.target.value); if(v>0) {setSelectedDuration(v); setTimeLeft(v*60);}}} />}
            </div>
            <div className="flex flex-col gap-3 min-w-[120px] items-end">
                {[15, 25, 45].map(m => (<button key={m} onClick={()=>updateTimer(m)} className={`h-12 w-16 rounded-2xl text-xs font-black uppercase transition-all shadow-md ${selectedDuration===m && !isCustomTime ? (isGymMode ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-blue-600 text-white shadow-blue-900/20') : 'glass text-slate-500 hover:text-white'}`}>{m}m</button>))}
                <button onClick={()=>setIsCustomTime(!isCustomTime)} className={`h-12 w-16 rounded-2xl glass transition-all shadow-md ${isCustomTime ? (isGymMode ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-white'}`}><Settings2 size={20}/></button>
            </div>
        </section>

        {/* TASK MANAGEMENT */}
        <div className="space-y-12">
            <div className={`glass p-4 rounded-[4rem] border transition-all shadow-2xl ${isGymMode ? 'border-red-600/30 focus-within:ring-4 ring-red-600/20' : 'border-white/5 focus-within:ring-4 ring-blue-600/10'}`}>
                <form onSubmit={(e)=>{e.preventDefault(); handleAddTask(e.target.task.value, newTaskSlot, newTaskFreq); e.target.reset();}} className="flex flex-col md:flex-row gap-4 items-center">
                    <div className={`flex-1 flex items-center px-10 rounded-[2.5rem] border glass shadow-inner ${isGymMode ? 'border-red-900/30' : 'border-slate-800'}`}>
                        <Plus size={32} className={isGymMode ? 'text-red-700 mr-6' : 'text-slate-600 mr-6'} /><input name="task" placeholder={String(t.addTaskPlaceholder).replace('{name}', userName)} className="w-full bg-transparent py-10 text-3xl font-black outline-none text-white placeholder:text-slate-800 text-right tracking-tight" />
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                      <div className={`flex gap-2 p-1.5 rounded-2xl border glass ${isGymMode ? 'border-red-900/40' : 'border-white/5'}`}>
                        {['morning', 'day', 'night'].map(s => (
                          <button key={s} type="button" onClick={() => setNewTaskSlot(s)} title={String(t.slots[s])} className={`flex-1 p-3 rounded-xl transition-all active:scale-90 ${newTaskSlot === s ? (isGymMode ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-blue-600 text-white shadow-lg') : (isGymMode ? 'text-red-900 hover:text-red-500' : 'text-slate-500 hover:text-white')}`}>
                              {s === 'morning' ? <Sun size={18}/> : s === 'day' ? <CloudSun size={18}/> : <Moon size={18}/>}
                          </button>
                        ))}
                      </div>
                      <select onChange={(e) => setNewTaskFreq(e.target.value)} className={`text-[10px] font-black uppercase px-4 py-3 rounded-xl outline-none border glass cursor-pointer ${isGymMode ? 'text-red-100 border-red-800/40 shadow-inner' : 'text-slate-400 border-white/5 shadow-sm'}`}>
                        {Object.entries(t.freq).map(([k,v]) => <option key={k} value={k}>{String(v)}</option>)}
                      </select>
                      <button type="submit" className={`px-10 py-5 rounded-[2rem] font-black text-white active:scale-95 transition-all shadow-2xl ${isGymMode ? 'bg-red-600 hover:bg-red-500 shadow-red-600/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'}`}>{String(t.addBtn)}</button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {tasks.length === 0 ? <div className="py-40 text-center border-4 border-dashed border-slate-900/40 rounded-[5rem] animate-pulse opacity-20"><ArchiveX size={64} className="mx-auto mb-6"/><p className="text-2xl font-black uppercase tracking-widest italic text-slate-700">Operations Pending..</p></div> : 
                  tasks.map(task => (
                    <div key={task.id} className={`group flex items-center justify-between p-6 rounded-[3rem] border glass transition-all duration-700 ${task.completed ? 'opacity-30 grayscale scale-95 border-slate-900' : (isGymMode ? 'border-red-900/20 shadow-2xl shadow-red-950/20 hover:scale-[1.01]' : 'hover:border-blue-500/30 hover:scale-[1.01] shadow-xl')}`}>
                      <div className="flex items-center gap-10 flex-1 overflow-hidden text-right">
                        <button onClick={()=>toggleStatus(task.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${task.completed ? 'bg-emerald-500 text-white shadow-emerald-900/40' : 'glass border-2 border-slate-800 text-transparent hover:border-blue-500 shadow-inner'}`}><CheckCircle size={24}/></button>
                        <div className="flex items-center gap-6 overflow-hidden">
                          <span className="text-3xl flex-shrink-0">{String(task.emoji || "✨")}</span>
                          <div className="flex flex-col overflow-hidden text-right">
                            <p className={`text-2xl font-black tracking-tighter truncate ${task.completed ? 'line-through text-slate-500 italic' : 'text-slate-100'}`}>{String(task.text)}</p>
                            <div className="flex items-center justify-end gap-4 mt-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isGymMode ? 'bg-red-500/5 border-red-500/10 text-red-900' : 'bg-slate-800/50 border-white/5 text-slate-600'}`}>{String(t.slots[task.slot] || "Day")}</span>
                                {task.frequency !== 'none' && <span className="text-[9px] font-black uppercase italic bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full border border-blue-500/20">{String(t.freq[task.frequency])}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={()=>deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-4 text-slate-600 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-2xl"><Trash2 size={24}/></button>
                    </div>))}
            </div>
        </div>

        <footer className="mt-48 border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center gap-10 px-10 pb-20 opacity-40 hover:opacity-100 transition-all text-right">
            <p className="text-[12px] font-black tracking-[0.6em] text-slate-500 uppercase italic">V46.0 Sovereign Master Build</p>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-right leading-none">
                <p className="text-[10px] font-black uppercase text-slate-600 mb-2 italic">Designed & Optimized by</p>
                <p className={`text-3xl font-black uppercase tracking-widest leading-none italic ${isGymMode ? 'text-red-600 drop-shadow-[0_0_10px_red]' : 'text-white'}`}>Humam Taibeh 🦾</p>
            </div>
        </footer>
      </div>

      {/* AURA MODAL */}
      {showAuraInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setShowAuraInfo(false)}></div>
           <div className="relative w-full max-w-md bg-slate-900 border border-white/10 p-12 rounded-[4rem] text-center shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>
              <Gem size={72} className="mx-auto text-blue-400 mb-8 animate-pulse" />
              <h3 className="text-3xl font-black text-white mb-6 uppercase italic">Aura Protocol</h3>
              <p className="text-slate-400 text-base leading-relaxed mb-10 text-right">{String(t.auraGuide)}</p>
              <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 mb-10 flex justify-between items-center text-right shadow-inner">
                 <div className="text-right flex-1"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">{String(t.streak)}</p><p className="text-5xl font-black text-white">{streak}</p></div>
                 <Flame size={56} className={streak > 0 ? 'text-orange-500 ml-4 animate-pulse' : 'text-slate-700 ml-4'} />
              </div>
              <button onClick={() => setShowAuraInfo(false)} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest active:scale-95 shadow-xl shadow-blue-900/30 text-center">LOCKED IN 🦾</button>
           </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-right">
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
              <div className={`relative w-full max-w-2xl border p-16 rounded-[6rem] shadow-2xl glass animate-in zoom-in-95 duration-500 ${isGymMode ? 'border-red-500/20' : ''}`}>
                <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 p-6 rounded-full border shadow-xl bg-slate-800 text-slate-400 hover:bg-red-500 transition-all active:scale-90"><X size={32}/></button>
                <h2 className={`text-5xl font-black italic mb-16 flex items-center gap-6 ${isGymMode ? 'text-red-50' : 'text-white'}`}><Settings className={isGymMode ? "animate-spin-slow text-red-600" : "text-blue-500"} /> HUB CONFIG</h2>
                <div className="space-y-14 relative z-10 text-right">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-end gap-2 italic">اسم المناداة <UserCircle size={14} /></label>
                        <input type="text" value={draftName} className={`w-full border rounded-[3rem] p-8 font-black text-white text-4xl text-center outline-none transition-all shadow-inner ${isGymMode ? 'bg-red-950 border-red-500/20 focus:ring-red-600/10' : 'bg-slate-950 border-white/5 focus:ring-blue-600/10'}`} onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="space-y-6 text-center">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic mb-2 block text-right">اللغة (Interface Language)</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[{id:'ar', n:'العربية'}, {id:'en_slang', n:'Slang EN'}, {id:'en_normal', n:'Standard EN'}].map(l => (
                                <button key={l.id} onClick={() => setDraftLang(l.id)} className={`py-6 rounded-3xl text-xs font-black uppercase transition-all shadow-lg ${draftLang === l.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{l.n}</button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-16 border-t border-white/5 space-y-6">
                        <button onClick={() => { saveProfile({ name: draftName, lang: draftLang }); setShowSettings(false); }} className={`w-full py-8 rounded-[3rem] font-black text-sm uppercase transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3 ${isGymMode ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}><Save size={28} /> حفظ التغييرات</button>
                        <button onClick={()=>handleLogout()} className="w-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white py-5 rounded-[3rem] font-black text-xs flex items-center justify-center gap-3 transition-all shadow-xl"><LogOut size={18}/> تسجيل خروج</button>
                    </div>
                </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes heat-rise { 0% { transform: translateY(0) scaleY(1); opacity: 0.3; } 50% { transform: translateY(-30px) scaleY(1.15); opacity: 0.6; } 100% { transform: translateY(-60px) scaleY(1.3); opacity: 0; } }
        .animate-heat-rise { animation: heat-rise 2.5s infinite linear; }
        .logo-glow { text-shadow: 0 0 25px rgba(59, 130, 246, 0.4); }
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default App;
