import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const SubscriptionStatusCard = ({ subscription, isLoading }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const handleManageSubscription = () => {
    navigate('/user-profile?tab=subscription');
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-[#FF8A00] border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-muted-foreground">Loading subscription...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Subscription Status</h3>
        <Icon name="CreditCard" className="w-5 h-5 text-[#FF8A00]" />
      </div>

      {subscription ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">{subscription.plan}</h4>
              <p className="text-sm text-muted-foreground capitalize">
                Status: <span className={subscription.status === 'Active' ? 'text-green-500' : 'text-yellow-500'}>
                  {subscription.status}
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#FF8A00]">
                ${subscription.plan === 'Premium' ? '19.99' : '29.99'}/mo
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleManageSubscription}
              className="w-full py-2 px-4 bg-[#FF8A00] hover:bg-[#E67B00] text-black font-medium rounded-lg transition-colors"
            >
              Manage Subscription
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Icon name="Star" className="w-6 h-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-foreground mb-2">Free Plan</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Upgrade to unlock premium features and unlimited access!
          </p>
          <button
            onClick={handleUpgrade}
            className="w-full py-2 px-4 bg-[#FF8A00] hover:bg-[#E67B00] text-black font-medium rounded-lg transition-colors"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-foreground">
              {subscription ? 'Unlimited' : '10'}
            </div>
            <div className="text-muted-foreground">Workout Hours</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">
              {subscription ? 'Unlimited' : '100'}
            </div>
            <div className="text-muted-foreground">AI Messages</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStatusCard;