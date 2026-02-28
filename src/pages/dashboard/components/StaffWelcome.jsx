import React from 'react';
import Icon from '../../../components/AppIcon';

const staffMembers = [
  {
    name: 'Dr. Alex Reed',
    title: 'Head of Sports Science',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg',
  },
  {
    name: 'Sarah Chen',
    title: 'Lead Nutritionist',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    name: 'Mike Thompson',
    title: 'Master Trainer',
    avatar: 'https://randomuser.me/api/portraits/men/82.jpg',
  },
];

const StaffWelcome = () => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-semibold mb-4">Meet Our Experts</h3>
      <p className="text-muted-foreground mb-6">Our team of certified professionals is here to support your fitness journey.</p>
      <div className="space-y-4">
        {staffMembers.map((staff, index) => (
          <div key={index} className="flex items-center space-x-4">
            <img src={staff.avatar} alt={staff.name} className="w-12 h-12 rounded-full" />
            <div>
              <p className="font-semibold">{staff.name}</p>
              <p className="text-sm text-muted-foreground">{staff.title}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-6 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2">
        <Icon name="MessageCircle" size={16} />
        <span>Chat with a Coach</span>
      </button>
    </div>
  );
};

export default StaffWelcome;
