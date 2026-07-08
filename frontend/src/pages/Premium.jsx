import React, { useState } from "react";
import {
  Trophy,
  Diamond,
  Star,
  Activity,
  Target,
  BookOpen,
  Rocket,
  Briefcase,
  CheckSquare,
  TerminalSquare,
} from "lucide-react";

function Premium() {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const features = [
    {
      icon: <Trophy size={18} className="text-amber-600 dark:text-amber-500" />,
      title: "Exclusive Contests",
      description:
        "Participate in premium-only contests with bigger prizes and recognition. Compete with the best.",
    },
    {
      icon: (
        <Diamond size={18} className="text-amber-600 dark:text-amber-500" />
      ),
      title: "Premium Problems",
      description:
        "Unlock 200+ exclusive problems curated from top tech companies and interview questions.",
    },
    {
      icon: <Star size={18} className="text-amber-600 dark:text-amber-500" />,
      title: "Daily Challenge",
      description:
        "Get access to special problem of the day designed to prepare you for real-world interviews.",
    },
    {
      icon: (
        <Activity size={18} className="text-amber-600 dark:text-amber-500" />
      ),
      title: "Advanced Analytics",
      description:
        "Deep dive into your performance with detailed statistics, progress tracking, and insights.",
    },
    {
      icon: <Target size={18} className="text-amber-600 dark:text-amber-500" />,
      title: "Company-Specific Prep",
      description:
        "Access problems tagged by company with real interview questions from FAANG and top startups.",
    },
    {
      icon: (
        <BookOpen size={18} className="text-amber-600 dark:text-amber-500" />
      ),
      title: "Solution Walkthroughs",
      description:
        "Watch video explanations and detailed editorial solutions for all premium problems.",
    },
    {
      icon: <Rocket size={18} className="text-amber-600 dark:text-amber-500" />,
      title: "Priority Support",
      description:
        "Get your questions answered faster with a dedicated premium support team.",
    },
    {
      icon: (
        <Briefcase size={18} className="text-amber-600 dark:text-amber-500" />
      ),
      title: "Interview Resources",
      description:
        "Access exclusive interview guides, tips, and strategies from industry professionals.",
    },
  ];

  const plans = [
    {
      name: "Monthly",
      price: "$15",
      period: "/month",
      billingCycle: "monthly",
      popular: false,
    },
    {
      name: "Annual",
      price: "$120",
      period: "/year",
      billingCycle: "annual",
      popular: true,
      savings: "SAVE $60",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "SWE @ Google",
      avatar: "S",
      text: "Premium problems helped me land my dream job at Google. The company-specific questions were invaluable!",
    },
    {
      name: "Michael Rodriguez",
      role: "Full Stack Dev",
      avatar: "M",
      text: "The premium contests pushed me to become a better coder. Worth every penny!",
    },
    {
      name: "Emily Watson",
      role: "Senior Dev @ Amazon",
      avatar: "E",
      text: "Daily premium challenges kept me sharp and prepared for technical interviews.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] font-sans transition-colors duration-300">
      <div className="relative bg-white dark:bg-[#050608] border-b border-slate-200 dark:border-slate-800 transition-colors overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center flex flex-col items-center z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight font-sans max-w-4xl">
            Unlock Your Full{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-400 dark:to-orange-500">
              Potential
            </span>
          </h1>

          <p className="text-[15px] font-semibold font-sans text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Get unlimited access to premium problems, exclusive contests, and
            advanced features to accelerate your coding journey and land your
            dream job. <br /> <br />
            Note that this page is a mockup. Algorhythm premium is in works as
            of now. <br /> - Atharv Dubey
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white rounded-[3px] font-sans font-semibold text-[13px] tracking-wide transition-all border-none shadow-md shadow-orange-500/10 active:scale-[0.98]">
              Get Premium
            </button>
            <button className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-[3px] font-sans text-[13px] font-semibold tracking-wide transition-all active:scale-[0.98]">
              View Docs
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-slate-50 dark:bg-[#0a0c10] py-20 transition-colors border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12 flex flex-col items-center md:items-start">
            <h2 className="font-mono text-[12px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              System Capabilities
            </h2>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Everything You Need to Succeed
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-950 rounded-[3px] p-6 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:-translate-y-0.5 transition-all duration-300 group flex flex-col shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-[3px] flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-800 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:border-amber-200 dark:group-hover:border-amber-500/30 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Benefits Highlight */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Benefit 1 */}
          <div className="bg-white dark:bg-slate-950 rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                MODULE: CONTESTS
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="w-10 h-10 bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] flex items-center justify-center mb-5">
                <Trophy
                  size={20}
                  className="text-slate-700 dark:text-slate-300"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Premium Contests
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6">
                Compete in exclusive premium-only contests with:
              </p>
              <ul className="space-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {[
                  "Higher prize pools",
                  "Harder problem sets",
                  "Exclusive badges",
                  "Ranking recognition",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckSquare size={14} className="text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white dark:bg-slate-950 rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                MODULE: PROBLEMS
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="w-10 h-10 bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] flex items-center justify-center mb-5">
                <Diamond
                  size={20}
                  className="text-slate-700 dark:text-slate-300"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Premium Problems
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6">
                Access 200+ exclusive problems featuring:
              </p>
              <ul className="space-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {[
                  "Real interview questions",
                  "Company-tagged problems",
                  "Detailed solutions",
                  "Video walkthroughs",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckSquare size={14} className="text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white dark:bg-slate-950 rounded-[3px] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                MODULE: CHALLENGES
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="w-10 h-10 bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] flex items-center justify-center mb-5">
                <Star
                  size={20}
                  className="text-slate-700 dark:text-slate-300"
                />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Daily Challenge
              </h3>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mb-6">
                Master coding with daily challenges:
              </p>
              <ul className="space-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                {[
                  "Curated daily problems",
                  "Interview-focused topics",
                  "Progress tracking",
                  "Streak rewards",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckSquare size={14} className="text-amber-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-slate-50 dark:bg-[#0a0c10] py-20 transition-colors border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-mono text-[12px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.15em] mb-2">
              Subscription Plans
            </h2>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Flexible pricing that grows with you
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.billingCycle}
                className={`flex flex-col bg-white dark:bg-slate-950 rounded-[3px] border hover:-translate-y-0.5 transition-transform duration-300 ${
                  plan.popular
                    ? "border-amber-500 dark:border-amber-500 shadow-md shadow-amber-500/10"
                    : "border-slate-200 dark:border-slate-800 shadow-sm"
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-white font-mono text-[9px] font-bold px-3 py-1 uppercase tracking-widest rounded-[3px]">
                    MOST POPULAR
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    {plan.savings && (
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[9px] font-mono font-bold uppercase tracking-widest rounded-[3px]">
                        {plan.savings}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-mono text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
                      {plan.price}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      {plan.period}
                    </span>
                  </div>

                  <div className="space-y-4 mb-10 flex-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500">[{">"}]</span> All
                      premium features
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500">[{">"}]</span> Cancel
                      anytime
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-500">[{">"}]</span> Priority
                      support
                    </div>
                  </div>

                  <button
                    className={`w-full py-3 rounded-[3px] font-mono text-[11px] font-bold uppercase tracking-widest transition-all border-none cursor-pointer active:scale-[0.98] ${
                      plan.popular
                        ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {plan.popular ? "SELECT PLAN" : "SELECT PLAN"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center font-mono text-[10px] text-slate-500 dark:text-slate-500 mt-8 uppercase tracking-widest">
            * All plans include a 7-day money-back guarantee.
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-slate-950 py-20 transition-colors border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h2 className="font-mono text-[12px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              User Feedback
            </h2>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Loved by Developers
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-50 dark:bg-[#0d1117] rounded-[3px] p-6 border border-slate-200 dark:border-slate-800 flex flex-col"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-[3px] flex items-center justify-center text-slate-700 dark:text-slate-300 font-mono font-bold text-[12px] uppercase">
                    {testimonial.avatar}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-sans font-bold text-[13px] text-slate-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed italic border-l-2 border-amber-500/50 pl-3">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative bg-slate-900 dark:bg-[#050608] py-24 overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight font-sans">
            Ready to Succeed?
          </h2>
          <p className="text-[14px] text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Join thousands of developers who upgraded their skills and
            accelerated their careers with Algorhythm Pro.
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 cursor-pointer text-white rounded-[3px] font-mono text-[12px] font-bold uppercase tracking-widest transition-all active:scale-[0.98] border-none shadow-md shadow-orange-500/20">
            START PREMIUM JOURNEY
          </button>
        </div>
      </div>
    </div>
  );
}

export default Premium;
