import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection,
  updateDoc
} from 'firebase/firestore';
import { 
  Droplets, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Zap, 
  Settings, 
  Clock, 
  Calendar,
  RotateCcw,
  Plus,
  Trash2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Sunrise,
  User,
  Monitor
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDRB_9laY7I6lG6ZpgphX5dzKiUdhwl40M",
  authDomain: "glowup-omni-v2.firebaseapp.com",
  projectId: "glowup-omni-v2",
  storageBucket: "glowup-omni-v2.appspot.com",
  messagingSenderId: "9876543210",
  appId: "1:9876543210:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'glowup_omni_v2';

// --- UI Styling Helpers ---
const GLASS_BG = "bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl";
const RED_GLOW = "shadow-[0_0_15px_rgba(239,68,68,0.5)]";

// --- Multi-Language Matrix ---
const TRANSLATIONS = {
  AR_URBAN: {
    welcome: "يا هلا يا وحش! جاهز للـ Glow Up؟",
    water_goal: "قديه شربت مي اليوم؟ شد حيلك",
    task_morning: "مهام الفجرية (Sunrise)",
    task_day: "وقت الشغل والحرث (Grind)",
    task_night: "مهام السهرة (Late)",
    aura_score: "سكور الهيبة (Aura)",
    streak_label: "الالتزام (Streak)",
    save_btn: "تثبيت الهوية",
    water_unit: "مل",
    undo: "تراجع",
    custom: "إضافة يدوي",
    footer_text: "HUMAM TAIBEH",
    quotes: [
      "يا وحش الصلاة قبل كل شي، هي عمودك الفقري.",
      "الحديد ما بلين لحاله، قوم شدلي حالك بالجيم.",
      "معدل شرب المي عندك تعبان، اشرب يا كبير.",
      "تذكر ليش بلشت، الـ Glow Up بدو صبر."
    ]
  },
  AR_FORMAL: {
    welcome: "مرحباً بك في نظام GlowUp Omni المتطور.",
    water_goal: "معدل استهلاك المياه اليومي",
    task_morning: "الفترة الصباحية",
    task_day: "فترة العمل والنشاط",
    task_night: "الفترة المسائية",
    aura_score: "مؤشر الهيبة",
    streak_label: "سلسلة الالتزام",
    save_btn: "حفظ الإعدادات",
    water_unit: "مل",
    undo: "تراجع",
    custom: "كمية مخصصة",
    footer_text: "HUMAM TAIBEH",
    quotes: [
      "الصلاة هي مفتاح النجاح في الدارين.",
      "الاستمرارية في التمارين هي سر الجسد المثالي.",
      "حافظ على رطوبة جسدك لتعزيز تركيزك الذهني.",
      "الانضباط هو الجسر بين الأهداف والإنجاز."
    ]
  },
  EN_SLANG: {
    welcome: "Yo, ready for that glow up? Let's get it.",
    water_goal: "U hydrated? Check ur water intake.",
    task_morning: "Sunrise Grind",
    task_day: "The Hustle (Grind)",
    task_night: "Late Night Moves",
    aura_score: "Aura Score",
    streak_label: "Streak",
    save_btn: "Lock in Identity",
    water_unit: "ml",
    undo: "undo",
    custom: "custom",
    footer_text: "HUMAM TAIBEH",
    quotes: [
      "Keep ur prayer on lock, it's the main pillar.",
      "No pain no gain fr, hit the gym.",
      "Ngl u need more water. Stay hydrated.",
      "Stay consistent, the results r coming."
    ]
  },
  EN_OFFICIAL: {
    welcome: "Welcome to GlowUp Omni Systems.",
    water_goal: "Daily Hydration Progress",
    task_morning: "Morning Sessions",
    task_day: "Work & Productivity",
    task_night: "Night & Recovery",
    aura_score: "Aura Score",
    streak_label: "Commitment Streak",
    save_btn: "Initialize Identity",
    water_unit: "ml",
    undo: "Undo",
    custom: "Custom Amount",
    footer_text: "HUMAM TAIBEH",
    quotes: [
      "Prioritize your spiritual well-being.",
      "Discipline in fitness leads to excellence.",
      "Hydration is critical for optimal performance.",
      "Consistent progress defines long-term success."
    ]
  }
};

export default function App() {
  // --- State Management ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identityInit, setIdentityInit] = useState(false);
  const [lang, setLang] = useState('AR_URBAN');
  const [scaling, setScaling] = useState('Standard');
  const [userName, setUserName] = useState('');
  
  const [waterAmount, setWaterAmount] = useState(0);
  const [waterHistory, setWaterHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [aura, setAura] = useState(0);
  const [streak, setStreak] = useState(1);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.AR_URBAN;

  // --- Initialization & Firebase ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        const timeout = setTimeout(() => setLoading(false), 5000); // Emergency Handshake
        await signInAnonymously(auth);
        clearTimeout(timeout);
      } catch (err) {
        console.error("Auth Error:", err);
        setLoading(false);
      }
    };
    initAuth();
    
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchUserData(u.uid);
    });
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(db, 'artifacts', APP_ID, 'users', uid, 'profile', 'data');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserName(data.name || '');
        setLang(data.lang || 'AR_URBAN');
        setScaling(data.scaling || 'Standard');
        setWaterAmount(data.water || 0);
        setAura(data.aura || 0);
        setStreak(data.streak || 1);
        setTasks(data.tasks || []);
        setIdentityInit(true);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const saveData = async () => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'profile', 'data');
    await setDoc(docRef, {
      name: userName,
      lang: lang,
      scaling: scaling,
      water: waterAmount,
      aura: aura,
      streak: streak,
      tasks: tasks,
      lastUpdated: new Date().toISOString()
    });
  };

  // --- Motivation Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % t.quotes.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [lang]);

  // --- Water Logic ---
  const addWater = (amount) => {
    setWaterHistory([...waterHistory, waterAmount]);
    setWaterAmount(prev => Math.min(prev + amount, 4000));
  };

  const undoWater = () => {
    if (waterHistory.length > 0) {
      const prev = waterHistory.pop();
      setWaterAmount(prev);
      setWaterHistory([...waterHistory]);
    }
  };

  // --- Task Logic ---
  const addTask = (slot) => {
    const newTask = {
      id: Date.now(),
      text: '',
      slot: slot,
      status: 'Todo',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setTasks([...tasks, newTask]);
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        let nextStatus;
        if (task.status === 'Todo') {
          nextStatus = 'Doing';
        } else if (task.status === 'Doing') {
          nextStatus = 'Done';
          setAura(prev => prev + 10);
        } else if (task.status === 'Done') {
          nextStatus = 'Missed';
          setAura(prev => Math.max(0, prev - 5));
        } else {
          nextStatus = 'Todo';
        }
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  const updateTaskText = (id, text) => {
    setTasks(tasks.map(t => t.id === id ? {...t, text} : t));
  };

  // --- Auto Save ---
  useEffect(() => {
    if (identityInit) {
      const timer = setTimeout(() => saveData(), 2000);
      return () => clearTimeout(timer);
    }
  }, [waterAmount, aura, tasks, lang, scaling]);

  // --- Boot Sequence (Loading) ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-red-500 font-bold tracking-widest animate-pulse">SYSTEM BOOTING...</p>
      </div>
    );
  }

  // --- Identity Initialization (Onboarding) ---
  if (!identityInit) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" dir={lang.startsWith('AR') ? 'rtl' : 'ltr'}>
        <div className={`${GLASS_BG} p-10 rounded-3xl w-full max-w-md space-y-8`}>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">Identity Setup</h1>
            <p className="text-white/60">Initialize your Omni-core</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="What's your name, champ?" 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-red-500 transition-colors"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="AR_URBAN">Arabic - Urban (Jordanian)</option>
              <option value="AR_FORMAL">Arabic - Formal</option>
              <option value="EN_SLANG">English - Slang</option>
              <option value="EN_OFFICIAL">English - Official</option>
            </select>
            <button 
              onClick={() => setIdentityInit(true)}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold p-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.save_btn}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getFontSize = () => {
    if (scaling === 'Compact') return 'text-sm';
    if (scaling === 'Expanded') return 'text-lg';
    return 'text-base';
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-white font-['Tajawal',sans-serif] ${getFontSize()}`} dir={lang.startsWith('AR') ? 'rtl' : 'ltr'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        .water-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(180deg, rgba(59,130,246,0.6) 0%, rgba(37,99,235,0.8) 100%);
          transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3ExternalIcon %3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
        }
        .footer-glow:hover {
          text-shadow: 0 0 10px #ef4444;
          transition: all 0.1s ease;
        }
      `}</style>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 pb-32">
        
        {/* Header: Aura & Streak */}
        <header className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${GLASS_BG} p-6 rounded-3xl flex items-center justify-between overflow-hidden relative group`}>
            <div className="absolute inset-0 glass-noise"></div>
            <div className="relative z-10">
              <p className="text-white/60 text-sm font-bold uppercase tracking-wider">{t.aura_score}</p>
              <h2 className="text-4xl font-black text-red-500 drop-shadow-lg">{aura}</h2>
            </div>
            <Zap className="w-12 h-12 text-red-500 animate-pulse relative z-10" />
          </div>

          <div className={`${GLASS_BG} p-6 rounded-3xl flex items-center justify-between overflow-hidden relative`}>
            <div className="absolute inset-0 glass-noise"></div>
            <div className="relative z-10">
              <p className="text-white/60 text-sm font-bold uppercase tracking-wider">{t.streak_label}</p>
              <h2 className="text-4xl font-black text-orange-500 drop-shadow-lg">{streak} Days</h2>
            </div>
            <Flame className="w-12 h-12 text-orange-500 animate-bounce relative z-10" />
          </div>
        </header>

        {/* AI Quote Banner */}
        <section className={`${GLASS_BG} p-4 rounded-2xl mb-8 text-center border-l-4 border-l-red-500 animate-in fade-in slide-in-from-top duration-700`}>
          <p className="italic font-bold text-white/90">"{t.quotes[quoteIndex]}"</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Water Hub */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${GLASS_BG} rounded-3xl p-6 h-[450px] relative overflow-hidden flex flex-col items-center justify-between`}>
              <div className="absolute inset-0 glass-noise"></div>
              <div className="water-wave" style={{ height: `${(waterAmount / 2000) * 100}%` }}></div>
              
              <div className="relative z-10 text-center w-full">
                <h3 className="text-xl font-bold mb-1">{t.water_goal}</h3>
                <p className="text-white/50 text-xs">Target: 2000ml+</p>
              </div>

              <div className="relative z-10 flex flex-col items-center">
                <Droplets className="w-16 h-16 text-blue-400 mb-2 drop-shadow-lg" />
                <span className="text-5xl font-black">{waterAmount}</span>
                <span className="text-xl text-blue-300">{t.water_unit}</span>
              </div>

              <div className="relative z-10 grid grid-cols-2 gap-2 w-full">
                <button onClick={() => addWater(100)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-xs font-bold border border-white/10 transition-all">+100</button>
                <button onClick={() => addWater(250)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-xs font-bold border border-white/10 transition-all">+250</button>
                <button onClick={() => addWater(600)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-xs font-bold border border-white/10 transition-all">+600</button>
                <button onClick={undoWater} className="bg-red-500/20 hover:bg-red-500/30 p-2 rounded-xl text-xs font-bold border border-red-500/20 text-red-400 transition-all flex items-center justify-center gap-1">
                  <RotateCcw className="w-3 h-3" /> {t.undo}
                </button>
              </div>
            </div>

            {/* Quick Config */}
            <div className={`${GLASS_BG} rounded-3xl p-6`}>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-red-500" />
                <h3 className="font-bold">Quick Config</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  {['Compact', 'Standard', 'Expanded'].map(s => (
                    <button 
                      key={s}
                      onClick={() => setScaling(s)}
                      className={`flex-1 p-2 rounded-xl text-xs transition-all ${scaling === s ? 'bg-red-600' : 'bg-white/5 border border-white/10'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white"
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="AR_URBAN">Jordanian Urban 🇯🇴</option>
                  <option value="AR_FORMAL">Arabic Formal 🇸🇦</option>
                  <option value="EN_SLANG">English Slang 🇺🇸</option>
                  <option value="EN_OFFICIAL">English Official 🇬🇧</option>
                </select>
              </div>
            </div>
          </div>

          {/* Task Matrix */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { id: 'Sunrise', icon: <Sunrise className="w-5 h-5 text-orange-400" />, title: t.task_morning },
              { id: 'Grind', icon: <Sun className="w-5 h-5 text-yellow-400" />, title: t.task_day },
              { id: 'Late', icon: <Moon className="w-5 h-5 text-purple-400" />, title: t.task_night }
            ].map(section => (
              <div key={section.id} className={`${GLASS_BG} rounded-3xl p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-bold">{section.title}</h3>
                  </div>
                  <button 
                    onClick={() => addTask(section.id)}
                    className="p-2 bg-red-600 rounded-lg hover:bg-red-500 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {tasks.filter(tk => tk.slot === section.id).map(task => (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        task.status === 'Done' ? 'bg-green-500/10 border-green-500/20 opacity-60' : 
                        task.status === 'Missed' ? 'bg-red-500/10 border-red-500/40 animate-pulse' :
                        'bg-white/5 border-white/10'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTaskStatus(task.id)}
                        className="flex-shrink-0"
                      >
                        {task.status === 'Todo' && <Circle className="w-6 h-6 text-white/40" />}
                        {task.status === 'Doing' && <div className="w-6 h-6 border-2 border-orange-500 rounded-full border-t-transparent animate-spin"></div>}
                        {task.status === 'Done' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                        {task.status === 'Missed' && <AlertCircle className="w-6 h-6 text-red-500" />}
                      </button>
                      
                      <input 
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTaskText(task.id, e.target.value)}
                        placeholder="What's next?"
                        className="flex-1 bg-transparent border-none outline-none text-white font-medium placeholder:text-white/20"
                      />

                      <div className="text-[10px] font-bold text-white/30 uppercase tracking-tighter">
                        {task.timestamp}
                      </div>

                      <button 
                        onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tasks.filter(tk => tk.slot === section.id).length === 0 && (
                    <p className="text-center text-white/20 py-4 text-sm italic">No tasks locked in for this slot yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Sovereign Signature */}
      <footer className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pointer-events-auto">
          <div className="flex items-center gap-4 text-white/40 text-xs font-bold">
            <div className="flex items-center gap-1"><Monitor className="w-3 h-3" /> V43.2 Omni Core</div>
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Amman Time</div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <span className="text-white/40 text-[10px] tracking-widest uppercase block text-center md:text-right">Architected By</span>
            <span className="text-white font-black text-xl tracking-tighter footer-glow cursor-default select-none">
              {t.footer_text}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
