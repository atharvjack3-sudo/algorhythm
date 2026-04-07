import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function useReveal() {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

const Reveal = ({ children, delay = 0, className = "" }) => {
  const { ref, isVisible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-[650ms] ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function AlgorhythmLanding() {
  const [activeSolutionId, setActiveSolutionId] = useState(2);
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState("C++17");
  const [timeLeft, setTimeLeft] = useState(7724);
  const [stats, setStats] = useState({ s1: 20, s2: 50, s3: 100, s4: 15 });

  const statsRef = useRef(null);
  const [statsAnimated, setStatsAnimated] = useState(false);

  const hmLevels = [
    0, 0, 0, 1, 0, 1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 3, 4, 3, 2, 4, 3,
    2, 2, 1, 0, 0, 1, 2, 3, 1, 2, 4, 3, 2, 4, 3, 2, 1, 3, 4, 2, 1, 0, 2, 3, 4,
    3, 2,
  ];
  const solutions = [
    {
      id: 1,
      label: "Brute Force",
      tc: "O(n³)",
      tcWidth: "90%",
      sc: "O(1)",
      scWidth: "15%",
      verdictId: "tle",
      verdicts: [
        {
          label: "AC",
          time: "1850ms",
          mem: "3.8 MB",
          test: "1–25",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "TLE",
          time: ">2000ms",
          mem: "—",
          test: "26",
          color:
            "bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24]",
        },
        {
          label: "TLE",
          time: ">2000ms",
          mem: "—",
          test: "27",
          color:
            "bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24]",
        },
      ],
      code: (
        <>
          <span className="text-[#ffcb6b]">string</span>{" "}
          <span className="text-[#82aaff]">longestPalindrome</span>(
          <span className="text-[#ffcb6b]">string</span> s) {"{\n"} <br/>
          &nbsp;&nbsp;<span className="text-[#ffcb6b]">string</span> res ={" "}
          <span className="text-[#c3e88d]">""</span>;<br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">int</span> i ={" "}
          <span className="text-[#f78c6c]">0</span>; i &lt; s.size(); i++){" "}
          {"{\n"} <br/>
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">int</span> j = i; j &lt; s.size();
          j++) {"{\n"}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <br/> &nbsp; &nbsp; &nbsp; &nbsp;
          <span className="text-[#ffcb6b]">string</span> sub = s.substr(i, j-i+
          <span className="text-[#f78c6c]">1</span>);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span className="text-[#c792ea]"> if</span> (
          <span className="text-[#82aaff]">isPalindrome</span>(sub) &amp;&amp;
          sub.size() &gt; res.size())
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;res = sub;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;  {"}\n"}
          &nbsp;&nbsp; <br/> &nbsp;&nbsp;{"}\n"} <br/>
          &nbsp;&nbsp;<span className="text-[#c792ea]">return</span> res;
          <br />
          {"}"}
        </>
      ),
    },
    {
      id: 2,
      label: "Better",
      tc: "O(n²)",
      tcWidth: "60%",
      sc: "O(1)",
      scWidth: "15%",
      verdictId: "ac",
      verdicts: [
        {
          label: "AC",
          time: "38ms",
          mem: "4.1 MB",
          test: "1–45",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "AC",
          time: "42ms",
          mem: "4.2 MB",
          test: "46",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "AC",
          time: "39ms",
          mem: "4.1 MB",
          test: "47",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
      ],
      code: (
        <>
          <span className="text-[#ffcb6b]">string</span>{" "}
          <span className="text-[#82aaff]">expand</span>(
          <span className="text-[#ffcb6b]">string</span>&amp; s,{" "}
          <span className="text-[#c792ea]">int</span> l,{" "}
          <span className="text-[#c792ea]">int</span> r) {"{\n"}
          &nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp; while</span> (l &gt;={" "}
          <span className="text-[#f78c6c]">0</span> &amp;&amp; r &lt; s.size()
          &amp;&amp; s[l] == s[r])
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;l--, r++;
          <br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">return</span> s.substr(l+
          <span className="text-[#f78c6c]">1</span>, r-l-
          <span className="text-[#f78c6c]">1</span>);
          <br />
          {"}\n"} <br/>
          <span className="text-[#ffcb6b]">string</span>{" "}
          <span className="text-[#82aaff]">longestPalindrome</span>(
          <span className="text-[#ffcb6b]">string</span> s) {"{\n"}
          &nbsp;&nbsp;<span className="text-[#ffcb6b]"><br/>&nbsp;&nbsp;string</span> res ={" "}
          <span className="text-[#c3e88d]">""</span>;<br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">int</span> i ={" "}
          <span className="text-[#f78c6c]">0</span>; i &lt; s.size(); i++){" "}
          {"{\n"}
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ffcb6b]">
            <br/>&nbsp;&nbsp;&nbsp;&nbsp;string
          </span>{" "}
          odd = <span className="text-[#82aaff]">expand</span>(s, i, i);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ffcb6b]">
            string
          </span>{" "}
          even = <span className="text-[#82aaff]">expand</span>(s, i, i+
          <span className="text-[#f78c6c]">1</span>);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            if
          </span>{" "}
          (odd.size() &gt; res.size()) res = odd;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            if
          </span>{" "}
          (even.size() &gt; res.size()) res = even;
          <br />
          &nbsp;&nbsp;{"}\n"}
          &nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp;&nbsp;return</span> res;
          <br />
          {"}"}
        </>
      ),
    },
    {
      id: 3,
      label: "Optimal",
      tc: "O(n)",
      tcWidth: "20%",
      sc: "O(n)",
      scWidth: "60%",
      verdictId: "ac",
      verdicts: [
        {
          label: "AC",
          time: "4ms",
          mem: "5.2 MB",
          test: "1–47",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "AC",
          time: "6ms",
          mem: "5.3 MB",
          test: "48",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "AC",
          time: "5ms",
          mem: "5.2 MB",
          test: "49",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
      ],
      code: (
        <>
          <span className="text-[#ffcb6b]">string</span>{" "}
          <span className="text-[#82aaff]">longestPalindrome</span>(
          <span className="text-[#ffcb6b]">string</span> s) {"{\n"}
          &nbsp;&nbsp;<span className="text-[#ffcb6b]"><br/>&nbsp;&nbsp;string</span> t ={" "}
          <span className="text-[#c3e88d]">"^#"</span>;<br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">char</span> c : s) t += c, t +={" "}
          <span className="text-[#c3e88d]">"#"</span>;<br />
          &nbsp;&nbsp;t += <span className="text-[#c3e88d]">"$"</span>;<br />
          &nbsp;&nbsp;<span className="text-[#ffcb6b]">vector</span>&lt;
          <span className="text-[#c792ea]">int</span>&gt; p(t.size(),{" "}
          <span className="text-[#f78c6c]">0</span>);
          <br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">int</span> c ={" "}
          <span className="text-[#f78c6c]">0</span>, r ={" "}
          <span className="text-[#f78c6c]">0</span>, maxLen ={" "}
          <span className="text-[#f78c6c]">0</span>, center ={" "}
          <span className="text-[#f78c6c]">0</span>;<br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">int</span> i ={" "}
          <span className="text-[#f78c6c]">1</span>; i &lt; t.size()-
          <span className="text-[#f78c6c]">1</span>; i++) {"{\n"}
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp;&nbsp;&nbsp;&nbsp;if</span> (r
          &gt; i) p[i] = <span className="text-[#82aaff]">min</span>(r - i, p[
          <span className="text-[#f78c6c]">2</span>*c - i]);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            while
          </span>{" "}
          (t[i+<span className="text-[#f78c6c]">1</span>+p[i]] == t[i-
          <span className="text-[#f78c6c]">1</span>-p[i]]) p[i]++;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">if</span> (i
          + p[i] &gt; r) c = i, r = i + p[i];
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            if
          </span>{" "}
          (p[i] &gt; maxLen) maxLen = p[i], center = i;
          <br />
          &nbsp;&nbsp;{"}\n"}
          &nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp;&nbsp;return</span>{" "}
          s.substr((center - maxLen)/<span className="text-[#f78c6c]">2</span>,
          maxLen);
          <br />
          {"}"}
        </>
      ),
    },
    {
      id: 4,
      label: "Wrong",
      tc: "O(n²)",
      tcWidth: "60%",
      sc: "O(1)",
      scWidth: "15%",
      verdictId: "wa",
      verdicts: [
        {
          label: "AC",
          time: "14ms",
          mem: "3.9 MB",
          test: "1–15",
          color:
            "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
        },
        {
          label: "WA",
          time: "14ms",
          mem: "3.8 MB",
          test: "16",
          color:
            "bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185]",
        },
        {
          label: "WA",
          time: "14ms",
          mem: "3.8 MB",
          test: "17",
          color:
            "bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185]",
        },
      ],
      code: (
        <>
          <span className="text-[#ffcb6b]">string</span>{" "}
          <span className="text-[#82aaff]">longestPalindrome</span>(
          <span className="text-[#ffcb6b]">string</span> s) {"{\n"}
          &nbsp;&nbsp;<span className="text-[#ffcb6b]"><br/>&nbsp;&nbsp;string</span> res ={" "}
          <span className="text-[#c3e88d]">""</span>;<br />
          &nbsp;&nbsp;
          <span className="text-[#888] italic">
            // Bug: Only checks odd-length palindromes!
          </span>
          <br />
          &nbsp;&nbsp;<span className="text-[#c792ea]">for</span> (
          <span className="text-[#c792ea]">int</span> i ={" "}
          <span className="text-[#f78c6c]">0</span>; i &lt; s.size(); i++){" "}
          {"{\n"}
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp;&nbsp;&nbsp;&nbsp;int</span> l
          = i, r = i;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            while
          </span>{" "}
          (l &gt;= <span className="text-[#f78c6c]">0</span> &amp;&amp; r &lt;
          s.size() &amp;&amp; s[l] == s[r]) {"{\n"}<br/>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;l--, r++;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{"}\n"}
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#ffcb6b]">
            <br/>&nbsp;&nbsp;&nbsp;&nbsp;string
          </span>{" "}
          sub = s.substr(l+<span className="text-[#f78c6c]">1</span>, r-l-
          <span className="text-[#f78c6c]">1</span>);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#c792ea]">
            if
          </span>{" "}
          (sub.size() &gt; res.size()) res = sub;
          <br />
          &nbsp;&nbsp;{"}\n"}
          &nbsp;&nbsp;<span className="text-[#c792ea]"><br/>&nbsp;&nbsp;return</span> res;
          <br />
          {"}"}
        </>
      ),
    },
  ];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(
      () => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Stats Animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !statsAnimated) {
          setStatsAnimated(true);
          const animate = (key, target) => {
            let start = null;
            const dur = 1800;
            const step = (ts) => {
              if (!start) start = ts;
              const progress = Math.min((ts - start) / dur, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setStats((prev) => ({
                ...prev,
                [key]: Math.floor(eased * target),
              }));
              if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          };
          animate("s1", 10000);
          animate("s2", 500);
          animate("s3", 1000000);
          animate("s4", 50);
        }
      },
      { threshold: 0.5 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [statsAnimated]);

  return (
    <div className="min-h-screen bg-[#f5f4f0] dark:bg-[#0c0d10] text-[#0d0d0d] dark:text-[#f0f0ee] font-sans overflow-x-hidden selection:bg-blue-500/20">
      {/* Inject custom keyframes for the marquee animation so it works without tailwind.config changes */}
      <style>{`
        @keyframes tick { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-tick { animation: tick 35s linear infinite; }
        .animate-tick:hover { animation-play-state: paused; }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-6">
        {/* HERO */}
        <div className="py-[120px] pb-20 text-center relative">
          <Reveal className="mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
              Now in Public Beta
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-[clamp(48px,8vw,88px)] font-medium leading-[1.04] tracking-[-0.03em] mb-6">
              Think in algorithms.
              <br />
              <em className="not-italic text-blue-600 dark:text-blue-400">
                Execute in seconds.
              </em>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-[clamp(16px,2vw,20px)] text-[#555] dark:text-[#a0a0a8] max-w-[560px] mx-auto mb-10 leading-[1.65]">
              The modern arena for competitive programmers. Solve curated
              problems, compete in live contests, discuss approaches, and track
              every step of your growth.
            </p>
          </Reveal>
          <Reveal delay={300} className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => navigate("/auth")}
              className="bg-blue-600 text-white border-none px-8 py-3.5 rounded-full text-[15px] font-medium cursor-pointer transition-all hover:opacity-90 hover:-translate-y-[1px]"
            >
              Start Coding Free
            </button>
            <button
              onClick={() => navigate("/problemset")}
              className="bg-transparent text-[#555] dark:text-[#a0a0a8] border border-black/10 dark:border-white/10 px-7 py-3.5 rounded-full text-[15px] cursor-pointer transition-all hover:bg-white dark:hover:bg-[#13151a] hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee]"
            >
              Browse Problem Set
            </button>
          </Reveal>
        </div>

        {/* TRUSTED BY MARQUEE */}
        {/* TRUSTED BY MARQUEE */}
        <Reveal className="py-12   -mx-6 md:mx-0 md:rounded-2xl flex flex-col items-center relative overflow-hidden">
          <p className="text-[11px] font-bold text-[#888] dark:text-[#555] uppercase tracking-[0.2em] mb-10 text-center">
            Trusted by engineers at
          </p>

          {/* Gradient Masks for Seamless Fade In/Out */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#f5f4f0] dark:from-[#0c0d10] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#f5f4f0] dark:from-[#0c0d10] to-transparent z-10 pointer-events-none"></div>

          {/* Marquee Container */}
          <div className="flex w-full overflow-hidden">
            <div className="flex animate-tick whitespace-nowrap hover:[animation-play-state:paused] items-center">
              {/* Duplicated list for infinite scroll effect */}
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-around gap-16 md:gap-24 px-8 md:px-12"
                >
                  {/* Google */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                    </svg>
                    <span className="font-semibold text-2xl tracking-tighter">
                      Google
                    </span>
                  </div>

                  {/* Microsoft */}
                  <div className="flex items-center gap-2.5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <svg
                      className="w-6 h-6 text-[#00a4ef]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                    </svg>
                    <span className="font-semibold text-2xl tracking-tight">
                      Microsoft
                    </span>
                  </div>

                  {/* Uber */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <span className="font-normal text-[28px] tracking-wide">
                      Uber
                    </span>
                  </div>

                  {/* Netflix */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <span className="font-black text-[26px] tracking-[0.1em] text-[#E50914] uppercase">
                      Netflix
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <svg
                      className="w-8 h-8 text-[#0668E1]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2.04c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 18.5c-4.69 0-8.5-3.81-8.5-8.5S7.31 3.54 12 3.54 20.5 7.35 20.5 12 16.69 20.54 12 20.54z" />
                    </svg>
                    <span className="font-semibold text-2xl tracking-wide">
                      Meta
                    </span>
                  </div>

                  {/* Stripe */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <span className="font-bold text-[28px] tracking-tighter text-[#635BFF]">
                      stripe
                    </span>
                  </div>

                  {/* Amazon */}
                  <div className="flex items-center gap-1 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <span className="font-bold text-[28px] tracking-tighter">
                      amazon
                    </span>
                  </div>

                  {/* Spotify */}
                  <div className="flex items-center gap-2 grayscale opacity-40 hover:opacity-100 hover:grayscale-0 transition-all duration-300 cursor-pointer">
                    <svg
                      className="w-8 h-8 text-[#1ED760]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.181-1.38-.781-.18-.6.18-1.2.78-1.381 4.26-1.26 11.28-1.02 15.721 1.621.54.3.72.96.42 1.5-.3.54-.96.72-1.5.42z" />
                    </svg>
                    <span className="font-bold text-2xl tracking-tighter">
                      Spotify
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* STATS */}
        <Reveal className="my-[60px]" ref={statsRef}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-[20px] overflow-hidden">
            <div className="bg-white dark:bg-[#13151a] p-8 text-center">
              <div className="text-[40px] font-medium tracking-[-0.03em] leading-none">
                {stats.s1.toLocaleString()}+
              </div>
              <div className="text-[12px] text-[#888] dark:text-[#555] uppercase tracking-[0.08em] mt-2">
                Active Coders
              </div>
            </div>
            <div className="bg-white dark:bg-[#13151a] p-8 text-center">
              <div className="text-[40px] font-medium tracking-[-0.03em] leading-none">
                {stats.s2.toLocaleString()}+
              </div>
              <div className="text-[12px] text-[#888] dark:text-[#555] uppercase tracking-[0.08em] mt-2">
                Curated Problems
              </div>
            </div>
            <div className="bg-white dark:bg-[#13151a] p-8 text-center">
              <div className="text-[40px] font-medium tracking-[-0.03em] leading-none">
                {stats.s3.toLocaleString()}+
              </div>
              <div className="text-[12px] text-[#888] dark:text-[#555] uppercase tracking-[0.08em] mt-2">
                Solutions Submitted
              </div>
            </div>
            <div className="bg-white dark:bg-[#13151a] p-8 text-center">
              <div className="text-[40px] font-medium tracking-[-0.03em] leading-none">
                {stats.s4.toLocaleString()}+
              </div>
              <div className="text-[12px] text-[#888] dark:text-[#555] uppercase tracking-[0.08em] mt-2">
                Contests Held
              </div>
            </div>
          </div>
        </Reveal>

        {/* SECTION 1: CODE EDITOR */}
        <div className="py-[100px] pt-0">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f0efe9] dark:bg-[#1a1c24] text-[#555] dark:text-[#a0a0a8] border border-black/10 dark:border-white/10">
              Core Environment
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              Write. Run. Submit.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              A full-featured in-browser IDE with real-time compilation for C++,
              Python, and Java. Get instant verdicts, time and memory stats, and
              per-test-case breakdowns.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-7 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f0efe9] dark:bg-[#1a1c24] text-[#555] dark:text-[#a0a0a8] border border-black/10 dark:border-white/10">
                Code Editor
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Syntax-aware, instant feedback
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Write in your language of choice. Submissions are evaluated
                against hidden test cases with real-time verdicts — AC, WA, TLE,
                MLE — and full memory/time profiling.
              </p>

              <div className="flex gap-2 flex-wrap mt-4">
                {solutions.map((sol) => (
                  <div
                    key={sol.id}
                    onClick={() => setActiveSolutionId(sol.id)}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border cursor-pointer transition-all ${
                      activeSolutionId === sol.id
                        ? "bg-blue-600 text-white border-transparent"
                        : "border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8] hover:bg-[#f0efe9] dark:hover:bg-[#1a1c24]"
                    }`}
                  >
                    {sol.label}
                  </div>
                ))}
              </div>

              <div className="bg-[#0f1117] dark:bg-[#0a0b0f] rounded-2xl overflow-hidden mt-6 border border-white/5">
                <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
                  <span className="text-[11px] text-[#555] font-mono ml-2">
                    longest_palindrome.cpp
                  </span>
                </div>
                <div className="p-5 px-5.5 text-[13px] font-mono leading-[1.8] overflow-x-auto text-[#f0f0ee] min-h-[360px]">
                  {solutions.find((s) => s.id === activeSolutionId)?.code}
                </div>
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-5 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e] border border-transparent">
                Verdicts
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Know exactly what failed
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Per-test-case breakdowns show time, memory, and the exact input
                that caused a wrong answer or timeout.
              </p>

              <table className="w-full mt-5 border-collapse">
                <thead>
                  <tr>
                    <th className="text-[11px] uppercase tracking-[0.06em] text-[#888] dark:text-[#555] font-medium p-2 px-3 text-left border-b border-black/10 dark:border-white/10">
                      Status
                    </th>
                    <th className="text-[11px] uppercase tracking-[0.06em] text-[#888] dark:text-[#555] font-medium p-2 px-3 text-left border-b border-black/10 dark:border-white/10">
                      Time
                    </th>
                    <th className="text-[11px] uppercase tracking-[0.06em] text-[#888] dark:text-[#555] font-medium p-2 px-3 text-left border-b border-black/10 dark:border-white/10">
                      Memory
                    </th>
                    <th className="text-[11px] uppercase tracking-[0.06em] text-[#888] dark:text-[#555] font-medium p-2 px-3 text-left border-b border-black/10 dark:border-white/10">
                      Test
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={`transition-all duration-300 ${activeSolutionId === 2 || activeSolutionId === 3 ? "bg-[#eff4ff] dark:bg-[#4d8dff]/10" : "opacity-40 grayscale-[50%]"}`}
                  >
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]">
                        AC
                      </span>
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      {activeSolutionId === 3 ? "4ms" : "38ms"}
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      {activeSolutionId === 3 ? "5.2 MB" : "4.1 MB"}
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      All
                    </td>
                  </tr>
                  <tr
                    className={`transition-all duration-300 ${activeSolutionId === 1 ? "bg-[#fffbeb] dark:bg-[#fbbf24]/10" : "opacity-40 grayscale-[50%]"}`}
                  >
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24]">
                        TLE
                      </span>
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      &gt;2000ms
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      —
                    </td>
                    <td className="text-[13px] p-2.5 px-3 border-b border-black/10 dark:border-white/10 text-[#555] dark:text-[#a0a0a8]">
                      46
                    </td>
                  </tr>
                  <tr
                    className={`transition-all duration-300 ${
                      activeSolutionId === 4
                        ? "bg-rose-50 dark:bg-rose-500/10"
                        : "opacity-40 grayscale-[50%]"
                    }`}
                  >
                    <td className="text-[13px] p-2.5 px-3 text-[#555] dark:text-[#a0a0a8]">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185]">
                        WA
                      </span>
                    </td>
                    <td className="text-[13px] p-2.5 px-3 text-[#555] dark:text-[#a0a0a8]">
                      14ms
                    </td>
                    <td className="text-[13px] p-2.5 px-3 text-[#555] dark:text-[#a0a0a8]">
                      3.8 MB
                    </td>
                    <td className="text-[13px] p-2.5 px-3 text-[#555] dark:text-[#a0a0a8]">
                      47
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-5">
                <div className="text-[12px] text-[#888] dark:text-[#555] mb-2.5 uppercase tracking-[0.06em]">
                  Complexity Analysis
                </div>
                <div className="flex flex-col gap-3.5">
                  <div>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-[#555] dark:text-[#a0a0a8]">
                        Time complexity
                      </span>
                      <span className="font-medium font-mono text-[#16a34a] dark:text-[#22c55e]">
                        {solutions.find((s) => s.id === activeSolutionId)?.tc}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-[#16a34a] dark:bg-[#22c55e]"
                        style={{
                          width: solutions.find(
                            (s) => s.id === activeSolutionId,
                          )?.tcWidth,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-[#555] dark:text-[#a0a0a8]">
                        Space complexity
                      </span>
                      <span className="font-medium font-mono text-[#16a34a] dark:text-[#22c55e]">
                        {solutions.find((s) => s.id === activeSolutionId)?.sc}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-blue-600 dark:bg-blue-400"
                        style={{
                          width: solutions.find(
                            (s) => s.id === activeSolutionId,
                          )?.scWidth,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>{" "}
        </div>

        {/* SECTION 2: PROBLEM SET */}
        <div className="pb-[100px]">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f5f3ff] dark:bg-[#a78bfa]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-transparent">
              Problem Set
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              500+ problems. Perfectly curated.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              From foundational arrays to advanced graph theory — every problem
              is tagged by topic, difficulty, and company. Filter, favourite,
              and track your exact progress.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-5 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f5f3ff] dark:bg-[#a78bfa]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-transparent">
                Browse
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Filter by what matters
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65] mb-0">
                Topic, difficulty, company, acceptance rate — slice the problem
                set exactly how you need it.
              </p>

              <div className="flex flex-col gap-2 mt-5">
                {[
                  {
                    name: "Two Sum",
                    tags: "Array · Hash Map",
                    diff: "Easy",
                    diffColor: "text-[#16a34a] dark:text-[#22c55e]",
                    done: true,
                  },
                  {
                    name: "Longest Palindromic Substring",
                    tags: "String · DP",
                    diff: "Medium",
                    diffColor: "text-[#d97706] dark:text-[#fbbf24]",
                    done: true,
                  },
                  {
                    name: "Trapping Rain Water",
                    tags: "Array · Two Pointers",
                    diff: "Hard",
                    diffColor: "text-[#e11d48] dark:text-[#fb7185]",
                    done: false,
                  },
                  {
                    name: "Word Ladder II",
                    tags: "BFS · Graph",
                    diff: "Hard",
                    diffColor: "text-[#e11d48] dark:text-[#fb7185]",
                    done: false,
                  },
                ].map((prob, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 px-4 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-xl text-[13px]"
                  >
                    <div>
                      <div className="font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                        {prob.name}
                      </div>
                      <div className="text-[11px] text-[#888] dark:text-[#555] mt-1">
                        {prob.tags}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] ${prob.diffColor}`}>
                        {prob.diff}
                      </span>
                      {prob.done ? (
                        <span className="text-[14px] text-[#16a34a] dark:text-[#22c55e]">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[14px] text-[#888] dark:text-[#555]">
                          —
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-7 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24] border border-transparent">
                Your Progress
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Topic-by-topic mastery
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Know exactly where your gaps are. Algorhythm breaks your solve
                rate down by every major DSA category.
              </p>

              <div className="flex flex-col gap-3.5 mt-6">
                {[
                  {
                    label: "Arrays & Strings",
                    val: "94 / 110",
                    pct: "85%",
                    color: "bg-blue-600 dark:bg-blue-400",
                  },
                  {
                    label: "Dynamic Programming",
                    val: "51 / 95",
                    pct: "54%",
                    color: "bg-[#7c3aed] dark:bg-[#a78bfa]",
                  },
                  {
                    label: "Trees & Graphs",
                    val: "67 / 88",
                    pct: "76%",
                    color: "bg-[#16a34a] dark:bg-[#22c55e]",
                  },
                  {
                    label: "Segment Trees / BIT",
                    val: "18 / 40",
                    pct: "45%",
                    color: "bg-[#d97706] dark:bg-[#fbbf24]",
                  },
                  {
                    label: "Hard Combinatorics",
                    val: "8 / 30",
                    pct: "27%",
                    color: "bg-[#e11d48] dark:bg-[#fb7185]",
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[12px] mb-1.5">
                      <span className="text-[#555] dark:text-[#a0a0a8]">
                        {item.label}
                      </span>
                      <span className="font-medium font-mono">{item.val}</span>
                    </div>
                    <div className="h-1.5 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${item.color}`}
                        style={{ width: item.pct }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* SECTION 3: CONTESTS */}
        <div className="pb-[100px]">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185] border border-transparent">
              Live Contests
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              Compete. Rank. Rise.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              Weekly and monthly rated contests with real-time leaderboards.
              Every submission counts. Performance updates your global rating
              the moment the contest ends.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-4 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185] border border-transparent">
                Next Up
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Weekly Arena #43
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                4 problems. 90 minutes. Rated for all participants. 1,240
                already registered.
              </p>

              <div className="bg-[#f0efe9] dark:bg-[#1a1c24] border border-black/10 dark:border-white/10 rounded-2xl p-5 mt-5">
                <div className="text-[12px] text-[#888] dark:text-[#555] uppercase tracking-[0.06em]">
                  Starts in
                </div>
                <div className="text-[32px] font-medium tracking-[-0.03em] font-mono my-2 text-[#0d0d0d] dark:text-[#f0f0ee]">
                  {formatTime(timeLeft)}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24] mt-1.5">
                  ⭐ Rating · Rated Contest
                </span>

                <div className="mt-6 items-center justify-center flex gap-2">
                  <button onClick={()=>navigate("/auth")} className="bg-blue-600 text-white border-none px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-all hover:opacity-90 hover:-translate-y-[1px]">
                    Register
                  </button>
                 
                </div>
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-8 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff] border border-transparent">
                Live Standings
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Real-time leaderboard
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Watch rankings shift live as participants submit. Your position
                updates instantly.
              </p>

              <div className="mt-5">
                {[
                  {
                    r: 1,
                    init: "SK",
                    name: "star_kshitij",
                    solved: "4/4",
                    score: "2840 pts",
                    hl: false,
                    color:
                      "bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24]",
                  },
                  {
                    r: 2,
                    init: "AN",
                    name: "algo_neha",
                    solved: "4/4",
                    score: "2791 pts",
                    hl: false,
                    color:
                      "bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]",
                  },
                  {
                    r: 7,
                    init: "YO",
                    name: "you",
                    solved: "3/4",
                    score: "2104 pts",
                    hl: true,
                    color:
                      "bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff]",
                  },
                  {
                    r: 8,
                    init: "RP",
                    name: "recur_priya",
                    solved: "3/4",
                    score: "2088 pts",
                    hl: false,
                    color:
                      "bg-[#f5f3ff] dark:bg-[#a78bfa]/10 text-[#7c3aed] dark:text-[#a78bfa]",
                  },
                  {
                    r: 9,
                    init: "VK",
                    name: "void_karan",
                    solved: "2/4",
                    score: "1650 pts",
                    hl: false,
                    color:
                      "bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff]",
                    isWa: true,
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 py-3 ${!row.hl ? "border-b border-black/10 dark:border-white/10 last:border-none" : "bg-[#eff4ff] dark:bg-[#4d8dff]/10 -mx-8 px-8 border-transparent"}`}
                  >
                    <div
                      className={`text-[13px] font-medium w-6 shrink-0 text-center ${row.hl ? "text-[#2563eb] dark:text-[#4d8dff]" : "text-[#888] dark:text-[#555]"}`}
                    >
                      {row.r}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 ${row.color}`}
                    >
                      {row.init}
                    </div>
                    <div
                      className={`flex-1 text-[13px] font-medium ${row.hl ? "text-[#2563eb] dark:text-[#4d8dff]" : "text-[#0d0d0d] dark:text-[#f0f0ee]"}`}
                    >
                      {row.name}
                    </div>
                    <div className="flex gap-1.5 mr-4">
                      {row.isWa ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185]">
                          {row.solved}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]">
                          {row.solved}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[13px] font-medium font-mono ${row.hl ? "text-[#2563eb] dark:text-[#4d8dff]" : "text-[#555] dark:text-[#a0a0a8]"}`}
                    >
                      {row.score}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* SECTION 4: DISCUSSION */}
        <div className="pb-[100px]">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff] border border-transparent">
              Community
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              Every problem, many perspectives.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              Discuss your approach, get code reviewed, discover a DP solution
              where you used brute force. The discussion board is where real
              learning happens.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-8 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff] border border-transparent">
                Discussion Board
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Learn from every solution
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                For every problem, a threaded discussion where the community
                shares and debates approaches — from brute force to O(log n)
                optimizations.
              </p>

              <div className="flex flex-col gap-2.5 mt-5">
                <div className="bg-[#f0efe9] dark:bg-[#1a1c24] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-medium bg-[#eff4ff] dark:bg-[#4d8dff]/10 text-[#2563eb] dark:text-[#4d8dff]">
                      JC
                    </div>
                    <span className="text-[12px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                      john_coder
                    </span>
                    <span className="text-[11px] text-[#888] dark:text-[#555]">
                      2h ago
                    </span>
                  </div>
                  <div className="text-[13px] text-[#555] dark:text-[#a0a0a8] leading-[1.6]">
                    Here's my DFS approach — runs in{" "}
                    <code className="bg-white dark:bg-[#13151a] px-1.5 py-[1px] rounded text-[12px] font-mono text-[#2563eb] dark:text-[#4d8dff]">
                      O(V+E)
                    </code>
                    . Anyone see a way to squeeze the inner loop? It hits TLE on
                    test 46 specifically.
                  </div>
                </div>

                <div className="bg-[#f0efe9] dark:bg-[#1a1c24] rounded-r-2xl p-4 ml-7 border-l-2 border-[#2563eb] dark:border-[#4d8dff] pl-[18px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-medium bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e]">
                      MT
                    </div>
                    <span className="text-[12px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                      maria_tech
                    </span>
                    <span className="text-[11px] text-[#888] dark:text-[#555]">
                      1h ago
                    </span>
                  </div>
                  <div className="text-[13px] text-[#555] dark:text-[#a0a0a8] leading-[1.6]">
                    Use Dijkstra instead — you get{" "}
                    <code className="bg-white dark:bg-[#13151a] px-1.5 py-[1px] rounded text-[12px] font-mono text-[#2563eb] dark:text-[#4d8dff]">
                      O(E log V)
                    </code>
                    . Your DFS revisits nodes. Try keeping a{" "}
                    <code className="bg-white dark:bg-[#13151a] px-1.5 py-[1px] rounded text-[12px] font-mono text-[#2563eb] dark:text-[#4d8dff]">
                      dist[]
                    </code>{" "}
                    array and skip nodes already settled.
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-4 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f0efe9] dark:bg-[#1a1c24] text-[#555] dark:text-[#a0a0a8] border border-black/10 dark:border-white/10">
                Activity
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Your contribution streak
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65] mb-0">
                Solving and discussing problems daily builds your streak and
                reputation score.
              </p>

              <div className="grid grid-cols-[repeat(26,1fr)] gap-[3px] mt-5">
                {hmLevels.map((l, i) => {
                  let bg = "bg-[#f0efe9] dark:bg-[#1a1c24]";
                  if (l === 1) bg = "bg-blue-600/20";
                  if (l === 2) bg = "bg-blue-600/45";
                  if (l === 3) bg = "bg-blue-600/70";
                  if (l === 4) bg = "bg-blue-600";
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-[3px] ${bg}`}
                    ></div>
                  );
                })}
              </div>

              <div className="mt-3.5 flex justify-between items-center">
                <div className="text-[12px] text-[#888] dark:text-[#555]">
                  Past 6 months
                </div>
                <div className="text-[13px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                  148-day streak 🔥
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* SECTION 5: CUSTOM LISTS */}
        <div className="pb-[100px]">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f5f3ff] dark:bg-[#a78bfa]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-transparent">
              Custom Lists
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              Structure your own prep.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              Build and follow curated problem lists. Use community-made lists
              or craft your own — organize by company, interview round, or topic
              deep-dive.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-6 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f5f3ff] dark:bg-[#a78bfa]/10 text-[#7c3aed] dark:text-[#a78bfa] border border-transparent">
                Your Lists
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Learning paths, your way
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Track progress across any list. Pin lists to your dashboard and
                pick up exactly where you left off.
              </p>

              <div className="flex flex-col gap-3.5 mt-6">
                <div className="bg-[#f0efe9] dark:bg-[#1a1c24] rounded-[14px] p-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <div>
                      <div className="text-[14px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                        FAANG Interview Prep
                      </div>
                      <div className="text-[12px] text-[#888] dark:text-[#555] mt-0.5">
                        75 problems · Google focus
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24] border border-transparent">
                      60%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white dark:bg-[#13151a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-[#d97706] dark:bg-[#fbbf24]"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-[#f0efe9] dark:bg-[#1a1c24] rounded-[14px] p-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <div>
                      <div className="text-[14px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                        DP Mastery Series
                      </div>
                      <div className="text-[12px] text-[#888] dark:text-[#555] mt-0.5">
                        50 problems · All patterns
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-white dark:bg-[#13151a] text-[#555] dark:text-[#a0a0a8] border border-transparent">
                      25%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white dark:bg-[#13151a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-[#7c3aed] dark:bg-[#a78bfa]"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-[#f0efe9] dark:bg-[#1a1c24] rounded-[14px] p-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <div>
                      <div className="text-[14px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                        Arrays & Strings
                      </div>
                      <div className="text-[12px] text-[#888] dark:text-[#555] mt-0.5">
                        30 problems · Foundation
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#f0fdf4] dark:bg-[#22c55e]/10 text-[#16a34a] dark:text-[#22c55e] border border-transparent">
                      100%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white dark:bg-[#13151a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-[#16a34a] dark:bg-[#22c55e]"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-6 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24] border border-transparent">
                Analytics
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Difficulty spread at a glance
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                See exactly how your problem-solving distributes across Easy,
                Medium, and Hard — and where to push next.
              </p>

              <div className="flex gap-4 mt-6 items-end h-[140px]">
                {[
                  {
                    label: "Easy",
                    count: "180",
                    h: "88%",
                    color: "bg-[#16a34a] dark:bg-[#22c55e]",
                    textColor: "text-[#16a34a] dark:text-[#22c55e]",
                  },
                  {
                    label: "Medium",
                    count: "250",
                    h: "66%",
                    color: "bg-[#d97706] dark:bg-[#fbbf24]",
                    textColor: "text-[#d97706] dark:text-[#fbbf24]",
                  },
                  {
                    label: "Hard",
                    count: "70",
                    h: "22%",
                    color: "bg-[#e11d48] dark:bg-[#fb7185]",
                    textColor: "text-[#e11d48] dark:text-[#fb7185]",
                  },
                  {
                    label: "Total",
                    count: "500",
                    h: "100%",
                    color: "bg-blue-600 dark:bg-blue-400",
                    textColor: "text-blue-600 dark:text-blue-400",
                  },
                ].map((bar, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="flex-1 w-full flex items-end">
                      <div
                        className={`w-full ${bar.color} rounded-t-md transition-all duration-1000`}
                        style={{ height: bar.h }}
                      ></div>
                    </div>
                    <div className={`text-[11px] font-medium ${bar.textColor}`}>
                      {bar.label}
                    </div>
                    <div className="text-[12px] text-[#0d0d0d] dark:text-[#f0f0ee] font-medium font-mono">
                      {bar.count}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-2.5">
                <div className="flex-1 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-xl p-3.5 text-center">
                  <div className="text-[22px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee] tracking-[-0.02em]">
                    74%
                  </div>
                  <div className="text-[11px] text-[#888] dark:text-[#555] mt-1">
                    Acceptance rate
                  </div>
                </div>
                <div className="flex-1 bg-[#f0efe9] dark:bg-[#1a1c24] rounded-xl p-3.5 text-center">
                  <div className="text-[22px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee] tracking-[-0.02em]">
                    +12%
                  </div>
                  <div className="text-[11px] text-[#888] dark:text-[#555] mt-1">
                    vs. global avg
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* SECTION 6: RANKING */}
        <div className="pb-[100px]">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185] border border-transparent">
              Ranks & Reputation
            </span>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] leading-[1.1] mt-4">
              Earn your rank. Wear it.
            </h2>
            <p className="text-[17px] text-[#555] dark:text-[#a0a0a8] max-w-[520px] mx-auto mt-4 leading-[1.6]">
              Solve problems, win contests, and climb a reputation ladder that
              actually means something. Every badge you earn is tied to real
              performance.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-0">
            {/* Left Bento */}
            <Reveal className="col-span-12 md:col-span-5 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fff1f2] dark:bg-[#fb7185]/10 text-[#e11d48] dark:text-[#fb7185] border border-transparent">
                Rank Tiers
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Seven tiers. One ladder.
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65] mb-0">
                Your global rating from contests and problem-solving places you
                in a tier. Flaunt your skills to the world.
              </p>

              <div className="flex flex-col gap-2 mt-5">
                {[
                  {
                    icon: "🌱",
                    iconBg: "bg-[#f0efe9] dark:bg-[#1a1c24]",
                    name: "Trainee",
                    req: "0 – 1199 rating",
                    style: "border-[#888] dark:border-[#555] opacity-50",
                  },
                  {
                    icon: "⚡",
                    iconBg: "bg-[#f0fdf4] dark:bg-[#22c55e]/10",
                    name: "Soldier",
                    req: "1200 – 1399",
                    style: "border-black/10 dark:border-white/10",
                  },
                  {
                    icon: "🔷",
                    iconBg: "bg-[#eff4ff] dark:bg-[#4d8dff]/10",
                    name: "Lieutenant",
                    req: "1400 – 1599",
                    style:
                      "border-[#2563eb] dark:border-[#4d8dff] bg-[#eff4ff] dark:bg-[#4d8dff]/10",
                    current: true,
                  },
                  {
                    icon: "🌀",
                    iconBg: "bg-[#f5f3ff] dark:bg-[#a78bfa]/10",
                    name: "Colonel",
                    req: "1600 – 1799",
                    style: "border-black/10 dark:border-white/10",
                  },
                  {
                    icon: "🔥",
                    iconBg: "bg-[#fff1f2] dark:bg-[#fb7185]/10",
                    name: "Brigadier",
                    req: "1800 - 1999",
                    style: "border-black/10 dark:border-white/10",
                  },
                  {
                    icon: "🔱",
                    iconBg: "bg-[#fffbeb] dark:bg-[#fbbf24]/10",
                    name: "Major General",
                    req: "2000 - 2499",
                    style: "border-black/10 dark:border-white/10",
                  },
                  {
                    icon: "👑",
                    iconBg: "bg-[#fefce8] dark:bg-[#facc15]/10",
                    name: "Commander-in-Chief",
                    req: "2500+",
                    style: "border-[#ca8a04] dark:border-[#facc15]",
                  },
                ].map((tier, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3.5 px-4.5 rounded-xl border ${tier.style}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-[18px] shrink-0 ${tier.iconBg}`}
                      >
                        {tier.icon}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                          {tier.name}
                        </div>
                        <div className="text-[12px] text-[#888] dark:text-[#555]">
                          {tier.req}
                        </div>
                      </div>
                    </div>
                    {tier.current && (
                      <div className="text-[12px] font-medium text-blue-600 dark:text-blue-400">
                        Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Right Bento */}
            <Reveal
              delay={100}
              className="col-span-12 md:col-span-7 bg-white dark:bg-[#13151a] border border-black/10 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden"
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-[0.06em] uppercase bg-[#fffbeb] dark:bg-[#fbbf24]/10 text-[#d97706] dark:text-[#fbbf24] border border-transparent">
                Achievements
              </span>
              <h3 className="text-[22px] font-medium tracking-[-0.02em] mt-4 mb-2.5">
                Badges tied to real milestones
              </h3>
              <p className="text-[14px] text-[#555] dark:text-[#a0a0a8] leading-[1.65]">
                Every badge requires you to prove something — no participation
                trophies. Locked badges show exactly what you need to do to
                unlock them.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 mt-5">
                {[
                  {
                    icon: "⚡",
                    name: "Speed Demon",
                    desc: "Solved in top 10% time",
                  },
                  {
                    icon: "🏆",
                    name: "Contest Winner",
                    desc: "Ranked #1 in a contest",
                  },
                  {
                    icon: "🔥",
                    name: "100-Day Streak",
                    desc: "Solved daily for 100 days",
                  },
                  {
                    icon: "🦉",
                    name: "Night Owl",
                    desc: "Solve 25 problems after midnight",
                  },
                  {
                    icon: "🩸",
                    name: "First Blood",
                    desc: "First to solve in a contest",
                  },
                  {
                    icon: "🤝",
                    name: "Community Pillar",
                    desc: "50 upvotes on discussions",
                  },
                  {
                    icon: "🌀",
                    name: "DP Wizard",
                    desc: "Solve 50 DP problems",
                    locked: true,
                  },
                  {
                    icon: "🔱",
                    name: "Graph Master",
                    desc: "Complete graph track",
                    locked: true,
                  },
                  {
                    icon: "🧮",
                    name: "Math Genius",
                    desc: "Solve 50 Math problems",
                    locked: true,
                  },
                  {
                    icon: "🐛",
                    name: "Bug Squasher",
                    desc: "Get AC after 5+ failed attempts",
                    locked: true,
                  },
                  {
                    icon: "💎",
                    name: "Apex Predator",
                    desc: "Reach 2500 rating",
                    locked: true,
                  },
                  {
                    icon: "👑",
                    name: "Legendary",
                    desc: "Top 10 rank site wide",
                    locked: true,
                  },
                ].map((b, i) => (
                  <div
                    key={i}
                    className={`bg-[#f0efe9] dark:bg-[#1a1c24] rounded-xl p-4 text-center border border-black/10 dark:border-white/10 ${b.locked ? "opacity-35" : ""}`}
                  >
                    <span className="text-[28px] block mb-2">{b.icon}</span>
                    <div className="text-[12px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee]">
                      {b.name}
                    </div>
                    <div className="text-[11px] text-[#888] dark:text-[#555] mt-1">
                      {b.desc}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* CTA */}
        <div className="py-[60px] pt-0">
          <Reveal className="mb-12 bg-slate-900 flex flex-col justify-center items-center dark:bg-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl dark:shadow-none border border-transparent dark:border-slate-700 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
            <h2 className="text-[clamp(36px,5vw,56px)] font-medium tracking-[-0.025em] text-white mb-5">
              Ready to start your journey?
            </h2>
            <p className="text-[18px] text-white/75 max-w-[500px] mx-auto mb-10 leading-[1.6]">
              Join thousands of competitive programmers who are getting better
              every day on Algorhythm.
            </p>
            <button
              onClick={() => navigate("/auth")}
              className="bg-white text-blue-600 border-none px-10 py-4 rounded-full text-[16px] font-medium cursor-pointer transition-all hover:scale-105"
            >
              Create a free account
            </button>
          </Reveal>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-black/10 dark:border-white/10 pt-[60px] pb-10 bg-white dark:bg-[#13151a]">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-[30px] h-[30px] bg-blue-600 rounded-lg flex items-center justify-center text-white text-[14px] font-medium">
                  A
                </div>
                <span className="text-[18px] font-medium text-[#0d0d0d] dark:text-[#f0f0ee] m-0">
                  Algorhythm
                </span>
              </div>
              <div className="text-[13px] text-[#888] dark:text-[#555] leading-[1.7] max-w-[240px]">
                The minimalist arena for competitive programmers. Built for
                speed, depth, and community.
              </div>
            </div>
            <div className="flex flex-col">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888] dark:text-[#555] mb-4">
                Platform
              </h4>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Problems
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Contests
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Leaderboard
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Discuss
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Lists
              </a>
            </div>
            <div className="flex flex-col">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888] dark:text-[#555] mb-4">
                Resources
              </h4>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Blogs
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Editorial
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                API Docs
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Changelog
              </a>
            </div>
            <div className="flex flex-col">
              <h4 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888] dark:text-[#555] mb-4">
                Company
              </h4>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                About
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-[14px] text-[#555] dark:text-[#a0a0a8] no-underline mb-2.5 hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-black/10 dark:border-white/10">
            <div className="text-[13px] text-[#888] dark:text-[#555]">
              © 2026 Algorhythm. All rights reserved.
            </div>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-[13px] text-[#888] dark:text-[#555] no-underline hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-[13px] text-[#888] dark:text-[#555] no-underline hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                GitHub
              </a>
              <a
                href="#"
                className="text-[13px] text-[#888] dark:text-[#555] no-underline hover:text-[#0d0d0d] dark:hover:text-[#f0f0ee] transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
