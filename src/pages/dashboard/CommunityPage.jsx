import React from 'react';
import AppHeader from '../../components/ui/AppHeader';
import SidebarNavigation from '../../components/ui/SidebarNavigation';
import Icon from '../../components/AppIcon';

const CommunityPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const features = [
    {
      icon: 'Users',
      title: 'Share Your Workouts',
      description: 'Connect with friends and the ATOS Fit community by sharing your workout sessions, progress photos, and achievements.',
      color: 'from-primary/20 to-primary/5'
    },
    {
      icon: 'MessageSquare',
      title: 'Create & Engage',
      description: 'Post about your fitness journey, share tips, and engage with other members through likes and comments.',
      color: 'from-success/20 to-success/5'
    },
    {
      icon: 'Heart',
      title: 'Support & Motivation',
      description: 'Like and comment on other members\' workouts and posts to build a supportive fitness community.',
      color: 'from-accent/20 to-accent/5'
    },
    {
      icon: 'Share2',
      title: 'Social Integration',
      description: 'Instantly share your workout achievements to X (Twitter), Facebook, or Instagram stories with seamless integrations.',
      color: 'from-warning/20 to-warning/5'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader isSidebarOpen={isSidebarOpen} onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      <SidebarNavigation isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="pt-16 lg:pl-72 min-h-screen">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/10 via-success/5 to-accent/10 rounded-xl p-8 mb-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Icon name="Users" size={32} className="text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-primary via-primary to-accent bg-clip-text text-transparent">
                Community Hub
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Connect, share, and grow together with the ATOS Fit community
              </p>
            </div>
            
            {/* Status Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-warning/10 border border-warning/20 rounded-full">
              <div className="w-2 h-2 bg-warning rounded-full mr-2 animate-pulse"></div>
              <span className="text-warning font-medium">Coming Soon</span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 group">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon name={feature.icon} size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Preview Section */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-2 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-card-foreground">What to Expect</h2>
              <Icon name="Sparkles" size={24} className="text-primary" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Trophy" size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">Achievement Sharing</h3>
                <p className="text-sm text-muted-foreground">Celebrate your milestones and inspire others with your progress</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                  <Icon name="Target" size={24} className="text-success" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">Goal Challenges</h3>
                <p className="text-sm text-muted-foreground">Join community challenges and compete with friends</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="MessageCircle" size={24} className="text-accent" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">Expert Tips</h3>
                <p className="text-sm text-muted-foreground">Get advice from fitness experts and experienced members</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 text-center">
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              Ready to Connect?
            </h3>
            <p className="text-muted-foreground mb-4">
              Be the first to know when our community features launch. Your fitness social experience is coming soon!
            </p>
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Icon name="Rocket" size={20} />
              <span className="font-medium">Launching Soon</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
