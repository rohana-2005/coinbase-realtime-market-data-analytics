import React from 'react';
import { Zap, TrendingUp, Bell, ArrowRight, Sparkles } from 'lucide-react';
import dashboardImage from '../assets/dashboard.png';

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2364ffda' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-8 lg:px-16 xl:px-24 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="text-2xl transform group-hover:scale-110 transition-transform">🪙</div>
            <span className="text-base font-bold bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              Crypto Market Dashboard
            </span>
            <span className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full shadow-lg shadow-emerald-500/50 animate-pulse">
              Live
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#home" className="hover:text-emerald-400 transition-all hover:scale-105 relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all"></span>
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-all hover:scale-105 relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all"></span>
            </a>
            <a href="#statistics" className="hover:text-emerald-400 transition-all hover:scale-105 relative group">
              Statistics
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all"></span>
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-all hover:scale-105 relative group">
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all"></span>
            </a>
            <a href="#contact" className="hover:text-emerald-400 transition-all hover:scale-105 relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 group-hover:w-full transition-all"></span>
            </a>
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 w-full px-8 lg:px-16 xl:px-24 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Real-Time Market Intelligence</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Real-Time Crypto
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                Market Tracking
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Stay updated with live Bitcoin price data and market statistics. 
              Monitor trends, analyze patterns, and make informed decisions in real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={onGetStarted}
                className="group px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={onGetStarted}
                className="px-8 py-3.5 bg-slate-800/50 backdrop-blur-sm border-2 border-emerald-500/30 text-emerald-400 rounded-xl font-semibold hover:bg-slate-800 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300"
              >
                View Live Demo
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-6 border-t border-slate-800">
              <div>
                <div className="text-xl font-bold text-emerald-400">10s</div>
                <div className="text-xs text-slate-400">Update Interval</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">24/7</div>
                <div className="text-xs text-slate-400">Live Monitoring</div>
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-400">Real-Time</div>
                <div className="text-xs text-slate-400">Market Data</div>
              </div>
            </div>
          </div>

          {/* Right side - Dashboard Image */}
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-2xl blur-3xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-75"></div>
            
            {/* Image container with enhanced styling */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-emerald-500/20 group-hover:shadow-emerald-500/40 group-hover:scale-[1.02] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
              <img 
                src={dashboardImage}
                alt="Crypto Dashboard Preview" 
                className="w-full h-auto relative z-10 transform group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>

            {/* Floating badges
            <div className="absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg shadow-lg shadow-emerald-500/50 animate-bounce">
              
            </div> */}
          </div>
        </div>
      </div>

      {/* CTA Button
      <div className="relative z-10 w-full px-8 lg:px-16 xl:px-24 pb-16 text-center">
       
      </div> */}

      {/* Features Section */}
      <div className="relative z-10 w-full px-8 lg:px-16 xl:px-24 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 text-center hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-emerald-500/20">
              <Zap className="w-7 h-7 text-emerald-400 group-hover:animate-pulse" />
            </div>
            <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
              Live BTC Price <span className="text-emerald-400">Updates</span>
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Receive live Bitcoin price updates every 10 seconds with real-time market data streaming.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 text-center hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-teal-500/20">
              <TrendingUp className="w-7 h-7 text-teal-400 group-hover:animate-pulse" />
            </div>
            <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-teal-400 bg-clip-text text-transparent">
              Detailed Market <span className="text-teal-400">Analytics</span>
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Track price trends, volume, and market movements with comprehensive analytics tools.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 text-center hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-cyan-500/20">
              <Bell className="w-7 h-7 text-cyan-400 group-hover:animate-pulse" />
            </div>
            <h3 className="text-lg font-bold mb-2 bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
              Real-Time <span className="text-cyan-400">Alerts</span>
            </h3>
            <p className="text-slate-400 leading-relaxed text-sm">
              Get notified about significant market changes instantly with smart alerts system.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="relative z-10 w-full px-8 lg:px-16 xl:px-24 pb-20">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full border border-slate-700/50">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300 font-medium">Comprehensive Analytics Platform</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-white via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Crypto Market Dashboard
            </span>
          </h2>
          
          <p className="text-sm text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Our Crypto Market Dashboard provides real-time data and insights to help you stay ahead 
            in the cryptocurrency market. Monitor Bitcoin prices, track market trends, and receive instant alerts.
          </p>
        </div>

        {/* Features List with enhanced styling */}
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            { text: 'Live BTC Price Updates', color: 'emerald' },
            { text: 'Detailed Market Analytics', color: 'teal' },
            { text: 'Instant Price Alerts', color: 'cyan' }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group flex items-center gap-4 text-base p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all duration-300 hover:translate-x-2"
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${
                feature.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                feature.color === 'teal' ? 'from-teal-500 to-cyan-600' :
                'from-cyan-500 to-blue-600'
              } rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="font-medium group-hover:text-emerald-400 transition-colors">{feature.text}</span>
            </div>
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default LandingPage;
