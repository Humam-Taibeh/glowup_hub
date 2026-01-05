import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, 
  signInWithPopup, signOut, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, sendPasswordResetEmail 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, updateDoc, deleteDoc, addDoc 
} from 'firebase/firestore';
import { 
  CheckCircle2, Circle, Plus, Trash2, Sparkles, Loader2, Dumbbell, Flame, Play, Pause, RotateCcw, 
  Quote, Target, Settings, ChevronRight, UserCircle, X, Moon, Heart, Brain, Coffee, Swords, Rocket, 
  Gem, Filter, RefreshCw, Save, ArchiveX, History, Edit2, LogOut, Mail, Lock, KeyRound, ArrowRightCircle, ShieldCheck
} from 'lucide-react';

// --- همام: استبدل البيانات تحت ببيانات الـ Config الحقيقية من Firebase Console ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "glowup_nexus_v45_final";

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
  const [authMode, setAuthMode] = useState('login'); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempName, setTempName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isGymMode, setIsGymMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [currentQuote, setCurrentQuote] = useState("الالتزام هو اللي بيصنع الفرق.. 🔥");

  // Timer Engine
  const [timerActive, setTimerActive] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); 
  const [isCustomTime, setIsCustomTime] = useState(false);
  const timerRef = useRef(null);

  // Scaling Logic
  const scalingStyles = useMemo(() => {
    const scales = { small: 0.75, medium: 1, large: 1.4 };
    return { zoom: scales[config.fontSize] || 1 };
  }, [config.fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const scales = { small: '0.7', medium: '1', large: '1.4' };
    root.style.setProperty('--global-zoom', scales[config.fontSize] || '1');
    root.style.setProperty('--icon-scale', scales[config.iconSize] || '1');
  }, [config]);

  // --- 2. Multi-Language Dictionary ---
  const dictionary = useMemo(() => ({
    ar: {
      welcome: "يا هلا.. عرفني عن اسمك؟",
      googleBtn: "Cloud Sync (Google) ☁️",
      emailBtn: "دخول",
      registerBtn: "عضوية جديدة",
      resetBtn: "نسيت كلمة السر؟",
      startBtn: "دخول سريع (بدون حساب) ⚡",
      errorName: "نَسيت الاسم يا بطل! ⚠️",
      unauthDomain: "تسجيل قوقل غير متاح حالياً. استخدم الإيميل! ⚠️",
      efficiency: "الإنجاز",
      aura: "الآورا",
      beast: "Beast Mode",
      power: "Power Mode",
      focus: "Focus Mode",
      howLong: "كم دقيقة يا وحش؟ ⏱️",
      customTimerMsg: "اختيار بطل! {mins} دقيقة كافية لتهد الجبال. يلا Lock In! 🔥",
      addTaskPlaceholder: "شو هدفنا اليوم يا {name}؟",
      addBtn: "إضافة",
      identity: "ايش بنحب نناديك؟",
      font: "حجم الموقع",
      icons: "حجم الأيقونة",
      language: "اللغة",
      save: "حفظ التغييرات",
      logout: "تسجيل خروج",
      heroSub: "نظام تنظيم الوقت والارتقاء الشخصي",
      empty: "القائمة فاضية.. ابدأ هسا!",
      statuses: { todo: "جاهزة", doing: "جاري العمل", done: "تمت" },
      slots: { all: "الكل", morning: "الصبح", day: "نهاراً", night: "بليل" },
      freq: { none: "مرة واحدة", daily: "يومياً", weekly: "أسبوعياً", monthly: "شهرياً" }
    },
    en_slang: {
      welcome: "Yo! Who's pullin' up?",
      googleBtn: "Cloud Sync (Google) ☁️",
      emailBtn: "Sign In",
      registerBtn: "Join squad",
      resetBtn: "Forgot pass?",
      startBtn: "Ghost Entry ⚡",
      errorName: "Forgot ID, King! ⚠️",
      unauthDomain: "Google restricted. Use Email! ⚠️",
      efficiency: "Grind",
      aura: "Aura",
      beast: "Beast Mode",
      power: "Alpha Mode",
      focus: "Focus Hub",
      howLong: "Mins? ⏱️",
      customTimerMsg: "Bet! {mins} mins is plenty. Lock in! 🔥",
      addTaskPlaceholder: "Grind today, {name}?",
      addBtn: "Deploy",
      identity: "Ur ID Tag?",
      font: "Scale",
      icons: "Icons",
      language: "Vibe",
      save: "Apply",
      logout: "Sign Out",
      heroSub: "Personal Growth Engine",
      empty: "Siege Line Empty..",
      statuses: { todo: "Todo", doing: "Lockin'", done: "W" },
      slots: { all: "All", morning: "Sunrise", day: "Grind", night: "After Hours" },
      freq: { none: "One-off", daily: "Daily", weekly: "Weekly", monthly: "Monthly" }
    },
    en_normal: {
      welcome: "Welcome. Please enter your name.",
      googleBtn: "Sign in with Google ☁️",
      emailBtn: "Login",
      registerBtn: "Register",
      resetBtn: "Reset Pass",
      startBtn: "Quick Start ⚡",
      errorName: "Name required! ⚠️",
      unauthDomain: "Google error. Use Email! ⚠️",
      efficiency: "Productivity",
      aura: "Aura Pts",
      beast: "Beast Mode",
      power: "Power Mode",
      focus: "Focus Hub",
      howLong: "Duration? ⏱️",
      customTimerMsg: "Great! {mins} mins is enough. Lock in! 🔥",
      addTaskPlaceholder: "Goals for today, {name}?",
      addBtn: "Add",
      identity: "Name",
      font: "Font Size",
      icons: "Icon Size",
      language: "Language",
      save: "Save",
      logout: "Logout",
      heroSub: "Optimization System",
      empty: "Task list is empty..",
      statuses: { todo: "Todo", doing: "Active", done: "Done" },
      slots: { all: "All", morning: "Morning", day: "Day", night: "Night" },
      freq: { none: "Once", daily: "Daily", weekly: "Weekly", monthly: "Monthly" }
    }
  }), []);

  const t = useMemo(() => dictionary[lang] || dictionary.ar, [lang, dictionary]);

  // --- 3. Firebase Listeners ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { setUserName(""); setIsAuthLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const unsubProfile = onSnapshot(profileDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const n = String(data.name || "");
        setUserName(n);
        setDraftName(n);
        setAura(data.aura || 0);
        setStreak(data.streak || 0);
        setLang(data.lang || "ar");
        setDraftLang(data.lang || "ar");
        setConfig(data.config || { fontSize: 'medium', iconSize: 'medium' });
        setDraftConfig(data.config || { fontSize: 'medium', iconSize: 'medium' });
      } else {
        setUserName(""); // Shows name entry screen
      }
      setIsAuthLoading(false);
    });
    const unsubTasks = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(list.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)));
    });
    return () => { unsubProfile(); unsubTasks(); };
  }, [user]);

  // --- 4. Logic Handlers ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) { setLoginError("خطأ في البيانات.. تأكد وحاول ثانية ⚠️"); }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } 
    catch (error) { setLoginError("Google restricted here. Use Email! ⚠️"); }
  };

  const handleLogout = async () => { await signOut(auth); window.location.reload(); };

  const saveProfile = async (updates) => {
    if (!user) return;
    const profileDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    await setDoc(profileDoc, { ...updates }, { merge: true });
    if(updates.name) setUserName(updates.name);
  };

  const handleAddTask = async (txt) => {
    if (!txt || !user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), {
      text: txt, completed: false, status: 'todo', emoji: "✨",
      slot: 'day', frequency: 'none', dateAdded: new Date().toISOString()
    });
  };

  const toggleStatus = async (id) => {
    const task = tasks.find(t => t.id === id);
    const sequence = ['todo', 'doing', 'done'];
    const nextStatus = sequence[(sequence.indexOf(task.status) + 1) % 3];
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { 
      status: nextStatus, completed: nextStatus === 'done' 
    });
    if (nextStatus === 'done') saveProfile({ aura: aura + 10 });
  };

  const deleteTask = async (id) => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id)); };

  const updateTimer = (m) => { setTimerActive(false); setTimeLeft(m * 60); setSelectedDuration(m); setIsCustomTime(false); };

  // Timer Tick
  useEffect(() => {
    if (timerActive && timeLeft > 0) timerRef.current = setInterval(() => setTimeLeft(p => p - 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- 5. Main Render ---
  if (isAuthLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 size={64} className="text-blue-500 animate-spin" /></div>;

  if (!user || !userName) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative font-sans overflow-hidden text-right">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/5 blur-[180px] rounded-full"></div>
        <div className="max-w-xl w-full relative z-10 animate-in zoom-in-95">
          <div className="glass p-16 rounded-[4rem] text-center shadow-2xl relative border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>
            <Rocket size={48} className="text-blue-500 mx-auto mb-10 animate-bounce" />
            <h1 className="text-7xl font-black mb-4 italic text-white logo-glow uppercase leading-none">GLOWUP</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-10">{String(t.heroSub)}</p>
            <div className="space-y-8">
              {user && !userName ? (
                <div className="space-y-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">{String(t.welcome)}</p>
                  <input type="text" placeholder="..." className="w-full bg-slate-950/50 border border-white/5 rounded-3xl p-8 text-center font-black text-4xl text-white outline-none focus:ring-4 ring-blue-500/10 shadow-inner" onChange={(e)=>setTempName(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && tempName.trim() && saveProfile({name:tempName, aura:0, streak:0})} />
                  <button onClick={()=>tempName.trim() ? saveProfile({name: tempName, aura: 0, streak: 0}) : setLoginError("الاسم مطلوب! ⚠️")} className="w-full bg-blue-600 py-6 rounded-[2.5rem] font-black text-white uppercase tracking-widest active:scale-95 transition-all">ابدأ الآن 🚀</button>
                </div>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Mail className="text-slate-600" size={20} /><input type="email" placeholder="Email" className="bg-transparent flex-1 outline-none font-bold text-white text-lg" onChange={(e)=>setEmail(e.target.value)} required /></div>
                  <div className="bg-slate-950/50 p-5 rounded-3xl flex items-center gap-4 border border-white/5 shadow-inner"><Lock className="text-slate-600" size={20} /><input type="password" placeholder="Password" className="bg-transparent flex-1 outline-none font-bold text-white text-lg" onChange={(e)=>setPassword(e.target.value)} required /></div>
                  <button type="submit" className="w-full bg-blue-600 py-6 rounded-[2rem] font-black text-white active:scale-95 transition-all uppercase tracking-widest shadow-xl shadow-blue-900/20">{authMode === 'login' ? 'Sign In' : 'Join Now'}</button>
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                    <button type="button" onClick={()=>setAuthMode(authMode==='login'?'register':'login')}>{authMode==='login'?'Create Account':'Back to Login'}</button>
                    <button type="button" onClick={()=>signInAnonymously(auth)}>Guest Mode ⚡</button>
                  </div>
                  <div className="relative py-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div><div className="relative flex justify-center text-[10px] font-black uppercase bg-[#0f172a] px-4">OR</div></div>
                  <button type="button" onClick={handleGoogleSignIn} className="bg-white text-slate-900 p-5 rounded-3xl font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 w-full"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" /> GOOGLE</button>
                </form>
              )}
              {loginError && <p className="text-red-500 text-xs font-black animate-pulse">{loginError}</p>}
              <div className="flex items-center justify-center gap-3 opacity-30 mt-8"><ShieldCheck size={14}/><p className="text-[8px] font-bold uppercase tracking-widest">Cloud Shield Active • V45.0</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-1000 p-6 md:p-8 pb-48 font-sans ${isGymMode ? 'bg-[#0f0105]' : 'bg-[#020617]'}`}>
      {isGymMode && <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-30"><div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-red-600/40 to-transparent animate-heat-rise"></div></div>}
      
      <div className="w-full max-w-full mx-auto main-wrapper" style={{ zoom: scalingStyles.zoom }}>
        <header className="flex flex-col gap-10 mb-16 border-b border-white/5 pb-12 animate-in slide-in-from-top-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 text-right">
            <h1 className={`text-5xl md:text-8xl font-black tracking-tighter italic ${isGymMode ? 'text-red-600' : 'text-white'}`}>هلا <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent uppercase">{userName}</span></h1>
            <div className="flex gap-4">
              <div className={`p-8 rounded-[2.5rem] border glass flex items-center gap-8 min-w-[280px] shadow-2xl ${isGymMode ? 'border-red-500/30' : 'border-white/5'}`}>
                 <div className="flex-1 text-right leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-1">AURA</p><p className={`text-5xl font-black ${isGymMode ? 'text-red-500' : 'text-blue-400'}`}><Gem className="inline mr-2" size={28} /> {aura}</p></div>
                 <div className="w-[1px] h-12 bg-white/10"></div>
                 <div className="text-center leading-none"><p className="text-[10px] text-slate-500 uppercase font-black mb-1">STREAK</p><p className="text-5xl font-black text-orange-500">{streak} <Flame className="inline animate-pulse" size={32}/></p></div>
              </div>
              <button onClick={()=>setIsGymMode(!isGymMode)} className={`p-10 rounded-[2.5rem] border transition-all flex flex-col items-center justify-center min-w-[160px] active:scale-95 ${isGymMode ? 'bg-red-600 border-red-400 text-white shadow-red-600/30' : 'glass text-slate-500 shadow-blue-900/10'}`}>{isGymMode ? <Swords size={40}/> : <Dumbbell size={40}/>}<p className="text-[10px] font-black uppercase mt-2">BEAST</p></button>
              <button onClick={()=>{setShowSettings(true); setDraftName(userName);}} className="p-10 rounded-[2.5rem] glass border border-white/5 text-slate-500 hover:text-blue-400 transition-all active:scale-90"><Settings size={48} /></button>
            </div>
          </div>
          <div className={`w-full flex items-center justify-between px-10 py-5 rounded-[3rem] border glass ${isGymMode ? 'border-red-500/30' : ''}`}>
              <Quote className={isGymMode ? 'text-red-500 animate-pulse' : 'text-blue-500'} size={28} />
              <p className="text-xl md:text-2xl font-black italic tracking-tight truncate">"{currentQuote}"</p>
              <button onClick={()=>{}} className="p-4 rounded-2xl border border-white/5 hover:rotate-180 transition-transform duration-500"><RefreshCw size={24}/></button>
          </div>
        </header>

        {/* FOCUS HUB */}
        <section className={`p-8 rounded-[4rem] border glass shadow-2xl flex items-center justify-between gap-12 w-full mb-12 ${isGymMode ? 'border-red-500/30 shadow-red-950/20' : ''}`}>
            <div className="flex flex-col gap-4 min-w-[120px]">
                <button onClick={()=>setTimerActive(!timerActive)} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all active:scale-90 ${timerActive ? 'bg-red-500/20 text-red-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/40'}`}>{timerActive ? <Pause size={32}/> : <Play size={32}/>}</button>
                <button onClick={()=>{setTimerActive(false); setTimeLeft(selectedDuration*60);}} className="w-16 h-16 rounded-3xl glass border border-white/5 text-slate-500"><RotateCcw size={28}/></button>
            </div>
            <div className="relative flex flex-col items-center justify-center flex-1">
                <svg className="w-56 h-56 transform -rotate-90"><circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-900/50" /><circle cx="112" cy="112" r="85" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="534" strokeDashoffset={534 - (534 * (timeLeft / (selectedDuration * 60)))} strokeLinecap="round" className={`transition-all duration-1000 ${isGymMode ? 'text-red-600 drop-shadow-[0_0_15px_red]' : 'text-blue-500'}`} /></svg>
                <div className="absolute flex flex-col items-center">
                  <p className="text-5xl font-black text-white">{formatTime(timeLeft)}</p>
                  {isCustomTime && <p className="text-[10px] font-black text-slate-500 uppercase mt-2">{String(t.customTimerMsg).replace('{mins}', selectedDuration)}</p>}
                </div>
                {isCustomTime && <input type="number" autoFocus className="mt-4 w-32 glass border border-white/5 rounded-2xl p-3 text-center text-white font-black" onChange={(e)=>{const v=parseInt(e.target.value); if(v>0) {setSelectedDuration(v); setTimeLeft(v*60);}}} />}
            </div>
            <div className="flex flex-col gap-3 min-w-[120px] items-end">
                {[15, 25, 45].map(m => (<button key={m} onClick={()=>updateTimer(m)} className={`h-12 w-16 rounded-2xl text-xs font-black uppercase transition-all ${selectedDuration===m && !isCustomTime ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'glass text-slate-500 shadow-sm'}`}>{m}m</button>))}
                <button onClick={()=>setIsCustomTime(!isCustomTime)} className={`h-12 w-16 rounded-2xl glass transition-all ${isCustomTime ? 'bg-indigo-600 text-white' : 'text-slate-500 shadow-sm'}`}><Settings2 size={20}/></button>
            </div>
        </section>

        {/* TASK HUB */}
        <div className="space-y-12">
            <div className={`glass p-4 rounded-[4rem] border transition-all ${isGymMode ? 'border-red-600/30 focus-within:ring-4 ring-red-600/10' : 'border-white/5 focus-within:ring-4 ring-blue-600/10'}`}>
                <form onSubmit={(e)=>{e.preventDefault(); handleAddTask(e.target.task.value); e.target.reset();}} className="flex gap-4 items-center">
                    <div className={`flex-1 flex items-center px-10 rounded-[2.5rem] border glass ${isGymMode ? 'border-red-900/30' : 'border-slate-800'}`}>
                        <Plus size={32} className={isGymMode ? 'text-red-700 mr-6' : 'text-slate-600 mr-6'} /><input name="task" placeholder={String(t.addTaskPlaceholder).replace('{name}', userName)} className="w-full bg-transparent py-10 text-3xl font-black outline-none text-white placeholder:text-slate-800" />
                    </div>
                    <button type="submit" className={`px-10 py-5 rounded-[2rem] font-black text-white active:scale-95 transition-all shadow-xl ${isGymMode ? 'bg-red-600' : 'bg-blue-600'}`}>إضافة</button>
                </form>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {tasks.length === 0 ? <div className="py-40 text-center border-4 border-dashed border-slate-900/40 rounded-[5rem] animate-pulse opacity-20"><ArchiveX size={64} className="mx-auto mb-6"/><p className="text-2xl font-black uppercase tracking-widest italic">Operations Pending..</p></div> : 
                  tasks.map(task => (
                    <div key={task.id} className={`group flex items-center justify-between p-6 rounded-[3rem] border glass transition-all duration-700 ${task.completed ? 'opacity-30 grayscale scale-95 border-slate-900' : 'hover:border-blue-500/30 hover:scale-[1.01]'}`}>
                      <div className="flex items-center gap-10 flex-1 overflow-hidden">
                        <button onClick={()=>toggleStatus(task.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 text-white shadow-emerald-900/40' : 'glass border-2 border-slate-800 text-transparent hover:border-blue-500 shadow-inner'}`}><CheckCircle size={24}/></button>
                        <div className="flex flex-col"><p className={`text-2xl font-black tracking-tighter truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>{task.text}</p></div>
                      </div>
                      <button onClick={()=>deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-4 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={24}/></button>
                    </div>))}
            </div>
        </div>

        <footer className="mt-48 border-t border-white/5 pt-16 flex justify-between items-center opacity-40 hover:opacity-100 transition-all text-right">
            <p className="text-xs font-black uppercase tracking-widest italic">V45.0 Master Build</p>
            <div className="text-right leading-none"><p className="text-[10px] font-black uppercase text-slate-600 mb-2 text-right">Powered by</p><p className={`text-2xl font-black uppercase tracking-widest text-white italic`}>Humam Taibeh 🦾</p></div>
        </footer>
      </div>

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-right">
              <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setShowSettings(false)}></div>
              <div className={`relative w-full max-w-2xl border p-16 rounded-[6rem] shadow-2xl glass animate-in zoom-in-95`}>
                <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 p-6 rounded-full border shadow-xl bg-slate-800 text-slate-400 hover:bg-red-500 transition-all shadow-lg"><X size={32}/></button>
                <h2 className="text-5xl font-black italic mb-16 flex items-center gap-6 text-white"><Settings className="text-blue-500" /> Hub Settings</h2>
                <div className="space-y-14 relative z-10">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">اسم المناداة</label>
                        <input type="text" value={draftName} className="w-full border rounded-[3rem] p-8 font-black text-white text-4xl text-center outline-none bg-slate-950/50 shadow-inner" onChange={(e) => setDraftName(e.target.value)} />
                    </div>
                    <div className="space-y-6 text-center">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 italic mb-2 block text-right">اللغة</label>
                        <div className="grid grid-cols-3 gap-4">
                            {[{id:'ar', n:'العربية'}, {id:'en_slang', n:'Slang EN'}, {id:'en_normal', n:'Standard EN'}].map(l => (
                                <button key={l.id} onClick={() => setDraftLang(l.id)} className={`py-6 rounded-3xl text-xs font-black uppercase transition-all ${draftLang === l.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20' : 'bg-slate-800 text-slate-500 shadow-sm'}`}>{l.n}</button>
                            ))}
                        </div>
                    </div>
                    <div className="pt-16 border-t border-white/5 space-y-6">
                        <button onClick={() => { saveProfile({ name: draftName, lang: draftLang, config: draftConfig }); setShowSettings(false); }} className="w-full py-8 rounded-[3rem] font-black text-sm uppercase bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl transition-all active:scale-95"><Save size={28} className="inline mr-2" /> حفظ التغييرات</button>
                        <button onClick={()=>signOut(auth).then(()=>window.location.reload())} className="w-full bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white py-5 rounded-[3rem] font-black text-xs flex items-center justify-center gap-3 transition-all"><LogOut size={18}/> تسجيل خروج</button>
                    </div>
                </div>
              </div>
          </div>
      )}

      <style>{`
        @keyframes heat-rise { 0% { transform: translateY(0) scaleY(1); opacity: 0.3; } 50% { transform: translateY(-30px) scaleY(1.15); opacity: 0.6; } 100% { transform: translateY(-60px) scaleY(1.3); opacity: 0; } }
        .animate-heat-rise { animation: heat-rise 2.5s infinite linear; }
      `}</style>
    </div>
  );
};

export default App;
