import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { paymentService } from '../../utils/paymentService';

const PricingPage = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize payment service and check user authentication
  useEffect(() => {
    const initializePayments = async () => {
      await paymentService.initialize();
      
      // Check if user is logged in (you might want to get this from your auth context)
      const userData = localStorage.getItem('userData');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    };

    initializePayments();
  }, []);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with ATOS fit',
      features: {
        tracking: '10 hours/month',
        chatbot: '100 messages/month',
        foodScanning: '50 scans/month',
        formCorrection: true,
        repCounting: true,
        basicWorkouts: true,
        dataPrivacy: true,
        personalizedPlans: false,
        prioritySupport: false,
        unlimitedTracking: false,
        unlimitedChatbot: false,
        unlimitedFoodScanning: false
      },
      popular: false,
      betaNote: 'Currently free during beta',
      planType: 'Basic'
    },
    {
      name: 'Premium',
      price: { monthly: 9.99, yearly: 99.99 },
      description: 'Enhanced features for serious fitness enthusiasts',
      features: {
        tracking: '100 hours/month',
        chatbot: '1,000 messages/month',
        foodScanning: '500 scans/month',
        formCorrection: true,
        repCounting: true,
        basicWorkouts: true,
        dataPrivacy: true,
        personalizedPlans: true,
        prioritySupport: false,
        unlimitedTracking: false,
        unlimitedChatbot: false,
        unlimitedFoodScanning: false
      },
      popular: true,
      betaNote: 'Free during beta - $9.99/month after launch',
      planType: 'Premium'
    },
    {
      name: 'Premium Plus',
      price: { monthly: 19.99, yearly: 199.99 },
      description: 'Unlimited access to all ATOS fit features',
      features: {
        tracking: 'Unlimited',
        chatbot: 'Unlimited',
        foodScanning: 'Unlimited',
        formCorrection: true,
        repCounting: true,
        basicWorkouts: true,
        dataPrivacy: true,
        personalizedPlans: true,
        prioritySupport: true,
        unlimitedTracking: true,
        unlimitedChatbot: true,
        unlimitedFoodScanning: true
      },
      popular: false,
      betaNote: 'Free during beta - $19.99/month after launch',
      planType: 'PremiumPlus'
    }
  ];

  const featuresList = [
    { key: 'tracking', label: 'Workout Tracking', icon: 'Clock' },
    { key: 'chatbot', label: 'AI Chatbot Messages', icon: 'MessageCircle' },
    { key: 'foodScanning', label: 'Food Scanning', icon: 'Scan' },
    { key: 'formCorrection', label: 'Real-time Form Correction', icon: 'Target' },
    { key: 'repCounting', label: 'Automatic Rep Counting', icon: 'BarChart3' },
    { key: 'basicWorkouts', label: 'Basic Workout Library', icon: 'Dumbbell' },
    { key: 'dataPrivacy', label: 'Complete Data Privacy', icon: 'Shield' },
    { key: 'personalizedPlans', label: 'Personalized Workout Plans', icon: 'User' },
    { key: 'prioritySupport', label: '24/7 Priority Support', icon: 'Headphones' }
  ];

  const handleGetStarted = async (plan) => {
    // For Free plan, just navigate to login
    if (plan.planType === 'Basic') {
      navigate('/login-screen');
      return;
    }

    // Check if user is authenticated
    if (!currentUser) {
      // Store the selected plan and redirect to login
      localStorage.setItem('selectedPlan', JSON.stringify(plan));
      navigate('/login-screen');
      return;
    }

    // Process payment for Premium/Premium Plus plans
    setIsProcessing(true);
    
    try {
      // Create checkout session
      const result = await paymentService.createCheckoutSession(currentUser.id, plan.planType);
      
      if (result.success) {
        // Redirect to Stripe Checkout
        const redirectResult = await paymentService.redirectToCheckout(result.sessionId);
        
        if (!redirectResult.success) {
          alert('Failed to redirect to checkout: ' + redirectResult.error);
        }
      } else {
        alert('Failed to create checkout session: ' + result.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
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
            <button onClick={() => navigate('/')} className="text-[#E0E0E0] hover:text-white transition-colors">Home</button>
            <a href="#pricing" className="text-white font-medium">Pricing</a>
            <button onClick={() => navigate('/privacy')} className="text-[#E0E0E0] hover:text-white transition-colors">Privacy</button>
            <button onClick={() => navigate('/about')} className="text-[#E0E0E0] hover:text-white transition-colors">About Us</button>
          </div>

          {/* Desktop Sign In Button */}
          <button
            onClick={() => navigate('/login-screen')}
            className="hidden md:block bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)]"
          >
            Sign In
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
              <button 
                onClick={() => {
                  navigate('/');
                  setIsMobileMenuOpen(false);
                }} 
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2 w-full text-left"
              >
                Home
              </button>
              <a 
                href="#pricing" 
                className="block text-white font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
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
                  navigate('/login-screen');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:shadow-[0px_4px_15px_rgba(255,138,0,0.2)] mt-4"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-white mb-6">
              Choose Your <span className="text-[#FF8A00]">Fitness Journey</span>
            </h1>
            <p className="text-xl text-[#E0E0E0] max-w-3xl mx-auto mb-8">
              All plans are currently free during our beta phase. Experience the full power of AI-driven fitness 
              with complete privacy and blockchain security.
            </p>
            
            {/* Beta Notice */}
            <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.3)] rounded-2xl p-6 max-w-2xl mx-auto mb-12">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Icon name="Info" size={24} className="text-[#FF8A00]" />
                <h3 className="text-xl font-semibold text-white">Free Beta Access</h3>
              </div>
              <p className="text-[#E0E0E0]">
                We're currently in beta! All premium features are completely free while we perfect the experience. 
                Your feedback helps us build the ultimate AI fitness companion.
              </p>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-lg ${billingCycle === 'monthly' ? 'text-white' : 'text-[rgba(255,255,255,0.4)]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 bg-[#1A1A1A] rounded-full border border-[rgba(255,255,255,0.1)] transition-all duration-300"
            >
              <div className={`absolute top-1 w-6 h-6 bg-[#FF8A00] rounded-full transition-all duration-300 ${
                billingCycle === 'yearly' ? 'left-9' : 'left-1'
              }`} />
            </button>
            <span className={`text-lg ${billingCycle === 'yearly' ? 'text-white' : 'text-[rgba(255,255,255,0.4)]'}`}>
              Yearly
            </span>
            <span className="bg-[#FF8A00] text-black text-sm font-semibold px-3 py-1 rounded-full">
              Save 17%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-[#1A1A1A] border rounded-[32px] p-8 transition-all duration-300 hover:border-[rgba(255,138,0,0.4)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.15)] ${
                  plan.popular 
                    ? 'border-[#FF8A00] shadow-[0px_0px_30px_rgba(255,138,0,0.2)]' 
                    : 'border-[rgba(255,255,255,0.1)]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#FF8A00] text-black font-semibold px-6 py-2 rounded-full text-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-[rgba(255,255,255,0.4)] mb-6">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-white">
                      ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-[rgba(255,255,255,0.4)] ml-2">
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-3 mb-6">
                    <p className="text-sm text-[#FF8A00] font-medium">{plan.betaNote}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#E0E0E0]">Workout Tracking</span>
                      <span className="text-white font-medium">{plan.features.tracking}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#E0E0E0]">AI Chatbot</span>
                      <span className="text-white font-medium">{plan.features.chatbot}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#E0E0E0]">Food Scanning</span>
                      <span className="text-white font-medium">{plan.features.foodScanning}</span>
                    </div>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full py-4 rounded-2xl font-semibold bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                >
                  {plan.planType === 'Basic' ? (
                    'Start Free Beta'
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Compare All Features
            </h2>
            <p className="text-xl text-[#E0E0E0]">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] overflow-hidden hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.1)]">
                    <th className="text-left p-6 text-white font-semibold">Features</th>
                    {plans.map((plan) => (
                      <th key={plan.name} className="text-center p-6">
                        <div className="text-white font-semibold text-lg">{plan.name}</div>
                        <div className="text-[rgba(255,255,255,0.4)] text-sm mt-1">
                          ${billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly}
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {featuresList.map((feature, index) => (
                    <tr key={feature.key} className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="p-6">
                        <div className="flex items-center space-x-3">
                          <Icon name={feature.icon} size={20} className="text-[#FF8A00]" />
                          <span className="text-[#E0E0E0]">{feature.label}</span>
                        </div>
                      </td>
                      {plans.map((plan) => (
                        <td key={`${plan.name}-${feature.key}`} className="text-center p-6">
                          {feature.key === 'tracking' || feature.key === 'chatbot' || feature.key === 'foodScanning' ? (
                            <span className="text-white font-medium">{plan.features[feature.key]}</span>
                          ) : plan.features[feature.key] ? (
                            <Icon name="Check" size={24} className="text-[#FF8A00] mx-auto" />
                          ) : (
                            <Icon name="X" size={24} className="text-[rgba(255,255,255,0.3)] mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-3">
                Why is everything free during beta?
              </h3>
              <p className="text-[rgba(255,255,255,0.4)]">
                We're perfecting ATOS fit based on real user feedback. During beta, all features are free so you can
                experience the full platform and help us build the best AI fitness companion possible.
              </p>
            </div>

            <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-3">
                When will paid plans become active?
              </h3>
              <p className="text-[rgba(255,255,255,0.4)]">
                Paid plans will activate after our beta phase ends. We'll give all beta users advance notice and 
                special early-bird pricing as a thank you for your feedback and support.
              </p>
            </div>

            <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300">
              <h3 className="text-xl font-medium text-white mb-3">
                Is my data really private?
              </h3>
              <p className="text-[rgba(255,255,255,0.4)]">
                Absolutely. Your workout videos are processed locally on your device using MediaPipe. Your identity 
                is secured by Internet Identity, and your data is protected by ICP blockchain technology. We never 
                see your personal workout data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-[rgba(255,255,255,0.1)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/assets/images/atosfit.png" alt="ATOS fit Logo" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold text-white">ATOS fit</span>
            </div>
            
            <div className="flex items-center space-x-8">
              <button onClick={() => navigate('/')} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">Home</button>
              <a href="#pricing" className="text-white">Pricing</a>
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

export default PricingPage;
