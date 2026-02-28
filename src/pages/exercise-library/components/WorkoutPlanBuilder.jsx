import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const WorkoutPlanBuilder = ({ exercises, onSavePlan, onClose }) => {
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredExercises = exercises.filter(exercise => {
    const matchesFilter = filter === 'all' || exercise.difficulty.toLowerCase() === filter.toLowerCase();
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.targetMuscles.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const addExercise = (exercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, { ...exercise, sets: 3, reps: exercise.reps }]);
    }
  };

  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  const updateExercise = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  const savePlan = () => {
    if (!planName.trim() || selectedExercises.length === 0) {
      alert('Please provide a plan name and select at least one exercise');
      return;
    }

    const plan = {
      id: Date.now(),
      name: planName,
      description: planDescription,
      exercises: selectedExercises,
      createdAt: new Date().toISOString(),
      type: 'custom'
    };

    onSavePlan(plan);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end lg:pl-72">
      <div
        className="bg-card border border-border rounded-none lg:rounded-l-xl shadow-elevation-3 w-full max-w-2xl h-full lg:h-screen flex flex-col overflow-y-auto"
        style={{ maxHeight: '100vh' }}
      >
        <div className="p-6 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-card-foreground">Create Workout Plan</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">Plan Details</h3>
              <Input
                label="Plan Name"
                placeholder="e.g., My Upper Body Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Description</label>
                <textarea
                  placeholder="Describe your workout plan..."
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              {/* Selected Exercises */}
              <div>
                <h4 className="text-md font-semibold text-card-foreground mb-3">Selected Exercises ({selectedExercises.length})</h4>
                {selectedExercises.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No exercises selected yet</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedExercises.map((exercise) => (
                      <div key={exercise.id} className="bg-muted rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-card-foreground">{exercise.name}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(exercise.id)}
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Sets</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value))}
                              className="w-full p-2 border border-border rounded text-sm text-foreground bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Reps</label>
                            <input
                              type="text"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                              className="w-full p-2 border border-border rounded text-sm text-foreground bg-background"
                              placeholder="15 or 30s"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Exercise Library */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-card-foreground">Add Exercises</h3>
              
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg bg-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'beginner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('beginner')}
                  >
                    Beginner
                  </Button>
                  <Button
                    variant={filter === 'intermediate' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('intermediate')}
                  >
                    Intermediate
                  </Button>
                  <Button
                    variant={filter === 'advanced' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('advanced')}
                  >
                    Advanced
                  </Button>
                </div>
              </div>

              {/* Exercise List */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <h5 className="font-medium text-card-foreground">{exercise.name}</h5>
                      <p className="text-xs text-muted-foreground">{exercise.targetMuscles}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {exercise.difficulty}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addExercise(exercise)}
                      disabled={selectedExercises.find(ex => ex.id === exercise.id)}
                    >
                      <Icon name="Plus" size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end space-x-3 sticky bottom-0 bg-card z-10">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={savePlan} disabled={!planName.trim() || selectedExercises.length === 0}>
            Save Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlanBuilder;
