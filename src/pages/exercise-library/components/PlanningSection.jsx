import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlanCard = ({ plan, onStart }) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <h4 className="font-semibold">{plan.name}</h4>
    <p className="text-sm text-muted-foreground">{plan.description}</p>
    <Button onClick={() => onStart(plan)} className="mt-4 w-full">Start Plan</Button>
  </div>
);

const PlanningSection = () => {
  const [plans, setPlans] = useState([
    { id: 1, name: '4-Week Beginner Bodyweight', description: 'Build a solid foundation with this 4-week bodyweight plan.' },
    { id: 2, name: 'Full Body Strength', description: 'A 3-day per week plan to build strength across your entire body.' },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');

  const handleStartPlan = (plan) => {
    alert(`Starting plan: ${plan.name}`);
  };

  const handleCreatePlan = () => {
    if (newPlanName.trim()) {
      setPlans([...plans, { id: Date.now(), name: newPlanName, description: 'A new custom plan.' }]);
      setNewPlanName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4">Workout Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} onStart={handleStartPlan} />
        ))}
      </div>
      {isCreating ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="New plan name"
            className="flex-grow p-2 border border-border rounded-lg bg-background"
          />
          <Button onClick={handleCreatePlan}>Save</Button>
          <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
        </div>
      ) : (
        <Button onClick={() => setIsCreating(true)} variant="outline" className="w-full">
          <Icon name="Plus" size={16} className="mr-2" />
          Create New Plan
        </Button>
      )}
    </div>
  );
};

export default PlanningSection;
