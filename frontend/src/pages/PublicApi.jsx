import React, { useState } from 'react';

function PublicApi() {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeLang, setActiveLang] = useState('JavaScript');

  const handleCopyJson = () => {
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeExamples[activeLang].raw);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeExamples = {
    JavaScript: {
      raw: `const username = "algo_neha";\nfetch(\`https://api.algorhythm.com/v1/users/\${username}\`)\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`,
      formatted: (
        <>
          <span className="text-purple-400">const</span> <span className="text-blue-400">username</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">"algo_neha"</span><span className="text-slate-400">;</span><br/>
          <span className="text-blue-400">fetch</span><span className="text-slate-400">(`</span><span className="text-emerald-400">https://api.algorhythm.com/v1/users/</span><span className="text-blue-400">{"${username}"}</span><span className="text-slate-400">`)</span><br/>
          <span className="text-slate-400">  .</span><span className="text-blue-400">then</span><span className="text-slate-400">(</span><span className="text-orange-400">response</span> <span className="text-purple-400">=&gt;</span> <span className="text-orange-400">response</span><span className="text-slate-400">.</span><span className="text-blue-400">json</span><span className="text-slate-400">())</span><br/>
          <span className="text-slate-400">  .</span><span className="text-blue-400">then</span><span className="text-slate-400">(</span><span className="text-orange-400">data</span> <span className="text-purple-400">=&gt;</span> <span className="text-slate-400">console.</span><span className="text-blue-400">log</span><span className="text-slate-400">(data))</span><br/>
          <span className="text-slate-400">  .</span><span className="text-blue-400">catch</span><span className="text-slate-400">(</span><span className="text-orange-400">error</span> <span className="text-purple-400">=&gt;</span> <span className="text-slate-400">console.</span><span className="text-blue-400">error</span><span className="text-slate-400">(</span><span className="text-emerald-400">'Error:'</span><span className="text-slate-400">, error));</span>
        </>
      )
    },
    Python: {
      raw: `import requests\n\nusername = "algo_neha"\nurl = f"https://api.algorhythm.com/v1/users/{username}"\n\nresponse = requests.get(url)\nif response.status_code == 200:\n    print(response.json())\nelse:\n    print("Error:", response.status_code)`,
      formatted: (
        <>
          <span className="text-purple-400">import</span> <span className="text-slate-300">requests</span><br/><br/>
          <span className="text-blue-400">username</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">"algo_neha"</span><br/>
          <span className="text-blue-400">url</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">f"https://api.algorhythm.com/v1/users/</span><span className="text-blue-400">{"{username}"}</span><span className="text-emerald-400">"</span><br/><br/>
          <span className="text-orange-400">response</span> <span className="text-slate-400">=</span> <span className="text-slate-300">requests.</span><span className="text-blue-400">get</span><span className="text-slate-400">(url)</span><br/>
          <span className="text-purple-400">if</span> <span className="text-orange-400">response</span><span className="text-slate-400">.status_code ==</span> <span className="text-orange-400">200</span><span className="text-slate-400">:</span><br/>
          <span className="text-slate-400">    </span><span className="text-blue-400">print</span><span className="text-slate-400">(</span><span className="text-orange-400">response</span><span className="text-slate-400">.</span><span className="text-blue-400">json</span><span className="text-slate-400">())</span><br/>
          <span className="text-purple-400">else</span><span className="text-slate-400">:</span><br/>
          <span className="text-slate-400">    </span><span className="text-blue-400">print</span><span className="text-slate-400">(</span><span className="text-emerald-400">"Error:"</span><span className="text-slate-400">, </span><span className="text-orange-400">response</span><span className="text-slate-400">.status_code)</span>
        </>
      )
    },
    Go: {
      raw: `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n)\n\nfunc main() {\n\turl := "https://api.algorhythm.com/v1/users/algo_neha"\n\tresp, err := http.Get(url)\n\tif err != nil {\n\t\tfmt.Println("Error:", err)\n\t\treturn\n\t}\n\tdefer resp.Body.Close()\n\tbody, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(body))\n}`,
      formatted: (
        <>
          <span className="text-purple-400">package</span> <span className="text-slate-300">main</span><br/><br/>
          <span className="text-purple-400">import</span> <span className="text-slate-400">(</span><br/>
          <span className="text-slate-400">    </span><span className="text-emerald-400">"fmt"</span><br/>
          <span className="text-slate-400">    </span><span className="text-emerald-400">"io"</span><br/>
          <span className="text-slate-400">    </span><span className="text-emerald-400">"net/http"</span><br/>
          <span className="text-slate-400">)</span><br/><br/>
          <span className="text-purple-400">func</span> <span className="text-blue-400">main</span><span className="text-slate-400">() {"{"}</span><br/>
          <span className="text-slate-400">    url := </span><span className="text-emerald-400">"https://api.algorhythm.com/v1/users/algo_neha"</span><br/>
          <span className="text-slate-400">    resp, err := http.</span><span className="text-blue-400">Get</span><span className="text-slate-400">(url)</span><br/>
          <span className="text-purple-400">    if</span> <span className="text-slate-400">err !=</span> <span className="text-purple-400">nil</span> <span className="text-slate-400">{"{"}</span><br/>
          <span className="text-slate-400">        fmt.</span><span className="text-blue-400">Println</span><span className="text-slate-400">(</span><span className="text-emerald-400">"Error:"</span><span className="text-slate-400">, err)</span><br/>
          <span className="text-purple-400">        return</span><br/>
          <span className="text-slate-400">    {"}"}</span><br/>
          <span className="text-purple-400">    defer</span> <span className="text-slate-400">resp.Body.</span><span className="text-blue-400">Close</span><span className="text-slate-400">()</span><br/>
          <span className="text-slate-400">    body, _ := io.</span><span className="text-blue-400">ReadAll</span><span className="text-slate-400">(resp.Body)</span><br/>
          <span className="text-slate-400">    fmt.</span><span className="text-blue-400">Println</span><span className="text-slate-400">(</span><span className="text-blue-400">string</span><span className="text-slate-400">(body))</span><br/>
          <span className="text-slate-400">{"}"}</span>
        </>
      )
    },
    Dart: {
      raw: `import 'package:http/http.dart' as http;\nimport 'dart:convert';\n\nvoid main() async {\n  var username = 'algo_neha';\n  var url = Uri.parse('https://api.algorhythm.com/v1/users/$username');\n  \n  var response = await http.get(url);\n  if (response.statusCode == 200) {\n    print(jsonDecode(response.body));\n  } else {\n    print('Request failed with status: \${response.statusCode}.');\n  }\n}`,
      formatted: (
        <>
          <span className="text-purple-400">import</span> <span className="text-emerald-400">'package:http/http.dart'</span> <span className="text-purple-400">as</span> <span className="text-slate-300">http</span><span className="text-slate-400">;</span><br/>
          <span className="text-purple-400">import</span> <span className="text-emerald-400">'dart:convert'</span><span className="text-slate-400">;</span><br/><br/>
          <span className="text-purple-400">void</span> <span className="text-blue-400">main</span><span className="text-slate-400">()</span> <span className="text-purple-400">async</span> <span className="text-slate-400">{"{"}</span><br/>
          <span className="text-purple-400">  var</span> <span className="text-orange-400">username</span> <span className="text-slate-400">=</span> <span className="text-emerald-400">'algo_neha'</span><span className="text-slate-400">;</span><br/>
          <span className="text-purple-400">  var</span> <span className="text-orange-400">url</span> <span className="text-slate-400">= Uri.</span><span className="text-blue-400">parse</span><span className="text-slate-400">(</span><span className="text-emerald-400">'https://api.algorhythm.com/v1/users/</span><span className="text-blue-400">$username</span><span className="text-emerald-400">'</span><span className="text-slate-400">);</span><br/><br/>
          <span className="text-purple-400">  var</span> <span className="text-orange-400">response</span> <span className="text-slate-400">=</span> <span className="text-purple-400">await</span> <span className="text-slate-300">http.</span><span className="text-blue-400">get</span><span className="text-slate-400">(url);</span><br/>
          <span className="text-purple-400">  if</span> <span className="text-slate-400">(</span><span className="text-orange-400">response</span><span className="text-slate-400">.statusCode ==</span> <span className="text-orange-400">200</span><span className="text-slate-400">) {"{"}</span><br/>
          <span className="text-slate-400">    </span><span className="text-blue-400">print</span><span className="text-slate-400">(</span><span className="text-blue-400">jsonDecode</span><span className="text-slate-400">(</span><span className="text-orange-400">response</span><span className="text-slate-400">.body));</span><br/>
          <span className="text-slate-400">  {"}"}</span> <span className="text-purple-400">else</span> <span className="text-slate-400">{"{"}</span><br/>
          <span className="text-slate-400">    </span><span className="text-blue-400">print</span><span className="text-slate-400">(</span><span className="text-emerald-400">'Request failed with status: '</span> <span className="text-slate-400">+</span> <span className="text-orange-400">response</span><span className="text-slate-400">.statusCode.</span><span className="text-blue-400">toString</span><span className="text-slate-400">() +</span> <span className="text-emerald-400">'.'</span><span className="text-slate-400">);</span><br/>
          <span className="text-slate-400">  {"}"}</span><br/>
          <span className="text-slate-400">{"}"}</span>
        </>
      )
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans transition-colors duration-300 text-slate-900 dark:text-slate-100 pb-24 overflow-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-16 md:pt-32 md:pb-20 px-4 sm:px-6">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[11px] font-black uppercase tracking-widest mb-6 border border-blue-100 dark:border-blue-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
            Algorhythm Public API v1.0
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight transition-colors">
            Build with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Algorhythm</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed transition-colors">
            Integrate your coding journey into personal portfolios, discord bots, or custom dashboards. Fetch real-time stats, ratings, and submission history.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Endpoint Card */}
          <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">REST Endpoint</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">Fetch public user data via standard GET requests.</p>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0a0b0f] border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-xl overflow-x-auto custom-scrollbar">
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                GET
              </span>
              <code className="text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                https://api.algorhythm.com/v1/users/<span className="text-blue-500 dark:text-blue-400">{"{username}"}</span>
              </code>
            </div>
          </div>

          {/* Rate Limit Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 border border-amber-100 dark:border-amber-500/20 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Rate Limits</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              To ensure platform stability, the public API is strictly limited to <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded">30 requests / hour</span> per IP address.
            </p>
          </div>
        </div>

        {/* Documentation / Code Block Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden transition-colors mb-8">
          
          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            
            {/* Left Sidebar: Schema Info */}
            <div className="lg:col-span-4 p-8 md:p-10 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-8">Response Schema</h3>
              
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white">solved_stats</h4>
                    <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20">Object</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Breakdown of problems solved by difficulty (Easy, Medium, Hard) and total count.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white">contest_rating</h4>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Integer</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    The user's current Elo rating in the Algorhythm arena. Updates automatically after rated events.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white">global_ranks</h4>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Object</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    Contains the user's global standing overall and specifically within contest ladders.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white">recent_ac_submissions</h4>
                    <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-500/20">Array</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    A list of the user's last 5 accepted (AC) solutions, including problem IDs and timestamps.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel: JSON Example */}
            <div className="lg:col-span-8 p-6 md:p-8 bg-[#0a0b0f] relative group">
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={handleCopyJson}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                  title="Copy JSON"
                >
                  {copiedJson ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
                <span className="text-[11px] font-mono text-slate-500 ml-2">response.json</span>
              </div>

              <pre className="text-[13px] leading-relaxed font-mono overflow-x-auto custom-scrollbar p-2">
<span className="text-slate-400">{"{"}</span>
  <span className="text-blue-400">"status"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"success"</span><span className="text-slate-400">,</span>
  <span className="text-blue-400">"data"</span><span className="text-slate-400">: {"{"}</span>
    <span className="text-blue-400">"username"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"algo_neha"</span><span className="text-slate-400">,</span>
    <span className="text-blue-400">"acceptance_rate"</span><span className="text-slate-400">:</span> <span className="text-orange-400">74.2</span><span className="text-slate-400">,</span>
    <span className="text-blue-400">"contest_rating"</span><span className="text-slate-400">:</span> <span className="text-orange-400">2104</span><span className="text-slate-400">,</span>
    <span className="text-blue-400">"global_ranks"</span><span className="text-slate-400">: {"{"}</span>
      <span className="text-blue-400">"overall"</span><span className="text-slate-400">:</span> <span className="text-orange-400">42</span><span className="text-slate-400">,</span>
      <span className="text-blue-400">"contest"</span><span className="text-slate-400">:</span> <span className="text-orange-400">18</span>
    <span className="text-slate-400">{"},"}</span>
    <span className="text-blue-400">"solved_stats"</span><span className="text-slate-400">: {"{"}</span>
      <span className="text-blue-400">"total"</span><span className="text-slate-400">:</span> <span className="text-orange-400">345</span><span className="text-slate-400">,</span>
      <span className="text-blue-400">"easy"</span><span className="text-slate-400">:</span> <span className="text-orange-400">150</span><span className="text-slate-400">,</span>
      <span className="text-blue-400">"medium"</span><span className="text-slate-400">:</span> <span className="text-orange-400">145</span><span className="text-slate-400">,</span>
      <span className="text-blue-400">"hard"</span><span className="text-slate-400">:</span> <span className="text-orange-400">50</span>
    <span className="text-slate-400">{"},"}</span>
    <span className="text-blue-400">"recent_ac_submissions"</span><span className="text-slate-400">: [</span>
      <span className="text-slate-400">{"{"}</span>
        <span className="text-blue-400">"problem_id"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"DP-104"</span><span className="text-slate-400">,</span>
        <span className="text-blue-400">"title"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"Longest Palindromic Substring"</span><span className="text-slate-400">,</span>
        <span className="text-blue-400">"difficulty"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"Medium"</span><span className="text-slate-400">,</span>
        <span className="text-blue-400">"language"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"cpp"</span><span className="text-slate-400">,</span>
        <span className="text-blue-400">"timestamp"</span><span className="text-slate-400">:</span> <span className="text-emerald-400">"2026-04-07T21:15:00Z"</span>
      <span className="text-slate-400">{"}"},</span>
      <span className="text-slate-500 italic">... (4 more entries)</span>
    <span className="text-slate-400">]</span>
  <span className="text-slate-400">{"}"}</span>
<span className="text-slate-400">{"}"}</span>
              </pre>
            </div>
          </div>
        </div>

        {/* Integration Examples Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden transition-colors">
          <div className="p-8 md:p-10 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Integration Examples</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ready-to-use snippets to fetch user data in your favorite language.</p>
            </div>
            
            {/* Language Tabs */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0a0b0f] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
              {Object.keys(codeExamples).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeLang === lang
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#0a0b0f] relative group min-h-[300px]">
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all"
                title="Copy code"
              >
                {copiedCode ? (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></div>
              <span className="text-[11px] font-mono text-slate-500 ml-2">
                {activeLang === 'JavaScript' ? 'fetch_user.js' : activeLang === 'Python' ? 'fetch_user.py' : activeLang === 'Go' ? 'fetch_user.go' : 'fetch_user.dart'}
              </span>
            </div>

            <pre className="text-[13px] leading-[1.7] font-mono overflow-x-auto custom-scrollbar p-2">
              {codeExamples[activeLang].formatted}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PublicApi;