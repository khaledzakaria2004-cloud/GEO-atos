import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveImage from '../../components/InteractiveImage';


const LandingPage = () => {
  const navigate = useNavigate();
  const { login, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const featureWidgets = [
    {
      id: "real_time_feedback",
      heading: "Real-Time Feedback & Form Correction",
      body: "Get immediate and actionable insights that will help you push past plateaus and smash your goals.",
      video: "/schools-header-vp9-chrome-1.webm",
      className: "lg:col-start-1 lg:col-span-4 lg:row-start-1 lg:row-span-2 md:col-start-1 md:col-span-8 md:row-start-1 col-start-1 col-span-4 row-start-1",
    },
    {
      id: "ai_coach",
      heading: "AI Coach",
      body: "Ask about anything fitness-related, from workout plans to nutrition advice, and get instant, personalized answers.",
      image: "artificial-intelligence.svg",
      className: "lg:col-start-5 lg:col-span-4 lg:row-start-1 md:col-start-1 md:col-span-4 md:row-start-2 col-start-1 col-span-4 row-start-2 svg-white",
    },
    {
      id: "food_scanner",
      heading: "Food Scanner",
      body: "Instantly identify food items and get detailed nutritional information to stay on top of your diet.",
      image: "scanner.svg",
      className: "lg:col-start-5 lg:col-span-4 lg:row-start-2 md:col-start-5 md:col-span-4 md:row-start-2 col-start-1 col-span-4 row-start-3 svg-white",
    },
    {
      id: "rep_counting",
      heading: "Automatic Rep Counting",
      body: "Focus on your form, not the count. Our AI automatically tracks your reps with precision.",
      image: "Gemini_Generated_Image_5ysnl85ysnl85ysn.png",
      className: "lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-2 md:col-start-1 md:col-span-8 md:row-start-3 col-start-1 col-span-4 row-start-4",
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = async () => {
    try {
      await login();
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.name && user.email) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (e) {
      navigate('/login-screen');
    }
  };

  const handleLogin = async () => {
    try {
      await login();
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.name && user.email) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (e) {
      navigate('/login-screen');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-['Halyard_Display',sans-serif]">
      {/* Background accent glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[rgba(255,138,0,0.15)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-[rgba(255,138,0,0.1)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-[700px] h-[700px] bg-[rgba(255,138,0,0.08)] rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/assets/images/atosfit.png" alt="ATOS fit Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-white">ATOS fit</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-[#E0E0E0] hover:text-white transition-colors">Home</a>
            <button onClick={() => navigate('/pricing')} className="text-[#E0E0E0] hover:text-white transition-colors">Pricing</button>
            <button onClick={() => navigate('/privacy')} className="text-[#E0E0E0] hover:text-white transition-colors">Privacy</button>
            <button onClick={() => navigate('/about')} className="text-[#E0E0E0] hover:text-white transition-colors">About Us</button>
          </div>

          {/* Desktop Sign In Button */}
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="hidden md:block bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)]"
          >
            {authLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle mobile menu"
          >
            <Icon name={isMobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#1A1A1A] border-t border-[rgba(255,255,255,0.1)] shadow-lg">
            <div className="px-6 py-4 space-y-4">
              <a
                href="#home"
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </a>
              <button
                onClick={() => {
                  navigate('/pricing');
                  setIsMobileMenuOpen(false);
                }}
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2 w-full text-left"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  navigate('/privacy');
                  setIsMobileMenuOpen(false);
                }}
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2 w-full text-left"
              >
                Privacy
              </button>
              <button
                onClick={() => {
                  navigate('/about');
                  setIsMobileMenuOpen(false);
                }}
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2 w-full text-left"
              >
                About Us
              </button>
              <button
                onClick={() => {
                  handleLogin();
                  setIsMobileMenuOpen(false);
                }}
                disabled={authLoading}
                className="w-full bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)] mt-4"
              >
                {authLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10 pt-4 pb-12 lg:pt-6 lg:pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left Content */}
            <div className={`space-y-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="space-y-6">
                <h1 className="text-6xl font-bold leading-tight text-white">
                  <div className="mb-3">PERFECT FORM</div>
                  <div className="text-[#FF8A00] mb-4">MAX RESULTS</div>
                </h1>
                <p className="text-xl text-[#E0E0E0] leading-relaxed max-w-lg">
                  <span className="text-[#FF8A00] font-semibold">ATOS fit</span> corrects your form in real-time. With privacy-first technology, your video never leaves your device and you have full control of your data.
                </p>
              </div>

              <button
                onClick={handleGetStarted}
                disabled={authLoading}
                className="bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-8 py-4 rounded-2xl text-lg transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? 'Starting...' : 'Start Your Journey'}
              </button>
            </div>

            {/* Right Content - Interactive iPhone */}
            <div className="relative">
              <InteractiveImage />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Title */}
      <section className="relative z-10 pt-16 lg:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-semibold text-white mb-6">
            Why Choose <span className="text-[#FF8A00]">ATOS fit</span>?
          </h2>
          <p className="text-xl text-[#E0E0E0] max-w-3xl mx-auto">
            Discover the revolutionary features that make ATOS fit the ultimate AI-powered fitness companion
          </p>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="relative z-10 pb-16 lg:pb-20">
        <div className="max-w-full px-6 lg:px-8">
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10 auto-rows-[minmax(300px,auto)]">
            {featureWidgets.map((feature, index) => {
              const isLargeWidget = feature.id === 'real_time_feedback' || feature.id === 'rep_counting';
              return (
                <div
                  key={feature.id}
                  className={`bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] ${isLargeWidget ? '' : 'p-6 md:p-8'} flex flex-col text-white transition-all duration-300 hover:border-[rgba(255,138,0,0.5)] hover:shadow-[0px_0px_60px_rgba(255,138,0,0.2)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${feature.className}`}
                >
                  {isLargeWidget ? (
                    <div className="relative flex-grow flex flex-col justify-end">
                      {feature.video ? (
                        <video
                          src={feature.video}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover rounded-[32px]"
                        />
                      ) : (
                        <img src={feature.image} alt={feature.heading} className="absolute inset-0 w-full h-full object-contain rounded-[32px]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent rounded-[32px]"></div>
                      <div className="relative p-4">
                        <h3 className="text-2xl md:text-3xl font-semibold mb-2 text-[#FF8A00]">{feature.heading}</h3>
                        <p className="text-base text-[rgba(255,255,255,0.8)] leading-relaxed">{feature.body}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col">
                      {/* Use a row flex with gap to control spacing between image and heading consistently */}
                      <div className="flex items-start mb-4 gap-4">
                        {/* For food_scanner: image on the left, heading next to it */}
                        {feature.id === 'food_scanner' && (
                          <img src={feature.image} alt={feature.heading} className={`w-16 h-16 object-contain flex-shrink-0 ${feature.className.includes('svg-white') ? 'filter-white' : ''}`} />
                        )}

                        <div className="flex-1">
                          <h3 className="text-3xl font-semibold text-[#FF8A00]">{feature.heading}</h3>
                        </div>

                        {/* For ai_coach: image on the right */}
                        {feature.id === 'ai_coach' && (
                          <img src={feature.image} alt={feature.heading} className={`w-16 h-16 object-contain flex-shrink-0 ${feature.className.includes('svg-white') ? 'filter-white' : ''}`} />
                        )}
                      </div>

                      <p className="text-lg text-[rgba(255,255,255,0.4)] leading-relaxed">{feature.body}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="relative z-10 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 lg:mb-24">
            <h2 className="text-5xl font-semibold text-white mb-6">
              Your Privacy is <span className="text-[#FF8A00]">Our Foundation</span>
            </h2>
            <p className="text-xl text-[#E0E0E0] max-w-3xl mx-auto">
              Built with privacy-first architecture, ATOS fit ensures your data stays yours while delivering cutting-edge AI fitness coaching
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Local Processing */}
            <div className={`bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-8 transition-all duration-300 hover:border-[rgba(255,138,0,0.5)] hover:shadow-[0px_0px_60px_rgba(255,138,0,0.2)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center">
                <div className="w-20 h-20 bg-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/ai-secured.svg" alt="AI Secured" className="w-12 h-12 object-contain filter-orange" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">
                  Local AI Processing
                </h3>
                <p className="text-[#E0E0E0] mb-6 leading-relaxed">
                  Your workout videos are processed entirely on your device using MediaPipe technology. No video data ever leaves your phone.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Real-time pose analysis on-device</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">No video transmission to servers</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Works completely offline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Internet Identity */}
            <div className={`bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-8 transition-all duration-300 hover:border-[rgba(255,138,0,0.5)] hover:shadow-[0px_0px_60px_rgba(255,138,0,0.2)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center">
                <div className="w-20 h-20 bg-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/global-identity.svg" alt="Global Identity" className="w-12 h-12 object-contain filter-orange" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">
                  Anonymous Authentication
                </h3>
                <p className="text-[#E0E0E0] mb-6 leading-relaxed">
                  Internet Identity provides secure, anonymous login without emails or personal data. Your identity stays completely private.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">No email or personal info required</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Cryptographically secure</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Resistant to hacking attempts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Storage */}
            <div className={`bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-8 transition-all duration-300 hover:border-[rgba(255,138,0,0.5)] hover:shadow-[0px_0px_60px_rgba(255,138,0,0.2)] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center">
                <div className="w-20 h-20 bg-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/internet-computer.svg" alt="Internet Computer" className="w-12 h-12 object-contain filter-orange" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">
                  Decentralized Storage
                </h3>
                <p className="text-[#E0E0E0] mb-6 leading-relaxed">
                  Your data is stored on the Internet Computer blockchain, making it tamper-proof and inaccessible to unauthorized parties.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Distributed across multiple nodes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">Cryptographically secured</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Icon name="Check" size={16} className="text-[#FF8A00] flex-shrink-0" />
                    <span className="text-[rgba(255,255,255,0.4)] text-sm">You own and control your data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy CTA */}
          <div className="text-center mt-20 lg:mt-24">
            <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-[32px] p-10 lg:p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-semibold text-white mb-4">
                Complete Privacy Transparency
              </h3>
              <p className="text-[#E0E0E0] mb-6 leading-relaxed">
                Learn exactly how we protect your privacy and why ATOS fit is the most secure fitness app available today.
              </p>
              <button
                onClick={() => navigate('/privacy')}
                className="bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)]"
              >
                Read Our Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-8 py-16 lg:py-20 border-t border-[rgba(255,255,255,0.1)] mt-16 lg:mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/assets/images/atosfit.png" alt="ATOS fit Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-white">ATOS fit</span>
            </div>

            <div className="flex items-center space-x-8">
              <a href="#home" className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">Home</a>
              <button onClick={() => navigate('/pricing')} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">Pricing</button>
              <button onClick={() => navigate('/privacy')} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">Privacy</button>
              <button onClick={() => navigate('/about')} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">About Us</button>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href="https://www.linkedin.com/company/atos-fit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgba(255,255,255,0.4)] hover:text-[#FF8A00] transition-colors"
                aria-label="LinkedIn"
              >
                <Icon name="Linkedin" size={24} />
              </a>
              <a
                href="https://twitter.com/AtosFit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgba(255,255,255,0.4)] hover:text-[#FF8A00] transition-colors"
                aria-label="Twitter/X"
              >
                <Icon name="Twitter" size={24} />
              </a>
              <a
                href="https://www.producthunt.com/posts/atos-fit?utm_source=other&utm_medium=social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[rgba(255,255,255,0.4)] hover:text-[#FF8A00] transition-colors"
                aria-label="Product Hunt"
              >
                <Icon name="ExternalLink" size={24} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
