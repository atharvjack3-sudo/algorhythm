import React, { useState } from 'react';

function Premium() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const features = [
    {
      icon: '🏆',
      title: 'Exclusive Premium Contests',
      description: 'Participate in premium-only contests with bigger prizes and recognition. Compete with the best coders.',
    },
    {
      icon: '💎',
      title: 'Access Premium Problems',
      description: 'Unlock 200+ exclusive premium problems curated from top tech companies and interview questions.',
    },
    {
      icon: '⭐',
      title: 'Daily Premium Challenge',
      description: 'Get access to special problem of the day designed to prepare you for real-world coding interviews.',
    },
    {
      icon: '📊',
      title: 'Advanced Analytics',
      description: 'Deep dive into your performance with detailed statistics, progress tracking, and personalized insights.',
    },
    {
      icon: '🎯',
      title: 'Company-Specific Prep',
      description: 'Access problems tagged by company with real interview questions from FAANG and top startups.',
    },
    {
      icon: '📚',
      title: 'Solution Walkthroughs',
      description: 'Watch video explanations and detailed editorial solutions for all premium problems.',
    },
    {
      icon: '🚀',
      title: 'Priority Support',
      description: 'Get your questions answered faster with dedicated premium support team.',
    },
    {
      icon: '💼',
      title: 'Interview Prep Resources',
      description: 'Access exclusive interview guides, tips, and strategies from industry professionals.',
    },
  ];

  const plans = [
    {
      name: 'Monthly',
      price: '$15',
      period: '/month',
      billingCycle: 'monthly',
      popular: false,
    },
    {
      name: 'Annual',
      price: '$120',
      period: '/year',
      billingCycle: 'annual',
      popular: true,
      savings: 'Save $60',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Engineer at Google',
      avatar: 'S',
      text: 'Premium problems helped me land my dream job at Google. The company-specific questions were invaluable!',
    },
    {
      name: 'Michael Rodriguez',
      role: 'Full Stack Developer',
      avatar: 'M',
      text: 'The premium contests pushed me to become a better coder. Worth every penny!',
    },
    {
      name: 'Emily Watson',
      role: 'Senior Developer at Amazon',
      avatar: 'E',
      text: 'Daily premium challenges kept me sharp and prepared for technical interviews.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans transition-colors duration-300">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-[#0a0c10] border-b border-amber-100 dark:border-amber-900/30 transition-colors">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-0 w-72 h-72 bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold mb-8 shadow-md shadow-orange-500/20 uppercase tracking-widest">
            <span>✨</span>
            <span>Algorhythm Premium</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Unlock Your Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Potential</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            Get unlimited access to premium problems, exclusive contests, and advanced features to accelerate your coding journey and land your dream job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95">
              Get Premium Now
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-lg border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all active:scale-95 shadow-sm">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-[#f8f9fa] dark:bg-[#0a0c10] py-20 md:py-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Everything You Need to Succeed</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Premium gives you the definitive edge in your coding journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 hover:shadow-xl hover:shadow-amber-500/10 dark:hover:shadow-none transition-all border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-500/50 group"
              >
                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300 border border-amber-100 dark:border-amber-500/20">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Benefits Highlight */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Exclusive Contests */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-8 shadow-lg shadow-purple-500/20">
                🏆
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Premium Contests</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Compete in exclusive premium-only contests with:
              </p>
              <ul className="space-y-4">
                {[
                  "Higher prize pools",
                  "Harder problem sets",
                  "Exclusive badges & titles",
                  "Recognition in rankings"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-purple-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Premium Problems */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-8 shadow-lg shadow-blue-500/20">
                💎
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Premium Problems</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Access 200+ exclusive problems featuring:
              </p>
              <ul className="space-y-4">
                {[
                  "Real interview questions",
                  "Company-tagged problems",
                  "Detailed solutions",
                  "Video walkthroughs"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Daily Challenge */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-8 shadow-lg shadow-orange-500/20">
                ⭐
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Daily Challenge</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                Master coding with daily challenges:
              </p>
              <ul className="space-y-4">
                {[
                  "Curated daily problems",
                  "Interview-focused topics",
                  "Progress tracking",
                  "Streak rewards"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-[#f8f9fa] dark:bg-[#0a0c10] py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Choose Your Plan</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Flexible pricing that grows with you</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.billingCycle}
                className={`relative bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 p-8 md:p-10 transition-all ${
                  plan.popular 
                    ? 'border-amber-500 shadow-2xl shadow-orange-500/10 dark:shadow-none' 
                    : 'border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="px-5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/30 border border-white dark:border-slate-900">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{plan.name}</h3>
                  {plan.savings && (
                    <span className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-md mb-6 border border-emerald-200 dark:border-emerald-500/20">
                      {plan.savings}
                    </span>
                  )}
                  <div className="flex items-end justify-center gap-1.5">
                    <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">{plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-lg font-bold mb-2">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">All premium features included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">Priority customer support</span>
                  </div>
                </div>

                <button
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {plan.popular ? 'Get Started' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 mt-10">
            All plans include a 7-day money-back guarantee. No questions asked.
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-slate-900 border-t border-b border-slate-200 dark:border-slate-800 py-20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Loved by Developers</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">See what our premium members have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-8 border border-slate-100 dark:border-slate-800 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white tracking-tight">{testimonial.name}</h4>
                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-6">"{testimonial.text}"</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-br from-slate-900 to-black dark:from-black dark:to-slate-950 py-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Ready to Level Up?
          </h2>
          <p className="text-xl text-slate-300 mb-10 font-medium max-w-2xl mx-auto">
            Join thousands of developers who upgraded their skills and accelerated their careers with Premium.
          </p>
          <button className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95">
            Start Your Premium Journey
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default Premium;