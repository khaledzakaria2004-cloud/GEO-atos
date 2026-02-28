import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';

const PrivacyPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const privacyFeatures = [
    {
      icon: '/ai-secured.svg',
      title: 'Local AI Processing with MediaPipe',
      description: 'Your workout videos are processed entirely on your device using Google\'s MediaPipe technology. No video data ever leaves your phone.',
      details: [
        'Real-time 3D pose estimation runs entirely on your device',
        'Zero video data transmission to external servers',
        'Complete control over your workout footage and privacy',
        'Works completely offline - no internet required for form analysis',
        'Instant deletion of video frames after processing',
        'Advanced AI models optimized for mobile devices'
      ]
    },
    {
      icon: '/global-identity.svg',
      title: 'Internet Identity Authentication',
      description: 'Revolutionary anonymous authentication system that protects your identity without requiring any personal information.',
      details: [
        'No email addresses, phone numbers, or personal identifiers required',
        'Cryptographic authentication prevents identity theft and hacking',
        'Anonymous by design - we never know who you are',
        'Resistant to phishing, social engineering, and data breaches',
        'Decentralized authentication - no central authority can compromise you',
        'Cross-platform security that works seamlessly across devices'
      ]
    },
    {
      icon: '/internet-computer.svg',
      title: 'ICP Blockchain Data Storage',
      description: 'Your fitness data is stored on the Internet Computer Protocol blockchain, making it tamper-proof and truly decentralized.',
      details: [
        'Data distributed across multiple independent nodes worldwide',
        'Cryptographically secured and mathematically immutable',
        'No single point of failure, control, or censorship',
        'You own and control your data completely - not us',
        'Transparent and auditable data handling processes',
        'Resistant to government interference and corporate data mining'
      ]
    }
  ];

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
            <button onClick={() => navigate('/pricing')} className="text-[#E0E0E0] hover:text-white transition-colors">Pricing</button>
            <span className="text-white font-medium">Privacy</span>
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
              <button 
                onClick={() => {
                  navigate('/pricing');
                  setIsMobileMenuOpen(false);
                }} 
                className="block text-[#E0E0E0] hover:text-white transition-colors py-2 w-full text-left"
              >
                Pricing
              </button>
              <span className="block text-white font-medium py-2">
                Privacy
              </span>
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Your Privacy is <span className="text-[#FF8A00]">Our Priority</span>
          </h1>
          <p className="text-xl text-[#E0E0E0] leading-relaxed mb-12">
            ATOS fit is built from the ground up with privacy-first architecture. 
            Your data stays yours, your workouts remain private, and your identity is protected.
          </p>
        </div>
      </section>      
{/* Privacy Features */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {privacyFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-8 hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300"
              >
                <div className="w-16 h-16 bg-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-center mb-6">
                  <img 
                    src={feature.icon} 
                    alt={feature.title} 
                    className="w-10 h-10 object-contain filter-orange" 
                  />
                </div>
                <h3 className="text-2xl font-medium text-white mb-4">{feature.title}</h3>
                <p className="text-[#E0E0E0] mb-6 leading-relaxed">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-3">
                      <Icon name="Check" size={16} className="text-[#FF8A00] mt-1 flex-shrink-0" />
                      <span className="text-[rgba(255,255,255,0.4)] text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Detailed Privacy Policy */}
          <div className="bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-[32px] p-10 hover:border-[rgba(255,138,0,0.3)] hover:shadow-[0px_0px_40px_rgba(255,138,0,0.1)] transition-all duration-300">
            <h2 className="text-4xl font-semibold text-white mb-8 text-center">
              Complete Privacy Policy
            </h2>
            
            <div className="space-y-12">
              {/* Data Collection */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Database" size={24} className="text-[#FF8A00] mr-3" />
                  What Data We Collect
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    ATOS fit follows a strict data minimization principle, collecting only essential data for app functionality:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Activity" size={20} className="text-[#FF8A00] mr-2" />
                        Fitness Data We Store
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Exercise counts and repetitions</li>
                        <li>• Workout duration and frequency</li>
                        <li>• Form correction feedback history</li>
                        <li>• Personal fitness goals and preferences</li>
                        <li>• Nutrition tracking (when you choose to save)</li>
                        <li>• Progress metrics and achievements</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Settings" size={20} className="text-[#FF8A00] mr-2" />
                        Technical Data We Store
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• App settings and customizations</li>
                        <li>• Device performance metrics (anonymous)</li>
                        <li>• Feature usage statistics (no personal data)</li>
                        <li>• Error logs for app improvement</li>
                        <li>• Internet Identity authentication tokens</li>
                        <li>• Sync preferences across devices</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-6 mt-6">
                    <h4 className="text-[#FF8A00] font-medium mb-3 flex items-center">
                      <Icon name="Shield" size={20} className="mr-2" />
                      What We NEVER Collect
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ul className="space-y-2 text-sm">
                        <li>• Video footage or camera recordings</li>
                        <li>• Personal identifiers (name, email, phone)</li>
                        <li>• Biometric data or body measurements</li>
                        <li>• Location or GPS coordinates</li>
                      </ul>
                      <ul className="space-y-2 text-sm">
                        <li>• Social media profiles or contacts</li>
                        <li>• Financial or payment information</li>
                        <li>• Health records or medical data</li>
                        <li>• Browsing history or external app usage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Processing */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Smartphone" size={24} className="text-[#FF8A00] mr-3" />
                  Advanced Local Processing Technology
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    ATOS fit leverages cutting-edge on-device AI processing to ensure your workout videos never leave your device. 
                    We combine Google's MediaPipe with MocapNET for real-time 3D motion analysis:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Camera" size={18} className="text-[#FF8A00] mr-2" />
                        Real-Time Analysis
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• 30+ FPS pose estimation</li>
                        <li>• 3D motion capture from 2D video</li>
                        <li>• Instant form correction feedback</li>
                        <li>• Advanced biomechanics analysis</li>
                        <li>• Multi-joint movement tracking</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Cpu" size={18} className="text-[#FF8A00] mr-2" />
                        On-Device Processing
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Zero video data transmission</li>
                        <li>• Works completely offline</li>
                        <li>• Optimized for mobile hardware</li>
                        <li>• Frame-by-frame instant deletion</li>
                        <li>• No cloud dependencies</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Shield" size={18} className="text-[#FF8A00] mr-2" />
                        Privacy Guarantees
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Video never stored or cached</li>
                        <li>• No network transmission</li>
                        <li>• Memory cleared after processing</li>
                        <li>• Only metrics extracted and saved</li>
                        <li>• Complete user control</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-6 mt-6">
                    <h4 className="text-[#FF8A00] font-medium mb-3 flex items-center">
                      <Icon name="Zap" size={20} className="mr-2" />
                      Technical Implementation
                    </h4>
                    <p className="text-sm mb-3">
                      Our privacy-first architecture uses advanced computer vision techniques to analyze your form without compromising your privacy:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>MediaPipe Integration:</strong>
                        <ul className="mt-2 space-y-1 ml-4">
                          <li>• Real-time pose landmark detection</li>
                          <li>• 33-point body pose estimation</li>
                          <li>• Optimized neural networks for mobile</li>
                        </ul>
                      </div>
                      <div>
                        <strong>MocapNET Enhancement:</strong>
                        <ul className="mt-2 space-y-1 ml-4">
                          <li>• 3D pose reconstruction from 2D input</li>
                          <li>• Advanced biomechanical analysis</li>
                          <li>• Real-time form correction algorithms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internet Identity */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Key" size={24} className="text-[#FF8A00] mr-3" />
                  Revolutionary Internet Identity Authentication
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    ATOS fit uses Internet Identity, the world's most advanced privacy-preserving authentication system. 
                    Built by the DFINITY Foundation, it eliminates traditional privacy vulnerabilities:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="UserCheck" size={18} className="text-[#FF8A00] mr-2" />
                        Anonymous by Design
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <Icon name="Check" size={14} className="text-[#FF8A00] mt-1" />
                          <span>No email, phone, or personal info required</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Check" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Cryptographic identity anchors</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Check" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Biometric authentication (stays on device)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Check" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Hardware security key support</span>
                        </li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Lock" size={18} className="text-[#FF8A00] mr-2" />
                        Unbreakable Security
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start space-x-2">
                          <Icon name="Shield" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Immune to password breaches</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Shield" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Resistant to phishing attacks</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Shield" size={14} className="text-[#FF8A00] mt-1" />
                          <span>No central authority to compromise</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <Icon name="Shield" size={14} className="text-[#FF8A00] mt-1" />
                          <span>Quantum-resistant cryptography</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-6 mt-6">
                    <h4 className="text-[#FF8A00] font-medium mb-3 flex items-center">
                      <Icon name="Globe" size={20} className="mr-2" />
                      How Internet Identity Protects You
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h5 className="text-white font-medium mb-2">Traditional Login Problems:</h5>
                        <ul className="space-y-1 text-red-400">
                          <li>• Passwords can be stolen or guessed</li>
                          <li>• Email addresses link to your identity</li>
                          <li>• Central servers can be hacked</li>
                          <li>• Personal data required for recovery</li>
                          <li>• Vulnerable to social engineering</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-white font-medium mb-2">Internet Identity Solutions:</h5>
                        <ul className="space-y-1 text-green-400">
                          <li>• Cryptographic keys replace passwords</li>
                          <li>• Anonymous anchors protect identity</li>
                          <li>• Decentralized - no central target</li>
                          <li>• Device-based recovery mechanisms</li>
                          <li>• Mathematically impossible to social engineer</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ICP Blockchain Storage */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Lock" size={24} className="text-[#FF8A00] mr-3" />
                  Internet Computer Protocol (ICP) Blockchain Storage
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    ATOS fit stores your fitness data on the Internet Computer Protocol (ICP) blockchain, the world's most advanced 
                    decentralized computing platform. This provides unprecedented security, transparency, and user control:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Globe" size={20} className="text-[#FF8A00] mr-2" />
                        True Decentralization
                      </h4>
                      <p className="text-sm mb-3">
                        Your data is distributed across hundreds of independent nodes worldwide, operated by different entities.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li>• No single company controls your data</li>
                        <li>• Resistant to government censorship</li>
                        <li>• Automatic geographic redundancy</li>
                        <li>• 99.99% uptime guarantee</li>
                        <li>• Immune to corporate shutdowns</li>
                      </ul>
                    </div>
                    
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Shield" size={20} className="text-[#FF8A00] mr-2" />
                        Military-Grade Security
                      </h4>
                      <p className="text-sm mb-3">
                        Advanced cryptographic protocols ensure your data is mathematically secure and tamper-proof.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li>• Threshold cryptography protection</li>
                        <li>• Immutable audit trails</li>
                        <li>• Chain-key cryptography</li>
                        <li>• Consensus-based validation</li>
                        <li>• Quantum-resistant algorithms</li>
                      </ul>
                    </div>

                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="User" size={20} className="text-[#FF8A00] mr-2" />
                        Complete Data Ownership
                      </h4>
                      <p className="text-sm mb-3">
                        You have unprecedented control over your data with full transparency and portability.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li>• Export all data in standard formats</li>
                        <li>• Permanent deletion when requested</li>
                        <li>• No vendor lock-in mechanisms</li>
                        <li>• Transparent data processing logs</li>
                        <li>• Direct blockchain verification</li>
                      </ul>
                    </div>

                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="Zap" size={20} className="text-[#FF8A00] mr-2" />
                        Smart Contract Automation
                      </h4>
                      <p className="text-sm mb-3">
                        Automated smart contracts ensure privacy policies are enforced by code, not corporate promises.
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li>• Automated data retention policies</li>
                        <li>• Programmable privacy controls</li>
                        <li>• Transparent algorithmic governance</li>
                        <li>• Immutable privacy guarantees</li>
                        <li>• Community-verifiable operations</li>
                      </ul>
                    </div>
                  </div>
                  <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-6 mt-6">
                    <h4 className="text-[#FF8A00] font-medium mb-3 flex items-center">
                      <Icon name="Info" size={20} className="mr-2" />
                      Why ICP is Different from Other Blockchains
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <h5 className="text-white font-medium mb-2">Traditional Cloud Storage:</h5>
                        <ul className="space-y-1 text-red-400">
                          <li>• Controlled by single companies</li>
                          <li>• Subject to government requests</li>
                          <li>• Can be shut down or sold</li>
                          <li>• Privacy policies can change</li>
                          <li>• Data mining for profit</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-white font-medium mb-2">ICP Blockchain Advantages:</h5>
                        <ul className="space-y-1 text-green-400">
                          <li>• Governed by decentralized protocol</li>
                          <li>• Censorship-resistant by design</li>
                          <li>• Permanent and unstoppable</li>
                          <li>• Privacy rules enforced by code</li>
                          <li>• No profit motive for data exploitation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Usage */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Eye" size={24} className="text-[#FF8A00] mr-3" />
                  How We Use Your Data
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>Your data is used exclusively to provide and improve ATOS fit services:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h4 className="text-white font-medium mb-3 text-[#FF8A00]">✓ What We Do</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Provide personalized workout recommendations</li>
                        <li>• Track your fitness progress over time</li>
                        <li>• Improve AI form correction accuracy</li>
                        <li>• Sync your data across your devices</li>
                        <li>• Provide customer support when requested</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-3 text-red-400">✗ What We Never Do</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Sell your data to third parties</li>
                        <li>• Share data with advertisers</li>
                        <li>• Use data for marketing purposes</li>
                        <li>• Access your video footage</li>
                        <li>• Track you across other websites</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Rights */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Users" size={24} className="text-[#FF8A00] mr-3" />
                  Your Privacy Rights
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>You have complete control over your privacy and data:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Icon name="Download" size={20} className="text-[#FF8A00] mt-1" />
                        <div>
                          <h4 className="text-white font-medium">Data Export</h4>
                          <p className="text-sm">Download all your data in a standard format anytime.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Icon name="Trash2" size={20} className="text-[#FF8A00] mt-1" />
                        <div>
                          <h4 className="text-white font-medium">Data Deletion</h4>
                          <p className="text-sm">Permanently delete your account and all associated data.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Icon name="Settings" size={20} className="text-[#FF8A00] mt-1" />
                        <div>
                          <h4 className="text-white font-medium">Privacy Controls</h4>
                          <p className="text-sm">Granular controls over what data is collected and how it's used.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Icon name="AlertCircle" size={20} className="text-[#FF8A00] mt-1" />
                        <div>
                          <h4 className="text-white font-medium">Transparency</h4>
                          <p className="text-sm">Full visibility into what data we have and how it's processed.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Third-Party Services */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="ExternalLink" size={24} className="text-[#FF8A00] mr-3" />
                  Third-Party Services & Integrations
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    ATOSfit minimizes third-party dependencies to protect your privacy. Here's what we use and why:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="CheckCircle" size={18} className="text-green-400 mr-2" />
                        Privacy-Safe Services
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>MediaPipe (Google):</strong> Runs locally, no data sent to Google</li>
                        <li>• <strong>Internet Computer Protocol:</strong> Decentralized, no corporate control</li>
                        <li>• <strong>Device Hardware:</strong> Camera and sensors stay local</li>
                        <li>• <strong>Open Source Libraries:</strong> Auditable and transparent</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Icon name="XCircle" size={18} className="text-red-400 mr-2" />
                        What We Don't Use
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li>• No Google Analytics or tracking</li>
                        <li>• No Facebook/Meta integrations</li>
                        <li>• No advertising networks</li>
                        <li>• No cloud AI services</li>
                        <li>• No social media APIs</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center">
                  <Icon name="Clock" size={24} className="text-[#FF8A00] mr-3" />
                  Data Retention & Deletion
                </h3>
                <div className="space-y-4 text-[#E0E0E0] leading-relaxed">
                  <p>
                    We believe in your right to be forgotten. Here's how we handle data retention and deletion:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3">Automatic Retention Policies</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Workout videos: Never stored (processed and deleted immediately)</li>
                        <li>• Fitness metrics: Kept until you delete your account</li>
                        <li>• Error logs: Automatically deleted after 30 days</li>
                        <li>• Anonymous analytics: Aggregated and anonymized after 90 days</li>
                      </ul>
                    </div>
                    <div className="bg-[rgba(255,255,255,0.05)] rounded-xl p-6">
                      <h4 className="text-white font-medium mb-3">User-Controlled Deletion</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• Delete individual workouts anytime</li>
                        <li>• Clear all fitness history with one click</li>
                        <li>• Permanent account deletion available</li>
                        <li>• Blockchain data marked as deleted (immutable by design)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[rgba(255,138,0,0.1)] border border-[rgba(255,138,0,0.2)] rounded-xl p-8 text-center">
                <h3 className="text-2xl font-medium text-white mb-4">
                  Questions About Your Privacy?
                </h3>
                <p className="text-[#E0E0E0] mb-6">
                  We're committed to transparency. If you have any questions about how we protect your privacy, 
                  we're here to help. Our privacy team responds to all inquiries within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold px-8 py-4 rounded-2xl transition-all duration-300">
                    Contact Privacy Team
                  </button>
                  <button 
                    onClick={() => navigate('/about')}
                    className="border border-[rgba(255,255,255,0.1)] hover:border-[#FF8A00] text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300"
                  >
                    Learn About Our Team
                  </button>
                </div>
                <p className="text-[rgba(255,255,255,0.4)] text-sm mt-4">
                  Last updated: December 2024 | Version 2.0
                </p>
              </div>
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
              <button onClick={() => navigate('/pricing')} className="text-[rgba(255,255,255,0.4)] hover:text-white transition-colors">Pricing</button>
              <span className="text-white">Privacy</span>
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

export default PrivacyPage;
