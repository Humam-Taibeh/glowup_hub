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
  query,
  where
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, TrendingUp, Zap, 
  BrainCircuit, Loader2, Dumbbell, Flame, Play, Pause, RotateCcw, 
  Quote, Target, Settings, X, Moon, Heart, Brain, Coffee, Swords, Rocket, 
  Gem, Filter, RefreshCw, Save, Search, Activity,
  FlameKindling, CheckCircle, Construction, CalendarDays, ArchiveX, History, Calendar, Edit2, LogOut,
  Mail, Lock, UserPlus, KeyRound, ArrowRightCircle, ShieldCheck, Settings2,
  Smartphone, ExternalLink, BookOpen, AlertCircle, MapPin, User, Book, Star, Wand2, Sun, CloudSun, Droplets, Timer, Info, ChevronRight, ChevronLeft
} from 'lucide-react';

// --- 1. FIREBASE CONFIGURATION (OFFICIAL PROJECT: aura-sovereign) ---
const firebaseConfig = {
  apiKey: "AIzaSyDRB_9laY7I6lG6ZpgphX5dzKiUdhwl40M",
  authDomain: "aura-sovereign.firebaseapp.com",
  projectId: "aura-sovereign",
  storageBucket: "aura-sovereign.firebasestorage.app",
  messagingSenderId: "912670363868",
  appId: "1:912670363868:web:e9d46f795d2cc932ce2419",
  measurementId: "G-CM81C8ED35"
};

// RULE 1: Sanitize path segments for Firestore paths (Even segments only)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'aura_sovereign_v50_titan';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

// Initialize Firebase
const actualConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
const app = initializeApp(actualConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 2. AI CONFIGURATION ---
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

  // UI & AUTH FLOW STATES
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // login, register, reset, guestMode
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

  // DRAFTS
  const [draftName, setDraftName] = useState("");
  const [filterSlot, setFilterSlot] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all'); 
  const [newTaskSlot, setNewTaskSlot] = useState('day');
  const [newTaskFreq, setNewTaskFreq] = useState('none'); 

  // SCALING
  const scalingStyles = useMemo(() => {
    const scales = { small: 0.75, medium: 1, large: 1.4 };
    return { zoom: scales[config.fontSize] || 1 };
  }, [config.fontSize]);

  // ZUJ EXAM INTEL
  const exams = useMemo(() => [
    { id: 1, name: "الريادة والابتكار", date: "14/1/2026", time: "12:00-1:00", instructor: "د. يوسف أبوزغلة", location: "مختبرات 216", daysLeft: 9, material: "الفصل 1 - 6" },
    { id: 2, name: "Data Analytics", date: "21/1/2026", time: "11:30-1:30", instructor: "Dr. Ibrahim Atoum", location: "TBD", daysLeft: 16, material: "All Lectures" },
    { id: 3, name: "Data Structure", date: "26/1/2026", time: "11:30-1:30", instructor: "Dr. Sohair Al Hakeem", location: "TBD", daysLeft: 21, material: "Full Syllabus" },
    { id: 4, name: "Data Mining", date: "2/2/2026", time: "2:00-3:30", instructor: "Dr. Bilal Hawashin", location: "TBD", daysLeft: 28, material: "Full Syllabus" }
  ], []);

  // --- 3. DICTIONARY (Universal & Sanitized) ---
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
    editTask: "تعديل المهمة",
    auraGuide: "كل مهمة بتخلصها بتزيد الآورا 10 نقاط. الستريك بلمع كل ما خلصت مهام اليوم!"
  }), []);

  // --- 4. FIREBASE AUTHENTICATION (RULE 3: Auth First) ---
  useEffect(() => {
    const initAuth = async () => {
      setIsAuthLoading(true);
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        }
      } catch (err) { console.error("Initial Auth Failure"); }
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

  // --- 5. CLOUD SYNC ENGINE (RULE 1 & 2) ---
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
        setLang(data.lang || "ar");
        setConfig(data.config || { fontSize: 'medium', iconSize: 'medium' });
      } else {
        setUserName(""); // Triggers Identity Protocol screen
      }
      setIsAuthLoading(false);
    }, (error) => console.error("Cloud Access Restricted:", error));

    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    }, (error) => console.error("Tasks Access Restricted:", error));

    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // --- 6. HANDLERS ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    setLoginError("");
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) { 
      const code = err.code;
      if (code === 'auth/user-not-found') setLoginError("الحساب غير موجود ⚠️");
      else if (code === 'auth/wrong-password') setLoginError("كلمة السر خطأ ⚠️");
      else if (code === 'auth/email-already-in-use') setLoginError("الإيميل مستخدم مسبقاً ⚠️");
      else setLoginError("خطأ في البيانات.. تأكد وحاول ثانية ⚠️");
    } finally { setIsActionLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setLoginError("");
    try { 
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider); 
    } catch (err) { 
      setLoginError("قوقل مقيد في هذا النطاق. ضيف الرابط في Authorized Domains! ⚠️"); 
    } finally { setIsGoogleLoading(false); }
  };

  const handleGuestSignIn = async () => {
    setIsActionLoading(true);
    setLoginError("");
    try { await signInAnonymously(auth); }
    catch (err) { setLoginError("فشل الدخول كضيف."); }
    finally { setIsActionLoading(false); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const handlePasswordReset = async () => {
    if (!email) return setLoginError("اكتب إيميلك أولاً! ⚠️");
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg("تم إرسال رابط إعادة التعيين ✅");
    } catch (e) { setLoginError("فشل إرسال الرابط."); }
  };

  const saveProfile = async (updates) => {
    if (!user) return;
    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await setDoc(profileRef, { ...updates }, { merge: true });
    if(updates.name) setUserName(String(updates.name));
  };

  const handleAddTask = async (txt, slot = 'day', freq = 'none') => {
    if (!txt || !user) return;
    const tasksRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
    await addDoc(tasksRef, {
      text: String(txt), completed: false, status: 'todo', emoji: "⏳",
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
    
    const taskRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id);
    await updateDoc(taskRef, { status: nextStatus, completed: nextStatus === 'done' });
    saveProfile({ aura: auraUpdate });
  };

  const deleteTask = async (id) => { 
    if (!user) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id)); 
  };

  const addWater = (amt) => {
    const newVal = Math.min(waterTotal + amt, 4000);
    setWaterTotal(newVal);
    saveProfile({ water: newVal });
  };

  const refreshAiQuote = () => {
    setIsAiLoading(true);
    const quotes = ["الالتزام هو اللي بيصنع الفرق.. 🔥", "الوحوش ما بتوقف.. كمل طريقك! 🦾", "كل مهمة بتخلصها هي خطوة للقمة. 👑", "ZUJ AI: Excellence in every byte."];
    setTimeout(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setIsAiLoading(false);
    }, 600);
  };

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

  // --- 7. UI RENDERING ---

  if (isAuthLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 size={64} className="text-blue-500 animate-spin" /></div>;

  // 🛡️ THE ALPHA VAULT (AUTH GATE)
  if (!user || !userName) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-right font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15 pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 blur-[180px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/5 blur-[180px] rounded-full"></div>
        
        <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-700">
          <div className="glass p-16 rounded-[4rem] text-center shadow-2xl border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-[0_0_15px_blue]"></div>
            <Rocket size={48} className="text-blue-500 mx-auto mb-10 animate-bounce" />
            <h1 className="text-7xl font-black mb-4 italic text-white uppercase leading-none tracking-tighter logo-glow">GLOWUP</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.6em] mb-12 italic">{String(d.heroSub)}</p>
            
            <div className="space-y-8">
              {user && !userName ? (
                /* IDENTITY PROTOCOL */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">{String(d.welcome)}</p>
                  <input 
                    type="text" placeholder="..." 
                    className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-8 text-center font-black text-4xl text-white outline-none focus:ring-4 ring-blue-500/10 shadow-inner transition-all"
                    onChange={(e)=>{setTempName(e.target.value); setLoginError("");}}
                    onKeyDown={(e)=>e.key==='Enter' && (!tempName.trim() ? setLoginError(String(d.errorName)) : saveProfile({name:tempName, aura:0, streak:0}))}
                  />
                  <button onClick={()=> !tempName.trim() ? setLoginError(String(d.errorName)) : saveProfile({name: tempName, aura: 0, streak: 0})} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[2.5rem] font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-900/40">ابدأ الآن 🚀</button>
                  <button onClick={handleLogout} className="text-xs text-slate-600 font-bold uppercase tracking-widest hover:text-white transition-all underline">العودة لشاشة الدخول</button>
                </div>
              ) : authMode === 'reset' ? (
                /* PASSWORD RESET */
                <div className="space-y-6 text-right animate-in slide-in-from-bottom-2">
                   <div className="bg-slate-950/50 p-6 rounded-3xl border border-white/5 shadow-inner flex items-center gap-4">
                      <Mail className="text-slate-600" size={20} />
                      <input type="email" placeholder="Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} />
                   </div>
                   <button onClick={handlePasswordReset} className="w-full bg-indigo-600 py-5 rounded-3xl font-black text-white active:scale-95 transition-all">إرسال رابط التعيين</button>
                   <button onClick={() => setAuthMode('login')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">العودة للدخول</button>
                </div>
              ) : (
                /* LOGIN OPTIONS */
                <div className="space-y-6">
                  <form onSubmit={handleEmailAuth} className="space-y-4">
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Mail className="text-slate-600" size={20} /><input type="email" placeholder="Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setEmail(e.target.value)} required /></div>
                    <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Lock className="text-slate-600" size={20} /><input type="password" placeholder="Password" className="bg-transparent flex-1 outline-none font-bold text-white text-lg text-right" onChange={(e)=>setPassword(e.target.value)} required /></div>
                    <button type="submit" disabled={isActionLoading} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-3xl font-black text-white active:scale-95 transition-all shadow-xl shadow-blue-900/30">{authMode === 'login' ? String(d.emailBtn) : String(d.registerBtn)}</button>
                  </form>
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 px-4">
                    <button type="button" onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Join Squad':'Back to Login'}</button>
                    <button type="button" onClick={()=>setAuthMode('reset')}>{String(d.resetBtn)}</button>
                  </div>
                  <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5 opacity-10"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase bg-[#0f172a] px-4 italic text-slate-600">Secure Access</div></div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="bg-white text-slate-900 p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-100 flex items-center justify-center gap-2 shadow-sm">{isGoogleLoading ? <Loader2 size={16} className="animate-spin" /> : <><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="google"/> GOOGLE</>}</button>
                    <button onClick={handleGuestSignIn} className="bg-slate-800 text-white p-5 rounded-3xl font-black text-[10px] uppercase transition-all hover:bg-slate-700 flex items-center justify-center gap-2 shadow-sm"><Zap size={16} className="text-yellow-400" /> GUEST</button>
                  </div>
                </div>
              )}
              {loginError && <p className="text-red-500 text-[11px] font-black animate-pulse text-center">{String(loginError)}</p>}
              {successMsg && <p className="text-emerald-500 text-[11px] font-black text-center">{String(successMsg)}</p>}
              <div className="flex items-center justify-center gap-3 opacity-30 mt-8"><ShieldCheck size={14}/><p className="text-[8px] font-bold uppercase tracking-widest text-slate-500">Cloud Shield Protocol Active • V50.0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🦾 MAIN OPERATIONAL HUB (POST-AUTH)
  return (
    <div className={`min-h-screen transition-all duration-1000 p-6 md:p-8 pb-48 font-sans selection:bg-blue-500/30 overflow-x-hidden ${isGymMode ? 'bg-[#0b011d]' : 'bg-[#020617]'}`}>
      {isGymMode && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30"><div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-purple-600/40 to-transparent animate-heat-rise"></div></div>}
      <div className="fixed inset-0 pointer-events-none opacity-40 -z-10">
        <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-600/40 animate-pulse' : 'bg-blue-600/10'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full transition-all duration-1000 ${isGymMode ? 'bg-red-900/30' : 'bg-indigo-600/5'}`}></div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto main-wrapper" style={{ zoom: scalingStyles.zoom }}>
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20 border-b border-white/5 pb-12 text-right animate-in slide-in-from-top-10 duration-1000">
            <div className="flex-1">
                <h1 className={`text-6xl md:text-9xl font-black italic leading-[0.8] mb-6 tracking-tighter ${isGymMode ? 'text-purple-400 drop-shadow-[0_0_20px_purple]' : 'text-white'}`}>
                  {String(d.hello)} <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent uppercase">{String(userName)}</span>
                </h1>
                <div className="inline-flex items-center gap-4 bg-slate-900/40 p-5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
                  <BrainCircuit size={20} className={isGymMode ? "text-purple-400" : "text-blue-500"} />
                  <p className="text-slate-200 italic font-bold text-lg md:text-xl leading-none truncate max-w-[500px]">"{String(currentQuote)}"</p>
                  <button onClick={refreshAiQuote} disabled={isAiLoading} className="p-2 hover:rotate-180 transition-all duration-500 text-slate-600 hover:text-white">
                    <RefreshCw size={18} className={isAiLoading ? "animate-spin" : ""} />
                  </button>
                </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowAuraInfo(true)} className={`p-8 rounded-[2.5rem] border glass flex items-center gap-8 min-w-[320px] shadow-2xl transition-all hover:scale-105 active:scale-95 ${isGymMode ? 'border-purple-500/30 shadow-purple-950/20' : 'border-white/5 shadow-blue-950/20'}`}>
                 <div className="flex-1 text-right leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-2 italic tracking-widest">{String(d.aura)}</p><p className={`text-5xl font-black ${isGymMode ? 'text-purple-500' : 'text-blue-400'}`}><Gem className="inline" size={28} /> {aura}</p><div className="w-full h-1.5 bg-slate-800 rounded-full mt-5 overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isGymMode ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-blue-500 shadow-[0_0_10px_blue]'}`} style={{width: `${(aura % 1000) / 10}%`}}></div></div></div>
                 <div className="w-[1px] h-12 bg-white/10"></div>
                 <div className="text-center leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-2 italic tracking-widest">{String(d.streak)}</p><p className="text-5xl font-black text-orange-500">{streak} <Flame className="inline animate-pulse" size={32}/></p></div>
              </button>
              <button onClick={()=>setIsGymMode(!isGymMode)} className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center min-w-[160px] active:scale-95 shadow-2xl ${isGymMode ? 'bg-purple-600 border-purple-400 text-white shadow-purple-950/50' : 'glass text-slate-500 shadow-blue-900/10'}`}>{isGymMode ? <Flame size={40}/> : <Dumbbell size={40}/>}<p className="text-[10px] font-black uppercase mt-2">{isGymMode ? 'BEAST ACTIVATED' : String(d.power)}</p></button>
              <button onClick={()=>{setShowSettings(true); setDraftName(userName);}} className="p-10 rounded-[2.5rem] glass border border-white/5 text-slate-500 hover:text-blue-400 transition-all active:scale-90 shadow-xl"><Settings size={40}/></button>
            </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* COLUMN 1: VITALS (4/12) */}
            <div className="lg:col-span-4 space-y-12">
                {/* Hydration Tracker */}
                <section className="bg-slate-900/60 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <Droplets size={150} className="absolute -right-10 -top-10 opacity-5 text-cyan-500" />
                    <div className="flex justify-between items-center mb-8 relative z-10 text-right">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 flex items-center gap-2 italic"><Droplets size={14}/> Hydration Ops</h2>
                        <p className="text-3xl font-black text-white">{waterTotal}ml</p>
                    </div>
                    <div className="h-4 bg-slate-800 rounded-full mb-8 overflow-hidden shadow-inner"><div className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_15px_cyan]" style={{width:`${(waterTotal/4000)*100}%`}}></div></div>
                    <div className="grid grid-cols-3 gap-3">
                        {[250, 500, 1000].map(amt => <button key={amt} onClick={()=>addWater(amt)} className="py-6 rounded-2xl bg-slate-800 hover:bg-cyan-900/40 text-xs font-black border border-white/5 transition-all active:scale-90 shadow-sm">+{amt}</button>)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-6 tracking-widest text-center italic">Daily Target: 2.0L+</p>
                </section>

                {/* ZUJ Exams (The Humam Schedule) */}
                <section className="bg-slate-900/60 p-10 rounded-[4rem] border border-white/5 shadow-2xl relative group overflow-hidden">
                    <BookOpen size={150} className="absolute -right-10 -top-10 opacity-5 text-purple-400" />
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-purple-400 mb-10 flex items-center gap-3 italic"><Calendar size={16}/> ZUJ EXAM OPS</h2>
                    <div className="space-y-4 relative z-10">
                        {exams.map(ex => (
                            <div key={ex.id} className="p-7 rounded-[3rem] bg-slate-950/60 border border-slate-800 flex justify-between items-center hover:border-purple-500/40 transition-all cursor-pointer shadow-lg active:scale-95 group/item">
                                <div className="text-right flex-1 overflow-hidden">
                                    <p className="text-xl font-black text-white uppercase tracking-tight truncate group-hover/item:text-purple-300 transition-colors">{ex.name}</p>
                                    <p className="text-[11px] text-slate-500 font-bold mt-2 tracking-[0.1em]">{ex.date} | {ex.time}</p>
                                    <p className="text-[10px] text-purple-600 font-black mt-1 uppercase italic">{ex.instructor}</p>
                                </div>
                                <div className={`text-[11px] font-black px-4 py-2 rounded-full border shadow-inner ml-4 ${ex.daysLeft < 10 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-purple-500/10 border-purple-500/30 text-purple-500'}`}>{ex.daysLeft}d</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* COLUMN 2: CENTER OPERATIONS (8/12) */}
            <div className="lg:col-span-8 space-y-12">
                
                {/* FOCUS ENGINE (VERTICAL DESIGN) */}
                <section className={`p-10 rounded-[5rem] border glass shadow-2xl flex items-center justify-between gap-12 w-full relative overflow-hidden group ${isGymMode ? 'border-purple-500/30 shadow-purple-950/30' : 'shadow-blue-950/10'}`}>
                    <div className="flex flex-col gap-6 min-w-[140px] relative z-10">
                        <button onClick={()=>setTimerActive(!timerActive)} className={`w-28 h-28 rounded-[3rem] flex items-center justify-center transition-all active:scale-90 shadow-[0_0_40px_rgba(0,0,0,0.6)] ${timerActive ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-blue-600 text-white shadow-blue-900/50'}`}>
                            {timerActive ? <Pause size={56}/> : <Play size={56} className="ml-1"/>}
                        </button>
                        <button onClick={()=>{setTimerActive(false); setTimeLeft(selectedDuration*60);}} className="w-28 h-20 rounded-[2.5rem] glass border border-white/5 text-slate-500 flex items-center justify-center active:rotate-180 transition-all duration-700 shadow-lg hover:text-white">
                          <RotateCcw size={32}/>
                        </button>
                    </div>

                    <div className="relative flex flex-col items-center justify-center flex-1">
                        <svg className="w-80 h-80 transform -rotate-90">
                          <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/50 shadow-inner" />
                          <circle cx="160" cy="160" r="140" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray="880" strokeDashoffset={ringOffset * (880/502)} strokeLinecap="round" className={`transition-all duration-1000 ${isGymMode ? 'text-purple-600 drop-shadow-[0_0_25px_purple]' : 'text-blue-500 drop-shadow-[0_0_25px_blue]'}`} />
                        </svg>
                        <div className="absolute flex flex-col items-center text-center">
                          <p className="text-8xl font-black text-white tracking-tighter leading-none font-mono">{formatTime(timeLeft)}</p>
                          {isCustomTime && <p className="text-[12px] font-black text-slate-500 uppercase mt-4 px-4 italic animate-pulse tracking-widest">{String(d.customTimerMsg).replace('{mins}', selectedDuration)}</p>}
                        </div>
                        {isCustomTime && <input type="number" autoFocus placeholder={String(d.howLong)} className={`mt-8 w-40 glass border border-white/10 rounded-2xl p-5 text-center text-white font-black text-3xl outline-none focus:ring-4 ${isGymMode ? 'ring-purple-600/20' : 'ring-blue-600/20'} shadow-inner`} onChange={(e)=>{const v=parseInt(e.target.value); if(v>0) {setSelectedDuration(v); setTimeLeft(v*60);}}} />}
                    </div>

                    <div className="flex flex-col gap-4 min-w-[120px] items-end relative z-10">
                        {[15, 25, 45, 60].map(m => (<button key={m} onClick={()=>updateTimer(m)} className={`h-16 w-24 rounded-[2rem] text-sm font-black uppercase transition-all shadow-xl ${selectedDuration===m && !isCustomTime ? (isGymMode ? 'bg-purple-600 text-white shadow-purple-900/50' : 'bg-blue-600 text-white shadow-blue-900/50') : 'glass text-slate-500 hover:text-white border border-white/5'}`}>{m}m</button>))}
                        <button onClick={()=>setIsCustomTime(!isCustomTime)} className={`h-16 w-24 rounded-[2rem] glass transition-all shadow-xl flex items-center justify-center ${isCustomTime ? 'bg-purple-600 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-white border border-white/5'}`}><Settings2 size={28}/></button>
                    </div>
                </section>

                {/* MISSION CONTROL (TASKS) */}
                <div className="space-y-12">
                    <div className={`glass p-5 rounded-[5rem] border transition-all shadow-2xl ${isGymMode ? 'border-purple-600/30 focus-within:ring-4 ring-purple-600/20' : 'border-white/5 focus-within:ring-4 ring-blue-600/10'}`}>
                        <form onSubmit={(e)=>{e.preventDefault(); handleAddTask(e.target.task.value, newTaskSlot, newTaskFreq); e.target.reset();}} className="flex flex-col md:flex-row gap-6 items-center">
                            <div className={`flex-1 flex items-center px-10 rounded-[3rem] border glass shadow-inner transition-all ${isGymMode ? 'border-purple-900/30 bg-slate-950/40' : 'border-slate-800 bg-slate-950/20'}`}>
                                <Plus size={32} className={isGymMode ? 'text-purple-700 mr-6' : 'text-slate-600 mr-6'} />
                                <input name="task" placeholder={String(d.addTaskPlaceholder).replace('{name}', userName)} className="w-full bg-transparent py-14 text-3xl md:text-4xl font-black outline-none text-white placeholder:text-slate-800 text-right tracking-tight leading-tight" />
                            </div>
                            <div className="flex flex-col gap-4 min-w-[240px] w-full md:w-auto">
                              <div className={`flex gap-2 p-2 rounded-2xl border glass ${isGymMode ? 'border-purple-900/40' : 'border-white/5'}`}>
                                {['morning', 'day', 'night'].map(s => (
                                  <button key={s} type="button" onClick={() => setNewTaskSlot(s)} title={String(d.slots[s])} className={`flex-1 p-4 rounded-xl transition-all active:scale-90 ${newTaskSlot === s ? (isGymMode ? 'bg-purple-600 text-white shadow-purple-600/30' : 'bg-blue-600 text-white shadow-lg') : (isGymMode ? 'text-purple-900 hover:text-purple-500' : 'text-slate-500 hover:text-white')}`}>
                                      {s === 'morning' ? <Sun size={20}/> : s === 'day' ? <CloudSun size={20}/> : <Moon size={20}/>}
                                  </button>
                                ))}
                              </div>
                              <select onChange={(e) => setNewTaskFreq(e.target.value)} className={`text-xs font-black uppercase px-6 py-5 rounded-2xl outline-none border glass cursor-pointer transition-all text-right ${isGymMode ? 'text-purple-100 border-purple-800/40 bg-purple-950/40' : 'text-slate-400 border-white/5 bg-slate-800'}`}>
                                {Object.entries(d.freq).map(([k,v]) => <option key={k} value={k}>{String(v)}</option>)}
                              </select>
                              <button type="submit" className={`px-12 py-7 rounded-[3rem] font-black text-white active:scale-95 transition-all shadow-2xl uppercase tracking-widest text-base ${isGymMode ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'}`}>{String(d.addBtn)}</button>
                            </div>
                        </form>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {tasks.length === 0 ? (
                          <div className="py-56 text-center border-4 border-dashed border-slate-900/40 rounded-[6rem] animate-pulse opacity-20 group">
                            <ArchiveX size={120} className="mx-auto mb-10 text-slate-800" />
                            <p className="text-4xl font-black uppercase tracking-[0.5em] italic text-slate-700">Operations Pending..</p>
                          </div>
                        ) : tasks.map(task => (
                            <div key={task.id} className={`group flex items-center justify-between p-10 rounded-[4rem] border glass transition-all duration-700 ${task.completed ? 'opacity-30 grayscale scale-95 border-slate-900 shadow-none' : (isGymMode ? 'border-purple-900/20 shadow-2xl shadow-purple-950/20 hover:scale-[1.01] hover:border-purple-500/40' : 'hover:border-blue-500/30 hover:scale-[1.01] shadow-xl hover:shadow-blue-950/20')}`}>
                              <div className="flex items-center gap-12 flex-1 overflow-hidden text-right">
                                <button onClick={()=>toggleTask(task.id)} className={`w-18 h-18 rounded-[2.5rem] flex items-center justify-center transition-all shadow-lg active:scale-90 ${task.completed ? 'bg-emerald-500 text-white shadow-emerald-900/40' : 'glass border-2 border-slate-800 text-transparent hover:border-blue-500 shadow-inner'}`}><CheckCircle2 size={36}/></button>
                                <div className="flex items-center gap-10 overflow-hidden text-right">
                                  <span className="text-6xl flex-shrink-0 group-hover:rotate-12 transition-transform duration-700">{String(task.emoji || "✨")}</span>
                                  <div className="flex flex-col overflow-hidden text-right">
                                    <p className={`text-4xl md:text-5xl font-black tracking-tighter truncate leading-tight ${task.completed ? 'line-through text-slate-500 italic' : 'text-slate-100 italic'}`}>{String(task.text)}</p>
                                    <div className="flex items-center justify-end gap-6 mt-6">
                                        <span className={`text-[12px] font-black uppercase tracking-[0.4em] px-5 py-2 rounded-full border shadow-sm ${isGymMode ? 'bg-purple-500/5 border-purple-500/10 text-purple-900' : 'bg-slate-800/50 border-white/5 text-slate-600'}`}>{String(d.slots[task.slot] || "Grind")}</span>
                                        {task.frequency !== 'none' && <span className={`text-[12px] font-black uppercase italic bg-blue-500/10 text-blue-500 px-5 py-2 rounded-full border border-blue-500/20 shadow-sm`}>{String(d.freq[task.frequency])}</span>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button onClick={()=>deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-8 text-slate-700 hover:text-red-500 transition-all hover:bg-red-500/5 rounded-3xl active:scale-90"><Trash2 size={32}/></button>
                            </div>))}
                    </div>
                </div>
            </div>
        </main>

        {/* SIGNATURE FOOTER */}
        <footer className="mt-80 border-t border-white/5 pt-24 flex flex-col md:flex-row justify-between items-center gap-16 px-16 pb-40 opacity-40 hover:opacity-100 transition-all duration-1000 text-right">
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-black tracking-[1em] text-slate-500 uppercase italic">V50.0 SOVEREIGN MASTER BUILD</p>
              <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.5em]">ZUJ AI CORE • DISCIPLINE EQUALS FREEDOM</p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1.5 text-right leading-none group">
                <p className="text-[12px] font-black uppercase text-slate-600 mb-4 italic tracking-widest group-hover:text-blue-500 transition-colors">DESIGNED & OPTIMIZED BY</p>
                <div className="relative">
                  <p className={`text-6xl md:text-7xl font-black uppercase tracking-[0.2em] leading-none italic ${isGymMode ? 'text-purple-600 drop-shadow-[0_0_20px_purple]' : 'text-white'}`}>HUMAM TAIBEH 🦾</p>
                  <div className={`h-2 w-full mt-6 rounded-full transition-all duration-1000 ${isGymMode ? 'bg-purple-600 shadow-[0_0_20px_purple]' : 'bg-blue-500'}`}></div>
                </div>
            </div>
        </footer>
      </div>

      {/* AURA MODAL */}
      {showAuraInfo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 text-right">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setShowAuraInfo(false)}></div>
           <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 p-20 rounded-[6rem] text-center shadow-[0_0_150px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_20px_blue]"></div>
              <Gem size={100} className="mx-auto text-blue-400 mb-12 animate-pulse" />
              <h3 className="text-5xl font-black text-white mb-8 uppercase italic tracking-tighter">Aura Protocol</h3>
              <p className="text-slate-400 text-xl leading-relaxed mb-16 text-right font-bold italic">"{String(d.auraGuide)}"</p>
              <div className="bg-slate-800/50 p-12 rounded-[3.5rem] border border-white/5 mb-16 flex justify-between items-center text-right shadow-inner relative overflow-hidden">
                 <div className="text-right flex-1 relative z-10"><p className="text-[12px] font-black text-slate-500 uppercase mb-3 tracking-[0.3em]">{String(d.streak)}</p><p className="text-7xl font-black text-white leading-none">{streak}</p></div>
                 <Flame size={80} className={streak > 0 ? 'text-orange-500 ml-4 animate-pulse relative z-10' : 'text-slate-700 ml-4 relative z-10'} />
              </div>
              <button onClick={() => setShowAuraInfo(false)} className="w-full py-10 bg-blue-600 hover:bg-blue-500 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] active:scale-95 transition-all shadow-2xl shadow-blue-900/40 text-lg">LOCKED IN 🦾</button>
           </div>
        </div>
      )}

      {/* CORE SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 text-right">
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
              <div className={`relative w-full max-w-3xl border p-24 rounded-[7rem] shadow-[0_0_200px_rgba(0,0,0,0.9)] glass animate-in zoom-in-95 duration-500 ${isGymMode ? 'border-purple-500/20' : 'border-white/5'}`}>
                <button onClick={() => setShowSettings(false)} className="absolute top-16 right-16 p-8 rounded-full border bg-slate-800 text-slate-400 hover:bg-red-500 transition-all active:scale-90 shadow-2xl"><X size={40}/></button>
                <h2 className={`text-7xl font-black italic mb-24 flex items-center gap-6 ${isGymMode ? 'text-purple-50' : 'text-white'}`}><Settings className={isGymMode ? "animate-spin-slow text-purple-600" : "text-blue-500"} /> HUB CONFIG</h2>
                <div className="space-y-20 relative z-10 text-right">
                    <div className="space-y-8">
                        <label className="text-[14px] font-black uppercase tracking-[0.5em] text-slate-500 flex items-center justify-end gap-4 italic font-black">اسم المناداة <UserCircle size={20} /></label>
                        <input type="text" value={draftName} className={`w-full border rounded-[3.5rem] p-12 font-black text-white text-6xl text-center outline-none transition-all shadow-inner ${isGymMode ? 'bg-slate-950 border-purple-500/20 focus:ring-purple-600/10' : 'bg-slate-950 border-white/5 focus:ring-blue-600/10'}`} onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="pt-24 border-t border-white/5 space-y-8">
                        <button onClick={() => { saveProfile({ name: draftName }); setShowSettings(false); }} className={`w-full py-12 rounded-[4rem] font-black text-lg uppercase tracking-[0.6em] transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-6 ${isGymMode ? 'bg-purple-700 hover:bg-purple-600 shadow-purple-900/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30'}`}><Save size={40} /> {String(d.save)}</button>
                        <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white py-8 rounded-[4rem] font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl border border-white/5 active:scale-95"><LogOut size={24}/> {String(d.logout)}</button>
                    </div>
                </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes heat-rise { 0% { transform: translateY(0) scaleY(1); opacity: 0.3; } 50% { transform: translateY(-50px) scaleY(1.3); opacity: 0.7; } 100% { transform: translateY(-100px) scaleY(1.6); opacity: 0; } }
        .animate-heat-rise { animation: heat-rise 2.5s infinite linear; }
        .logo-glow { text-shadow: 0 0 35px rgba(59, 130, 246, 0.6); }
        .animate-spin-slow { animation: spin 25s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .glass { background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.08); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default App;
