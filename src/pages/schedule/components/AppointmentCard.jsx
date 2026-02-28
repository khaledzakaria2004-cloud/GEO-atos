import React from 'react';
import Icon from '../../../components/AppIcon';

const AppointmentCard = ({ appointment, onComplete, onDelete }) => {
  const getAppointmentIcon = (type) => {
    switch (type) {
      case 'workout': return 'Activity';
      case 'cardio': return 'Heart';
      case 'strength': return 'Zap';
      case 'flexibility': return 'Stretch';
      case 'nutrition': return 'Apple';
      default: return 'Calendar';
    }
  };

  const getAppointmentColor = (type) => {
    switch (type) {
      case 'workout': return 'bg-primary';
      case 'cardio': return 'bg-error';
      case 'strength': return 'bg-warning';
      case 'flexibility': return 'bg-success';
      case 'nutrition': return 'bg-accent';
      default: return 'bg-muted';
    }
  };

  const isCompleted = appointment.status === 'completed';

  return (
    <div
      className={`bg-card border border-border rounded-lg p-6 transition-all duration-200 ${
        isCompleted ? 'opacity-75' : 'hover:shadow-elevation-2'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${getAppointmentColor(appointment.type)} rounded-full flex items-center justify-center`}>
          <Icon name={getAppointmentIcon(appointment.type)} size={20} color="white" />
        </div>
        <div className="flex items-center space-x-2">
          {!isCompleted && (
            <button onClick={() => onComplete(appointment.id)} className="text-success hover:text-success/80">
              <Icon name="Check" size={18} />
            </button>
          )}
          <button onClick={() => onDelete(appointment.id)} className="text-destructive hover:text-destructive/80">
            <Icon name="Trash2" size={18} />
          </button>
        </div>
      </div>
      
      <h3 className="font-semibold text-card-foreground mb-2">{appointment.title}</h3>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Icon name="Calendar" size={14} />
          <span>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Clock" size={14} />
          <span>{appointment.time} ({appointment.duration} min)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Icon name="Tag" size={14} />
          <span className="capitalize">{appointment.type}</span>
        </div>
        {appointment.workoutName && (
          <div className="flex items-center space-x-2">
            <Icon name="Dumbbell" size={14} />
            <span>{appointment.workoutName}</span>
          </div>
        )}
        {appointment.reps && (
          <div className="flex items-center space-x-2">
            <Icon name="Repeat" size={14} />
            <span>{appointment.reps} reps</span>
          </div>
        )}
      </div>
      
      {appointment.notes && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{appointment.notes}</p>
        </div>
      )}
    </div>
  );
};

export default AppointmentCard;
