import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import LandingPage from './pages/landing';
import PricingPage from './pages/pricing';
import PrivacyPage from './pages/privacy';
import AboutPage from './pages/about';
import AIAssistantFoodScanner from './pages/ai-assistant-food-scanner';
import AIChatPage from './pages/ai-assistant-food-scanner/ChatPage';
import FoodScannerPage from './pages/ai-assistant-food-scanner/ScannerPage';
import LoginScreen from './pages/login-screen';
import Dashboard from './pages/dashboard';
import ExerciseWorkoutScreen from './pages/exercise-workout-screen';
import RegisterScreen from './pages/register-screen';
import UserProfile from './pages/user-profile';
import OnboardingScreen from './pages/onboarding';
import ProtectedRoute from './components/ui/ProtectedRoute';
import SchedulePage from './pages/schedule';
import Exercises from './pages/exercise-library';
import AchievementsPage from './pages/achievements';
import PaymentSuccess from './pages/payment-success';
import PaymentCancel from './pages/payment-cancel';
import CommunityPage from './pages/dashboard/CommunityPage';

const Routes = () => {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <AuthProvider>
          <ErrorBoundary>
            <ScrollToTop />
            <RouterRoutes>
            {/* Define your route here */}
            {/* Make the landing page the app root */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/ai-assistant-food-scanner" element={<AIAssistantFoodScanner />} />
            <Route path="/ai-chat" element={<AIAssistantFoodScanner chatOnly={true} />} />
            <Route path="/food-scanner" element={<FoodScannerPage />} />
            <Route path="/login-screen" element={<LoginScreen />} />
            {/* Keep a /dashboard route as alias (public) */}
            <Route path="/exercise-workout-screen" element={<ExerciseWorkoutScreen />} />
            <Route path="/register-screen" element={<RegisterScreen />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingScreen /></ProtectedRoute>} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/community" element={<CommunityPage />} />
            
            {/* Schedule route removed per request */}
            <Route path="/exercise-library" element={<Exercises />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            
            {/* Payment flow routes */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-cancel" element={<PaymentCancel />} />
            
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
      </AuthProvider>
    </SupabaseAuthProvider>
  </BrowserRouter>
  );
};

export default Routes;
