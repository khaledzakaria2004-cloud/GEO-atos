import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Icon from '../../components/AppIcon';
import FoodScannerCamera from './components/FoodScannerCamera';
import FoodAnalysisResult from './components/FoodAnalysisResult';
import ScanHistory from './components/ScanHistory';
import { logFood, getFoodLogs, clearAllFoodLogs, deleteFoodLog, updateFoodLog } from '../../utils/api/foodApi';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); // Default to dark mode
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  // Load scan history from Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        // Get user from localStorage (ICP Principal ID)
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.principal || user.id;

        if (userId) {
          console.log('📥 Loading food history for user:', userId);
          const foods = await getFoodLogs(userId, { limit: 20 });
          console.log('✅ Food history loaded:', foods);

          // Convert to scan history format
          const history = foods.map(food => ({
            id: food.id,
            name: food.food_name,
            calories: food.calories,
            protein: food.protein,
            carbohydrates: food.carbs,
            fat: food.fat,
            timestamp: new Date(food.date_logged),
            scanType: 'food'
          }));
          setScanHistory(history);
        }
      } catch (error) {
        console.error('❌ Error loading food history:', error);
      }
    };

    loadHistory();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleTheme = () => setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
  const handleLogout = () => navigate('/login-screen');

  const CHATBOT_API_KEY = 'AIzaSyBxlkXAIw-0_fRHwnkXzb7gEwrROKnlvk8';
  const handleFoodCapture = async (file, scanType) => {
    setIsScanning(true);
    try {
      console.log('Using API Key:', CHATBOT_API_KEY ? `Key exists (${CHATBOT_API_KEY.substring(0, 10)}...)` : 'No key');
      const toBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const imageBase64 = await toBase64(file);

      // Try multiple models for better reliability
      const models = ['gemini-2.5-flash-lite', 'gemini-1.5-flash-latest'];
      let lastError = null;

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CHATBOT_API_KEY}`;
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: file.type, data: imageBase64 } },
                  { text: 'Analyze this food image and return JSON with name, calories, protein, carbohydrates, fat, sugar, serving_size, recommendation, allergens, health_score (1-10).' }
                ]
              }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024
              }
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error with ${model}:`, response.status, errorText);
            lastError = new Error(`API Error: ${response.status}`);
            continue; // Try next model
          }

          const data = await response.json();
          console.log(`API Response from ${model}:`, data);
          let result = null;
          let rawText = '';
          if (Array.isArray(data?.candidates) && data.candidates.length > 0) {
            const parts = data.candidates[0]?.content?.parts;
            if (Array.isArray(parts) && parts.length > 0 && typeof parts[0].text === 'string') {
              rawText = parts[0].text;
              let jsonMatch = rawText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try { result = JSON.parse(jsonMatch[0]); } catch { }
              }
            }
          }
          if (!result) result = { name: 'Unknown', recommendation: rawText || 'No prediction', scanType };
          result.image = URL.createObjectURL(file);
          result.scanType = scanType;
          result.timestamp = new Date();
          setScanResult(result);
          return; // Success, exit the loop
        } catch (modelError) {
          console.error(`Error with model ${model}:`, modelError);
          lastError = modelError;
          continue; // Try next model
        }
      }

      // All models failed
      throw lastError || new Error('All models failed');
    } catch (e) {
      console.error('Final error:', e);
      setScanResult({ name: 'Error', recommendation: `Error contacting AI service: ${e.message}. Please check your internet connection and try again.`, image: URL.createObjectURL(file), scanType, timestamp: new Date() });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveToHistory = async (result) => {
    try {
      // Get user from localStorage (ICP Principal ID)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.principal || user.id;

      if (!userId) {
        console.error('❌ No user ID found for saving food');
        // Still save locally
        const item = { ...result, id: Date.now() };
        setScanHistory(prev => [item, ...prev]);
        setScanResult(null);
        return;
      }

      console.log('📤 Saving food to Supabase for user:', userId);
      console.log('📤 Food data:', result);

      // Save to Supabase
      const savedFood = await logFood(userId, {
        foodName: result.name,
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbohydrates || result.carbs || 0,
        fat: result.fat || 0,
        portionSize: result.serving_size || result.portionSize,
        dateLogged: new Date().toISOString()
      });

      console.log('✅ Food saved to Supabase:', savedFood);

      // Add to local history with Supabase ID
      const item = {
        ...result,
        id: savedFood.id,
        timestamp: new Date(savedFood.date_logged)
      };
      setScanHistory(prev => [item, ...prev]);
      setScanResult(null);

    } catch (error) {
      console.error('❌ Error saving food to Supabase:', error);
      // Still save locally on error
      const item = { ...result, id: Date.now() };
      setScanHistory(prev => [item, ...prev]);
      setScanResult(null);
    }
  };

  const handleNewScan = () => setScanResult(null);
  const handleReanalyze = (scan) => setScanResult(scan);

  const handleClearHistory = async () => {
    try {
      // Get user from localStorage (ICP Principal ID)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.principal || user.id;

      if (userId) {
        console.log('🗑️ Clearing food history from Supabase for user:', userId);
        await clearAllFoodLogs(userId);
        console.log('✅ Food history cleared from Supabase');
      }

      // Clear local state
      setScanHistory([]);

    } catch (error) {
      console.error('❌ Error clearing food history:', error);
      // Still clear local state on error
      setScanHistory([]);
    }
  };

  // Delete a single food item
  const handleDeleteItem = async (itemId) => {
    try {
      console.log('🗑️ Deleting food item:', itemId);
      await deleteFoodLog(itemId);
      console.log('✅ Food item deleted from Supabase');

      // Remove from local state
      setScanHistory(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('❌ Error deleting food item:', error);
    }
  };

  // Rename a food item
  const handleRenameItem = async (itemId, newName) => {
    try {
      console.log('✏️ Renaming food item:', itemId, 'to:', newName);
      await updateFoodLog(itemId, { food_name: newName });
      console.log('✅ Food item renamed in Supabase');

      // Update local state
      setScanHistory(prev => prev.map(item =>
        item.id === itemId ? { ...item, name: newName } : item
      ));
    } catch (error) {
      console.error('❌ Error renaming food item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onThemeToggle={toggleTheme}
        currentTheme={currentTheme}
        user={JSON.parse(localStorage.getItem('user')) || {}}
        onLogout={handleLogout}
      />
      <SidebarNavigation isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">Dashboard</button>
            <Icon name="ChevronRight" size={16} />
            <span className="text-foreground">Food Scanner</span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-card border border-border rounded-xl p-6">
              {scanResult ? (
                <FoodAnalysisResult result={scanResult} onSaveToHistory={handleSaveToHistory} onNewScan={handleNewScan} />
              ) : (
                <FoodScannerCamera onCapture={handleFoodCapture} onUpload={handleFoodCapture} isScanning={isScanning} />
              )}
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <ScanHistory
                history={scanHistory}
                onReanalyze={handleReanalyze}
                onClearHistory={handleClearHistory}
                onDeleteItem={handleDeleteItem}
                onRenameItem={handleRenameItem}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScannerPage;


