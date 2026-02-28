import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';

const PaymentCancel = () => {
  const navigate = useNavigate();

  const handleRetryPayment = () => {
    navigate('/pricing');
  };

  const handleContinueWithFree = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="XCircle" className="w-12 h-12 text-white" />
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
        <p className="text-gray-400 mb-8">
          No worries! Your payment was cancelled and you haven't been charged. 
          You can still enjoy ATOS fit with our free plan or try upgrading again later.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetryPayment}
            className="w-full py-4 bg-[#FF8A00] hover:bg-[#E67B00] text-black font-semibold rounded-xl transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleContinueWithFree}
            className="w-full py-3 bg-transparent border border-gray-600 text-white hover:bg-gray-800 font-semibold rounded-xl transition-colors"
          >
            Continue with Free Plan
          </button>
        </div>

        {/* Free Plan Benefits */}
        <div className="mt-8 p-6 bg-gray-900 rounded-xl text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Free Plan Includes:</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
              10 hours of workout tracking per month
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
              100 AI chatbot messages per month
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
              50 food scans per month
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
              Form correction and rep counting
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-[#FF8A00] rounded-full mr-3"></div>
              Basic workout library access
            </li>
          </ul>
        </div>

        {/* Upgrade Later Info */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-300">
            💡 You can upgrade to Premium anytime from your profile settings to unlock unlimited features!
          </p>
        </div>

        {/* Support Link */}
        <div className="mt-6">
          <p className="text-xs text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;