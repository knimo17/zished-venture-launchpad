import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signOut, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Detect password-recovery links and prevent premature redirects
  useEffect(() => {
    let mounted = true;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const searchParams = new URLSearchParams(window.location.search);

    const type = hashParams.get('type') ?? searchParams.get('type');
    const error = hashParams.get('error') ?? searchParams.get('error');
    const errorDescription =
      hashParams.get('error_description') ?? searchParams.get('error_description');

    if ((error || errorDescription) && mounted) {
      toast({
        title: 'Password reset link error',
        description: decodeURIComponent(errorDescription ?? error ?? 'Invalid or expired link.'),
        variant: 'destructive',
      });
    }

    const init = async () => {
      // Implicit flow (hash): ...#access_token=...&type=recovery
      if (type === 'recovery') setIsResettingPassword(true);

      // PKCE flow (query): .../admin?code=...&type=recovery
      const code = searchParams.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && mounted) {
          toast({
            title: 'Password reset failed',
            description: exchangeError.message,
            variant: 'destructive',
          });
        } else {
          setIsResettingPassword(true);
          // Remove the code from the URL so refreshes don't re-run the exchange
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          window.history.replaceState(null, '', url.pathname + url.search + url.hash);
        }
      }

      if (mounted) setRecoveryChecked(true);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Redirect if already admin and not resetting password
  useEffect(() => {
    if (!recoveryChecked) return;
    if (isAdmin && !isResettingPassword) {
      navigate('/admin/dashboard');
    }
  }, [isAdmin, isResettingPassword, navigate, recoveryChecked]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Password updated successfully!',
        });
        setIsResettingPassword(false);
        setNewPassword('');
        setConfirmPassword('');
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/admin/dashboard');
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin`,
        });
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Password Reset Email Sent',
            description: 'Check your email for a link to reset your password.',
          });
          setIsForgotPassword(false);
        }
      } else {
        const { error } = isSignUp 
          ? await signUp(email, password)
          : await signIn(email, password);

        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          if (isSignUp) {
            toast({
              title: 'Success',
              description: 'Account created! Please contact an admin to grant you access.',
            });
          } else {
            navigate('/admin/dashboard');
          }
        }
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Show password reset form if user clicked reset link
  if (isResettingPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {user && (
        <div className="absolute top-4 right-4">
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      )}
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Admin Account' : 'Admin Login'}
          </CardTitle>
          <CardDescription>
            {isForgotPassword
              ? 'Enter your email to receive a password reset link'
              : isSignUp 
                ? 'Sign up for admin access to view applications'
                : 'Sign in to access the admin dashboard'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@verigo54.com"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            {!isForgotPassword && (
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            )}
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => {
                setIsForgotPassword(!isForgotPassword);
                setIsSignUp(false);
              }}
            >
              {isForgotPassword ? 'Back to login' : 'Forgot password?'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}