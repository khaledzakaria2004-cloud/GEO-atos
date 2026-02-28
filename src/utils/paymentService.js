import { loadStripe } from '@stripe/stripe-js';
import { createActor } from '../declarations/backend';

const paymentService = {
  stripe: null,
  backendActor: null,
  // Initialize the payment service
  async init() {
    try {
      // Initialize Stripe
      this.stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      
      // Initialize backend actor
      const canisterId = process.env.REACT_APP_BACKEND_CANISTER_ID || 'rrkah-fqaaa-aaaaa-aaaaq-cai';
      this.backendActor = createActor(canisterId, {
        agentOptions: {
          host: process.env.NODE_ENV === 'production' 
            ? 'https://ic0.app' 
            : 'http://localhost:4943'
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize payment service:', error);
      return { success: false, error: error.message };
    }
  },

  // Create checkout session and redirect to Stripe
  async createCheckoutSession(planType, billingCycle = 'monthly') {
    try {
      if (!this.backendActor) {
        throw new Error('Payment service not initialized');
      }

      const result = await this.backendActor.createCheckoutSession(planType, billingCycle);
      
      if (result.success) {
        // Redirect to Stripe checkout
        if (this.stripe) {
          await this.stripe.redirectToCheckout({
            sessionId: result.sessionId
          });
        }
        return { success: true, sessionId: result.sessionId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }
  },

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId) {
    try {
      const stripe = await getStripe();
      
      if (!stripe) {
        throw new Error('Stripe failed to initialize');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId,
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to redirect to checkout:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify subscription after successful payment
  async verifySubscription(sessionId) {
    try {
      if (!this.backendActor) {
        throw new Error('Payment service not initialized');
      }

      const result = await this.backendActor.verifySubscription(sessionId);
      return result;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user subscription status
  async getUserSubscription(userId) {
    try {
      if (!this.backendActor) {
        throw new Error('Payment service not initialized');
      }

      const result = await this.backendActor.getUserSubscription(userId);
      return result;
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel user subscription
  async cancelSubscription(subscriptionId) {
    try {
      if (!this.backendActor) {
        throw new Error('Payment service not initialized');
      }

      const result = await this.backendActor.cancelSubscription(subscriptionId);
      return result;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if user has active subscription
  async hasActiveSubscription(userId) {
    try {
      const result = await this.getUserSubscription(userId);
      
      if (result.success && result.subscription) {
        const subscription = result.subscription;
        const now = Date.now() * 1000000; // Convert to nanoseconds
        
        return subscription.status === 'Active' && 
               subscription.currentPeriodEnd > now;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  },

  // Get subscription plan details
  getSubscriptionPlanDetails(plan) {
    const plans = {
      Basic: {
        name: 'Basic',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Access to basic workout routines',
          'Progress tracking',
          'Community support'
        ]
      },
      Premium: {
        name: 'Premium',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Basic features',
          'Advanced workout routines',
          'Personalized meal plans',
          'Priority support',
          'Advanced analytics'
        ]
      },
      PremiumPlus: {
        name: 'Premium Plus',
        price: 29.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Premium features',
          '1-on-1 coaching sessions',
          'Custom workout creation',
          'Nutrition consultation',
          'Early access to new features'
        ]
      }
    };

    return plans[plan] || null;
  }
};

export default paymentService;
export { paymentService };