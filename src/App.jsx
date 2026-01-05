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
  addDoc 
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

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'glowup_nexus_v44';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

// --- Gemini AI Setup ---
const apiKey = ""; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

const App = () => {
  // --- 1. Core States ---
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [tasks, setTasks] = useState([]);
  const [aura, setAura] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lang, setLang] = useState("ar"); 
  const [config, setConfig] = useState({ fontSize: 'medium', iconSize: 'medium' });

  // Settings Drafts
  const [draftConfig, setDraftConfig] = useState({ fontSize: 'medium', iconSize: 'medium' });
  const [draftName, setDraftName] = useState("");
  const [draftLang, setDraftLang] = useState("ar");

  // UI Flow States
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login, register, reset, guest
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
  const [activeAiCatId, setActiveAiCatId] = useState(null);
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

  // Scaling Logic
  const scalingStyles = useMemo(() => {
    const scales = { small: 0.75, medium: 1, large: 1.5 };
    return { zoom: scales[config.fontSize] || 1 };
  }, [config.fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const scales = { small: '0.7', medium: '1', large: '1.4' };
    root.style.setProperty('--global-zoom', scales[config.fontSize] || '1');
    root.style.setProperty('--icon-scale', scales[config.iconSize] || '1');
  }, [config]);

  // --- 2. Robust Multi-Language Dictionary ---
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
      reset: "Hard Reset Hub",
      genMore: "توليد جديد",
      empty: "القائمة فاضية.. ابدأ هسا!",
      slots: { all: "الكل", morning: "الصبح", day: "نهاراً", night: "بليل" },
      statusFilters: { all: "الكل", todo: "بانتظار البدء", doing: "قيد التنفيذ", done: "خلصتها" },
      aiIntegrated: "مدعم بالذكاء الاصطناعي 🤖",
      auraGuide: "كل مهمة بتخلصها بتزيد الآورا 10 نقاط. الستريك بلمع كل ما خلصت مهام اليوم!",
      filters: "الفلاتر",
      hello: "هلا",
      statuses: { todo: "جاهزة", doing: "قيد التنفيذ", done: "تمت" },
      streak: "الستريك",
      freq: { none: "مرة واحدة", daily: "يومياً", weekly: "أسبوعياً", monthly: "شهرياً" },
      newDay: "يوم جديد 🌅",
      editTask: "تعديل المهمة",
      logout: "تسجيل خروج",
      heroSub: "نظام تنظيم الوقت والارتقاء الشخصي"
    },
    en_slang: {
      welcome: "Yo! Who's pullin' up?",
      googleBtn: "Cloud Sync (Google) ☁️",
      emailBtn: "Sign In",
      registerBtn: "Join squad",
      resetBtn: "Forgot pass?",
      startBtn: "Ghost Entry (Guest) ⚡",
      errorName: "Name? No cap, u forgot it! ⚠️",
      unauthDomain: "Google Login restricted. Use Guest! ⚠️",
      efficiency: "Grind Meter",
      aura: "Aura Pts",
      beast: "Beast Mode",
      power: "Locked In",
      focus: "Focus Hub",
      howLong: "Mins? ⏱️",
      customTimerMsg: "Bet! {mins} mins is plenty to go crazy. Lock in! 🔥",
      addTaskPlaceholder: "What's the grind today, {name}?",
      addBtn: "Deploy",
      aiHub: "Aura Ops",
      aiSub: "Main Character Protocols",
      pipeline: "Siege Line",
      active: "Active Ops",
      identity: "Ur ID Tag?",
      font: "Interface Scale",
      icons: "Icon Scale",
      language: "Vibe Selector",
      save: "Apply Vibe",
      reset: "Hard Reset",
      genMore: "Gen New Vibes",
      empty: "Siege line empty.. Start grindin'!",
      slots: { all: "Full", morning: "Sunrise", day: "Grind", night: "After Hours" },
      statusFilters: { all: "Every Vibe", todo: "Pending", doing: "Lockin'", done: "W" },
      aiIntegrated: "AI INFUSED HUB 🤖",
      auraGuide: "Stack +10 Aura per op. Stay consistent to keep streak glowing.",
      filters: "Sort",
      hello: "Yo",
      statuses: { todo: "Todo", doing: "Lockin'", done: "W" },
      streak: "Streak",
      freq: { none: "One-off", daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
      newDay: "Next Grind 🌅",
      editTask: "Refine Op",
      logout: "Sign Out",
      heroSub: "Personal Growth & Life Optimization"
    },
    en_normal: {
      welcome: "Welcome. Please enter your name.",
      googleBtn: "Sign in with Google ☁️",
      startBtn: "Quick Start (Guest) ⚡",
      errorName: "Name is required. ⚠️",
      unauthDomain: "Google Login unavailable. Use Guest Mode. ⚠️",
      efficiency: "Productivity",
      aura: "Aura Points",
      beast: "Peak Mode",
      power: "Standard Mode",
      focus: "Focus Center",
      howLong: "Duration needed?",
      customTimerMsg: "Great choice! {mins} mins is enough to move mountains.",
      addTaskPlaceholder: "What are your goals for today, {name}?",
      addBtn: "Add",
      aiHub: "AI Hub",
      aiSub: "Professional Protocols",
      pipeline: "Pipeline",
      active: "Active Tasks",
      identity: "Update Identifier",
      font: "Interface Scale",
      icons: "Icon Scale",
      language: "System Language",
      save: "Save Changes",
      reset: "Factory Reset",
      genMore: "Generate Suggestions",
      empty: "Task list is currently empty.",
      slots: { all: "All Time", morning: "Morning", day: "Daytime", night: "Night" },
      statusFilters: { all: "All Status", todo: "Pending", doing: "In Progress", done: "Completed" },
      aiIntegrated: "AI POWERED SYSTEM 🤖",
      auraGuide: "Each completed task increases your Aura by 10 points. Maintain your daily streak.",
      filters: "Filter View",
      hello: "Hello",
      statuses: { todo: "Pending", doing: "Progress", done: "Finished" },
      streak: "Daily Streak",
      freq: { none: "None", daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
      newDay: "Start New Day 🌅",
      editTask: "Edit Task",
      logout: "Logout",
      heroSub: "Life Optimization & Excellence Engine"
    }
  }), []);

  const t = useMemo(() => dictionary[lang] || dictionary.ar, [lang, dictionary]);
  const [currentQuote, setCurrentQuote] = useState("");

  // --- 3. Firebase Authentication Handlers ---
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      }
      setIsAuthLoading(false);
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

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    setLoginError("");
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else if (authMode === 'register') await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) { setLoginError(error.message.includes("invalid") ? "بيانات الدخول غير صحيحة ⚠️" : error.message); }
    finally { setIsActionLoading(false); }
  };

  const handlePasswordReset = async () => {
    if (!email) return setLoginError("اكتب إيميلك أولاً! ⚠️");
    setIsActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("تم إرسال رابط إعادة التعيين لإيميلك ✅");
    } catch (e) { setLoginError(e.message); }
    finally { setIsActionLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setLoginError("");
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) {
      if (error.code === 'auth/unauthorized-domain') setLoginError(String(t.unauthDomain));
      else setLoginError("Connection Error.");
    } finally { setIsGoogleLoading(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  // Sync Listeners for Firestore Profile & Tasks
  useEffect(() => {
    if (!user) return;
    const profileDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDoc, (snap) => {
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
      }
    });
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksCol, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)));
    });
    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // --- 4. Logic Handlers ---
  const callAi = async (prompt, sys) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: sys }] } })
      });
      const data = await resp.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) { return null; }
  };

  const refreshAiQuote = async () => {
    if (!userName) return;
    setIsAiLoading(true);
    const mood = isGymMode ? "aggressive, competitive, high energy" : "calm, professional, wise";
    const res = await callAi(`Quote for ${userName}`, `Motivation coach. Max 7 words. Use their name.`);
    if (res && typeof res === 'string') setCurrentQuote(res.replace(/["*()0-9\n]/g, "").trim());
    else setCurrentQuote(lang === 'ar' ? `الالتزام هو اللي بصنع الأبطال يا ${userName}! 🔥` : `Discipline is key, ${userName}! 🔥`);
    setIsAiLoading(false);
  };

  useEffect(() => { if(userName) refreshAiQuote(); }, [lang, userName, isGymMode]);

  const saveProfile = async (updates) => {
    if (!user) { await signInAnonymously(auth); return; }
    const profileDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await setDoc(profileDoc, { ...updates }, { merge: true });
    if(updates.name) setUserName(updates.name);
  };

  const handleAddTask = async (txt, slot = 'day', freq = 'none') => {
    if (!txt || !user) return;
    const tasksCol = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const docRef = await addDoc(tasksCol, {
      text: txt, completed: false, status: 'todo', emoji: "⏳",
      slot, frequency: freq, dateAdded: new Date().toISOString(), isProcessing: true
    });
    const emojiRes = await callAi(txt, "1 relevant emoji.");
    const emoji = typeof emojiRes === 'string' ? emojiRes.trim() : "✨";
    await updateDoc(docRef, { emoji, isProcessing: false });
  };

  const toggleStatus = async (id) => {
    if (!user) return;
    const task = tasks.find(t => t.id === id);
    const sequence = ['todo', 'doing', 'done'];
    const nextStatus = sequence[(sequence.indexOf(task.status) + 1) % 3];
    let auraUpdate = aura;
    if (nextStatus === 'done' && task.status !== 'done') auraUpdate += 10;
    if (task.status === 'done' && nextStatus === 'todo') auraUpdate = Math.max(0, auraUpdate - 10);
    const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
    await updateDoc(taskDoc, { status: nextStatus, completed: nextStatus === 'done' });
    await saveProfile({ aura: auraUpdate });
  };

  const deleteTask = async (id) => {
    if (!user) return;
    const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
    await deleteDoc(taskDoc);
  };

  const updateTaskData = async (taskId, updates) => {
    if (!user) return;
    const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', taskId);
    await updateDoc(taskDoc, updates);
  };

  const startNewDay = async () => {
    if (!user) return;
    const doneToday = tasks.filter(t => t.status === 'done').length;
    const newStreak = doneToday > 0 ? streak + 1 : 0;
    for (const task of tasks) {
      const taskDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', task.id);
      if (task.frequency === 'none') { if (task.status === 'done') await deleteDoc(taskDoc); }
      else { await updateDoc(taskDoc, { status: 'todo', completed: false }); }
    }
    await saveProfile({ streak: newStreak });
    refreshAiQuote();
  };

  const handleGenerateMore = async (catId) => {
    if (isAiLoading || !user) return;
    setIsAiLoading(true);
    const cat = categoriesData.find(c => c.id === catId);
    const existingList = tasks.map(t => t.text).join(", ");
    const res = await callAi(`More for ${catId}`, `Suggest 5 unique daily tasks for category "${cat.ar}". Avoid: [${existingList}]. Max 4 words each.`);
    if (res) {
      const newItems = res.split('\n').filter(t => t.trim()).map(t => t.trim().replace(/["*]/g, ""));
      setCategoriesData(prev => prev.map(c => c.id === catId ? { ...c, items: [...new Set([...c.items, ...newItems])] } : c));
    }
    setIsAiLoading(false);
  };

  const [categoriesData, setCategoriesData] = useState([
    { id: 'spiritual', ar: "ديني", sl: "Spirit", std: "Spiritual", icon: <Moon size={20} className="text-indigo-400" />, items: ["صلاة الفجر", "أذكار الصباح", "ورد القرآن"], slot: 'morning' },
    { id: 'health', ar: "صحي", sl: "Physique", std: "Health", icon: <Heart size={20} className="text-red-400" />, items: ["تمرين حديد 🔥", "شرب لتر ماء", "قطع السكر"], slot: 'day' },
    { id: 'skills', ar: "تطوير", sl: "Skills", std: "Development", icon: <Brain size={20} className="text-blue-400" />, items: ["English Shadowing", "Coding Lab", "قراءة كتاب"], slot: 'day' },
    { id: 'habits', ar: "عادات", sl: "Routine", std: "Habits", icon: <Coffee size={20} className="text-orange-400" />, items: ["ترتيب الغرفة", "تخطيط يوم بكرة", "تصفير الإشعارات"], slot: 'night' }
  ]);

  const currentCategories = useMemo(() => {
    return categoriesData.map(cat => ({ ...cat, title: lang === 'ar' ? cat.ar : (lang === 'en_slang' ? cat.sl : cat.std) }));
  }, [lang, categoriesData]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSlot = filterSlot === 'all' || t.slot === filterSlot;
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSlot && matchStatus;
    });
  }, [tasks, filterSlot, filterStatus]);

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

  // --- 5. UI Rendering ---
  if (isAuthLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 size={64} className="text-blue-500 animate-spin" /></div>;

  // Welcome Screen
  if (!user || !userName) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 blur-[180px] animate-pulse rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/5 blur-[180px] animate-pulse rounded-full"></div>
        
        <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-1000">
          <div className="glass p-16 rounded-[4rem] text-center shadow-2xl relative border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
            <div className="w-24 h-24 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-blue-500/30 shadow-2xl animate-bounce">
              <Rocket size={48} className="text-blue-500" />
            </div>
            <h1 className="text-7xl font-black mb-4 tracking-tighter italic text-white logo-glow uppercase leading-none">GLOWUP</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-12 italic">{String(t.heroSub)}</p>
            
            <div className="space-y-8">
              {authMode === 'guest' || (user && !userName) ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{String(t.welcome)}</p>
                  <input 
                    type="text" placeholder="..." 
                    className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-8 text-center outline-none focus:ring-4 ring-blue-500/10 font-black text-4xl text-white transition-all shadow-inner"
                    onChange={(e) => {setTempName(e.target.value); setLoginError("");}}
                    onKeyDown={(e) => e.key === 'Enter' && (!tempName.trim() ? setLoginError(String(t.errorName)) : saveProfile({ name: tempName, aura: 0, streak: 0, lang, config }))}
                  />
                  <button onClick={() => !tempName.trim() ? setLoginError(String(t.errorName)) : saveProfile({ name: tempName, aura: 0, streak: 0, lang, config })} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[2.5rem] font-black shadow-2xl text-white flex items-center justify-center gap-4 transition-all active:scale-95 uppercase tracking-widest">{String(t.startBtn)}</button>
                  {!user && <button onClick={() => setAuthMode('login')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">← Back to Cloud Account</button>}
                </div>
              ) : authMode === 'reset' ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-right">
                   <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner">
                      <Mail className="text-slate-600" size={20} />
                      <input type="email" placeholder="Ur Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg" onChange={(e)=>setEmail(e.target.value)} />
                   </div>
                   <button onClick={handlePasswordReset} disabled={isActionLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all">
                      {isActionLoading ? <Loader2 className="animate-spin" /> : <><KeyRound size={20}/> {String(t.resetBtn)}</>}
                   </button>
                   <button onClick={() => setAuthMode('login')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">Back to Login</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Mail className="text-slate-600" size={20} /><input type="email" placeholder="Email Address" className="bg-transparent flex-1 outline-none font-bold text-white text-lg" onChange={(e)=>setEmail(e.target.value)} required /></div>
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Lock className="text-slate-600" size={20} /><input type="password" placeholder="Password" className="bg-transparent flex-1 outline-none font-bold text-white text-lg" onChange={(e)=>setPassword(e.target.value)} required /></div>
                    <button type="submit" disabled={isActionLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl font-black text-white flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95">{isActionLoading ? <Loader2 className="animate-spin" /> : <><ArrowRightCircle size={24}/> {authMode === 'login' ? String(t.emailBtn) : String(t.registerBtn)}</>}</button>
                  </form>
                  <div className="flex justify-between items-center px-4">
                     <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black text-blue-400 hover:underline uppercase tracking-widest">{authMode === 'login' ? 'Join Now' : 'Sign In'}</button>
                     <button onClick={() => setAuthMode('reset')} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest">{String(t.resetBtn)}</button>
                  </div>
                  <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black"><span className="bg-[#0f172a] px-6 text-slate-600 italic">Access Methods</span></div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="bg-white text-slate-900 p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm">{isGoogleLoading ? <Loader2 className="animate-spin" /> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google"/> GOOGLE</>}</button>
                    <button onClick={() => setAuthMode('guest')} className="bg-slate-800 text-white p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-700 flex items-center justify-center gap-2 shadow-sm"><Zap size={16} className="text-yellow-400" /> GUEST</button>
                  </div>
                </div>
              )}
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse px-6">{String(loginError)}</p>}
              {successMsg && <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest px-6">{String(successMsg)}</p>}
              <div className="flex items-center justify-center gap-3 opacity-30 mt-8"><ShieldCheck size={14} className="text-slate-500" /><p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">Cloud Shield Protocol Active • V44.0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 9. Main Application Hub ---
  return (
    <div className={`min-h-screen transition-all duration-1000 p-4 md:p-8 pb-48 font-sans selection:bg-blue-500/30 overflow-x-hidden ${isGymMode ? 'bg-[#0f0105]' : 'bg-[#020617]'}`}>
      
      {isGymMode && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30">
          <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-600/40 to-transparent animate-heat-rise"></div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none opacity-40 -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-red-600/40 animate-pulse' : 'bg-blue-600/10'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-900/30' : 'bg-indigo-600/5'}`}></div>
      </div>

      <div className="w-full max-w-full mx-auto main-wrapper" style={{ zoom: scalingStyles.zoom }}>
        <header className="flex flex-col gap-12 mb-20 border-b border-white/5 pb-12 animate-in slide-in-from-top-10 duration-1000">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <h1 className={`text-5xl md:text-8xl font-black tracking-tighter italic leading-[0.85] mb-4 transition-all duration-1000 ${isGymMode ? 'text-red-600 drop-shadow-[0_0_20px_red]' : 'text-white'}`}>
              {String(t.hello)} <span className={`bg-gradient-to-r transition-all duration-1000 bg-clip-text text-transparent uppercase ${isGymMode ? 'from-red-600 to-orange-600 font-black' : 'from-blue-400 to-indigo-500'}`}>{String(userName)}</span>
            </h1>

            <div className="flex gap-4">
              <button onClick={() => setShowAuraInfo(true)} className={`p-8 rounded-[2.5rem] border flex items-center gap-8 min-w-[280px] shadow-2xl transition-all duration-700 hover:scale-105 active:scale-95 relative overflow-hidden group ${isGymMode ? 'bg-red-950/40 border-red-500/30' : 'bg-slate-900/40 border-white/5 backdrop-blur-xl shadow-blue-950/20'}`}>
                 <div className="flex-1 text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 italic">{String(t.aura)}</p>
                    <p className={`text-5xl font-black tracking-tighter leading-none flex items-center justify-end gap-2 ${isGymMode ? 'text-red-500' : 'text-blue-400'}`}><Gem size={28} /> {aura}</p>
                    <div className="w-full h-1 bg-slate-800 rounded-full mt-6 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isGymMode ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`} style={{width: `${(aura % 1000) / 10}%`}}></div></div>
                 </div>
                 <div className="w-[1px] h-12 bg-white/10"></div>
                 <div className="text-center">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 italic">{String(t.streak)}</p>
                    <div className="flex items-center gap-3">
                      <p className={`text-5xl font-black tracking-tighter leading-none ${streak > 0 ? 'text-orange-500' : 'text-slate-700'}`}>{streak}</p>
                      <Flame size={32} className={streak > 0 ? 'text-orange-500 animate-pulse' : 'text-slate-800'} />
                    </div>
                 </div>
              </button>
              <button onClick={() => setIsGymMode(!isGymMode)} className={`p-10 rounded-[2.5rem] border transition-all duration-700 flex flex-col items-center justify-center min-w-[160px] active:scale-95 shadow-2xl ${isGymMode ? 'bg-red-600 border-red-400 text-white shadow-red-900/50' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-white shadow-lg'}`}>
                 {isGymMode ? <Swords size={40} className="mb-2 animate-pulse" /> : <Dumbbell size={40} className="mb-2 opacity-30" />}
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none">{isGymMode ? 'BEAST ACTIVATED' : String(t.power)}</p>
              </button>
              <button onClick={() => setShowSettings(true)} className={`p-10 rounded-[2.5rem] border transition-all active:scale-95 shadow-xl ${isGymMode ? 'bg-red-900/20 border-red-500/20 text-red-500 hover:text-white' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-white shadow-lg'}`}>
                  <Settings size={48} />
              </button>
            </div>
          </div>

          <div className="w-full">
             <div className={`w-full flex items-center justify-between gap-8 px-10 py-5 rounded-[3rem] border backdrop-blur-md shadow-2xl transition-all duration-700 ${isGymMode ? 'bg-red-950/20 border-red-500/30 text-red-100 font-black' : 'bg-slate-900/40 border-white/5 text-slate-300 shadow-xl'}`}>
                <div className="flex items-center gap-8 flex-1 overflow-hidden">
                   <Quote size={28} className={isGymMode ? 'text-red-500 animate-pulse flex-shrink-0' : 'text-blue-500 flex-shrink-0'} />
                   <p className="text-xl md:text-2xl font-black italic tracking-tight leading-none truncate">"{String(currentQuote)}"</p>
                </div>
                <button onClick={refreshAiQuote} disabled={isAiLoading} className={`p-4 rounded-2xl border transition-all hover:rotate-180 duration-500 active:scale-90 shadow-xl ${isGymMode ? 'bg-red-900/20 border-red-500/30 text-red-500' : 'bg-slate-900/60 border-white/5 text-slate-600 hover:text-blue-400'}`}>
                  {isAiLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
                </button>
             </div>
          </div>
        </header>

        <div className="flex flex-col gap-12">
          {/* STACKED CONTROL HUB (FULL WIDTH) */}
          <section className={`p-8 rounded-[4rem] border shadow-2xl transition-all duration-1000 flex items-center justify-between gap-12 w-full ${isGymMode ? 'bg-red-950/20 border-red-500/30 shadow-red-900/20' : 'bg-slate-900/40 border-white/5 backdrop-blur-3xl shadow-blue-950/20'}`}>
              <div className="flex flex-col gap-4 min-w-[120px]">
                  <button onClick={() => setTimerActive(!timerActive)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all active:scale-90 shadow-xl ${timerActive ? (isGymMode ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-500') : (isGymMode ? 'bg-red-900 text-white' : 'bg-blue-600 text-white shadow-blue-900/30')}`}>
                      {timerActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                  </button>
                  <button onClick={() => {setTimerActive(false); setTimeLeft(selectedDuration * 60);}} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all border shadow-lg ${isGymMode ? 'bg-red-950 border-red-500/20 text-red-800' : 'bg-slate-800 border-white/5 text-slate-500 hover:text-white'}`}>
                      <RotateCcw size={28} />
                  </button>
              </div>

              <div className="relative flex flex-col items-center justify-center flex-1">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-56 h-56 transform -rotate-90">
                        <circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" className={isGymMode ? "text-red-950/30" : "text-slate-900/50"} />
                        <circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="534" strokeDashoffset={ ringOffset * (534/502) } strokeLinecap="round" className={`transition-all duration-1000 ${timerActive ? (isGymMode ? 'text-red-500 drop-shadow-[0_0_20px_red]' : 'text-blue-500 drop-shadow-[0_0_10px_blue]') : (isGymMode ? 'text-red-900' : 'text-slate-800')}`} />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <p className={`text-5xl font-black tracking-tighter transition-all duration-500 ${timerActive ? 'text-white' : (isGymMode ? 'text-red-950 font-black' : 'text-slate-750 font-bold')}`}>{formatTime(timeLeft)}</p>
                    </div>
                  </div>
                  
                  {isCustomTime && (
                    <div className="mt-4 animate-in slide-in-from-top-2 flex flex-col items-center gap-3">
                       <p className={`text-[11px] font-black uppercase text-center px-4 leading-tight ${isGymMode ? 'text-red-400' : 'text-slate-500'}`}>
                          {String(t.customTimerMsg).replace('{mins}', selectedDuration)}
                       </p>
                       <input 
                          type="number" autoFocus placeholder={String(t.howLong)}
                          className={`w-32 bg-slate-950/50 border border-white/5 rounded-2xl p-3 text-center outline-none focus:ring-2 font-black text-xl text-white ${isGymMode ? 'ring-red-500/20' : 'ring-blue-500/20'}`}
                          onChange={(e) => { const val = parseInt(e.target.value); if(val > 0) { setSelectedDuration(val); setTimeLeft(val * 60); } }} 
                        />
                    </div>
                  )}
              </div>

              <div className="flex flex-col gap-3 min-w-[120px] items-end">
                  {[15, 25, 45].map(m => (
                      <button key={m} onClick={() => updateTimer(m)} className={`h-12 w-16 rounded-2xl text-xs font-black uppercase transition-all ${selectedDuration === m && !isCustomTime ? (isGymMode ? 'bg-red-600 text-white' : 'bg-blue-600 text-white shadow-lg') : (isGymMode ? 'bg-red-950/40 text-red-900 hover:text-red-500' : 'bg-slate-800 text-slate-500 hover:text-white shadow-sm')}`}>{m}m</button>
                  ))}
                  <button onClick={() => setIsCustomTime(!isCustomTime)} className={`h-12 w-16 rounded-2xl flex items-center justify-center transition-all ${isCustomTime ? (isGymMode ? 'bg-purple-600 text-white shadow-purple-900/50' : 'bg-indigo-600 text-white shadow-blue-900/20') : (isGymMode ? 'bg-red-950/40 text-red-900' : 'bg-slate-800 text-slate-500 hover:text-white shadow-sm')}`}><Settings2 size={20} /></button>
              </div>
          </section>

          {/* MAIN HUB: TASK MANAGEMENT */}
          <div className="space-y-12">
            <div className="flex gap-4">
                <div className={`flex-1 glass p-4 rounded-[4rem] flex flex-col gap-4 focus-within:ring-4 transition-all group ${isGymMode ? 'focus-within:ring-red-600/30' : 'focus-within:ring-blue-500/5'}`}>
                    <form onSubmit={(e) => { e.preventDefault(); const val = e.target.task.value.trim(); if(val) handleAddTask(val, newTaskSlot, newTaskFreq); e.target.reset(); }} className="flex gap-4 items-center">
                        <div className={`flex-1 flex items-center px-10 rounded-[2.5rem] border transition-all shadow-inner ${isGymMode ? 'bg-red-950/30 border-red-600/20' : 'bg-slate-950/60 border-slate-800'}`}>
                            <Plus size={32} className={isGymMode ? 'text-red-700 mr-6' : 'text-slate-600 mr-6'} />
                            <input name="task" placeholder={String(t.addTaskPlaceholder).replace('{name}', userName || 'بطل')} className="w-full bg-transparent py-10 text-3xl font-black outline-none text-white tracking-tight" />
                        </div>
                        <div className="flex flex-col gap-3 min-w-[200px]">
                           <div className={`flex gap-2 p-1.5 rounded-2xl border transition-all ${isGymMode ? 'bg-red-950/40 border-red-900/30' : 'bg-slate-950/40 border-white/5'}`}>
                                {['morning', 'day', 'night'].map(s => (
                                    <button key={s} type="button" onClick={() => setNewTaskSlot(s)} title={String(t.slots[s])} className={`flex-1 p-3 rounded-xl transition-all active:scale-90 ${newTaskSlot === s ? (isGymMode ? 'bg-red-600 text-white shadow-red-900/50' : 'bg-blue-600 text-white shadow-lg') : (isGymMode ? 'text-red-900 hover:text-red-500' : 'text-slate-500 hover:text-white')}`}>
                                        {s === 'morning' ? <Sun size={18}/> : s === 'day' ? <CloudSun size={18}/> : <Moon size={18}/>}
                                    </button>
                                ))}
                           </div>
                           <select onChange={(e) => setNewTaskFreq(e.target.value)} className={`text-[10px] font-black uppercase px-4 py-3 rounded-xl outline-none border transition-all cursor-pointer ${isGymMode ? 'bg-red-900/40 text-red-100 border-red-800/40 shadow-inner' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
                              {Object.entries(t.freq).map(([k,v]) => <option key={k} value={k}>{String(v)}</option>)}
                           </select>
                           <button type="submit" className={`px-6 py-5 rounded-[2rem] transition-all shadow-xl font-black active:scale-95 text-[10px] uppercase tracking-widest text-white ${isGymMode ? 'bg-red-600 hover:bg-red-500 shadow-red-600/40' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}>{String(t.addBtn)}</button>
                        </div>
                    </form>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowAiMenu(!showAiMenu)} className={`p-10 rounded-[3.5rem] border transition-all duration-500 flex items-center justify-center active:scale-95 shadow-2xl ${showAiMenu ? (isGymMode ? 'bg-red-600 border-red-400 text-white shadow-red-900/50' : 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-900/50') : (isGymMode ? 'bg-red-950/40 border-red-500/30 text-red-500' : 'bg-slate-900/40 border-white/5 text-indigo-400 shadow-lg')}`}>
                      <Sparkles size={40} className={showAiMenu ? 'animate-pulse' : ''} />
                  </button>
                  <button onClick={() => setShowFilters(!showFilters)} className={`p-10 rounded-[3.5rem] border transition-all duration-500 flex items-center justify-center active:scale-95 shadow-2xl ${showFilters ? 'bg-blue-600 text-white border-blue-400 shadow-blue-900/50' : 'bg-slate-900/40 border-white/5 text-slate-500 shadow-lg'}`}>
                      <Filter size={40} />
                  </button>
                </div>
            </div>

            {showFilters && (
                <div className={`p-10 rounded-[4rem] border shadow-inner animate-in slide-in-from-top-4 transition-all space-y-8 ${isGymMode ? 'bg-red-950/40 border-red-500/30' : 'bg-slate-900/60 border-white/5 shadow-xl'}`}>
                    <div className="flex justify-between items-center px-2 text-right">
                        <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">{String(t.filters)}</p>
                        <button onClick={startNewDay} className={`flex items-center gap-3 px-6 py-3 rounded-2xl border font-black text-[10px] uppercase transition-all active:scale-95 ${isGymMode ? 'bg-red-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'}`}><RefreshCw size={14}/> {String(t.newDay)}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-right">
                        <div className="grid grid-cols-2 gap-3">
                            {['all', 'morning', 'day', 'night'].map(s => (
                                <button key={s} onClick={() => setFilterSlot(s)} className={`flex items-center justify-center gap-3 py-5 rounded-2xl border text-[11px] font-black uppercase transition-all active:scale-95 ${filterSlot === s ? (isGymMode ? 'bg-red-600 border-red-400 text-white shadow-md' : 'bg-blue-600 border-blue-400 text-white shadow-md') : (isGymMode ? 'bg-red-950/40 border-red-900/30 text-red-900 hover:text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white shadow-sm')}`}>
                                    {String(t.slots[s])}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-right">
                            {['all', 'todo', 'doing', 'done'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={`flex items-center justify-center gap-3 py-5 rounded-2xl border text-[11px] font-black uppercase transition-all active:scale-95 ${filterStatus === s ? (isGymMode ? 'bg-red-600 border-red-400 text-white shadow-md' : 'bg-orange-500 border-orange-400 text-white shadow-md') : (isGymMode ? 'bg-red-950/40 border-red-900/30 text-red-900 hover:text-red-500' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white shadow-sm')}`}>
                                    {String(t.statusFilters[s])}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 global-scaling">
                  {filteredTasks.length === 0 ? (
                    <div className="py-40 text-center border-4 border-dashed border-slate-900/40 rounded-[5rem] animate-pulse opacity-30 shadow-inner">
                        <ArchiveX size={64} className="mx-auto mb-6 text-slate-800" />
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] italic text-2xl leading-none">{String(t.empty)}</p>
                    </div>
                  ) : filteredTasks.map(task => (
                    <div key={task.id} className={`group flex items-center justify-between card-size rounded-[3rem] border transition-all duration-700 ${task.status === 'done' ? 'bg-slate-950/20 opacity-30 border-slate-950 grayscale scale-95' : (isGymMode ? 'bg-red-950/40 border-red-500/20 shadow-2xl shadow-red-900/10 scale-[1.01]' : 'bg-slate-900/60 border-white/5 shadow-2xl hover:border-blue-500/20 active:scale-[0.99] backdrop-blur-md')}`}>
                      <div className="flex items-center gap-10 flex-1 overflow-hidden text-right">
                        <button onClick={() => toggleStatus(task.id)} className={`icon-box rounded-2xl flex items-center justify-center transition-all shadow-lg ${task.status === 'done' ? 'bg-emerald-500 text-white shadow-emerald-950/50' : task.status === 'doing' ? 'bg-orange-500 text-white animate-pulse shadow-orange-900/40' : (isGymMode ? 'bg-slate-950 border-2 border-red-900/50 text-transparent' : 'bg-slate-950 border-2 border-slate-800 text-transparent shadow-inner')}`}>
                          {task.status === 'done' ? <CheckCircle size={18} /> : task.status === 'doing' ? <Construction size={18} /> : <Circle size={18} />}
                        </button>
                        <div className="flex items-center gap-8 overflow-hidden">
                            <span className={`emoji-text transition-all duration-700 transform ${task.isProcessing ? 'animate-pulse grayscale opacity-30 scale-90' : 'group-hover:scale-125 flex-shrink-0'}`}>{typeof task.emoji === 'string' ? task.emoji : '✨'}</span>
                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center gap-5">
                                  <p className={`font-black tracking-tighter leading-none task-font truncate ${task.status === 'done' ? 'line-through text-slate-600 italic font-bold' : (isGymMode ? 'text-red-50 font-black italic' : 'text-slate-100')}`}>{String(task.text)}</p>
                                  <span className={`text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-colors flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : task.status === 'doing' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-slate-800 text-slate-500 border-white/5 shadow-sm'}`}>{String(t.statuses[task.status])}</span>
                                </div>
                                <div className="flex items-center gap-6 mt-3">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isGymMode ? 'text-red-900' : 'text-slate-600'}`}>
                                        {task.slot === 'morning' && <Sun size={12} />}
                                        {task.slot === 'day' && <CloudSun size={12} />}
                                        {task.slot === 'night' && <Moon size={12} />}
                                        {String(t.slots[task.slot])}
                                    </span>
                                    {task.frequency !== 'none' && <span className="text-[9px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-black uppercase italic tracking-widest border border-blue-500/20">{String(t.freq[task.frequency])}</span>}
                                </div>
                            </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all ml-4">
                        <button onClick={() => setEditingTask(task)} className={`p-4 rounded-xl transition-all active:scale-90 ${isGymMode ? 'text-blue-900 hover:text-blue-400' : 'text-slate-600 hover:text-blue-400'}`}><Edit2 size={24}/></button>
                        <button onClick={() => deleteTask(task.id)} className={`p-4 rounded-xl transition-all active:scale-90 ${isGymMode ? 'text-red-900 hover:text-red-500' : 'text-slate-600 hover:text-red-500'}`}><Trash2 size={24}/></button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-48 border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center gap-10 px-10 pb-20 opacity-40 hover:opacity-100 transition-all duration-1000">
            <p className="text-[12px] font-black tracking-[0.6em] text-slate-500 uppercase italic">V43.0 GlowUp Omni Absolute</p>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-right">
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic leading-none text-right">Powered by</p>
                <p className={`text-2xl font-black tracking-[0.4em] uppercase italic leading-none ${isGymMode ? 'text-red-600' : 'text-white'}`}>Humam Taibeh 🦾</p>
            </div>
        </footer>
      </div>

      {/* MODALS */}
      {showAuraInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowAuraInfo(false)}></div>
           <div className="relative w-full max-sm bg-slate-900 border border-white/10 p-12 rounded-[4rem] text-center shadow-2xl animate-in zoom-in-95">
              <Gem size={72} className="mx-auto text-blue-400 mb-8 animate-pulse" />
              <h3 className="text-3xl font-black text-white mb-6 uppercase italic">Aura Protocol</h3>
              <p className="text-slate-400 text-base leading-relaxed mb-10">{String(t.auraGuide)}</p>
              <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 mb-10 flex justify-between items-center text-right">
                 <div className="text-right flex-1"><p className="text-[10px] font-black text-slate-500 uppercase mb-1">{String(t.streak)}</p><p className="text-4xl font-black text-white">{streak}</p></div>
                 <Flame size={48} className={streak > 0 ? 'text-orange-500 ml-4' : 'text-slate-700 ml-4'} />
              </div>
              <button onClick={() => setShowAuraInfo(false)} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase active:scale-95 transition-all">Got it</button>
           </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-right">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setEditingTask(null)}></div>
           <div className={`relative w-full max-w-lg p-14 rounded-[5rem] border shadow-2xl animate-in zoom-in-95 ${isGymMode ? 'bg-[#0f0105] border-red-500/20' : 'bg-slate-900 border-white/10'}`}>
              <button onClick={() => setEditingTask(null)} className="absolute top-10 right-10 p-4 bg-slate-800 rounded-full text-slate-400 hover:bg-red-500 transition-all"><X size={24}/></button>
              <h3 className="text-4xl font-black text-white mb-12 italic uppercase flex items-center gap-4 text-right"><Edit2 className="text-blue-500" /> {String(t.editTask)}</h3>
              <div className="space-y-10 text-right">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{lang === 'ar' ? 'نص المهمة' : 'Objective Text'}</p>
                     <div className="flex gap-4">
                        <button className="text-4xl bg-slate-950 p-5 rounded-3xl border border-white/5 shadow-inner">{editingTask.emoji}</button>
                        <input value={editingTask.text} className="flex-1 bg-slate-950 border border-white/5 p-6 rounded-3xl font-black text-white text-xl outline-none focus:ring-4 ring-blue-500/10 shadow-inner" onChange={(e) => setEditingTask({...editingTask, text: e.target.value})} />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-right">
                      <div className="space-y-4">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{lang === 'ar' ? 'وقت المهمة' : 'Time Slot'}</p>
                         <div className="flex gap-2 p-1.5 bg-slate-950 rounded-2xl border border-white/5">
                            {['morning', 'day', 'night'].map(s => (
                                <button key={s} onClick={() => setEditingTask({...editingTask, slot: s})} className={`flex-1 p-4 rounded-xl transition-all ${editingTask.slot === s ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
                                    {s === 'morning' ? <Sun size={18} className="mx-auto"/> : s === 'day' ? <CloudSun size={18} className="mx-auto"/> : <Moon size={18} className="mx-auto"/>}
                                </button>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-4 text-right">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{lang === 'ar' ? 'التكرار' : 'Repeat'}</p>
                         <select value={editingTask.frequency} onChange={(e) => setEditingTask({...editingTask, frequency: e.target.value})} className="w-full bg-slate-950 p-5 rounded-2xl border border-white/5 text-[11px] font-black uppercase text-slate-400 outline-none shadow-inner" >
                            {Object.entries(t.freq).map(([k,v]) => <option key={k} value={k}>{String(v)}</option>)}
                         </select>
                      </div>
                  </div>
                  <button onClick={() => { updateTaskData(editingTask.id, editingTask); setEditingTask(null); }} className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-900/30 transition-all active:scale-95">{String(t.save)}</button>
              </div>
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right">
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
              <div className={`relative w-full max-w-2xl border p-16 rounded-[6rem] shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden ${isGymMode ? 'bg-[#0f0105] border-red-500/20' : 'bg-slate-900 border-white/10'}`}>
                <button onClick={() => setShowSettings(false)} className={`absolute top-12 right-12 p-6 rounded-full border shadow-xl bg-slate-800 text-slate-400 hover:bg-red-500 transition-all shadow-lg`}><X size={32}/></button>
                <h2 className={`text-5xl font-black italic mb-16 flex items-center gap-6 ${isGymMode ? 'text-red-50' : 'text-white'}`}><Settings className={isGymMode ? "animate-spin-slow text-red-600" : "text-blue-500"} /> CORE CONFIG</h2>
                <div className="space-y-14 relative z-10 text-right">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-end gap-2 italic font-black">{String(t.identity)} <UserCircle size={14} /></label>
                        <input type="text" value={draftName} className={`w-full border rounded-[3rem] p-8 font-black text-white text-4xl text-center outline-none focus:ring-4 transition-all shadow-inner ${isGymMode ? 'bg-red-950 border-red-500/20 focus:ring-red-500/10' : 'bg-slate-950 border-white/5 focus:ring-blue-500/10'}`} onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="space-y-6 text-center">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic mb-2 block text-right">{String(t.language)}</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[{id:'ar', n:'العربية'}, {id:'en_slang', n:'Slang EN'}, {id:'en_normal', n:'Standard EN'}].map(l => (
                                <button key={l.id} onClick={() => setDraftLang(l.id)} className={`py-6 rounded-3xl text-xs font-black uppercase transition-all ${draftLang === l.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'bg-slate-800 text-slate-500 shadow-sm'}`}>{l.n}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-12 text-right">
                        <div className="space-y-6 text-center">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic mb-2 block">{String(t.font)}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['small', 'medium', 'large'].map(sz => (
                                    <button key={sz} onClick={() => setDraftConfig({...draftConfig, fontSize: sz})} className={`py-5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${draftConfig.fontSize === sz ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'bg-slate-800 text-slate-500 shadow-sm'}`}>{sz === 'medium' ? 'Default' : sz}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-6 text-center">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic mb-2 block">{String(t.icons)}</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['small', 'medium', 'large'].map(sz => (
                                    <button key={sz} onClick={() => setDraftConfig({...draftConfig, iconSize: sz})} className={`py-5 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm ${draftConfig.iconSize === sz ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/20' : 'bg-slate-800 text-slate-500 shadow-sm'}`}>{sz === 'medium' ? 'Default' : sz}</button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 border-t border-white/5 space-y-6 text-right">
                        <button onClick={() => { setConfig(draftConfig); saveProfile({ name: draftName, lang: draftLang, config: draftConfig }); setShowSettings(false); }} className={`w-full py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 ${isGymMode ? 'bg-emerald-700 shadow-emerald-900/30' : 'bg-emerald-600 shadow-emerald-900/30'}`}><Save size={28} /> {String(t.save)}</button>
                        <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white py-5 rounded-[3rem] font-black text-xs uppercase tracking-[0.3em] transition-all border border-white/5 active:scale-95 text-center flex items-center justify-center gap-3 shadow-lg"><LogOut size={18}/> {String(t.logout)}</button>
                    </div>
                </div>
              </div>
          </div>
      )}

      <style>{`
        :root {
          --f-scale: ${config.fontSize === 'small' ? '0.7' : config.fontSize === 'large' ? '1.5' : '1'};
          --i-scale: ${config.iconSize === 'small' ? '0.6' : config.iconSize === 'large' ? '1.5' : '1'};
        }
        .main-wrapper { transform-origin: top center; }
        .task-font { font-size: calc(1.1rem * var(--f-scale)); }
        .emoji-text { font-size: calc(2.4rem * var(--i-scale)); }
        .icon-box { width: calc(38px * var(--i-scale)); height: calc(38px * var(--i-scale)); }
        .card-size { padding: calc(1.2rem * var(--f-scale)); }
        .logo-glow { text-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
        ${isGymMode ? '.logo-glow { text-shadow: 0 0 50px rgba(239, 68, 68, 1); }' : ''}
        .animate-spin-slow { animation: spin 15s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes heat-rise {
          0% { transform: translateY(0) scaleY(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scaleY(1.15); opacity: 0.6; }
          100% { transform: translateY(-60px) scaleY(1.3); opacity: 0; }
        }
        .animate-heat-rise { animation: heat-rise 2.5s infinite linear; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .glass { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(28px); border: 1px solid rgba(255, 255, 255, 0.08); }
      `}</style>
    </div>
  );
};

export default App;
