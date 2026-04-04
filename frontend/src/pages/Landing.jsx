import React from "react";
import { 
  ArrowRight, Code2, Trophy, BarChart2, MessageSquare, 
  CheckCircle2, Play, BookOpen, Users, Award, TrendingUp 
} from "lucide-react";

// ==========================================
// REUSABLE UI SYSTEM
// ==========================================

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`px-3 py-1 text-xs font-bold tracking-wide uppercase rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, variant = "primary", className = "", icon: Icon }) => {
  const base = "px-6 py-3 rounded-full font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 text-sm md:text-base active:scale-95";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`}>
      {children}
      {Icon && <Icon className="w-4 h-4" />}
    </button>
  );
};

const BentoCard = ({ className = "", children, colSpan = "col-span-1" }) => (
  <div className={`group bg-white rounded-3xl border border-slate-200 p-8 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 ${colSpan} ${className}`}>
    {children}
  </div>
);

const FeatureListItem = ({ icon: Icon, text, colorClass = "text-blue-500" }) => (
  <li className="flex items-start gap-3 text-sm font-medium text-slate-700 mb-3">
    <Icon className={`w-5 h-5 shrink-0 ${colorClass}`} />
    <span className="leading-relaxed">{text}</span>
  </li>
);

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function AlgorhythmModernLanding() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-slate-900 selection:bg-blue-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <Badge color="blue">Algorhythm is Live</Badge>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
            Thinking in algorithms. <br className="hidden md:block" />
            <span className="text-blue-600">Executing in seconds.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The minimalist arena for competitive programmers. Master curated problem sets, discuss multiple approaches, and climb the global leaderboards.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" icon={ArrowRight}>Start Coding Now</Button>
            <Button variant="secondary">Explore Problems</Button>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="border-y border-slate-200 bg-white/50 backdrop-blur-sm px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8 text-center divide-x divide-slate-100">
          {[
            { label: "Active Coders", value: "10,000+" },
            { label: "Curated Problems", value: "500+" },
            { label: "Solutions Submitted", value: "1M+" },
            { label: "Contests Held", value: "50+" },
          ].map((stat, i) => (
            <div key={i} className="flex-1 min-w-[150px] px-4">
              <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. BENTO BOX FEATURES GRID */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(320px,auto)]">
          
          {/* ROW 1: IDE & CONTESTS */}
          
          <BentoCard colSpan="md:col-span-2">
            <div className="flex flex-col h-full justify-between">
              <div className="mb-8 max-w-lg">
                <Badge color="slate">Core Environment</Badge>
                <h3 className="text-2xl font-bold mt-4 mb-2">Blazing fast compilation.</h3>
                <p className="text-slate-600">Write, run, and evaluate C++, Python, and Java code instantly. Get immediate feedback on edge cases and time complexities right in the browser.</p>
              </div>
              
              <div className="rounded-2xl bg-[#0f111a] border border-slate-800 shadow-xl overflow-hidden mt-auto translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2">binary_conversion.cpp</span>
                </div>
                <div className="p-5 font-mono text-sm text-slate-300 overflow-x-auto">
                  <span className="text-pink-400">string</span> <span className="text-blue-400">toBinary</span>(<span className="text-purple-400">int</span> n) {'{'}<br/>
                  &nbsp;&nbsp;<span className="text-pink-400">if</span> (n == <span className="text-emerald-400">0</span>) <span className="text-pink-400">return</span> <span className="text-amber-300">"0"</span>;<br/>
                  &nbsp;&nbsp;<span className="text-pink-400">string</span> res = <span className="text-amber-300">""</span>;<br/>
                  &nbsp;&nbsp;<span className="text-pink-400">while</span> (n {">"} <span className="text-emerald-400">0</span>) {'{'}<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;res += (n % <span className="text-emerald-400">2</span> == <span className="text-emerald-400">0</span> ? <span className="text-amber-300">"0"</span> : <span className="text-amber-300">"1"</span>);<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;n /= <span className="text-emerald-400">2</span>;<br/>
                  &nbsp;&nbsp;{'}'}<br/>
                  &nbsp;&nbsp;<span className="text-blue-400">reverse</span>(res.begin(), res.end());<br/>
                  &nbsp;&nbsp;<span className="text-pink-400">return</span> res;<br/>
                  {'}'}
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard colSpan="md:col-span-1" className="bg-gradient-to-b from-white to-emerald-50/50">
            <div className="flex flex-col h-full">
              <Badge color="emerald">The Colosseum</Badge>
              <h3 className="text-2xl font-bold mt-4 mb-2">Weekly Live Contests.</h3>
              <p className="text-slate-600 mb-8">Test your mettle against developers worldwide in our timed, weekend contest formats.</p>
              
              <div className="mt-auto bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between group-hover:scale-[1.02] transition-transform">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <p className="text-sm font-bold text-slate-900">Weekly Arena #42</p>
                  </div>
                  <p className="text-xs font-medium text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded">Starts in 2h 15m</p>
                </div>
                <button className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-sm hover:bg-emerald-700 transition-colors">
                  <Play className="w-4 h-4 ml-0.5" fill="currentColor"/>
                </button>
              </div>
            </div>
          </BentoCard>

          {/* ROW 2: CUSTOM LISTS & DISCUSSION */}

          <BentoCard colSpan="md:col-span-1">
            <div className="flex flex-col h-full">
              <Badge color="purple">Curated Collections</Badge>
              <h3 className="text-2xl font-bold mt-4 mb-2">Learn your way.</h3>
              <p className="text-slate-600 mb-6">Take hold of your learning journey with custom problem lists tailored to your goals.</p>
              
              <div className="mt-auto space-y-3">
                {[
                  { name: "FAANG Interview Prep", progress: 60 },
                  { name: "Dynamic Programming", progress: 25 },
                  { name: "Arrays & Strings", progress: 100 }
                ].map((list, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-semibold text-slate-900">{list.name}</h4>
                      <span className="text-xs font-medium text-slate-500">{list.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full ${list.progress === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${list.progress}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <BentoCard colSpan="md:col-span-2">
            <div className="flex flex-col md:flex-row h-full gap-8">
              <div className="flex-1 flex flex-col justify-center">
                <Badge color="blue">Community</Badge>
                <h3 className="text-2xl font-bold mt-4 mb-4">Learn together through discussion.</h3>
                <ul className="space-y-1">
                  <FeatureListItem icon={MessageSquare} text="Share solutions and explain your thought process." colorClass="text-blue-500"/>
                  <FeatureListItem icon={Users} text="Get instant feedback on time complexity and edge cases." colorClass="text-indigo-500"/>
                  <FeatureListItem icon={BookOpen} text="Discover multiple approaches (Greedy, DP) for the same problem." colorClass="text-cyan-500"/>
                </ul>
              </div>
              
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold">JC</div>
                    <p className="text-xs font-semibold text-slate-900">John_Coder <span className="text-slate-400 font-normal ml-1">2h ago</span></p>
                  </div>
                  <p className="text-sm text-slate-600">Here's a solution using DFS in O(V+E). Anyone have thoughts on optimizing the inner loop?</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm ml-6 relative">
                  <div className="absolute -left-4 top-4 w-4 h-[1px] bg-slate-200"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">MT</div>
                    <p className="text-xs font-semibold text-slate-900">Maria_Tech</p>
                  </div>
                  <p className="text-sm text-slate-600">You can actually optimize it further using Dijkstra to O(E log V)!</p>
                </div>
              </div>
            </div>
          </BentoCard>

          {/* ROW 3: GAMIFICATION & ANALYTICS */}

          <BentoCard colSpan="md:col-span-1" className="bg-gradient-to-b from-white to-rose-50/30">
            <div className="flex flex-col h-full relative z-10">
              <Badge color="rose">Reputation</Badge>
              <h3 className="text-2xl font-bold mt-4 mb-2">Compete & earn recognition.</h3>
              <p className="text-slate-600 mb-6">Build your reputation, unlock exclusive badges, and showcase your achievements.</p>
              
              <div className="flex flex-col gap-3 mt-auto">
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs"><Award className="w-4 h-4"/></div>
                    <span className="font-semibold text-sm text-slate-900">Legendary</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Top 5%</span>
                </div>
                <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-rose-100 shadow-sm relative z-10 scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold text-xs shadow-inner"><Trophy className="w-4 h-4"/></div>
                    <span className="font-semibold text-sm text-rose-700">Apex Predator</span>
                  </div>
                  <span className="text-xs text-rose-400 font-medium">Top 1%</span>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard colSpan="md:col-span-2">
            <div className="flex flex-col md:flex-row h-full gap-8 items-center">
              <div className="flex-1">
                <Badge color="amber">Analytics</Badge>
                <h3 className="text-2xl font-bold mt-4 mb-2">Track your progress.</h3>
                <p className="text-slate-600 mb-6">Visualize your improvement with detailed analytics, acceptance rates, and difficulty distributions to stay motivated.</p>
                
                <ul className="space-y-1">
                  <FeatureListItem icon={CheckCircle2} text="Difficulty Distribution (Easy / Med / Hard)" colorClass="text-amber-500"/>
                  <FeatureListItem icon={TrendingUp} text="Topic-wise mastery heatmaps" colorClass="text-amber-500"/>
                  <FeatureListItem icon={BarChart2} text="Acceptance rate vs. Global average" colorClass="text-amber-500"/>
                </ul>
              </div>
              
              <div className="w-full md:w-[45%] bg-slate-50 rounded-2xl p-5 border border-slate-100 h-full flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Difficulty Spread</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1"><span className="text-emerald-600">Easy</span> <span className="text-slate-900">180 solved</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-emerald-500 h-1.5 rounded-full w-[80%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1"><span className="text-amber-600">Medium</span> <span className="text-slate-900">250 solved</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-amber-500 h-1.5 rounded-full w-[60%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1"><span className="text-rose-600">Hard</span> <span className="text-slate-900">70 solved</span></div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full w-[20%]"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </BentoCard>

        </div>
      </section>

      {/* 4. CLEAN CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-blue-600 rounded-[2.5rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-600/20">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] border-[60px] border-white/5 rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to Start Your Journey?</h2>
            <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join Algorhythm today and transform your coding skills with structured practice, custom lists, and real-time community feedback.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto text-lg">
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MINIMAL FOOTER */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 px-6">
        {/* Footer content remains clean and standard */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">A</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Algorhythm</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Master coding through practice and competition. Built for the modern developer.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <div className="space-y-3 text-sm">
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Problems</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Contests</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Leaderboard</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Discuss</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <div className="space-y-3 text-sm">
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Blogs</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Documentation</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">API</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
            <div className="space-y-3 text-sm">
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">About</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Privacy</a>
              <a href="#" className="block text-slate-500 hover:text-blue-600 transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Algorhythm. All rights reserved.
        </div>
      </footer>
      
    </div>
  );
}