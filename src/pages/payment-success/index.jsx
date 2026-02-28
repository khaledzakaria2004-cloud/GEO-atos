import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { paymentService } from '../../utils/paymentService';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setVerificationStatus('error');
        setIsVerifying(false);
        return;
      }

      try {
        // Initialize payment service
        await paymentService.initialize();
        
        // Verify the subscription
        const result = await paymentService.verifySubscription(sessionId);
        
        if (result.success) {
          setVerificationStatus('success');
          setSubscriptionDetails(result.subscription);
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setVerificationStatus('error');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment</h2>
          <p className="text-gray-400">Please wait while we confirm your subscription...</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Verification Failed</h1>
          <p className="text-gray-400 mb-8">
            We couldn't verify your payment. Please contact support if you believe this is an error.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 bg-transparent border border-gray-600 text-white hover:bg-gray-800 font-semibold rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="CheckCircle" className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Welcome to ATOS fit {subscriptionDetails?.plan || 'Premium'}! Your subscription is now active.
        </p>

        {/* Subscription Details */}
        {subscriptionDetails && (
          <div className="bg-gray-900 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan:</span>
                <span className="text-white">{subscriptionDetails.plan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-400 capitalize">{subscriptionDetails.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Started:</span>
                <span className="text-white">
                  {new Date(Number(subscriptionDetails.createdAt) / 1000000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold rounded-xl transition-colors"
          >
            Continue to Dashboard
          </button>
          <button
            onClick={() => navigate('/user-profile')}
            className="w-full py-3 bg-transparent border border-gray-600 text-white hover:bg-gray-800 font-semibold rounded-xl transition-colors"
          >
            View Profile
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-gray-900 rounded-xl">
          <p className="text-sm text-gray-400">
            🎉 You now have access to all premium features including unlimited tracking, 
            advanced analytics, and personalized workout plans!
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;