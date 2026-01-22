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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50 border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-bold mb-6">
            <span>✨</span>
            <span>PREMIUM</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Unlock Your Full <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-500">Potential</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Get unlimited access to premium problems, exclusive contests, and advanced features to accelerate your coding journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition transform hover:scale-105">
              Get Premium Now
            </button>
            <button className="px-8 py-4 bg-white text-gray-700 rounded-xl font-medium text-lg border-2 border-gray-200 hover:border-amber-500 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600">Flexible pricing that grows with you</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.billingCycle}
              className={`relative bg-white rounded-2xl border-2 p-8 transition hover:shadow-xl ${
                plan.popular ? 'border-cyan-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-cyan-500 text-white text-sm font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                {plan.savings && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full mb-4">
                    {plan.savings}
                  </span>
                )}
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-lg mb-2">{plan.period}</span>
                </div>
              </div>

              <button
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  plan.popular
                    ? 'bg-cyan-500 text-white hover:shadow-lg hover:bg-cyan-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.popular ? 'Get Started' : 'Choose Plan'}
              </button>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">All premium features included</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Cancel anytime</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Priority customer support</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          All plans include a 7-day money-back guarantee. No questions asked.
        </p>
      </div>

      {/* Features Grid */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">Premium gives you the edge in your coding journey</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition border border-gray-100 hover:border-cyan-200"
              >
                <div className="w-12 h-12 bg-linear-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Benefits Highlight */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Exclusive Contests */}
          <div className="bg-linear-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
            <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-6">
              🏆
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Contests</h3>
            <p className="text-gray-600 mb-6">
              Compete in exclusive premium-only contests with:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Higher prize pools</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Harder problem sets</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Exclusive badges & titles</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Recognition in rankings</span>
              </li>
            </ul>
          </div>

          {/* Premium Problems */}
          <div className="bg-linear-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100">
            <div className="w-16 h-16 bg-linear-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-6">
              💎
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Premium Problems</h3>
            <p className="text-gray-600 mb-6">
              Access 200+ exclusive problems featuring:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Real interview questions</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Company-tagged problems</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Detailed solutions</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Video walkthroughs</span>
              </li>
            </ul>
          </div>

          {/* Daily Challenge */}
          <div className="bg-linear-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-100">
            <div className="w-16 h-16 bg-linear-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl mb-6">
              ⭐
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Daily Premium Challenge</h3>
            <p className="text-gray-600 mb-6">
              Master coding with daily challenges:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Curated daily problems</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Interview-focused topics</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Progress tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Streak rewards</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Developers</h2>
            <p className="text-xl text-gray-600">See what our premium members have to say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-linear-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.text}"</p>
                <div className="flex gap-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
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
      <div className="bg-linear-to-br from-amber-500 via-orange-500 to-orange-600 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Level Up?
          </h2>
          <p className="text-xl text-amber-50 mb-8">
            Join thousands of developers who upgraded their skills with Premium
          </p>
          <button className="px-10 py-5 bg-white text-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105">
            Start Your Premium Journey
          </button>
          <p className="text-amber-100 text-sm mt-6">
            7-day money-back guarantee • Cancel anytime • No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
}

export default Premium;