import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import { loginWithGoogle } from '../lib/auth';

export default function LoginView({ onDemoLogin }: { onDemoLogin?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
      alert('Login failed. Please check the console.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-xl border-border">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4">
            <LayoutDashboard className="w-6 h-6 text-primary dark:text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Dev Command</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">Sign in to sync your productivity metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-card text-foreground border border-border hover:bg-muted border-border dark:hover:bg-neutral-800 shadow-sm"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          <Button
            variant="outline"
            className="w-full border-dashed text-muted-foreground hover:text-foreground"
            onClick={onDemoLogin}
          >
            Preview without signing in
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
