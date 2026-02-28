import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const WaterMonitoringCard = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const [goal, setGoal] = useState('recommended');
  const [lastDrink, setLastDrink] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('atos_water_intake');
    if (saved) {
      const data = JSON.parse(saved);
      setWaterIntake(data.intake || 0);
      setGoal(data.goal || 'recommended');
      setLastDrink(data.lastDrink ? new Date(data.lastDrink) : null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('atos_water_intake', JSON.stringify({
      intake: waterIntake,
      goal,
      lastDrink: lastDrink?.toISOString()
    }));
  }, [waterIntake, goal, lastDrink]);

  const goalLevels = {
    minimum: { amount: 2000, label: 'Minimum', color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    recommended: { amount: 2500, label: 'Recommended', color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    advanced: { amount: 3000, label: 'Advanced', color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' }
  };

  const currentGoal = goalLevels[goal];
  const percentage = Math.min(100, (waterIntake / currentGoal.amount) * 100);
  const remaining = Math.max(0, currentGoal.amount - waterIntake);

  const addWater = (amount) => {
    if (waterIntake + amount <= currentGoal.amount) {
      setWaterIntake(prev => Math.min(prev + amount, currentGoal.amount));
      setLastDrink(new Date());
    }
  };

  const resetDaily = () => {
    setWaterIntake(0);
    setLastDrink(null);
  };

  const getMotivationMessage = () => {
    if (percentage >= 100) return "🎉 Goal achieved! Excellent hydration!";
    if (percentage >= 75) return "💪 Almost there! Keep it up!";
    if (percentage >= 50) return "👍 Good progress! Halfway there!";
    if (percentage >= 25) return "💧 Getting started! Every drop counts!";
    return "🚰 Time to hydrate! Your body needs water!";
  };

  // Responsive water-wave SVG animation
  const fillPercent = Math.min(1, waterIntake / currentGoal.amount);
  const circleSize = 120; // Optimized size for mobile and desktop
  const waveHeight = 10;

  const wavePath = (fill) => {
    const h = circleSize;
    const w = circleSize;
    const baseY = h - (h * fill);
    const points = [];
    const amplitude = waveHeight;

    for (let x = 0; x <= w; x += 2) {
      const y = baseY + Math.sin((x / w) * 4 * Math.PI + Date.now() / 1000) * amplitude * 0.8;
      points.push(`${x},${y}`);
    }

    points.push(`${w},${h}`);
    points.push(`0,${h}`);
    return `M0,${points[0].split(',')[1]} L${points.join(' ')} Z`;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-elevation-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-2 sm:mr-3">
          <Icon name="Droplets" size={14} className="text-blue-500 sm:w-4 sm:h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground text-xs sm:text-sm">Water Intake</h3>
          <p className="text-xs text-muted-foreground">{currentGoal.label} Goal</p>
        </div>
      </div>

      {/* Goal Selection */}
      <div className="mb-3 sm:mb-4 w-full">
        <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center w-full">
          {Object.entries(goalLevels).map(([key, level]) => (
            <button
              key={key}
              onClick={() => setGoal(key)}
              className={`flex-1 min-w-0 px-1 py-1 text-[10px] md:text-xs rounded-lg transition-all duration-200 font-medium border text-center ${goal === key
                  ? `${level.bgColor} ${level.color} ${level.borderColor}`
                  : 'text-muted-foreground hover:text-card-foreground bg-muted/50 hover:bg-muted border-border'
                }`}
            >
              <span className="truncate block w-full">{level.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Water Animation */}
      <div className="flex items-center justify-center mb-3 sm:mb-4 relative flex-1" style={{ minHeight: `${circleSize}px` }}>
        <svg width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`} className="drop-shadow-sm">
          {/* Main circle boundary */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={(circleSize - 8) / 2}
            fill="hsl(var(--muted))"
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />

          {/* Animated water fill */}
          <clipPath id="circle-clip">
            <circle cx={circleSize / 2} cy={circleSize / 2} r={(circleSize - 8) / 2} />
          </clipPath>

          <path
            d={wavePath(fillPercent)}
            fill="url(#water-gradient)"
            clipPath="url(#circle-clip)"
            style={{ transition: 'all 0.3s ease' }}
          >
            <animate
              attributeName="d"
              dur="2s"
              repeatCount="indefinite"
              values={`${wavePath(fillPercent)};${wavePath(fillPercent)}`}
            />
          </path>

          <defs>
            <linearGradient id="water-gradient" x1="0" y1="0" x2="0" y2={circleSize} gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#3b82f6" stopOpacity="0.7" />
              <stop offset="1" stopColor="#1d4ed8" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-xl sm:text-2xl font-bold text-blue-500">
            {Math.round(percentage)}%
          </div>
          <div className="text-xs font-medium text-card-foreground">
            {waterIntake}ml
            <span className="mx-1 text-muted-foreground">/</span>
            {currentGoal.amount}ml
          </div>
          {remaining > 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              {remaining}ml to go
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
        {[250, 500, 750].map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => addWater(amount)}
            className="text-xs py-1 sm:py-1.5 font-medium border-border text-card-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50"
            disabled={waterIntake >= currentGoal.amount}
          >
            +{amount}ml
          </Button>
        ))}
      </div>

      {/* Motivation Message */}
      <div className="text-center mb-2 sm:mb-3 p-2 bg-muted/30 rounded-lg border border-border/50">
        <div className="font-medium text-blue-500 text-xs leading-tight">{getMotivationMessage()}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-1.5 sm:space-x-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={resetDaily}
          className="flex-1 text-xs py-1 sm:py-1.5 font-medium border-border text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all duration-200"
        >
          Reset
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => addWater(200)}
          className="flex-1 text-xs py-1 sm:py-1.5 font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-50"
          disabled={waterIntake >= currentGoal.amount}
        >
          Quick Sip
        </Button>
      </div>
    </div>
  );
};

export default WaterMonitoringCard;
