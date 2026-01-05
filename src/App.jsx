import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection 
} from 'firebase/firestore';
import { 
  Droplets, CheckCircle2, Circle, Flame, Zap, Settings, 
  RotateCcw, Plus, Trash2, AlertCircle, Moon, Sun, Sunrise, Monitor,
  LayoutDashboard, Droplet, ListTodo, ShieldCheck
} from 'lucide-react';

// --- Sovereign Infrastructure ---
// We use a hybrid config to ensure it works both in Canvas and locally.
const localFirebaseConfig = {
  apiKey: "AIzaSyDRB_9laY7I6lG6ZpgphX5dzKiUdhwl40M",
  authDomain: "aura-sovereign.firebaseapp.com",
  projectId: "aura-sovereign",
  storageBucket: "aura-sovereign.firebasestorage.app",
  messagingSenderId: "912670363868",
  appId: "1:912670363868:web:a8200c36998d7520ce2419",
  measurementId: "G-C0FJ2VH891"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : localFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'aura-sovereign-v43';

// --- Visual Constants ---
const GLASS_BG = "bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]";

const TRANSLATIONS = {
  AR_URBAN: {
    welcome: "يا هلا يا وحش! جاهز للـ Glow Up؟",
    water_goal: "عداد المي (Hydration)",
    task_morning: "مهام الفجرية",
    task_day: "وقت الشغل والحرث",
    task_night: "مهام السهرة",
    aura: "سكور الهيبة",
    streak: "الالتزام",
    save: "تثبيت الهوية",
    undo: "تراجع",
    footer: "HUMAM TAIBEH",
    quotes: [
      "يا وحش الصلاة قبل كل شي، هي عمودك الفقري.",
      "الحديد ما بلين لحاله، قوم شدلي حالك بالجيم.",
      "معدل شرب المي عندك تعبان، اشرب يا كبير.",
      "تذكر ليش بلشت، الـ Glow Up بدو صبر."
    ]
  },
  AR_FORMAL: {
    welcome: "مرحباً بك في نظام GlowUp Omni المتطور.",
    water_goal: "معدل استهلاك المياه",
    task_morning: "الفترة الصباحية",
    task_day: "فترة النشاط",
    task_night: "الفترة المسائية",
    aura: "مؤشر الهيبة",
    streak: "سلسلة الالتزام",
    save: "حفظ الإعدادات",
    undo: "تراجع",
    footer: "HUMAM TAIBEH",
    quotes: [
      "الصلاة هي مفتاح النجاح في الدارين.",
      "الاستمرارية هي سر الجسد المثالي.",
      "حافظ على رطوبة جسدك لتعزيز تركيزك.",
      "الانضباط هو الجسر بين الأهداف والإنجاز."
    ]
  },
  EN_SLANG: {
    welcome: "Yo, ready for that glow up? Let's get it.",
    water_goal: "Water Intake",
    task_morning: "Sunrise Grind",
    task_day: "The Hustle",
    task_night: "Late Night Moves",
    aura: "Aura Score",
    streak: "Streak",
    save: "Lock in Identity",
    undo: "undo",
    footer: "HUMAM TAIBEH",
    quotes: [
      "Keep ur prayer on lock, it's the main pillar.",
      "No pain no gain fr, hit the gym.",
      "Ngl u need more water. Stay hydrated.",
      "Stay consistent, the results r coming."
    ]
  },
  EN_OFFICIAL: {
    welcome: "Welcome to GlowUp Omni Systems.",
    water_goal: "Daily Hydration",
    task_morning: "Morning Session",
    task_day: "Core Productivity",
    task_night: "Evening Recovery",
    aura: "Aura Score",
    streak: "Commitment Streak",
    save: "Initialize Identity",
    undo: "Undo",
    footer: "HUMAM TAIBEH",
    quotes: [
      "Prioritize your spiritual well-being.",
      "Discipline in fitness leads to excellence.",
      "Hydration is critical for optimal performance.",
      "Consistent progress defines long-term success."
    ]
  }
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [identityInit, setIdentityInit] = useState(false);
  const [lang, setLang] = useState('AR_URBAN');
  const [scaling, setScaling] = useState('Standard');
  const [userName, setUserName] = useState('');
  
  const [waterAmount, setWaterAmount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [aura, setAura] = useState(0);
  const [streak, setStreak] = useState(1);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.AR_URBAN;

  // --- Step 1: Authentication Protocol (MANDATORY RULE 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Sovereign Auth Error:", err);
      } finally {
        // Emergency Handshake: 2s for smoothness
        setTimeout(() => setBooting(false), 2000);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // --- Step 2: Data Retrieval (MANDATORY RULE 1 & 3) ---
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Path matches Rule 1 for user-specific data
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          setUserName(d.name || '');
          setLang(d.lang || 'AR_URBAN');
          setScaling(d.scaling || 'Standard');
          setWaterAmount(d.water || 0);
          setAura(d.aura || 0);
          setStreak(d.streak || 1);
          setTasks(d.tasks || []);
          setIdentityInit(true);
        }
      } catch (err) {
        console.error("Sovereign Data Load Error:", err);
      }
    };

    loadData();
  }, [user]);

  // --- Step 3: Data Synchronization ---
  const sync = async () => {
    if (!user || !identityInit) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      await setDoc(docRef, {
        name: userName, lang, scaling, water: waterAmount, aura, streak, tasks,
        lastSync: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Sync temporarily unavailable:", err.message);
    }
  };

  useEffect(() => {
    if (identityInit) {
      const timer = setTimeout(sync, 2000);
      return () => clearTimeout(timer);
    }
  }, [waterAmount, aura, tasks, lang, scaling, identityInit]);

  useEffect(() => {
    const interval = setInterval(() => setQuoteIndex(p => (p + 1) % t.quotes.length), 12000);
    return () => clearInterval(interval);
  }, [lang]);

  if (booting) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[999]">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-4 bg-red-600 rounded-full animate-pulse blur-sm opacity-50"></div>
        </div>
        <div className="text-red-600 font-black tracking-[0.3em] text-sm animate-pulse uppercase">Absolute System Booting</div>
        <div className="mt-2 text-white/20 text-[10px] font-mono uppercase tracking-widest">Aura-Sovereign Engine Initializing...</div>
      </div>
    );
  }

  if (!identityInit) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-['Tajawal']" dir={lang.startsWith('AR') ? 'rtl' : 'ltr'}>
        <div className={`${GLASS_BG} p-10 rounded-[2rem] w-full max-w-md relative overflow-hidden group`}>
          <div className="absolute inset-0 glass-noise pointer-events-none opacity-10"></div>
          <div className="relative z-10 space-y-8 text-center">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">IDENTITY SETUP</h1>
              <p className="text-white/40 mt-2 uppercase text-xs tracking-widest">Sovereign Protocol Initialization</p>
            </div>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Enter Your Name, Sovereign"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-red-600 focus:bg-white/10 transition-all text-center"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none appearance-none text-center cursor-pointer hover:bg-white/10 transition-all"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="AR_URBAN">Arabic - Urban (Jordanian)</option>
                <option value="AR_FORMAL">Arabic - Formal</option>
                <option value="EN_SLANG">English - Slang (U, R, FR)</option>
                <option value="EN_OFFICIAL">English - Official</option>
              </select>
              <button 
                onClick={() => setIdentityInit(true)}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getFontSize = () => scaling === 'Compact' ? 'text-sm' : scaling === 'Expanded' ? 'text-lg' : 'text-base';

  return (
    <div className={`min-h-screen bg-[#050505] text-white font-['Tajawal',sans-serif] selection:bg-red-600/30 ${getFontSize()}`} dir={lang.startsWith('AR') ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        .glass-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .water-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(180deg, rgba(239,68,68,0.3) 0%, rgba(220,38,38,0.6) 100%);
          transition: height 1s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .signature-text {
          text-shadow: 0 0 15px rgba(239,68,68,0);
          transition: all 0.1s ease;
        }
        .signature-text:active {
          text-shadow: 0 0 15px rgba(239,68,68,1);
          color: #ef4444;
        }
        @media (min-width: 1024px) { .signature-text:hover { text-shadow: 0 0 15px rgba(239,68,68,1); color: #ef4444; } }
        .pulse-red { animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 0% { border-color: rgba(239,68,68,0.2); } 50% { border-color: rgba(239,68,68,0.8); } 100% { border-color: rgba(239,68,68,0.2); } }
      `}</style>

      {/* Grid Layout: Centered & Sovereign */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-40">
        
        {/* Top Header Grid */}
        <header className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className={`${GLASS_BG} rounded-[2rem] p-8 flex items-center justify-between group overflow-hidden relative`}>
            <div className="absolute inset-0 glass-noise opacity-5 pointer-events-none"></div>
            <div>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] mb-1">{t.aura}</p>
              <h2 className="text-5xl font-black text-white group-hover:text-red-500 transition-colors">{aura}</h2>
            </div>
            <div className="bg-red-600/10 p-4 rounded-3xl border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
              <Zap className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className={`${GLASS_BG} rounded-[2rem] p-8 flex items-center justify-between group overflow-hidden relative`}>
            <div className="absolute inset-0 glass-noise opacity-5 pointer-events-none"></div>
            <div>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em] mb-1">{t.streak}</p>
              <h2 className="text-5xl font-black text-white group-hover:text-orange-500 transition-colors">{streak} <span className="text-xl">DAYS</span></h2>
            </div>
            <div className="bg-orange-600/10 p-4 rounded-3xl border border-orange-500/20 group-hover:scale-110 transition-transform duration-500">
              <Flame className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </header>

        {/* Motivation Banner */}
        <div className={`${GLASS_BG} rounded-2xl p-6 mb-10 border-l-[6px] border-l-red-600 overflow-hidden relative group`}>
          <div className="absolute inset-0 glass-noise opacity-5 pointer-events-none"></div>
          <div className="relative flex items-center gap-6">
            <div className="hidden md:block p-3 bg-red-600/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-xl font-bold italic text-white/90 leading-relaxed tracking-tight">"{t.quotes[quoteIndex]}"</p>
          </div>
        </div>

        {/* Content Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Water Sovereign Hub */}
          <div className="lg:col-span-4 space-y-8">
            <div className={`${GLASS_BG} rounded-[2.5rem] p-8 h-[550px] relative overflow-hidden flex flex-col justify-between group`}>
              <div className="absolute inset-0 glass-noise opacity-5 pointer-events-none"></div>
              <div className="water-wave" style={{ height: `${Math.min((waterAmount / 2000) * 100, 100)}%` }}></div>
              
              <div className="relative z-10 text-center">
                <h3 className="text-2xl font-black mb-1 uppercase tracking-tighter">{t.water_goal}</h3>
                <div className="flex items-center justify-center gap-2 text-white/40 font-mono text-xs">
                  <Droplet className="w-3 h-3" /> 2000ML DAILY PROTOCOL
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-4">
                  <Droplets className="w-24 h-24 text-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                  <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full animate-pulse"></div>
                </div>
                <div className="text-7xl font-black text-white tabular-nums leading-none tracking-tighter">{waterAmount}</div>
                <div className="text-red-500 font-bold uppercase tracking-widest text-sm mt-2">Milliliters</div>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-3">
                <button onClick={() => setWaterAmount(prev => prev + 250)} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl font-black transition-all hover:scale-[1.05]">+250</button>
                <button onClick={() => setWaterAmount(prev => prev + 500)} className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl font-black transition-all hover:scale-[1.05]">+500</button>
                <button onClick={() => setWaterAmount(prev => Math.max(0, prev - 250))} className="bg-white/5 hover:bg-red-600/20 border border-white/10 p-4 rounded-2xl flex items-center justify-center gap-2 group/undo transition-all">
                  <RotateCcw className="w-4 h-4 text-white/40 group-hover/undo:text-red-500 transition-colors" />
                </button>
                <button onClick={() => {
                  const val = prompt("Custom ml:");
                  if(val) setWaterAmount(prev => prev + parseInt(val));
                }} className="bg-red-600 hover:bg-red-500 p-4 rounded-2xl font-black transition-all">CUSTOM</button>
              </div>
            </div>

            {/* Quick System Config */}
            <div className={`${GLASS_BG} rounded-[2rem] p-6 space-y-4`}>
              <div className="flex items-center gap-3 text-white/40 uppercase text-[10px] font-bold tracking-[0.2em] mb-2">
                <Settings className="w-4 h-4" /> SYSTEM CONFIGURATION
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['Compact', 'Standard', 'Expanded'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setScaling(s)}
                    className={`text-[10px] font-bold p-3 rounded-xl transition-all ${scaling === s ? 'bg-red-600' : 'bg-white/5 border border-white/10'}`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none cursor-pointer"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="AR_URBAN">Jordanian Urban 🇯🇴</option>
                <option value="EN_SLANG">Street Slang 🇺🇸</option>
                <option value="AR_FORMAL">Formal Arabic 🇸🇦</option>
                <option value="EN_OFFICIAL">Official English 🇬🇧</option>
              </select>
            </div>
          </div>

          {/* Tasks Matrix Matrix */}
          <div className="lg:col-span-8 space-y-8">
            {[
              { id: 'Sunrise', icon: <Sunrise className="w-6 h-6 text-orange-500" />, title: t.task_morning },
              { id: 'Grind', icon: <Sun className="w-6 h-6 text-yellow-500" />, title: t.task_day },
              { id: 'Late', icon: <Moon className="w-6 h-6 text-purple-500" />, title: t.task_night }
            ].map(slot => (
              <div key={slot.id} className={`${GLASS_BG} rounded-[2.5rem] p-8 overflow-hidden relative`}>
                <div className="absolute inset-0 glass-noise opacity-5 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      {slot.icon}
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">{slot.title}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      const id = Date.now();
                      setTasks([...tasks, { id, text: '', slot: slot.id, status: 'Todo', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
                    }}
                    className="p-4 bg-red-600 hover:bg-red-500 rounded-2xl transition-all shadow-lg hover:shadow-red-600/20 active:scale-90"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {tasks.filter(tk => tk.slot === slot.id).map(task => (
                    <div 
                      key={task.id} 
                      className={`group/item flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        task.status === 'Done' ? 'bg-green-600/10 border-green-600/30 opacity-60' : 
                        task.status === 'Missed' ? 'pulse-red bg-red-600/10 border-red-600/40' :
                        'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <button 
                        onClick={() => {
                          setTasks(tasks.map(t => {
                            if (t.id === task.id) {
                              const next = t.status === 'Todo' ? 'Doing' : t.status === 'Doing' ? 'Done' : t.status === 'Done' ? 'Missed' : 'Todo';
                              if (next === 'Done') setAura(a => a + 10);
                              return { ...t, status: next };
                            }
                            return t;
                          }));
                        }}
                      >
                        {task.status === 'Todo' && <Circle className="w-7 h-7 text-white/20 hover:text-red-500 transition-colors" />}
                        {task.status === 'Doing' && <div className="w-7 h-7 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>}
                        {task.status === 'Done' && <CheckCircle2 className="w-7 h-7 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
                        {task.status === 'Missed' && <AlertCircle className="w-7 h-7 text-red-600 animate-pulse" />}
                      </button>

                      <input 
                        className="flex-1 bg-transparent border-none outline-none font-bold text-white placeholder:text-white/10"
                        value={task.text}
                        placeholder="Define next objective..."
                        onChange={(e) => setTasks(tasks.map(t => t.id === task.id ? {...t, text: e.target.value} : t))}
                      />

                      <span className="text-[10px] font-mono text-white/20">{task.time}</span>
                      
                      <button 
                        className="opacity-0 group-hover/item:opacity-100 p-2 hover:bg-red-600/20 rounded-lg transition-all"
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                      >
                        <Trash2 className="w-4 h-4 text-white/40 hover:text-red-500" />
                      </button>
                    </div>
                  ))}
                  {tasks.filter(tk => tk.slot === slot.id).length === 0 && (
                    <div className="text-center py-10 text-white/10 uppercase tracking-[0.5em] text-[10px]">No active protocols</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sovereign Signature Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pointer-events-none z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="flex flex-col">
              <span className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-black">CORE ENGINE</span>
              <span className="text-white/60 font-mono text-[10px]">V43.2 (OMNI_PRO)</span>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex items-center gap-2 text-red-600/80 animate-pulse">
              <Monitor className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Sync Active</span>
            </div>
          </div>

          <div className="text-center md:text-right group cursor-pointer">
            <span className="text-white/20 text-[9px] uppercase tracking-[0.4em] block mb-1 font-bold group-hover:text-red-500/40 transition-colors">ARCHITECTED BY</span>
            <span className="text-white font-black text-2xl tracking-tight signature-text select-none uppercase">
              {t.footer}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
