// import { useEffect, useState } from "react";
// import { api } from "../api/client";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";

// export default function Contests() {
//   const { user, loading: authLoading } = useAuth();
//   const navigate = useNavigate();

//   const [upcoming, setUpcoming] = useState([]);
//   const [running, setRunning] = useState([]);
//   const [past, setPast] = useState([]);

//   const [registered, setRegistered] = useState({});
//   const [loading, setLoading] = useState(true);

//   const [form, setForm] = useState({
//     name: "",
//     start_time: "",
//     end_time: "",
//     duration_minutes: "",
//     problems: "",
//   });

//   /* =========================
//      Auth redirect
//   ========================= */
//   useEffect(() => {
//     if (!authLoading && !user) {
//       navigate("/auth");
//     }
//   }, [authLoading, user, navigate]);

//   /* =========================
//      Load contests (SAFE EXTENSION)
//   ========================= */
//   async function loadContests() {
//     setLoading(true);

//     const [u, r, p] = await Promise.all([
//       api.get("/contests?status=upcoming"),
//       api.get("/contests?status=running"),
//       api.get("/contests?status=past"),
//     ]);

//     setUpcoming(u.data);
//     setRunning(r.data);
//     setPast(p.data.slice(0, 5)); // last 5 only

//     // 🔒 KEEP REGISTRATION LOGIC UNCHANGED
//     const all = [...u.data, ...r.data];
//     const status = {};

//     for (const c of all) {
//       const res = await api.get(
//         `/contests/${c.id}/registration-status`
//       );
//       status[c.id] = res.data.registered;
//     }

//     setRegistered(status);
//     setLoading(false);
//   }

//   useEffect(() => {
//     if (!authLoading && user) {
//       loadContests();
//     }
//   }, [authLoading, user]);

//   /* =========================
//      Register
//   ========================= */
//   async function register(contestId) {
//     await api.post(`/contests/${contestId}/register`);
//     alert("Registered successfully");
//     loadContests();
//   }

//   /* =========================
//      Create contest
//   ========================= */
//   async function createContest(e) {
//     e.preventDefault();

//     await api.post("/contests", {
//       name: form.name,
//       start_time: form.start_time,
//       end_time: form.end_time,
//       duration_minutes: Number(form.duration_minutes),
//       problems: form.problems
//         .split(",")
//         .map((x) => Number(x.trim())),
//     });

//     alert("Contest created");
//     setForm({
//       name: "",
//       start_time: "",
//       end_time: "",
//       duration_minutes: "",
//       problems: "",
//     });

//     loadContests();
//   }

//   if (authLoading) return <p>Checking authentication…</p>;
//   if (loading) return <p>Loading contests…</p>;

//   return (
//     <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
//       <h1>Contests</h1>

//       {/* ================= CREATE ================= */}
//       <section>
//         <h2>Create Contest</h2>
//         <form onSubmit={createContest}>
//           <input
//             placeholder="Contest name"
//             value={form.name}
//             onChange={(e) =>
//               setForm({ ...form, name: e.target.value })
//             }
//           />
//           <br />

//           <input
//             type="datetime-local"
//             value={form.start_time}
//             onChange={(e) =>
//               setForm({ ...form, start_time: e.target.value })
//             }
//           />
//           <br />

//           <input
//             type="datetime-local"
//             value={form.end_time}
//             onChange={(e) =>
//               setForm({ ...form, end_time: e.target.value })
//             }
//           />
//           <br />

//           <input
//             placeholder="Duration (minutes)"
//             value={form.duration_minutes}
//             onChange={(e) =>
//               setForm({
//                 ...form,
//                 duration_minutes: e.target.value,
//               })
//             }
//           />
//           <br />

//           <input
//             placeholder="Problem IDs (1,2,3)"
//             value={form.problems}
//             onChange={(e) =>
//               setForm({ ...form, problems: e.target.value })
//             }
//           />
//           <br />

//           <button>Create Contest</button>
//         </form>
//       </section>

//       <hr />

//       {/* ================= RUNNING ================= */}
//       <section>
//         <h2>Ongoing Contests</h2>

//         {running.length === 0 && <p>No ongoing contests</p>}

//         {running.map((c) => (
//           <div key={c.id} style={{ border: "1px solid #ccc", padding: 12 }}>
//             <h3>{c.name}</h3>

//             {registered[c.id] ? (
//               <button
//                 onClick={() =>
//                   navigate(`/contests/${c.id}/problems`)
//                 }
//               >
//                 Enter Contest
//               </button>
//             ) : (
//               <button onClick={() => register(c.id)}>
//                 Register
//               </button>
//             )}
//           </div>
//         ))}
//       </section>

//       <hr />

//       {/* ================= UPCOMING ================= */}
//       <section>
//         <h2>Upcoming Contests</h2>

//         {upcoming.length === 0 && <p>No upcoming contests</p>}

//         {upcoming.map((c) => (
//           <div key={c.id} style={{ border: "1px solid #ddd", padding: 12 }}>
//             <h3>{c.name}</h3>
//             <p>
//               Starts:{" "}
//               {new Date(c.start_time).toLocaleString()}
//             </p>

//             {registered[c.id] ? (
//               <span>Registered</span>
//             ) : (
//               <button onClick={() => register(c.id)}>
//                 Register
//               </button>
//             )}
//           </div>
//         ))}
//       </section>

//       <hr />

//       {/* ================= PAST ================= */}
//       <section>
//         <h2>Past Contests</h2>

//         {past.length === 0 && <p>No past contests</p>}

//         {past.map((c) => (
//           <div
//             key={c.id}
//             style={{
//               border: "1px solid #eee",
//               padding: 12,
//               background: "#f9f9f9",
//             }}
//           >
//             <h3>{c.name}</h3>
//             <p>
//               Ended:{" "}
//               {new Date(c.end_time).toLocaleString()}
//             </p>

//             <button
//               onClick={() =>
//                 navigate(`/contests/${c.id}`)
//               }
//             >
//               View Results
//             </button>
//           </div>
//         ))}
//       </section>
//     </div>
//   );
// }

import { useEffect, useState, useMemo } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Contests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const [upcoming, setUpcoming] = useState([]);
  const [running, setRunning] = useState([]);
  const [past, setPast] = useState([]);

  const [registered, setRegistered] = useState({});
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    start_time: "",
    end_time: "",
    duration_minutes: "",
    problems: "",
  });

  /* =========================
      Auth redirect
  ========================= */
  const altitudePath = useMemo(() => {
    if (history.length === 0) return "M0,45 L120,45"; // Default flat line
    if (history.length === 1) {
      const y = 60 - ((history[0].rating_after / 3000) * 50 + 5);
      return `M0,${y} L120,${y}`;
    }

    // Map history ratings to SVG coordinates (ViewBox 120x60)
    // Ratings usually range between 800 and 3000.
    // normalize them so the line fits nicely in the HUD.
    const padding = 10;
    const widthPerPoint = 120 / (history.length || 1);

    const points = history.map((entry, i) => {
      const x = i * widthPerPoint;
      // Inverse Y: Higher rating = lower Y value in SVG
      const y = 60 - ((entry.rating_after / 3000) * 50 + 5);
      return `${x},${y}`;
    });

    return `M${points.join(" L")}`;
  }, [history]);

  const getMilitaryRank = (rating) => {
    if (!rating || rating < 1200) return "Trainee";
    if (rating >= 1200 && rating <= 1399) return "Soldier";
    if (rating >= 1400 && rating <= 1599) return "Lieutenant";
    if (rating >= 1600 && rating <= 1799) return "Colonel";
    if (rating >= 1800 && rating <= 1999) return "Brigadier";
    if (rating >= 2000 && rating <= 2499) return "Major General";
    return "Commander-in-Chief"; // 2500+
  };

  async function loadArenaData() {
    setLoading(true);
    try {
      // Parallel fetch for Contests and User HUD Stats
      const [u, r, p, userStats, userHistory] = await Promise.all([
        api.get("/contests?status=upcoming"),
        api.get("/contests?status=running"),
        api.get("/contests?status=past"),
        api.get(`/users/${user.id}/contest-stats`),
        api.get(`/users/${user.id}/contest-rating-history`),
      ]);

      setUpcoming(u.data);
      setRunning(r.data);
      setPast(p.data.slice(-5));
      setStats(userStats.data);
      setHistory(userHistory.data.history);

      //  Handle Registration Status
      const allActive = [...u.data, ...r.data];
      const status = {};
      for (const c of allActive) {
        const res = await api.get(`/contests/${c.id}/registration-status`);
        status[c.id] = res.data.registered;
      }
      setRegistered(status);
    } catch (err) {
      console.error("Arena Data Sync Failed:", err);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!authLoading && user) {
      loadArenaData();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  /* =========================
      Load contests
  ========================= */
  async function loadContests() {
    setLoading(true);

    const [u, r, p] = await Promise.all([
      api.get("/contests?status=upcoming"),
      api.get("/contests?status=running"),
      api.get("/contests?status=past"),
    ]);

    setUpcoming(u.data);
    setRunning(r.data);
    setPast(p.data.slice(p.data.length - 5)); // last 5 only

    const all = [...u.data, ...r.data];
    const status = {};

    for (const c of all) {
      const res = await api.get(`/contests/${c.id}/registration-status`);
      status[c.id] = res.data.registered;
    }

    setRegistered(status);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadContests();
    }
  }, [authLoading, user]);

  /* =========================
      Register
  ========================= */
  async function register(contestId) {
    await api.post(`/contests/${contestId}/register`);
    alert("Registered successfully");
    loadContests();
  }

  /* =========================
      Create contest
  ========================= */
  async function createContest(e) {
    e.preventDefault();

    await api.post("/contests", {
      name: form.name,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: Number(form.duration_minutes),
      problems: form.problems.split(",").map((x) => Number(x.trim())),
    });

    alert("Contest created");
    setForm({
      name: "",
      start_time: "",
      end_time: "",
      duration_minutes: "",
      problems: "",
    });

    loadContests();
  }

  if (authLoading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <p className="text-sky-500 font-black animate-pulse">
          CHECKING AUTHENTICATION...
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <p className="text-sky-500 font-black animate-pulse">
          LOADING ARENA...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-white min-h-screen font-sans">
      {/* --- HERO HEADER --- */}
      <header className="mb-16 relative">
        <div className="absolute -left-4 top-0 w-1.5 h-16 bg-sky-500 rounded-full"></div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
          CONTEST <span className="text-sky-500 uppercase">Arena</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] mt-2 ml-1">
          Algorhythm Contest Engine v2.0
        </p>
      </header>

      {/* --- CREATE CONTEST (ADMIN) --- */}
      <section className="mb-20 relative p-1 rounded-[3rem] bg-gradient-to-tr from-sky-400 to-sky-100 overflow-hidden shadow-2xl shadow-sky-100/50">
        <div className="bg-white rounded-[2.9rem] p-10 lg:p-14">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-1/3">
              <span className="inline-block bg-sky-500 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest mb-6">
                Admin Command Center
              </span>
              <h2 className="text-3xl font-black text-slate-900 mb-4 uppercase">
                Launch New
                <br />
                <span className="text-sky-500">Contest</span>
              </h2>
              <p className="text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-tight opacity-70 italic">
                Authorized personnel only. Trespassers will be shot. Ensure all
                problem IDs are synced with the database before deployment.
              </p>
            </div>

            <div className="lg:w-2/3">
              <form
                onSubmit={createContest}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="md:col-span-2">
                  <input
                    className="w-full bg-sky-50/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none transition-all font-bold placeholder:text-sky-300 text-sky-900"
                    placeholder="Contest name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Start Time
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full bg-sky-50/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none transition-all font-bold text-sky-900"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    End Time
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full bg-sky-50/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none transition-all font-bold text-sky-900"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                  />
                </div>

                <input
                  className="w-full bg-sky-50/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none transition-all font-bold placeholder:text-sky-300 text-sky-900"
                  placeholder="Duration (minutes)"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: e.target.value })
                  }
                />

                <input
                  className="w-full bg-sky-50/50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-sky-500 focus:bg-white outline-none transition-all font-bold placeholder:text-sky-300 text-sky-900"
                  placeholder="Problem IDs (1,2,3)"
                  value={form.problems}
                  onChange={(e) =>
                    setForm({ ...form, problems: e.target.value })
                  }
                />

                <button className="md:col-span-2 bg-slate-900 hover:bg-sky-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl hover:shadow-sky-300 uppercase tracking-widest text-sm mt-2 transform active:scale-[0.98]">
                  Initialize Deployment Sequence
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-20 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 border-2 border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.15)] relative overflow-hidden group">
          <div className="relative flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center p-1 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center font-black text-3xl text-white italic tracking-tighter">
                {user.username?.substring(0, 1).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                  {user.username}
                </h3>
              </div>

              {/* Updated Rank Section with Military Tiers */}
              <p className="text-sky-400 font-black text-xs uppercase tracking-[0.2em] mb-4">
                RANK:{" "}
                {stats?.is_banned ? (
                  <span className="text-rose-500">TERMINATED</span>
                ) : (
                  getMilitaryRank(stats?.contest_rating)
                )}
              </p>

              <div className="flex gap-2">
                {!stats?.is_banned ? (
                  <>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                      GLOBAL RANK: {stats?.contest_global_rank || "---"}
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                      MISSIONS: {stats?.contests_solved || 0}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                      GLOBAL RANK: None
                    </span>
                    <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-700">
                      MISSIONS: None
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Altitude Graph (Live History) */}
        <div className="relative bg-white border-2 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-sm group h-full min-h-[160px]">
        
          <div className="relative z-20 p-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Rating Altitude
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
              </span>
            </div>
            <span className="text-4xl font-black text-slate-900 italic tracking-tighter leading-none">
              {stats?.contest_rating || 0}
            </span> <span className="text-xs font-stretch-semi-condensed text-gray-800 font-bold italic">(max. 1200)</span>
            <p className="text-[10px] font-bold text-emerald-500 uppercase mt-1 leading-none">
              {history.length > 0
                ? `↑ ${history[history.length - 1].rating_change} Gain`
                : ""}
            </p>
          </div>

          {/*  GRAPH LAYER */}
          <svg
            viewBox="0 0 120 60"
            className="w-full h-full absolute inset-0 z-10"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="altitudeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Shaded Area */}
            <path
              d={`${altitudePath} L120,60 L0,60 Z`}
              fill="url(#altitudeGradient)"
              className="transition-all duration-1000"
            />

            
            <path
              d={altitudePath}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="0.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* Efficiency Card (Live Stats) */}
        <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Kill Efficiency
            </span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <span className="text-4xl font-black text-slate-900 italic tracking-tighter">
              {stats?.contest_acceptance_rate || "0.0"}%
            </span>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-1000"
                style={{ width: `${stats?.contest_acceptance_rate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- ONGOING SECTION --- */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-black flex items-center gap-3 italic text-slate-900 uppercase">
            <span className="flex h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse"></span>
            Live Missions
          </h2>
          <div className="h-px flex-grow mx-8 bg-slate-100"></div>
        </div>

        {running.length === 0 ? (
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
            No active deployments detected.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {running.map((c) => (
              <div
                key={c.id}
                className="group relative bg-white border-2 border-sky-100 rounded-[2.5rem] p-10 hover:border-sky-500 transition-all shadow-xl shadow-sky-100/10 overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="px-3 py-1 bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-md mb-4 inline-block">
                    Realtime Active
                  </span>
                  <h3 className="text-3xl font-black text-slate-900 mb-8 max-w-xs leading-none">
                    {c.name}
                  </h3>
                  {registered[c.id] ? (
                    <button
                      onClick={() => navigate(`/contests/${c.id}/problems`)}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-lg shadow-sky-200 uppercase tracking-widest text-xs"
                    >
                      Enter Arena
                    </button>
                  ) : (
                    <button
                      onClick={() => register(c.id)}
                      disabled={stats?.is_banned}
                      className="bg-white border-2 border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-white font-black px-10 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs"
                    >
                      Enlist Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- UPCOMING SECTION --- */}
      <section className="mb-24">
        <h2 className="text-xl font-black mb-8 text-slate-400 italic uppercase">
          Scheduled Ops
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map((c) => (
            <div
              key={c.id}
              className="bg-sky-50/30 border border-sky-100 rounded-3xl p-8 hover:bg-sky-50 transition-all group"
            >
              <h3 className="text-xl font-black text-slate-800 mb-2">
                {c.name}
              </h3>
              <p className="text-xs font-bold text-sky-500 uppercase mb-8 flex items-center gap-2 tracking-tighter">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {new Date(c.start_time).toLocaleString()}
              </p>
              {registered[c.id] ? (
                <div className="w-full py-3.5 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[10px] text-center uppercase tracking-[0.2em] border border-emerald-100">
                  Ready for deployment
                </div>
              ) : (
                <button
                  onClick={() => register(c.id)}
                  className="w-full py-3.5 bg-white border-2 border-sky-200 text-sky-500 hover:bg-sky-500 hover:text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-[0.2em]"
                >
                  Join Mission
                </button>
              )}
            </div>
          ))}
          {upcoming.length === 0 && (
            <p className="text-slate-300 italic">
              No future operations scheduled.
            </p>
          )}
        </div>
      </section>

      {/* --- PAST SECTION --- */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 whitespace-nowrap">
            Historical Logs
          </span>
          <div className="h-px flex-grow bg-slate-100"></div>
        </div>
        <div className="flex flex-wrap gap-4">
          {past.map((c) => (
            <div
              key={c.id}
              className="px-6 py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between min-w-[280px] shadow-sm hover:border-sky-200 transition-all group cursor-pointer"
              onClick={() => navigate(`/contests/${c.id}`)}
            >
              <div>
                <h3 className="font-black text-slate-700 text-sm group-hover:text-sky-500 transition-colors uppercase">
                  {c.name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">
                  Concluded: {new Date(c.end_time).toLocaleDateString()}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-slate-200 group-hover:text-sky-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* --- ENGAGEMENT PROTOCOLS (RULES) --- */}
      <section className="mb-24">
        <div className="flex items-center gap-4 mb-10">
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
            Engagement Protocols
          </h2>
          <div className="h-px flex-grow bg-slate-100"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Rule 1: Format */}
          <div className="p-8 bg-white border-2 border-slate-50 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase mb-3 tracking-tight">
              Standard Loadout
            </h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
              Each official operation consists of exactly{" "}
              <span className="text-sky-500 font-black">
                4 algorithmic challenges
              </span>{" "}
              of varying difficulty.
            </p>
          </div>

          {/* Rule 2: Penalty */}
          <div className="p-8 bg-white border-2 border-slate-50 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase mb-3 tracking-tight">
              Penalty Logic
            </h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
              Ranking is based on solved count. Ties are settled by time
              penalty:{" "}
              <span className="text-amber-500 font-black">10 mins</span> added
              per failed submission.
            </p>
          </div>

          {/* Rule 3: Cheating */}
          <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-[2rem] shadow-sm">
            <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-rose-600 uppercase mb-3 tracking-tight">
              Protocol Zero
            </h3>
            <p className="text-xs font-bold text-rose-400 leading-relaxed uppercase tracking-tight italic">
              Any detected plagiarism or external assistance will result in an{" "}
              <span className="text-rose-600 font-black">
                immediate and permanent ban
              </span>{" "}
              from the Arena.
            </p>
          </div>

          {/* Rule 4: Sharing */}
          <div className="p-8 bg-slate-900 border-2 border-slate-800 rounded-[2rem] shadow-xl">
            <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-white uppercase mb-3 tracking-tight">
              Comms Blackout
            </h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tight">
              Solution disclosure is prohibited until the mission timer reaches{" "}
              <span className="text-sky-400 font-black">zero</span>. Maintain
              total operational silence.
            </p>
          </div>
          <div className="p-8 bg-sky-50 border-2 border-sky-100 rounded-[2rem] shadow-sm">
            <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-sm font-black text-sky-600 uppercase mb-3 tracking-tight">
              Rating Cycle
            </h3>
            <p className="text-xs font-bold text-sky-400 leading-relaxed uppercase tracking-tight">
              Combat ratings are processed and updated within{" "}
              <span className="text-sky-600 font-black">24 hours</span>{" "}
              post-mission.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-20 pt-10 border-t border-slate-50 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[1.5em] text-slate-900">
          Algorhythm Contest Engine
        </p>
      </footer>
    </div>
  );
}
