import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">MoneyTracker</h1>
            <p className="text-xl text-muted-foreground">
              Track your expenses and income with ease
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Sign in to start managing your finances
            </p>
            <Button asChild>
              <a href="/auth">Get Started</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
