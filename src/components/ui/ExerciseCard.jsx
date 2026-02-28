import React from 'react';

const ExerciseCard = ({ 
  title,
  level = 'Beginner',
  targetMuscles = [],
  exerciseType = '',
  gifUrl
}) => {
  return (
    <div className="bg-white/6 backdrop-blur-md rounded-xl p-4 border border-white/8">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="text-xs text-emerald-400">{level}</span>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {targetMuscles.map((muscle, idx) => (
            <span 
              key={idx}
              className="text-xs text-white/60"
            >
              {muscle}{idx < targetMuscles.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
        
        {exerciseType && (
          <div className="text-xs text-white/60">
            {exerciseType}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseCard;
