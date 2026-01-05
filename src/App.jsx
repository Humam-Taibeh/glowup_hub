<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Humam Ultimate Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
        
        body {
            font-family: 'Cairo', sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            overflow-x: hidden;
        }

        .diamond-gradient {
            background: linear-gradient(135deg, #b9f2ff 0%, #ffffff 50%, #b9f2ff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 20px rgba(185, 242, 255, 0.5);
        }

        .diamond-border {
            border: 2px solid transparent;
            background: linear-gradient(#0f172a, #0f172a) padding-box,
                        linear-gradient(135deg, #b9f2ff, #2563eb, #b9f2ff) border-box;
        }

        .beast-mode-bg {
            background: linear-gradient(45deg, #1e1b4b 0%, #450a0a 100%);
        }

        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .animate-float {
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
    </style>
</head>
<body class="min-h-screen">

    <!-- App Container -->
    <div id="app" class="max-w-md mx-auto min-h-screen relative">
        
        <!-- Login Screen -->
        <div id="login-screen" class="flex flex-col items-center justify-center min-h-screen p-6 space-y-8">
            <div class="text-center">
                <div class="w-24 h-24 mx-auto mb-4 relative animate-float">
                    <i data-lucide="gem" class="w-full h-full text-blue-300"></i>
                </div>
                <h1 class="text-4xl font-black diamond-gradient uppercase tracking-widest">Diamond Login</h1>
                <p class="text-slate-400 mt-2 text-sm">Welcome back, Humam</p>
            </div>

            <div class="w-full space-y-4">
                <button onclick="handleLogin('google')" class="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
                    <i data-lucide="chrome" class="w-5 h-5"></i>
                    الدخول بواسطة Google
                </button>
                
                <button onclick="handleLogin('guest')" class="w-full flex items-center justify-center gap-3 glass-card font-bold py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95">
                    <i data-lucide="user" class="w-5 h-5 text-blue-300"></i>
                    دخول كـ ضيف (Guest)
                </button>

                <div class="text-center mt-4">
                    <button onclick="showForgotName()" class="text-xs text-slate-500 hover:text-blue-300 underline transition-colors">
                        نَسيت الاسم؟
                    </button>
                </div>
            </div>
        </div>

        <!-- Dashboard Screen (Hidden by default) -->
        <div id="dashboard" class="hidden pb-24">
            <!-- Header -->
            <header class="p-6 flex justify-between items-center sticky top-0 z-50 glass-card bg-black/50">
                <div>
                    <h2 id="welcome-msg" class="text-xl font-bold">أهلاً، همام</h2>
                    <p class="text-xs text-slate-400">اليوم: <span id="current-date"></span></p>
                </div>
                <button onclick="toggleBeastMode()" id="beast-toggle" class="p-3 rounded-full border border-red-900/50 hover:bg-red-900/20 transition-all">
                    <i data-lucide="zap" class="text-red-500"></i>
                </button>
            </header>

            <!-- Main Content -->
            <main class="p-6 space-y-6">
                
                <!-- Water Tracker -->
                <section class="glass-card rounded-3xl p-6 relative overflow-hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold flex items-center gap-2">
                            <i data-lucide="droplet" class="text-blue-400"></i> متتبع الماء
                        </h3>
                        <span id="water-stat" class="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">0 / 2.5 L</span>
                    </div>
                    <div class="w-full bg-slate-800 h-4 rounded-full overflow-hidden mb-4">
                        <div id="water-progress" class="bg-blue-400 h-full transition-all duration-500" style="width: 0%"></div>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        <button onclick="addWater(250)" class="bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-xl text-xs">+250ml</button>
                        <button onclick="addWater(500)" class="bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-xl text-xs">+500ml</button>
                        <button onclick="addWater(1000)" class="bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-xl text-xs">+1L</button>
                        <button onclick="resetWater()" class="bg-red-500/10 hover:bg-red-500/20 py-2 rounded-xl text-xs">إعادة</button>
                    </div>
                </section>

                <!-- ZUJ Exam Schedule -->
                <section class="space-y-4">
                    <h3 class="font-bold flex items-center gap-2 px-2">
                        <i data-lucide="calendar" class="text-yellow-500"></i> جدول امتحانات ZUJ 2026
                    </h3>
                    <div class="space-y-3">
                        <!-- Exam Card 1 -->
                        <div class="glass-card p-4 rounded-2xl border-r-4 border-yellow-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-sm">الريادة والابتكار</h4>
                                    <p class="text-[10px] text-slate-400">د. يوسف أبوزغلة</p>
                                </div>
                                <span class="text-[10px] font-bold bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">14/1/2026</span>
                            </div>
                            <div class="mt-2 text-[10px] text-slate-300 flex items-center gap-2">
                                <i data-lucide="clock" class="w-3 h-3"></i> 12:00 - 1:00 | كلية الأعمال
                            </div>
                        </div>

                        <!-- Exam Card 2 -->
                        <div class="glass-card p-4 rounded-2xl border-r-4 border-blue-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-sm">تحليلات البيانات المتقدمة</h4>
                                    <p class="text-[10px] text-slate-400">د. إبراهيم عتوم</p>
                                </div>
                                <span class="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-1 rounded">21/1/2026</span>
                            </div>
                            <div class="mt-2 text-[10px] text-slate-300 flex items-center gap-2">
                                <i data-lucide="clock" class="w-3 h-3"></i> 11:30 - 1:30 | سيحدد لاحقاً
                            </div>
                        </div>

                        <!-- Exam Card 3 -->
                        <div class="glass-card p-4 rounded-2xl border-r-4 border-green-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-sm">تراكيب البيانات (Data Structure)</h4>
                                    <p class="text-[10px] text-slate-400">د. سهير الحكيم</p>
                                </div>
                                <span class="text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-1 rounded">26/1/2026</span>
                            </div>
                            <div class="mt-2 text-[10px] text-slate-300 flex items-center gap-2">
                                <i data-lucide="clock" class="w-3 h-3"></i> 11:30 - 1:30 | Sec-3-B
                            </div>
                        </div>

                        <!-- Exam Card 4 -->
                        <div class="glass-card p-4 rounded-2xl border-r-4 border-purple-500">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-sm">تنقيب البيانات (Data Mining)</h4>
                                    <p class="text-[10px] text-slate-400">د. بلال حواشين</p>
                                </div>
                                <span class="text-[10px] font-bold bg-purple-500/20 text-purple-300 px-2 py-1 rounded">2/2/2026</span>
                            </div>
                            <div class="mt-2 text-[10px] text-slate-300 flex items-center gap-2">
                                <i data-lucide="clock" class="w-3 h-3"></i> 2:00 - 3:30 | Sec-3-B
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Beast Mode Section -->
                <div id="beast-section" class="hidden animate-in fade-in duration-700">
                    <section class="beast-mode-bg rounded-3xl p-6 border border-red-500/30">
                        <div class="flex items-center gap-3 mb-4">
                            <i data-lucide="flame" class="text-orange-500 animate-pulse"></i>
                            <h3 class="font-black text-xl italic uppercase">Beast Mode ON</h3>
                        </div>
                        <div class="space-y-2 text-sm">
                            <p class="text-red-200">🚩 الهدف: Glow up كامل وتطور مادي وديني.</p>
                            <p class="text-red-200">💪 الجيم: Power Fitness (5 شهور المتبقية).</p>
                            <p class="text-red-200">🍳 الفطور: 4 بيضات + بطاطا مسلوقة (No Bread).</p>
                        </div>
                        <div class="mt-6 p-4 bg-black/40 rounded-xl border border-red-500/20">
                            <p class="text-xs text-red-400 mb-2">Music Vibe: Phonk / High Energy</p>
                            <div class="flex items-center gap-4">
                                <i data-lucide="play" class="fill-current"></i>
                                <div class="h-1 flex-1 bg-red-900 rounded-full overflow-hidden">
                                    <div class="w-2/3 h-full bg-red-500"></div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>

        <!-- Navigation Bar -->
        <nav id="navbar" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] glass-card rounded-full p-2 flex justify-around items-center z-[100]">
            <button class="p-4 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                <i data-lucide="layout-grid"></i>
            </button>
            <button onclick="scrollToExams()" class="p-4 rounded-full text-slate-400 hover:text-white transition-colors">
                <i data-lucide="book-open"></i>
            </button>
            <button onclick="showToast('سيتم تفعيل الإعدادات قريباً')" class="p-4 rounded-full text-slate-400 hover:text-white transition-colors">
                <i data-lucide="settings"></i>
            </button>
        </nav>

        <!-- Notification Toast -->
        <div id="toast" class="fixed top-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-2xl font-bold shadow-2xl transition-all duration-300 opacity-0 translate-y-[-100%] z-[1000]">
            Message here
        </div>

        <!-- Forgot Name Modal -->
        <div id="forgot-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center p-6 hidden z-[1000]">
            <div class="glass-card p-8 rounded-3xl w-full text-center space-y-4">
                <i data-lucide="help-circle" class="w-12 h-12 text-blue-300 mx-auto"></i>
                <h3 class="text-xl font-bold">شو يا غالي؟</h3>
                <p class="text-slate-400 text-sm">اسمك "همام" يا كينج.. معقول تنساه؟ <br> (Humam Zakwan Taibeh)</p>
                <button onclick="closeForgotModal()" class="w-full bg-blue-600 py-3 rounded-xl font-bold">تمام، تذكرت!</button>
            </div>
        </div>

    </div>

    <script>
        // Initialize Lucide Icons
        lucide.createIcons();

        // State Management
        let waterAmount = 0;
        const waterGoal = 2500;
        let isBeastMode = false;

        // Login Logic
        function handleLogin(type) {
            showToast(type === 'google' ? 'جاري الاتصال بـ Google...' : 'مرحباً بك كـ ضيف');
            setTimeout(() => {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                document.getElementById('navbar').classList.remove('hidden');
                document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }, 1000);
        }

        // Water Tracker Logic
        function addWater(amount) {
            waterAmount += amount;
            updateWaterUI();
            if (waterAmount >= 1000 && waterAmount < 1000 + amount) {
                showToast('عاش! كسرت حاجز اللتر 🔥');
            }
        }

        function resetWater() {
            waterAmount = 0;
            updateWaterUI();
        }

        function updateWaterUI() {
            const percentage = Math.min((waterAmount / waterGoal) * 100, 100);
            document.getElementById('water-progress').style.width = percentage + '%';
            document.getElementById('water-stat').innerText = `${(waterAmount / 1000).toFixed(1)} / 2.5 L`;
        }

        // Beast Mode Toggle
        function toggleBeastMode() {
            isBeastMode = !isBeastMode;
            const beastSection = document.getElementById('beast-section');
            const toggleBtn = document.getElementById('beast-toggle');
            
            if (isBeastMode) {
                beastSection.classList.remove('hidden');
                toggleBtn.classList.add('bg-red-600', 'border-red-400');
                document.body.classList.add('beast-active');
                showToast('Beast Mode Activated ⚡');
            } else {
                beastSection.classList.add('hidden');
                toggleBtn.classList.remove('bg-red-600', 'border-red-400');
                showToast('Back to Chill Mode');
            }
        }

        // UI Helpers
        function showToast(msg) {
            const toast = document.getElementById('toast');
            toast.innerText = msg;
            toast.classList.remove('opacity-0', 'translate-y-[-100%]');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-[-100%]');
            }, 3000);
        }

        function showForgotName() {
            document.getElementById('forgot-modal').classList.remove('hidden');
        }

        function closeForgotModal() {
            document.getElementById('forgot-modal').classList.add('hidden');
        }

        function scrollToExams() {
            window.scrollTo({ top: 500, behavior: 'smooth' });
            showToast('جدول امتحانات جامعة الزيتونة');
        }

    </script>
</body>
</html>
