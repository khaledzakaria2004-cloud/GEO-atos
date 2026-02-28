import React, { useRef, useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import useWorkoutData from '../../../hooks/useWorkoutData';
import { STORAGE_KEYS } from '../../../utils/workoutStorage';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardCharts = () => {
  const chartRef = useRef(null);
  const { loading } = useWorkoutData();
  const [weeklyActivityData, setWeeklyActivityData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Workout Duration (minutes)',
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(255, 138, 0, 0.6)',
        borderColor: 'rgba(255, 138, 0, 1)',
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  });

  useEffect(() => {
    if (!loading) {
      // Load last 7 days of workout data
      const loadWeeklyData = () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
          const allProgress = stored ? JSON.parse(stored) : {};
          
          const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
          const today = new Date();
          
          // Get last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const mondayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Monday = 0 index
            
            if (allProgress[dateStr]) {
              weeklyData[mondayIndex] = Math.round(allProgress[dateStr].totalWorkoutTime / 60) || 0;
            }
          }
          
          setWeeklyActivityData({
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Workout Duration (minutes)',
                data: weeklyData,
                backgroundColor: 'rgba(255, 138, 0, 0.6)',
                borderColor: 'rgba(255, 138, 0, 1)',
                borderWidth: 1,
                borderRadius: 5,
              },
            ],
          });
        } catch (error) {
          console.error('Error loading weekly chart data:', error);
        }
      };

      loadWeeklyData();
    }
  }, [loading]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Your Weekly Workout Activity',
      },
      tooltip: {
        enabled: true,
      },
    },
    hover: {
      mode: null, // Disable hover mode to prevent any hover scaling
    },
    animation: {
      duration: 1200, // Animate bars on mount
      easing: 'easeOutQuart',
      onProgress: function(animation) {
        // No-op, just for reference
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes',
        },
        grid: {
          color: '#eee',
        },
      },
    },
  };

  // Prevent chart from shrinking on hover by fixing the height
  // and disabling any container hover/scale effects
  return (
    <div className="bg-card p-4 rounded-lg shadow-sm h-64 min-h-64 max-h-96 flex flex-col justify-center">
      <Bar ref={chartRef} data={weeklyActivityData} options={options} />
    </div>
  );
};

export default DashboardCharts;
